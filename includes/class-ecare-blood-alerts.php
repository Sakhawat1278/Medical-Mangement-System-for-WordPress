<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ECARE_BloodAlerts
 *
 * Handles:
 *   1. Donor Matching Engine  — REST endpoint POST /ecare/v1/blood-donor-notify
 *   2. Blood Expiry Alerts    — scan inventory for near-expiry bags, create admin alerts
 */
class ECARE_BloodAlerts {

    // Blood group compatibility: key = requested group, value = blood groups that CAN donate to it
    const COMPATIBILITY = [
        'A+'  => ['A+', 'A-', 'O+', 'O-'],
        'A-'  => ['A-', 'O-'],
        'B+'  => ['B+', 'B-', 'O+', 'O-'],
        'B-'  => ['B-', 'O-'],
        'AB+' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        'AB-' => ['A-', 'B-', 'AB-', 'O-'],
        'O+'  => ['O+', 'O-'],
        'O-'  => ['O-'],
    ];

    // Days before expiry to trigger alert
    const EXPIRY_ALERT_DAYS = 7;

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // POST /ecare/v1/blood-donor-notify — notify matching donors for a blood request
        register_rest_route('ecare/v1', '/blood-donor-notify', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_donor_notify'],
            'permission_callback' => [$this, 'check_staff_permission'],
        ]);

        // POST /ecare/v1/blood-expiry-scan — manually trigger expiry scan (admin)
        register_rest_route('ecare/v1', '/blood-expiry-scan', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_expiry_scan'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // GET /ecare/v1/blood-expiry-alerts — get current expiry alerts
        register_rest_route('ecare/v1', '/blood-expiry-alerts-summary', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle_get_expiry_summary'],
            'permission_callback' => [$this, 'check_staff_permission'],
        ]);
    }

    public function check_staff_permission() {
        if (!is_user_logged_in()) return false;
        $user = wp_get_current_user();
        return in_array('ecare_admin', (array) $user->roles)
            || in_array('ecare_blood_bank_manager', (array) $user->roles)
            || in_array('administrator', (array) $user->roles);
    }

    public function check_admin_permission() {
        if (!is_user_logged_in()) return false;
        $user = wp_get_current_user();
        return in_array('ecare_admin', (array) $user->roles)
            || in_array('administrator', (array) $user->roles);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DONOR MATCHING ENGINE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Handle POST /ecare/v1/blood-donor-notify
     * Body: { request_id, blood_group, urgency, patient_name, hospital_name, units_required, component }
     */
    public function handle_donor_notify(WP_REST_Request $request) {
        $params         = $request->get_json_params() ?: $request->get_params();
        $request_id     = sanitize_text_field($params['request_id']    ?? '');
        $blood_group    = sanitize_text_field($params['blood_group']   ?? '');
        $urgency        = sanitize_text_field($params['urgency']       ?? 'Standard');
        $patient_name   = sanitize_text_field($params['patient_name']  ?? 'Patient');
        $hospital_name  = sanitize_text_field($params['hospital_name'] ?? '');
        $units_required = intval($params['units_required']             ?? 1);
        $component      = sanitize_text_field($params['component']     ?? 'Whole Blood');

        if (empty($blood_group)) {
            return new WP_REST_Response(['success' => false, 'message' => 'Blood group is required'], 400);
        }

        // Get compatible donor blood groups
        $compatible_groups = self::COMPATIBILITY[$blood_group] ?? [$blood_group];

        // Fetch all donors
        $all_donors = ECARE_DB_Client::select_all('ecare_blood_donors');
        $matched    = [];

        foreach ($all_donors as $donor_row) {
            $donor = is_string($donor_row->data ?? null)
                ? json_decode($donor_row->data, true)
                : (array) $donor_row;

            if (empty($donor)) continue;

            $donor_group  = $donor['blood_group']   ?? ($donor['bloodGroup'] ?? '');
            $donor_status = strtolower($donor['status'] ?? 'eligible');
            $donor_email  = $donor['email']          ?? ($donor['contact_email'] ?? '');
            $donor_phone  = $donor['contact_number'] ?? ($donor['phone'] ?? '');
            $donor_name   = $donor['name']           ?? ($donor['donor_name'] ?? 'Donor');
            $donor_city   = $donor['city']           ?? '';

            // Only eligible donors with matching compatible blood group
            if (!in_array($donor_group, $compatible_groups, true)) continue;
            if ($donor_status === 'ineligible' || $donor_status === 'banned') continue;

            $matched[] = [
                'id'          => $donor['id'] ?? '',
                'name'        => $donor_name,
                'blood_group' => $donor_group,
                'phone'       => $donor_phone,
                'email'       => $donor_email,
                'city'        => $donor_city,
                'status'      => $donor['status'] ?? 'Eligible',
            ];
        }

        $notified        = 0;
        $notified_names  = [];
        $site_name       = get_bloginfo('name');
        $admin_email     = get_option('admin_email');

        foreach ($matched as $donor) {
            // Create in-app notification for each matched donor (if they have a WP account)
            $this->create_donor_notification($donor, $blood_group, $urgency, $patient_name, $hospital_name, $units_required, $component);

            // Send email notification if donor has an email
            if (!empty($donor['email']) && is_email($donor['email'])) {
                $sent = $this->send_donor_email($donor, $blood_group, $urgency, $patient_name, $hospital_name, $units_required, $component);
                if ($sent) {
                    $notified++;
                    $notified_names[] = $donor['name'];
                }
            } else {
                // Count as notified even without email (in-app notification sent)
                $notified++;
                $notified_names[] = $donor['name'];
            }
        }

        // Log notification event in blood request record
        if ($request_id) {
            $existing = ECARE_DB_Client::find_one('ecare_blood_requests', $request_id);
            if ($existing) {
                $data = is_string($existing->data) ? json_decode($existing->data, true) : (array) $existing;
                $data['donor_notification'] = [
                    'notified_at'   => current_time('mysql'),
                    'notified_count' => $notified,
                    'notified_names' => $notified_names,
                    'notified_by'   => wp_get_current_user()->display_name ?? 'Admin',
                ];
                ECARE_DB_Client::update('ecare_blood_requests', $request_id, $data);
            }
        }

        // Notify admin about the dispatch
        $this->create_admin_notification(
            'blood_donor_notified',
            "🩸 Donor Alert Dispatched: {$notified} donor(s) notified for {$blood_group} {$urgency} request" . ($hospital_name ? " at {$hospital_name}" : ''),
            $request_id
        );

        return new WP_REST_Response([
            'success'        => true,
            'notified'       => $notified,
            'matched_total'  => count($matched),
            'notified_names' => $notified_names,
            'message'        => "Notified {$notified} of " . count($matched) . " compatible donors",
        ], 200);
    }

    /**
     * Send email notification to a matched donor
     */
    private function send_donor_email($donor, $blood_group, $urgency, $patient_name, $hospital_name, $units, $component) {
        $site_name  = get_bloginfo('name');
        $site_url   = home_url();
        $donor_name = esc_html($donor['name']);
        $urgency_label = strtoupper($urgency);

        $subject = "[{$site_name}] Urgent Blood Donation Request — {$blood_group} ({$urgency_label})";

        $message = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 0; border-radius: 12px; overflow: hidden;'>
            <div style='background: #dc2626; padding: 24px 32px; text-align: center;'>
                <h1 style='color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;'>🩸 Blood Donation Needed</h1>
                <p style='color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;'>{$site_name} Blood Bank</p>
            </div>
            <div style='padding: 32px; background: #ffffff;'>
                <p style='font-size: 15px; color: #1e293b; margin: 0 0 16px;'>Dear <strong>{$donor_name}</strong>,</p>
                <p style='font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.6;'>
                    A patient urgently needs your blood type. As a registered <strong>{$blood_group}</strong> donor, 
                    you are a compatible match. Your donation can save a life today.
                </p>
                <div style='background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 20px; margin-bottom: 24px;'>
                    <h3 style='color: #dc2626; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;'>Request Details</h3>
                    <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                        <tr><td style='color: #64748b; padding: 4px 0; width: 140px;'>Blood Group Needed:</td><td style='color: #dc2626; font-weight: 800; font-size: 16px;'>{$blood_group}</td></tr>
                        <tr><td style='color: #64748b; padding: 4px 0;'>Component:</td><td style='color: #1e293b; font-weight: 600;'>" . esc_html($component) . "</td></tr>
                        <tr><td style='color: #64748b; padding: 4px 0;'>Units Required:</td><td style='color: #1e293b; font-weight: 600;'>{$units} unit(s)</td></tr>
                        <tr><td style='color: #64748b; padding: 4px 0;'>Priority:</td><td style='color: " . ($urgency === 'Emergency' ? '#dc2626' : '#d97706') . "; font-weight: 700;'>{$urgency_label}</td></tr>
                        " . ($hospital_name ? "<tr><td style='color: #64748b; padding: 4px 0;'>Hospital:</td><td style='color: #1e293b; font-weight: 600;'>" . esc_html($hospital_name) . "</td></tr>" : "") . "
                    </table>
                </div>
                <p style='font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.6;'>
                    Please contact the blood bank immediately or visit our portal to respond to this request. 
                    Every minute counts in an emergency.
                </p>
                <div style='text-align: center; margin-bottom: 24px;'>
                    <a href='{$site_url}' style='display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;'>
                        Respond Now →
                    </a>
                </div>
            </div>
            <div style='background: #f1f5f9; padding: 16px 32px; text-align: center;'>
                <p style='font-size: 12px; color: #94a3b8; margin: 0;'>
                    You are receiving this because you are a registered blood donor at {$site_name}.<br>
                    Contact us at <a href='mailto:" . esc_attr(get_option('admin_email')) . "' style='color: #dc2626;'>" . esc_html(get_option('admin_email')) . "</a>
                </p>
            </div>
        </div>";

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        return wp_mail($donor['email'], $subject, $message, $headers);
    }

    /**
     * Create in-app notification record for a matched donor
     */
    private function create_donor_notification($donor, $blood_group, $urgency, $patient_name, $hospital_name, $units, $component) {
        // Try to find donor's WP user ID via email
        $wp_user_id = null;
        if (!empty($donor['email'])) {
            $wp_user = get_user_by('email', $donor['email']);
            if ($wp_user) {
                $wp_user_id = $wp_user->ID;
            }
        }

        ECARE_DB_Client::insert('ecare_notifications', [
            'type'        => 'blood_donor_needed',
            'title'       => "🩸 Blood Donation Request — {$blood_group}",
            'message'     => "Urgent {$urgency} request for {$blood_group} {$component} ({$units} unit(s))" . ($hospital_name ? " at " . $hospital_name : "") . ". Your blood type matches. Please respond.",
            'for_user_id' => $wp_user_id,
            'for_role'    => 'blood_donor',
            'blood_group' => $blood_group,
            'urgency'     => $urgency,
            'read'        => false,
            'created_at'  => current_time('mysql'),
        ]);
    }

    /**
     * Create admin notification
     */
    public static function create_admin_notification($type, $message, $ref_id = '') {
        ECARE_DB_Client::insert('ecare_notifications', [
            'type'       => $type,
            'title'      => '🩸 Blood Bank Alert',
            'message'    => $message,
            'for_role'   => 'admin',
            'ref_id'     => $ref_id,
            'read'       => false,
            'created_at' => current_time('mysql'),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXPIRY ALERT SYSTEM
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main expiry scan — called from cron (ECARE_Reminders) and manual REST endpoint
     * Returns summary of what was processed
     */
    public static function scan_expiry_alerts() {
        $all_bags   = ECARE_DB_Client::select_all('ecare_blood_inventory');
        $today      = current_time('Y-m-d');
        $threshold  = date('Y-m-d', strtotime($today . ' +' . self::EXPIRY_ALERT_DAYS . ' days'));
        $alerted    = 0;
        $dismissed  = 0;
        $alerts     = [];

        foreach ($all_bags as $bag_row) {
            $bag = is_string($bag_row->data ?? null)
                ? json_decode($bag_row->data, true)
                : (array) $bag_row;

            if (empty($bag)) continue;

            $bag_id      = $bag['id'] ?? ($bag_row->id ?? '');
            $status      = strtolower($bag['status'] ?? 'available');
            $expiry_date = $bag['expiry_date'] ?? ($bag['expiryDate'] ?? '');

            // Only alert for Available bags with a valid future expiry date
            if ($status !== 'available' || empty($expiry_date)) continue;
            if ($expiry_date > $threshold) continue; // Not near expiry yet

            $days_remaining = (int) ceil((strtotime($expiry_date) - strtotime($today)) / 86400);

            if ($days_remaining < 0) {
                // Already expired — mark as Quarantine if not already
                if ($status === 'available') {
                    ECARE_DB_Client::update('ecare_blood_inventory', $bag_id, array_merge($bag, [
                        'status' => 'Quarantine',
                        'quarantine_reason' => 'Auto-quarantined: expired on ' . $expiry_date,
                    ]));
                }
                continue;
            }

            // Insert or update expiry alert record
            $alert_id = 'expiry_' . $bag_id;
            $existing_alert = ECARE_DB_Client::find_one('ecare_blood_expiry_alerts', $alert_id);

            $alert_data = [
                'id'             => $alert_id,
                'bag_id'         => $bag_id,
                'blood_group'    => $bag['blood_group'] ?? '',
                'component'      => $bag['component'] ?? 'Whole Blood',
                'expiry_date'    => $expiry_date,
                'days_remaining' => $days_remaining,
                'bag_status'     => $bag['status'] ?? 'Available',
                'donor_name'     => $bag['donor_name'] ?? '',
                'collection_date'=> $bag['collection_date'] ?? '',
                'alerted_at'     => current_time('mysql'),
                'dismissed'      => false,
            ];

            if ($existing_alert) {
                ECARE_DB_Client::update('ecare_blood_expiry_alerts', $alert_id, $alert_data);
            } else {
                ECARE_DB_Client::insert('ecare_blood_expiry_alerts', $alert_data);
                // Create notification only for new alerts
                $blood_group = $bag['blood_group'] ?? 'Unknown';
                self::create_admin_notification(
                    'blood_expiry_warning',
                    "⚠️ Blood Bag Expiring Soon: {$blood_group} bag (ID: {$bag_id}) expires in {$days_remaining} day(s) on {$expiry_date}. Please act promptly.",
                    $bag_id
                );
                $alerted++;
            }

            $alerts[] = $alert_data;
        }

        return [
            'scanned'  => count($all_bags),
            'new_alerts' => $alerted,
            'total_near_expiry' => count($alerts),
            'alerts'   => $alerts,
            'scanned_at' => current_time('mysql'),
        ];
    }

    /**
     * REST: Manual trigger expiry scan — POST /ecare/v1/blood-expiry-scan
     */
    public function handle_expiry_scan(WP_REST_Request $request) {
        $result = self::scan_expiry_alerts();
        return new WP_REST_Response(array_merge(['success' => true], $result), 200);
    }

    /**
     * REST: Get expiry alerts summary — GET /ecare/v1/blood-expiry-alerts-summary
     */
    public function handle_get_expiry_summary(WP_REST_Request $request) {
        $alerts = ECARE_DB_Client::select_all('ecare_blood_expiry_alerts');
        $active = array_filter($alerts, function($a) {
            $data = is_string($a->data ?? null) ? json_decode($a->data, true) : (array) $a;
            return !($data['dismissed'] ?? false) && ($data['days_remaining'] ?? 99) >= 0;
        });

        $result = array_map(function($a) {
            return is_string($a->data ?? null) ? json_decode($a->data, true) : (array) $a;
        }, array_values($active));

        // Sort by days_remaining ascending
        usort($result, function($a, $b) {
            return ($a['days_remaining'] ?? 99) - ($b['days_remaining'] ?? 99);
        });

        return new WP_REST_Response(['success' => true, 'alerts' => $result, 'count' => count($result)], 200);
    }
}
