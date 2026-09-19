<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_API
{
    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('wp_ajax_ecare_cart_sync', array($this, 'handle_ajax_cart_sync'));
        add_filter('rest_post_dispatch', array($this, 'disable_rest_caching'), 10, 3);
    }

    public function disable_rest_caching($response, $server, $request) {
        $route = $request->get_route();
        if (strpos($route, '/ecare/v1') !== false) {
            if (!defined('DONOTCACHEPAGE')) {
                define('DONOTCACHEPAGE', true);
            }
            
            // LiteSpeed force no cache action
            do_action('litespeed_control_force_nocache');
            
            if (is_a($response, 'WP_REST_Response')) {
                $response->header('Cache-Control', 'no-cache, must-revalidate, max-age=0, no-store, private');
                $response->header('Expires', 'Wed, 11 Jan 1984 05:00:00 GMT');
                $response->header('Pragma', 'no-cache');
                $response->header('X-LiteSpeed-Cache-Control', 'no-cache');
            }
        }
        return $response;
    }

    public function register_routes()
    {
        $modules = array(
            'stats',
            'patients',
            'staff',
            'doctors',
            'specialities',
            'services',
            'appointments',
            'care-providers',
            'care-provider-bookings',
            'ambulance',
            'ambulance-bookings',
            'billing',
            'refunds',
            'manual-verifications',
            'settings',
            'medical-vault',
            'lab-tests',
            'lab-orders',
            'lab-locations',
            'telemed-rooms',
            'telemed-messages',
            'payouts',
            'doctor-availability',
            'consultation-notes',
            'notifications',
            'patient-vitals',
            'staff-attendance',
            'support-tickets',
            'support-messages',
            'promo-codes',
            'reviews',
            'blood-inventory',
            'blood-donors',
            'blood-requests',
            'blood-camps',
            'blood-expiry-alerts'
        );

        register_rest_route('ecare/v1', '/bootstrap', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_bootstrap_request'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route('ecare/v1', '/sync-live', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_sync_live'),
            'permission_callback' => array($this, 'check_permission'),
        ));

        register_rest_route('ecare/v1', '/check-duplicates', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_check_duplicates'),
            'permission_callback' => '__return_true',
        ));

        // File Upload
        register_rest_route('ecare/v1', '/upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_file_upload'),
            'permission_callback' => array($this, 'check_authenticated_permission'),
        ));

        // Validate Promo Code
        register_rest_route('ecare/v1', '/validate-promo', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_validate_promo'),
            'permission_callback' => '__return_true',
        ));

        // WooCommerce Checkout Redirect Integration
        register_rest_route('ecare/v1', '/checkout/woocommerce', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_woocommerce_checkout'),
            'permission_callback' => array($this, 'check_authenticated_permission'),
        ));

        // WooCommerce Cart Sync
        register_rest_route('ecare/v1', '/cart/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_woocommerce_cart_sync'),
            'permission_callback' => array($this, 'check_authenticated_permission'),
        ));

        // WooCommerce Pay Remaining Balance
        register_rest_route('ecare/v1', '/billing/(?P<id>[^/]+)/pay-remaining', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_pay_remaining_balance'),
            'permission_callback' => array($this, 'check_billing_payment_permission'),
        ));

        // Doctors search endpoint
        register_rest_route('ecare/v1', '/doctors/search', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_doctors'),
            'permission_callback' => '__return_true',
        ));

        // Firebase configuration parameters endpoint
        register_rest_route('ecare/v1', '/firebase/config', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_firebase_config'),
            'permission_callback' => '__return_true',
        ));

        // Settings Administrator Management Endpoints
        register_rest_route('ecare/v1', '/settings/admins', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_settings_admins'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        register_rest_route('ecare/v1', '/settings/admins/promote', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_promote_settings_admin'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        register_rest_route('ecare/v1', '/settings/admins/demote', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_demote_settings_admin'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        register_rest_route('ecare/v1', '/reminders/run', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_run_reminders'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        register_rest_route('ecare/v1', '/reminders/test', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_test_reminders'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        register_rest_route('ecare/v1', '/files/(?P<id>[a-zA-Z0-9-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_private_file_download'),
            'permission_callback' => array($this, 'check_authenticated_permission'),
        ));

        register_rest_route('ecare/v1', '/appointments/lifecycle/run', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_run_appointment_lifecycle'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        // Settings System Health and Diagnostics Endpoints
        register_rest_route('ecare/v1', '/settings/health/check', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_health_check'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        register_rest_route('ecare/v1', '/settings/health/repair', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_repair_db'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        // Settings Database Cleanup Endpoint
        register_rest_route('ecare/v1', '/settings/cleanup', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_database_cleanup'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        // Settings Full System Reset Endpoint
        register_rest_route('ecare/v1', '/settings/reset-system', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_system_reset'),
            'permission_callback' => array($this, 'check_settings_permission'),
        ));

        // Onboarding Completion Endpoint
        register_rest_route('ecare/v1', '/onboarding/complete', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_onboarding_complete'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));

        // Daily.co RTC Room & Token Session Endpoint
        register_rest_route('ecare/v1', '/telemed/token', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_telemed_token_request'),
            'permission_callback' => '__return_true',
        ));

        // Daily.co Connection Test Endpoint (Admin only)
        register_rest_route('ecare/v1', '/telemed/test-daily', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_test_daily_connection'),
            'permission_callback' => function() {
                return current_user_can('manage_options') || current_user_can('ecare_manage_settings');
            },
        ));

        // Agora RTC & Signaling Consultation Token Endpoint
        register_rest_route('ecare/v1', '/telemed/agora/token', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_agora_token_request'),
            'permission_callback' => array($this, 'check_authenticated_permission'),
        ));

        // Agora Connection & Token Diagnostics Endpoint (Admin only)
        register_rest_route('ecare/v1', '/telemed/agora/test', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_test_agora_connection'),
            'permission_callback' => function() {
                return current_user_can('manage_options') || current_user_can('ecare_manage_settings');
            },
        ));

        // Telemedicine Room Presence & Lifecycle Endpoint
        register_rest_route('ecare/v1', '/telemed/room/presence', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_telemed_room_presence'),
            'permission_callback' => array($this, 'check_authenticated_permission'),
        ));

        foreach ($modules as $module) {
            // Bulk Delete
            register_rest_route('ecare/v1', '/bulk-delete/' . $module, array(
                'methods' => 'POST',
                'callback' => array($this, 'handle_bulk_delete_request'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array('module' => array('default' => $module))
            ));

            // GET all
            register_rest_route('ecare/v1', '/' . $module, array(
                'methods' => 'GET',
                'callback' => array($this, 'handle_get_request'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array('module' => array('default' => $module))
            ));

            // GET single
            register_rest_route('ecare/v1', '/' . $module . '/(?P<id>[^/]+)', array(
                'methods' => 'GET',
                'callback' => array($this, 'handle_get_request'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array('module' => array('default' => $module))
            ));

            // POST create
            register_rest_route('ecare/v1', '/' . $module, array(
                'methods' => 'POST',
                'callback' => array($this, 'handle_post_request'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array('module' => array('default' => $module))
            ));

            // PUT update
            register_rest_route('ecare/v1', '/' . $module . '/(?P<id>[^/]+)', array(
                'methods' => 'PUT',
                'callback' => array($this, 'handle_put_request'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array('module' => array('default' => $module))
            ));

            // DELETE
            register_rest_route('ecare/v1', '/' . $module . '/(?P<id>[^/]+)', array(
                'methods' => 'DELETE',
                'callback' => array($this, 'handle_delete_request'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => array('module' => array('default' => $module))
            ));
        }
    }

    private function get_current_user_role()
    {
        $user = wp_get_current_user();
        if (!$user || !$user->exists()) {
            return 'guest';
        }
        if ($user->has_cap('manage_options') || in_array('ecare_admin', $user->roles, true)) {
            return 'admin';
        }
        if (in_array('ecare_doctor', $user->roles, true)) {
            return 'doctor';
        }
        if (in_array('ecare_receptionist', $user->roles, true) || in_array('ecare_staff', $user->roles, true)) {
            return 'staff';
        }
        if (in_array('ecare_patient', $user->roles, true)) {
            return 'patient';
        }
        return 'guest';
    }

    public function handle_bootstrap_request($request) {
        $role = $this->get_current_user_role();
        $current_user_id = get_current_user_id();

        // Map endpoint names to ecare_ collection names
        $all_modules = array(
            'patients'               => 'ecare_patients',
            'staff'                  => 'ecare_staff',
            'doctors'                => 'ecare_staff',
            'specialities'           => 'ecare_specialities',
            'services'               => 'ecare_services',
            'appointments'           => 'ecare_appointments',
            'care-providers'         => 'ecare_care_providers',
            'care-provider-bookings' => 'ecare_care_provider_bookings',
            'ambulance'              => 'ecare_ambulance',
            'ambulance-bookings'     => 'ecare_ambulance_bookings',
            'billing'                => 'ecare_billing',
            'refunds'                => 'ecare_refunds',
            'manual-verifications'   => 'ecare_manual_verifications',
            'lab-tests'              => 'ecare_lab_tests',
            'lab-orders'             => 'ecare_lab_orders',
            'lab-locations'          => 'ecare_lab_locations',
            'telemed-rooms'          => 'ecare_telemed_rooms',
            'telemed-messages'       => 'ecare_telemed_messages',
            'doctor-availability'    => 'ecare_doctor_availability',
            'consultation-notes'     => 'ecare_consultation_notes',
            'staff-attendance'       => 'ecare_staff_attendance',
            'settings'               => 'ecare_settings',
            'support-tickets'        => 'ecare_support_tickets',
            'support-messages'       => 'ecare_support_messages',
            'notifications'          => 'ecare_notifications',
            'payouts'                => 'ecare_payouts',
            'reviews'                => 'ecare_reviews',
            'blood-inventory'        => 'ecare_blood_inventory',
            'blood-donors'           => 'ecare_blood_donors',
            'blood-requests'         => 'ecare_blood_requests',
        );

        // Filter modules allowed for current user role
        $allowed_modules = array();
        foreach ($all_modules as $endpoint => $collection) {
            if ($role === 'admin') {
                $allowed_modules[$endpoint] = $collection;
            } elseif ($role === 'staff') {
                if (in_array($endpoint, array('patients', 'staff', 'doctors', 'specialities', 'services', 'appointments', 'care-providers', 'care-provider-bookings', 'ambulance', 'ambulance-bookings', 'billing', 'refunds', 'manual-verifications', 'lab-tests', 'lab-orders', 'lab-locations', 'telemed-rooms', 'telemed-messages', 'doctor-availability', 'consultation-notes', 'staff-attendance', 'settings', 'support-tickets', 'support-messages', 'notifications', 'payouts', 'reviews', 'blood-inventory', 'blood-donors', 'blood-requests'), true)) {
                    $allowed_modules[$endpoint] = $collection;
                }
            } elseif ($role === 'doctor') {
                if (in_array($endpoint, array('doctors', 'specialities', 'services', 'appointments', 'telemed-rooms', 'telemed-messages', 'doctor-availability', 'consultation-notes', 'staff-attendance', 'support-tickets', 'support-messages', 'notifications', 'patients', 'billing', 'lab-orders', 'care-provider-bookings', 'payouts', 'reviews', 'blood-inventory', 'blood-donors', 'blood-requests'), true)) {
                    $allowed_modules[$endpoint] = $collection;
                }
            } elseif ($role === 'patient') {
                if (in_array($endpoint, array('specialities', 'services', 'doctors', 'care-providers', 'ambulance', 'lab-tests', 'lab-locations', 'doctor-availability', 'appointments', 'billing', 'refunds', 'lab-orders', 'care-provider-bookings', 'ambulance-bookings', 'telemed-rooms', 'telemed-messages', 'consultation-notes', 'support-tickets', 'support-messages', 'notifications', 'manual-verifications', 'patients', 'reviews', 'blood-inventory', 'blood-donors', 'blood-requests'), true)) {
                    $allowed_modules[$endpoint] = $collection;
                }
            } else {
                // Guest
                if (in_array($endpoint, array('doctors', 'specialities', 'services', 'care-providers', 'ambulance', 'lab-tests', 'lab-locations', 'doctor-availability', 'settings', 'reviews', 'blood-inventory'), true)) {
                    $allowed_modules[$endpoint] = $collection;
                }
            }
        }

        // Fetch all allowed collections in 1 single database call (deduplicated collection list)
        $collections_to_fetch = array_unique(array_values($allowed_modules));
        $batch_data = ECARE_DB_Client::select_batch_collections($collections_to_fetch);

        // Map collection results back to endpoint keys
        $response_data = array();
        foreach ($allowed_modules as $endpoint => $collection) {
            $data = $batch_data[$collection] ?? array();
            
            // Filter doctors vs staff from ecare_staff collection
            if ($endpoint === 'doctors') {
                $data = array_values(array_filter($data, function($item) {
                    return ($item->role ?? '') === 'doctor';
                }));
            } elseif ($endpoint === 'staff') {
                $data = array_values(array_filter($data, function($item) {
                    return ($item->role ?? '') !== 'doctor';
                }));
            }

            // Apply role-based record filtering for privacy
            if ($role === 'patient' && in_array($endpoint, array('appointments', 'billing', 'refunds', 'lab-orders', 'care-provider-bookings', 'ambulance-bookings', 'telemed-rooms', 'telemed-messages', 'consultation-notes', 'support-tickets', 'support-messages', 'manual-verifications', 'reviews'), true)) {
                $data = array_values(array_filter($data, function($item) use ($current_user_id, $endpoint) {
                    if ($endpoint === 'support-tickets') return strval($item->user_id ?? '') === strval($current_user_id);
                    if ($endpoint === 'support-messages') return true;
                    if ($endpoint === 'telemed-messages') return true;
                    if ($endpoint === 'billing') return $this->billing_belongs_to_current_user($item, $current_user_id);
                    if ($endpoint === 'refunds') return $this->refund_belongs_to_current_user($item, $current_user_id);
                    if ($endpoint === 'reviews') {
                        if (($item->status ?? '') === 'Approved') return true;
                        return strval($item->patient_id ?? $item->patient_user_id ?? $item->user_id ?? '') === strval($current_user_id);
                    }
                    return strval($item->patient_id ?? $item->patient_user_id ?? $item->user_id ?? $item->patientId ?? '') === strval($current_user_id);
                }));
            }
            
            if ($role === 'doctor' && in_array($endpoint, array('appointments', 'telemed-rooms', 'telemed-messages', 'consultation-notes', 'doctor-availability', 'payouts', 'reviews'), true)) {
                $doctor_name = $this->get_doctor_name_by_user_id($current_user_id);
                $data = array_values(array_filter($data, function($item) use ($current_user_id, $doctor_name, $endpoint) {
                    if ($endpoint === 'doctor-availability') return strval($item->doctor_id ?? $item->doctor_user_id ?? '') === strval($current_user_id);
                    if ($endpoint === 'payouts') return strval($item->doctor_id ?? $item->doctor_user_id ?? $item->user_id ?? '') === strval($current_user_id);
                    if ($endpoint === 'appointments') {
                        return $this->doctor_can_access_appointment($item, $current_user_id, $doctor_name);
                    }
                    if ($endpoint === 'reviews') {
                        if (($item->status ?? '') === 'Approved') return true;
                        $matches_id = strval($item->doctor_id ?? $item->doctor_user_id ?? '') === strval($current_user_id);
                        $matches_name = !empty($doctor_name) && (($item->doctor_name ?? '') === $doctor_name || ($item->doctorName ?? '') === $doctor_name);
                        return $matches_id || $matches_name;
                    }
                    return true;
                }));
            }

            if ($role === 'guest' && $endpoint === 'reviews') {
                $data = array_values(array_filter($data, function($item) {
                    return ($item->status ?? '') === 'Approved';
                }));
            }

            if ($endpoint === 'settings') {
                $settings_record = $data[0] ?? new stdClass();
                if (is_object($settings_record)) {
                    if (!empty($settings_record->agoraAppCertificate) || !empty(get_option('ecare_agora_app_certificate', ''))) {
                        $settings_record->hasAgoraAppCertificate = true;
                    }
                    unset($settings_record->agoraAppCertificate, $settings_record->dailyApiKey);
                } elseif (is_array($settings_record)) {
                    if (!empty($settings_record['agoraAppCertificate']) || !empty(get_option('ecare_agora_app_certificate', ''))) {
                        $settings_record['hasAgoraAppCertificate'] = true;
                    }
                    unset($settings_record['agoraAppCertificate'], $settings_record['dailyApiKey']);
                }
                $response_data['settings'] = $settings_record;
            } else {
                if ($endpoint === 'refunds') {
                    $this->sync_refund_statuses($data, $batch_data['ecare_billing'] ?? null);
                }
                $response_data[$endpoint] = $data;
            }
        }

        // Add stats data if requested/allowed
        if (in_array($role, array('admin', 'staff'), true)) {
            $response_data['stats'] = array(
                'total_patients'     => count($response_data['patients'] ?? array()),
                'total_doctors'      => count($response_data['doctors'] ?? array()),
                'total_appointments' => count($response_data['appointments'] ?? array()),
                'total_billing'      => count($response_data['billing'] ?? array())
            );
        }

        return rest_ensure_response($response_data);
    }

    private function get_doctor_name_by_user_id($user_id) {
        if (empty($user_id)) {
            return '';
        }
        $staff = ECARE_DB_Client::select_where('ecare_staff', 'user_id', intval($user_id));
        if (empty($staff)) {
            $staff = ECARE_DB_Client::select_where('ecare_staff', 'user_id', strval($user_id));
        }
        if (!empty($staff) && isset($staff[0]->name)) {
            return $staff[0]->name;
        }
        // Fallback to WordPress display name if not found in MySQL DB yet
        $user = get_userdata($user_id);
        return $user ? $user->display_name : '';
    }

    private function can_manage_settings() {
        return current_user_can('manage_options') || current_user_can('ecare_manage_settings') || $this->get_current_user_role() === 'admin';
    }

    public function check_authenticated_permission($request = null) {
        if ($this->get_current_user_role() === 'guest') {
            return new WP_Error('rest_forbidden', __('You must be signed in to perform this action.', 'e-care-management'), array('status' => 401));
        }
        return true;
    }

    public function check_settings_permission($request = null) {
        if (!$this->can_manage_settings()) {
            return new WP_Error('rest_forbidden', __('You do not have permission to manage E-CARE settings.', 'e-care-management'), array('status' => 403));
        }
        return true;
    }

    public function check_billing_payment_permission($request) {
        $auth = $this->check_authenticated_permission($request);
        if (is_wp_error($auth)) {
            return $auth;
        }

        $billing_id = $request ? sanitize_text_field($request->get_param('id')) : '';
        $billing = ECARE_DB_Client::select_one('ecare_billing', $billing_id);
        if (!$billing) {
            return new WP_Error('not_found', __('Billing record not found.', 'e-care-management'), array('status' => 404));
        }

        if (!$this->can_access_billing_payment($billing)) {
            return new WP_Error('rest_forbidden', __('You cannot pay this invoice.', 'e-care-management'), array('status' => 403));
        }

        return true;
    }

    private function value_matches_user($value, $user_id) {
        return $value !== null && $value !== '' && strval($value) === strval($user_id);
    }

    private function record_matches_user($record, $fields, $user_id) {
        foreach ($fields as $field) {
            if (isset($record->$field) && $this->value_matches_user($record->$field, $user_id)) {
                return true;
            }
        }
        return false;
    }

    private function doctor_can_access_appointment($appointment, $doctor_user_id = null, $doctor_name = null) {
        if (!$appointment) {
            return false;
        }
        if ($doctor_user_id === null) {
            $doctor_user_id = get_current_user_id();
        }
        if ($doctor_name === null) {
            $doctor_name = $this->get_doctor_name_by_user_id($doctor_user_id);
        }

        if ($this->record_matches_user($appointment, array('doctor_id', 'doctor_user_id', 'doctorUserId'), $doctor_user_id)) {
            return true;
        }
        if (!empty($doctor_name) && isset($appointment->doctorName) && $appointment->doctorName === $doctor_name) {
            return true;
        }

        return (($appointment->status ?? '') === 'Query' && ($appointment->mode ?? '') === 'Instant Call');
    }

    private function normalize_appointment_status($status) {
        return strtolower(trim((string) $status));
    }

    private function appointment_blocks_schedule($appointment) {
        $status = $this->normalize_appointment_status($appointment->status ?? '');
        return !in_array($status, array('cancelled', 'expired', 'refunded', 'closed'), true);
    }

    private function parse_time_to_minutes($time_string) {
        $time_string = trim((string) $time_string);
        if ($time_string === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2}):(\d{2})$/', $time_string, $matches)) {
            return (((int) $matches[1]) * 60) + (int) $matches[2];
        }

        if (preg_match('/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i', $time_string, $matches)) {
            $hours = (int) $matches[1] % 12;
            if (strtoupper($matches[3]) === 'PM') {
                $hours += 12;
            }
            return ($hours * 60) + (int) $matches[2];
        }

        return null;
    }

    private function get_appointment_time_range($time_string) {
        $parts = preg_split('/\s*-\s*/', trim((string) $time_string));
        $start = $this->parse_time_to_minutes($parts[0] ?? '');
        if ($start === null) {
            return null;
        }

        $end = null;
        if (count($parts) > 1) {
            $end = $this->parse_time_to_minutes($parts[1]);
        }
        if ($end === null || $end <= $start) {
            $end = $start + 60;
        }

        return array($start, $end);
    }

    private function appointment_time_ranges_overlap($first_time, $second_time) {
        $first_range = $this->get_appointment_time_range($first_time);
        $second_range = $this->get_appointment_time_range($second_time);

        if (!$first_range || !$second_range) {
            return trim((string) $first_time) === trim((string) $second_time);
        }

        return $first_range[0] < $second_range[1] && $second_range[0] < $first_range[1];
    }

    private function get_appointment_doctor_keys($appointment) {
        $keys = array();
        foreach (array('doctor_id', 'doctor_user_id', 'doctorUserId') as $field) {
            if (is_array($appointment) && !empty($appointment[$field])) {
                $keys[] = 'id:' . strval($appointment[$field]);
            } elseif (is_object($appointment) && !empty($appointment->$field)) {
                $keys[] = 'id:' . strval($appointment->$field);
            }
        }

        $doctor_name = '';
        if (is_array($appointment)) {
            $doctor_name = trim((string) ($appointment['doctorName'] ?? ''));
        } elseif (is_object($appointment)) {
            $doctor_name = trim((string) ($appointment->doctorName ?? ''));
        }
        if ($doctor_name !== '') {
            $keys[] = 'name:' . strtolower($doctor_name);
        }

        return array_values(array_unique($keys));
    }

    private function find_conflicting_appointment($candidate, $exclude_id = null) {
        $candidate_date = is_array($candidate) ? ($candidate['date'] ?? '') : ($candidate->date ?? '');
        $candidate_time = is_array($candidate) ? ($candidate['time'] ?? '') : ($candidate->time ?? '');
        $doctor_keys = $this->get_appointment_doctor_keys($candidate);

        if (empty($candidate_date) || empty($candidate_time) || empty($doctor_keys)) {
            return null;
        }

        $appointments = ECARE_DB_Client::select_all('ecare_appointments');
        foreach ($appointments as $appointment) {
            if (!empty($exclude_id) && strval($appointment->id ?? '') === strval($exclude_id)) {
                continue;
            }
            if (!$this->appointment_blocks_schedule($appointment)) {
                continue;
            }
            if (($appointment->date ?? '') !== $candidate_date) {
                continue;
            }
            if (empty(array_intersect($doctor_keys, $this->get_appointment_doctor_keys($appointment)))) {
                continue;
            }
            if ($this->appointment_time_ranges_overlap($candidate_time, $appointment->time ?? '')) {
                return $appointment;
            }
        }

        return null;
    }

    private function doctor_can_access_patient($patient_user_id, $doctor_user_id = null, $doctor_name = null) {
        if (empty($patient_user_id)) {
            return false;
        }
        if ($doctor_user_id === null) {
            $doctor_user_id = get_current_user_id();
        }
        if ($doctor_name === null) {
            $doctor_name = $this->get_doctor_name_by_user_id($doctor_user_id);
        }

        $appointments = ECARE_DB_Client::select_all('ecare_appointments');
        foreach ($appointments as $appointment) {
            if (!$this->record_matches_user($appointment, array('patient_user_id', 'patient_id', 'user_id'), $patient_user_id)) {
                continue;
            }
            if ($this->doctor_can_access_appointment($appointment, $doctor_user_id, $doctor_name)) {
                return true;
            }
        }

        $rooms = ECARE_DB_Client::select_all('ecare_telemed_rooms');
        foreach ($rooms as $room) {
            if ($this->record_matches_user($room, array('patient_id'), $patient_user_id) && $this->record_matches_user($room, array('doctor_id'), $doctor_user_id)) {
                return true;
            }
        }

        return false;
    }

    private function can_access_related_room($room_id, $role, $current_user_id) {
        if (empty($room_id)) {
            return false;
        }
        $room = ECARE_DB_Client::select_one('ecare_telemed_rooms', $room_id);
        if (!$room) {
            return false;
        }
        if ($role === 'patient') {
            return $this->record_matches_user($room, array('patient_id'), $current_user_id);
        }
        if ($role === 'doctor') {
            return $this->record_matches_user($room, array('doctor_id'), $current_user_id);
        }
        return in_array($role, array('admin', 'staff'), true);
    }

    private function can_access_related_ticket($ticket_id, $role, $current_user_id) {
        if (empty($ticket_id)) {
            return false;
        }
        $ticket = ECARE_DB_Client::select_one('ecare_support_tickets', $ticket_id);
        if (!$ticket) {
            return false;
        }
        if (in_array($role, array('admin', 'staff'), true)) {
            return true;
        }
        return $this->record_matches_user($ticket, array('user_id'), $current_user_id);
    }

    private function billing_belongs_to_current_user($billing, $current_user_id = null) {
        if ($current_user_id === null) {
            $current_user_id = get_current_user_id();
        }
        if (!$current_user_id) {
            return false;
        }
        if ($this->record_matches_user($billing, array('patient_user_id', 'patient_id', 'user_id', 'patientId'), $current_user_id)) {
            return true;
        }

        if (!empty($billing->patientName)) {
            $user = get_userdata($current_user_id);
            if ($user) {
                $p_name = strtolower(trim($billing->patientName));
                if ($p_name === strtolower(trim($user->display_name ?? '')) || $p_name === strtolower(trim($user->user_login ?? ''))) {
                    return true;
                }
            }
        }

        $linked_modules = array(
            array('table' => 'ecare_appointments', 'field' => 'appointmentId'),
            array('table' => 'ecare_care_provider_bookings', 'field' => 'careProviderBookingId'),
            array('table' => 'ecare_lab_orders', 'field' => 'labOrderId'),
            array('table' => 'ecare_ambulance_bookings', 'field' => 'ambulanceBookingId'),
        );
        foreach ($linked_modules as $link) {
            $linked_id = $billing->{$link['field']} ?? null;
            if (empty($linked_id)) {
                continue;
            }
            $linked_record = ECARE_DB_Client::select_one($link['table'], $linked_id);
            if ($linked_record && $this->record_matches_user($linked_record, array('patient_user_id', 'patient_id', 'user_id'), $current_user_id)) {
                return true;
            }
        }

        return false;
    }

    private function refund_belongs_to_current_user($refund, $current_user_id = null) {
        if ($current_user_id === null) {
            $current_user_id = get_current_user_id();
        }
        if (!$current_user_id) {
            return false;
        }
        if ($this->record_matches_user($refund, array('patient_user_id', 'patient_id', 'user_id', 'patientId'), $current_user_id)) {
            return true;
        }

        if (!empty($refund->patientName)) {
            $user = get_userdata($current_user_id);
            if ($user) {
                $p_name = strtolower(trim($refund->patientName));
                if ($p_name === strtolower(trim($user->display_name ?? '')) || $p_name === strtolower(trim($user->user_login ?? ''))) {
                    return true;
                }
            }
        }

        if (!empty($refund->transactionId)) {
            $billing = ECARE_DB_Client::select_one('ecare_billing', $refund->transactionId);
            if ($billing && $this->billing_belongs_to_current_user($billing, $current_user_id)) {
                return true;
            }
        }

        return false;
    }

    private function sync_refund_statuses(&$refunds, $billings = null) {
        if (empty($refunds)) {
            return;
        }
        if ($billings === null) {
            $billings = ECARE_DB_Client::select_all('ecare_billing');
        }
        $billings_map = array();
        foreach ($billings as $b) {
            if (!empty($b->id)) {
                $billings_map[strval($b->id)] = $b;
            }
            if (!empty($b->invoiceNo)) {
                $billings_map[strval($b->invoiceNo)] = $b;
            }
        }
        foreach ($refunds as $ref) {
            $b = $billings_map[strval($ref->transactionId ?? '')] ?? $billings_map[strval($ref->invoiceNo ?? '')] ?? null;
            $is_auto_refund = (strpos(strtolower($ref->reason ?? ''), 'auto-refund') !== false);
            if (($ref->status ?? '') === 'Pending' && (($b && ($b->status ?? '') === 'Refunded') || $is_auto_refund)) {
                $ref->status = 'Processed';
                ECARE_DB_Client::update('ecare_refunds', $ref->id, array('status' => 'Processed'));
            }
        }
    }

    private function can_access_billing_payment($billing) {
        $role = $this->get_current_user_role();
        if (in_array($role, array('admin', 'staff'), true)) {
            return true;
        }
        return $role === 'patient' && $this->billing_belongs_to_current_user($billing);
    }

    private function can_access_record($module, $record, $action = 'read') {
        if (!$record) {
            return false;
        }

        $role = $this->get_current_user_role();
        $current_user_id = get_current_user_id();

        if (in_array($role, array('admin', 'staff'), true)) {
            return true;
        }

        $public_read_modules = array('doctors', 'specialities', 'services', 'lab-tests', 'lab-locations', 'settings', 'stats', 'blood-inventory', 'blood-donors', 'blood-camps');
        if ($action === 'read' && in_array($module, $public_read_modules, true)) {
            return true;
        }

        if ($role === 'guest') {
            if ($action === 'read' && $module === 'reviews') {
                return ($record->status ?? '') === 'Approved';
            }
            return false;
        }

        if ($role === 'patient') {
            if (in_array($module, array('appointments', 'care-provider-bookings', 'ambulance-bookings', 'lab-orders', 'medical-vault', 'patient-vitals'), true)) {
                return $this->record_matches_user($record, array('patient_user_id', 'patient_id', 'user_id'), $current_user_id);
            }
            if ($module === 'reviews') {
                if ($action === 'read') {
                    if (($record->status ?? '') === 'Approved') {
                        return true;
                    }
                    return $this->record_matches_user($record, array('patient_user_id', 'patient_id', 'user_id'), $current_user_id);
                }
                return $this->record_matches_user($record, array('patient_user_id', 'patient_id', 'user_id'), $current_user_id);
            }
            if ($module === 'blood-requests') {
                return true;
            }
            if ($module === 'blood-donors') {
                return true;
            }
            // Patients can read blood camps and POST camp registrations (handled via update)
            if ($module === 'blood-camps') {
                return true;
            }
            if ($module === 'billing') {
                return $this->billing_belongs_to_current_user($record, $current_user_id);
            }
            if ($module === 'refunds') {
                return $this->refund_belongs_to_current_user($record, $current_user_id);
            }
            if ($module === 'patients') {
                return $this->record_matches_user($record, array('user_id', 'id'), $current_user_id);
            }
            if ($module === 'telemed-rooms') {
                return $this->record_matches_user($record, array('patient_id'), $current_user_id);
            }
            if ($module === 'telemed-messages') {
                return $this->record_matches_user($record, array('sender_id'), $current_user_id) || $this->can_access_related_room($record->room_id ?? null, $role, $current_user_id);
            }
            if ($module === 'support-tickets') {
                return $this->record_matches_user($record, array('user_id'), $current_user_id);
            }
            if ($module === 'support-messages') {
                return $this->record_matches_user($record, array('sender_id'), $current_user_id) || $this->can_access_related_ticket($record->ticket_id ?? null, $role, $current_user_id);
            }
            if ($module === 'notifications') {
                return $this->record_matches_user($record, array('user_id'), $current_user_id);
            }
            return false;
        }

        if ($role === 'doctor') {
            $doctor_name = $this->get_doctor_name_by_user_id($current_user_id);

            if ($module === 'reviews') {
                if ($action === 'read') {
                    if (($record->status ?? '') === 'Approved') {
                        return true;
                    }
                    return $this->record_matches_user($record, array('doctor_id', 'doctor_user_id'), $current_user_id) || (!empty($doctor_name) && (($record->doctorName ?? '') === $doctor_name || ($record->doctor_name ?? '') === $doctor_name));
                }
                return false;
            }
            if ($module === 'blood-requests' || $module === 'blood-donors') {
                return true;
            }
            if ($module === 'appointments') {
                return $this->doctor_can_access_appointment($record, $current_user_id, $doctor_name);
            }
            if ($module === 'billing') {
                if (!empty($record->doctorName) && $record->doctorName === $doctor_name) {
                    return true;
                }
                if (!empty($record->appointmentId)) {
                    return $this->doctor_can_access_appointment(ECARE_DB_Client::select_one('ecare_appointments', $record->appointmentId), $current_user_id, $doctor_name);
                }
                return false;
            }
            if ($module === 'patients') {
                $patient_user_id = $record->user_id ?? $record->id ?? null;
                return $this->doctor_can_access_patient($patient_user_id, $current_user_id, $doctor_name);
            }
            if (in_array($module, array('medical-vault', 'patient-vitals', 'lab-orders', 'consultation-notes'), true)) {
                if ($this->record_matches_user($record, array('doctor_id', 'doctor_user_id'), $current_user_id)) {
                    return true;
                }
                $patient_user_id = $record->patient_user_id ?? $record->patient_id ?? null;
                return $this->doctor_can_access_patient($patient_user_id, $current_user_id, $doctor_name);
            }
            if ($module === 'telemed-rooms') {
                return $this->record_matches_user($record, array('doctor_id'), $current_user_id);
            }
            if ($module === 'telemed-messages') {
                return $this->record_matches_user($record, array('sender_id'), $current_user_id) || $this->can_access_related_room($record->room_id ?? null, $role, $current_user_id);
            }
            if ($module === 'doctor-availability') {
                return $this->record_matches_user($record, array('doctor_id'), $current_user_id);
            }
            if ($module === 'doctors') {
                return $this->record_matches_user($record, array('user_id'), $current_user_id);
            }
            if ($module === 'staff') {
                return $this->record_matches_user($record, array('user_id'), $current_user_id);
            }
            if ($module === 'support-tickets') {
                return $this->record_matches_user($record, array('user_id'), $current_user_id);
            }
            if ($module === 'support-messages') {
                return $this->record_matches_user($record, array('sender_id'), $current_user_id) || $this->can_access_related_ticket($record->ticket_id ?? null, $role, $current_user_id);
            }
            if ($module === 'notifications') {
                return $this->record_matches_user($record, array('user_id'), $current_user_id);
            }
            if ($module === 'payouts') {
                return $this->record_matches_user($record, array('doctor_id', 'user_id'), $current_user_id) || (!empty($doctor_name) && (($record->doctorName ?? '') === $doctor_name || ($record->doctor_name ?? '') === $doctor_name));
            }
            return false;
        }

        return false;
    }

    public function check_permission($request = null)
    {
        $role = $this->get_current_user_role();
        $module = $request ? $request->get_param('module') : null;
        $method = $request ? $request->get_method() : 'GET';

        if ($role === 'guest') {
            if ($method === 'GET' && in_array($module, array('specialities', 'services', 'settings', 'doctors', 'reviews', 'blood-inventory', 'blood-donors'), true)) {
                return true;
            }
            if ($method === 'POST' && in_array($module, array('doctors', 'care-providers', 'ambulance'), true)) {
                return true;
            }
            return false;
        }

        if ($request && strpos($request->get_route(), '/sync-live') !== false) {
            return true;
        }
        if ($role === 'admin') {
            return true;
        }

        $module = $request ? $request->get_param('module') : null;
        $method = $request ? $request->get_method() : 'GET';

        if ($role === 'staff') {
            if (in_array($method, array('POST', 'PUT', 'DELETE'), true)) {
                $restricted_staff_modules = array('settings', 'staff', 'doctors', 'payouts', 'disbursements');
                if (in_array($module, $restricted_staff_modules, true)) {
                    return false;
                }
            }
            return true;
        }

        if ($role === 'doctor') {
            $allowed_doctor_modules = array(
                'appointments', 'telemed-rooms', 'telemed-messages', 'doctor-availability', 
                'consultation-notes', 'patient-vitals', 'payouts', 'patients', 'specialities', 'services', 
                'lab-tests', 'lab-locations', 'lab-orders', 'support-tickets', 'support-messages', 'medical-vault',
                'doctors', 'staff', 'notifications', 'stats', 'settings', 'billing',
                'reviews', 'blood-inventory', 'blood-donors', 'blood-requests'
            );
            if (!in_array($module, $allowed_doctor_modules, true)) {
                return false;
            }
            if (in_array($method, array('POST', 'PUT', 'DELETE'), true)) {
                $restricted_doctor_modules = array('patients', 'specialities', 'services', 'lab-tests', 'lab-locations', 'settings', 'reviews', 'blood-inventory');
                if (in_array($module, $restricted_doctor_modules, true)) {
                    return false;
                }
            }
            return true;
        }

        if ($role === 'patient') {
            $allowed_patient_modules = array(
                'appointments', 'care-provider-bookings', 'ambulance-bookings', 'billing', 
                'medical-vault', 'telemed-rooms', 'telemed-messages', 'support-tickets', 
                'support-messages', 'patients', 'specialities', 'services', 'doctors', 
                'lab-tests', 'lab-locations', 'lab-orders', 'patient-vitals', 'notifications',
                'stats', 'settings', 'reviews', 'blood-inventory', 'blood-donors', 'blood-requests'
            );
            if (!in_array($module, $allowed_patient_modules, true)) {
                return false;
            }
            if (in_array($method, array('POST', 'PUT', 'DELETE'), true)) {
                // Patients cannot create/modify clinic catalogue data or blood inventory (read-only for them)
                $restricted_patient_modules = array('specialities', 'services', 'doctors', 'lab-tests', 'lab-locations', 'settings', 'blood-inventory');
                if (in_array($module, $restricted_patient_modules, true)) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    // get_table_name() removed — all data uses ECARE_DB_Client (MySQL wpdb backend) via get_collection_name()

    private function get_collection_name($module)
    {
        $map = array(
            'patients' => 'ecare_patients',
            'staff' => 'ecare_staff',
            'doctors' => 'ecare_staff',
            'specialities' => 'ecare_specialities',
            'services' => 'ecare_services',
            'appointments' => 'ecare_appointments',
            'care-providers' => 'ecare_care_providers',
            'care-provider-bookings' => 'ecare_care_provider_bookings',
            'ambulance' => 'ecare_ambulance',
            'ambulance-bookings' => 'ecare_ambulance_bookings',
            'billing' => 'ecare_billing',
            'refunds' => 'ecare_refunds',
            'manual-verifications' => 'ecare_manual_verifications',
            'medical-vault' => 'ecare_medical_vault',
            'lab-tests'     => 'ecare_lab_tests',
            'lab-orders'    => 'ecare_lab_orders',
            'lab-locations' => 'ecare_lab_locations',
            'telemed-rooms' => 'ecare_telemed_rooms',
            'telemed-messages' => 'ecare_telemed_messages',
            'doctor-availability' => 'ecare_doctor_availability',
            'consultation-notes' => 'ecare_consultation_notes',
            'notifications' => 'ecare_notifications',
            'patient-vitals' => 'ecare_patient_vitals',
            'payouts'        => 'ecare_payouts',
            'staff-attendance' => 'ecare_staff_attendance',
            'support-tickets' => 'ecare_support_tickets',
            'support-messages' => 'ecare_support_messages',
            'promo-codes' => 'ecare_promo_codes',
            'reviews' => 'ecare_reviews',
            'blood-inventory' => 'ecare_blood_inventory',
            'blood-donors'    => 'ecare_blood_donors',
            'blood-requests'  => 'ecare_blood_requests',
            'blood-camps'     => 'ecare_blood_camps',
            'blood-expiry-alerts' => 'ecare_blood_expiry_alerts'
        );
        return isset($map[$module]) ? $map[$module] : null;
    }

    private function delete_dashboard_cache()
    {
        delete_transient('ecare_dashboard_stats_admin_global');
        
        // Purge LiteSpeed Cache
        do_action('litespeed_purge_all');
        
        // Support other caching plugins
        if (function_exists('w3tc_pgcache_flush')) {
            w3tc_pgcache_flush();
        }
        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
        }
        if (class_exists('WPRocket\Plugin') && function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
        }
    }

    private function log_audit_event($action, $module, $record_id = null, $details = array()) {
        $sensitive_modules = array(
            'appointments', 'billing', 'refunds', 'manual-verifications', 'medical-vault',
            'lab-orders', 'telemed-rooms', 'telemed-messages', 'consultation-notes',
            'patient-vitals', 'patients', 'payouts', 'private-files'
        );
        if (!in_array($module, $sensitive_modules, true)) {
            return;
        }

        $user_id = get_current_user_id();
        ECARE_DB_Client::insert('ecare_audit_logs', array(
            'action' => sanitize_key($action),
            'module' => sanitize_key($module),
            'record_id' => $record_id !== null ? (string) $record_id : '',
            'user_id' => $user_id,
            'user_role' => $this->get_current_user_role(),
            'ip' => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
            'user_agent' => substr(sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
            'details' => $details,
            'created_at' => current_time('mysql', 1),
        ));
    }

    public function handle_get_firebase_config($request) {
        return new WP_REST_Response(array(
            'apiKey'            => get_option('ecare_firebase_api_key', ''),
            'authDomain'        => get_option('ecare_firebase_auth_domain', ''),
            'projectId'         => get_option('ecare_firebase_project_id', ''),
            'storageBucket'     => get_option('ecare_firebase_storage_bucket', ''),
            'messagingSenderId' => get_option('ecare_firebase_messaging_sender_id', ''),
            'appId'             => get_option('ecare_firebase_app_id', ''),
        ), 200);
    }

    public function handle_sync_live($request)
    {
        $params = $request->get_json_params();
        $modules = $params['modules'] ?? array();
        $user_id = $params['user_id'] ?? null;

        $response_data = array();

        foreach ($modules as $module) {
            $mock_request = new WP_REST_Request('GET', '/ecare/v1/' . $module);
            $mock_request->set_param('module', $module);
            if ($user_id && !in_array($module, array('patients', 'doctors', 'staff'), true)) {
                $mock_request->set_param('user_id', $user_id);
            }

            $res = $this->handle_get_request($mock_request);
            if (is_wp_error($res)) {
                $response_data[$module] = array();
            } else if ($res instanceof WP_REST_Response) {
                $response_data[$module] = $res->get_data();
            } else {
                $response_data[$module] = $res;
            }
        }

        return rest_ensure_response($response_data);
    }

    public function handle_check_duplicates($request)
    {
        // Rate limiting: 20 attempts per 15 minutes per IP to prevent user enumeration
        if (ecare_is_rate_limited('check_duplicates', 20)) {
            return new WP_Error('too_many_requests', __('Too many requests. Please try again in 15 minutes.', 'e-care-management'), array('status' => 429));
        }
        ecare_increment_rate_limit('check_duplicates', 900);

        $params = $request->get_json_params();
        $email = $params['email'] ?? '';
        $name = $params['name'] ?? '';
        $exclude_id = $params['exclude_id'] ?? null;
        $module = $params['module'] ?? 'staff';

        $results = array(
            'email_exists' => false,
            'name_exists' => false
        );

        if (!$email && !$name)
            return rest_ensure_response($results);

        $check_collections = array('ecare_staff', 'ecare_patients');

        foreach ($check_collections as $col) {
            if ($email) {
                $items = ECARE_DB_Client::select_where($col, 'email', $email);
                foreach ($items as $item) {
                    if ($exclude_id && strval($item->id) === strval($exclude_id) && $col === $this->get_collection_name($module)) {
                        continue;
                    }
                    $results['email_exists'] = true;
                    break;
                }
            }
            if ($name) {
                $items = ECARE_DB_Client::select_where($col, 'name', $name);
                foreach ($items as $item) {
                    if ($exclude_id && strval($item->id) === strval($exclude_id) && $col === $this->get_collection_name($module)) {
                        continue;
                    }
                    $results['name_exists'] = true;
                    break;
                }
            }
        }

        return rest_ensure_response($results);
    }

    public function handle_get_request($request)
    {
        $module = $request['module'];
        $id = $request['id'] ?? null;
        $role = $this->get_current_user_role();
        $current_user_id = get_current_user_id();

        if ($module === 'stats')
            return $this->get_dashboard_stats($request);
        if ($module === 'settings')
            return $this->get_settings();

        // ─── Auto-Cleanup & Expiry Check (for appointments) ──────────────────
        if ($module === 'appointments') {
            $appointments = ECARE_DB_Client::select_all('ecare_appointments');
            $now = current_time('timestamp');
            
            foreach ($appointments as $a) {
                $status = $a->status ?? '';
                // 1. Expire past appointments
                if (in_array($status, ['Pending', 'Confirmed']) && !empty($a->date) && !empty($a->time)) {
                    $apt_time = strtotime($a->date . ' ' . $a->time);
                    if ($apt_time < $now) {
                        ECARE_DB_Client::update('ecare_appointments', $a->id, ['status' => 'Expired']);
                        $a->status = 'Expired';
                    }
                }
                
                // 2. Auto-Refund Instant Bookings not picked up in 5 minutes
                if ($status === 'Query' && ($a->mode ?? '') === 'Instant Call' && !empty($a->query_started_at)) {
                    $query_started = strtotime($a->query_started_at . ' UTC');
                    $now_utc = current_time('timestamp', 1);
                    if ($now_utc - $query_started > 300) {
                        ECARE_DB_Client::update('ecare_appointments', $a->id, ['status' => 'Refunded', 'paymentStatus' => 'Refunded']);
                        $a->status = 'Refunded';
                        
                        // Find original billing and create refund request
                        $billings = ECARE_DB_Client::select_where('ecare_billing', 'appointmentId', $a->id);
                        if (!empty($billings)) {
                            $billing = $billings[0];
                            if (($billing->paidAmount ?? 0) > 0) {
                                ECARE_DB_Client::insert('ecare_refunds', array(
                                    'transactionId' => $billing->id,
                                    'appointmentId' => $a->id,
                                    'patient_user_id' => $billing->patient_user_id ?? $a->patient_user_id ?? 0,
                                    'invoiceNo' => $billing->invoiceNo ?? '',
                                    'patientName' => $billing->patientName ?? '',
                                    'originalAmount' => $billing->paidAmount,
                                    'refundAmount' => $billing->paidAmount,
                                    'type' => 'Full',
                                    'reason' => 'Instant Call Auto-Refund: No doctor accepted within 5 minutes.',
                                    'status' => 'Processed',
                                    'date' => current_time('Y-m-d', 1),
                                    'created_at' => current_time('mysql', 1)
                                ));
                                ECARE_DB_Client::update('ecare_billing', $billing->id, array('status' => 'Refunded'));
                            }
                        }
                    }
                }

                // 3. Auto-Close sessions older than 1 hour
                if ($status === 'Active' && ($a->mode ?? '') === 'Instant Call' && !empty($a->started_at)) {
                    $started = strtotime($a->started_at . ' UTC');
                    $now_utc = current_time('timestamp', 1);
                    if ($now_utc - $started > 3600) {
                        ECARE_DB_Client::update('ecare_appointments', $a->id, ['status' => 'Closed']);
                        $a->status = 'Closed';
                    }
                }
            }
        }

        // ─── Care Provider Bookings Join ─────────────────────────────────────
        if ($module === 'care-provider-bookings') {
            $bookings = ECARE_DB_Client::select_all('ecare_care_provider_bookings');
            $providers = ECARE_DB_Client::select_all('ecare_care_providers');
            $results = [];
            foreach ($bookings as $b) {
                if ($id && strval($b->id) !== strval($id)) continue;
                if ($role === 'patient' && intval($b->patient_user_id ?? 0) !== $current_user_id) continue;
                
                // Join provider details
                $b->photo = '';
                $b->provider_type = '';
                foreach ($providers as $p) {
                    if (isset($p->name) && $p->name === ($b->providerName ?? '')) {
                        $b->photo = $p->photo ?? '';
                        $b->provider_type = $p->type ?? '';
                        break;
                    }
                }
                $results[] = $b;
            }
            $results = $id ? ($results[0] ?? null) : $results;
            if (!$results) {
                return $id ? new WP_Error('not_found', 'Record not found', array('status' => 404)) : rest_ensure_response([]);
            }
            if ($id) {
                $this->log_audit_event('view', $module, $id);
            }
            return rest_ensure_response($results);
        }

        // ─── Billing Join ──────────────────────────────────────────────────
        if ($module === 'billing') {
            $billings = ECARE_DB_Client::select_all('ecare_billing');
            $patients = ECARE_DB_Client::select_all('ecare_patients');
            $appointments = ECARE_DB_Client::select_all('ecare_appointments');
            $cp_bookings = ECARE_DB_Client::select_all('ecare_care_provider_bookings');
            $care_providers = ECARE_DB_Client::select_all('ecare_care_providers');
            $doctor_name = ($role === 'doctor') ? $this->get_doctor_name_by_user_id($current_user_id) : '';

            $results = [];
            foreach ($billings as $b) {
                if ($id && strval($b->id) !== strval($id)) continue;
                if ($role === 'patient' && !$this->billing_belongs_to_current_user($b, $current_user_id)) continue;
                
                // Join patient details
                $b->patientPhone = '';
                $b->patientAddress = '';
                $b->patientEmail = '';
                foreach ($patients as $p) {
                    if (isset($p->name) && $p->name === ($b->patientName ?? '')) {
                        $b->patientPhone = $p->phone ?? '';
                        $b->patientAddress = $p->address ?? '';
                        $b->patientEmail = $p->email ?? '';
                        break;
                    }
                }

                // Join appointment details
                $b->doctorName = '';
                $b->doctorSpecialty = '';
                $b->appointmentTime = '';
                $b->appointmentMode = '';
                if (!empty($b->appointmentId)) {
                    foreach ($appointments as $a) {
                        if (strval($a->id) === strval($b->appointmentId)) {
                            $b->doctorName = $a->doctorName ?? '';
                            $b->doctorSpecialty = $a->specialty ?? '';
                            $b->appointmentTime = $a->time ?? '';
                            $b->appointmentMode = $a->mode ?? '';
                            break;
                        }
                    }
                }

                if ($role === 'doctor' && $b->doctorName !== $doctor_name) {
                    continue;
                }

                // Join care provider details
                $b->providerName = '';
                $b->providerPackage = '';
                $b->providerDuration = '';
                $b->providerType = '';
                if (!empty($b->careProviderBookingId)) {
                    foreach ($cp_bookings as $cpb) {
                        if (strval($cpb->id) === strval($b->careProviderBookingId)) {
                            $b->providerName = $cpb->providerName ?? '';
                            $b->providerPackage = $cpb->packageName ?? '';
                            $b->providerDuration = $cpb->duration ?? '';
                            
                            foreach ($care_providers as $cp) {
                                if (isset($cp->name) && $cp->name === $b->providerName) {
                                    $b->providerType = $cp->type ?? '';
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }

                $results[] = $b;
            }
            $results = $id ? ($results[0] ?? null) : $results;
            if (!$results) {
                return $id ? new WP_Error('not_found', 'Record not found', array('status' => 404)) : rest_ensure_response([]);
            }
            if ($id) {
                $this->log_audit_event('view', $module, $id);
            }
            return rest_ensure_response($results);
        }

        // ─── Standard Modules CRUD ───────────────────────────────────────────
        $collection = $this->get_collection_name($module);
        if (!$collection)
            return new WP_Error('invalid_module', 'Module not found', array('status' => 404));

        if ($id) {
            $results = ECARE_DB_Client::select_one($collection, $id);
            if ($results) {
                if (!$this->can_access_record($module, $results, 'read')) {
                    return new WP_Error('unauthorized', 'Unauthorized access', array('status' => 403));
                }
                $this->log_audit_event('view', $module, $id);
            }
        } else {
            $user_id = $request->get_param('user_id');
            $is_profile_module = in_array($module, array('patients', 'doctors', 'staff'), true);
            if ($user_id && $is_profile_module) {
                $items = ECARE_DB_Client::select_where($collection, 'user_id', intval($user_id));
                if (empty($items)) {
                    $items = ECARE_DB_Client::select_where($collection, 'user_id', strval($user_id));
                }
                $results = !empty($items) ? $items[0] : null;
                if ($results) {
                    if (!$this->can_access_record($module, $results, 'read')) {
                        return new WP_Error('unauthorized', 'Unauthorized access', array('status' => 403));
                    }
                    $this->log_audit_event('view', $module, $results->id ?? '');
                }
            } else {
                $raw_items = ECARE_DB_Client::select_all($collection);
                $results = [];

                foreach ($raw_items as $item) {
                    if (!$this->can_access_record($module, $item, 'read')) {
                        continue;
                    }

                    if ($module === 'doctors' && ($item->role ?? '') !== 'doctor') {
                        continue;
                    }
                    if ($module === 'staff' && ($item->role ?? '') === 'doctor') {
                        continue;
                    }

                    $results[] = $item;
                }

                // Sort lists
                if ($module === 'telemed-messages' || $module === 'support-messages') {
                    usort($results, function($a, $b) {
                        return strcmp($a->id ?? '', $b->id ?? '');
                    });
                } else {
                    usort($results, function($a, $b) {
                        $t_a = $a->created_at ?? $a->id ?? '';
                        $t_b = $b->created_at ?? $b->id ?? '';
                        return strcmp($t_b, $t_a);
                    });
                }
            }
        }

        if (!$results) {
            if ($id) {
                return new WP_Error('not_found', 'Record not found', array('status' => 404));
            }
            $user_id = $request->get_param('user_id');
            $is_profile_module = in_array($module, array('patients', 'doctors', 'staff'), true);
            return rest_ensure_response(($user_id && $is_profile_module) ? null : array());
        }

        // Inject 'specialty' alias on doctor/staff rows so frontend always has a consistent field
        if ($module === 'doctors' || $module === 'staff') {
            $items = is_array($results) ? $results : array($results);
            foreach ($items as $row) {
                if (!isset($row->specialty) || $row->specialty === null || $row->specialty === '') {
                    $row->specialty = $row->specialization ?? '';
                }
            }
        }

        if ($module === 'settings') {
            $settings_items = is_array($results) ? $results : array($results);
            foreach ($settings_items as &$item) {
                if (is_object($item)) {
                    if (!empty($item->agoraAppCertificate) || !empty(get_option('ecare_agora_app_certificate', ''))) {
                        $item->hasAgoraAppCertificate = true;
                    }
                    unset($item->agoraAppCertificate, $item->dailyApiKey);
                } elseif (is_array($item)) {
                    if (!empty($item['agoraAppCertificate']) || !empty(get_option('ecare_agora_app_certificate', ''))) {
                        $item['hasAgoraAppCertificate'] = true;
                    }
                    unset($item['agoraAppCertificate'], $item['dailyApiKey']);
                }
            }
            unset($item);
            $results = is_array($results) ? $settings_items : $settings_items[0];
        }

        return rest_ensure_response($results);
    }

    public function handle_post_request($request)
    {
        $module = $request['module'];
        $params = $request->get_json_params();
        $params = wp_unslash($params);

        if ($module === 'settings') {
            $existing = get_option('ecare_settings', array());
            if (!is_array($existing))
                $existing = array();

            $whitelist = array(
                'siteName',
                'siteAddress',
                'sitePhone',
                'siteEmail',
                'siteWebsite',
                'logo',
                'bgImage',
                'currency',
                'currencySymbol',
                'currencyCode',
                'providerTypes',
                'servicePricing',
                'paymentGateways',
                'jitsiServer',
                'telemedPaymentDeadline',
                'consultationModes',
                'primaryColor',
                'platformCommission',
                'serviceCommissions',
                'instantCallFee',
                'instantRefundDuration',
                'standardRefundDuration',
                'woocommerceEnabled',
                'partialPayment',
                'floatingWidgetEnabled',
                'socialLoginEnabled',
                'licenseKey',
                'firebaseConfig',
                'termsUrl',
                'privacyUrl',
                'telemedProvider',
                'agoraEnabled',
                'agoraAppId',
                'agoraAppCertificate',
                'agoraTokenExpiry',
                'agoraVideoEnabled',
                'agoraAudioEnabled',
                'agoraScreenShareEnabled',
                'agoraSignalingEnabled'
            );

            $filtered_params = array();
            foreach ($whitelist as $key) {
                if (isset($params[$key])) {
                    $filtered_params[$key] = $params[$key];
                }
            }

            // Protect Agora App Certificate: do not overwrite with masked placeholder or empty string if already set
            if (isset($filtered_params['agoraAppCertificate'])) {
                $raw_cert = trim(strval($filtered_params['agoraAppCertificate']));
                if (empty($raw_cert) || strpos($raw_cert, '•') !== false || strpos($raw_cert, '*') !== false) {
                    $filtered_params['agoraAppCertificate'] = $existing['agoraAppCertificate'] ?? get_option('ecare_agora_app_certificate', '');
                }
            }

            $new_settings = array_merge($existing, wp_unslash($filtered_params));

            update_option('ecare_settings', $new_settings);

            // Sync options to the standalone options used across the site
            if (isset($new_settings['primaryColor'])) {
                update_option('ecare_primary_color', $new_settings['primaryColor']);
            }
            if (isset($new_settings['logo'])) {
                update_option('ecare_auth_logo', $new_settings['logo']);
            }
            if (isset($new_settings['bgImage'])) {
                update_option('ecare_auth_bg_image', $new_settings['bgImage']);
            }
            if (isset($new_settings['licenseKey'])) {
                update_option('ecare_license_key', $new_settings['licenseKey']);
            }
            if (isset($new_settings['firebaseConfig']) && is_array($new_settings['firebaseConfig'])) {
                update_option('ecare_firebase_api_key', $new_settings['firebaseConfig']['apiKey'] ?? '');
                update_option('ecare_firebase_auth_domain', $new_settings['firebaseConfig']['authDomain'] ?? '');
                update_option('ecare_firebase_project_id', $new_settings['firebaseConfig']['projectId'] ?? '');
                update_option('ecare_firebase_storage_bucket', $new_settings['firebaseConfig']['storageBucket'] ?? '');
                update_option('ecare_firebase_messaging_sender_id', $new_settings['firebaseConfig']['messagingSenderId'] ?? '');
                update_option('ecare_firebase_app_id', $new_settings['firebaseConfig']['appId'] ?? '');
            }

            // Sync Agora settings to standalone options for high performance & security
            if (isset($new_settings['agoraEnabled'])) {
                update_option('ecare_agora_enabled', filter_var($new_settings['agoraEnabled'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0');
            }
            if (isset($new_settings['agoraAppId'])) {
                update_option('ecare_agora_app_id', sanitize_text_field($new_settings['agoraAppId']));
            }
            if (!empty($new_settings['agoraAppCertificate']) && strpos($new_settings['agoraAppCertificate'], '•') === false) {
                update_option('ecare_agora_app_certificate', sanitize_text_field($new_settings['agoraAppCertificate']));
            }
            if (isset($new_settings['agoraTokenExpiry'])) {
                update_option('ecare_agora_token_expiry', intval($new_settings['agoraTokenExpiry']));
            }
            if (isset($new_settings['agoraVideoEnabled'])) {
                update_option('ecare_agora_video_enabled', filter_var($new_settings['agoraVideoEnabled'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0');
            }
            if (isset($new_settings['agoraAudioEnabled'])) {
                update_option('ecare_agora_audio_enabled', filter_var($new_settings['agoraAudioEnabled'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0');
            }
            if (isset($new_settings['agoraScreenShareEnabled'])) {
                update_option('ecare_agora_screen_share_enabled', filter_var($new_settings['agoraScreenShareEnabled'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0');
            }
            if (isset($new_settings['agoraSignalingEnabled'])) {
                update_option('ecare_agora_signaling_enabled', filter_var($new_settings['agoraSignalingEnabled'], FILTER_VALIDATE_BOOLEAN) ? '1' : '0');
            }
            if (isset($new_settings['telemedProvider'])) {
                update_option('ecare_telemed_provider', sanitize_text_field($new_settings['telemedProvider']));
            }

            // Prepare client-safe response (strip sensitive App Certificate)
            $client_safe_settings = $new_settings;
            if (!empty($client_safe_settings['agoraAppCertificate']) || !empty(get_option('ecare_agora_app_certificate', ''))) {
                $client_safe_settings['hasAgoraAppCertificate'] = true;
            }
            unset($client_safe_settings['agoraAppCertificate']);
            unset($client_safe_settings['dailyApiKey']);

            return rest_ensure_response(array('success' => true, 'settings' => $client_safe_settings));
        }

        $module = $request->get_param('module');
        $params = $request->get_json_params() ?: array();
        $params = wp_unslash($params);

        $role = $this->get_current_user_role();
        if ($role === 'guest' && in_array($module, array('doctors', 'care-providers', 'ambulance'), true)) {
            // Honeypot check
            $honeypot = isset($params['middlename']) ? $params['middlename'] : '';
            if (!empty($honeypot)) {
                return new WP_Error('spam_detected', __('Spam registration detected.', 'e-care-management'), array('status' => 400));
            }

            // Rate limiting: 3 registrations per hour per IP
            if (ecare_is_rate_limited('guest_register_ip', 3)) {
                return new WP_Error('too_many_requests', __('Too many registration attempts. Please try again in an hour.', 'e-care-management'), array('status' => 429));
            }
            unset($params['middlename']);
        }

        if (isset($params['expiry_date']) && empty($params['expiry_date'])) {
            $params['expiry_date'] = null;
        }
        $collection = $this->get_collection_name($module);

        if (!$collection)
            return new WP_Error('invalid_module', 'Module collection not found: ' . $module, array('status' => 404));

        if ($module === 'doctors') {
            $params['role'] = 'doctor';
            if (isset($params['specialty'])) {
                $spec_val = $params['specialty'];
                if (is_string($spec_val) && (strpos($spec_val, '[') === 0 || strpos($spec_val, '{') === 0)) {
                    $decoded = json_decode($spec_val, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $spec_val = implode(', ', $decoded);
                    }
                } elseif (is_array($spec_val)) {
                    $spec_val = implode(', ', $spec_val);
                }
                $params['specialization'] = $spec_val;
                $params['specialty'] = $spec_val;
            }
        }
        unset($params['id']);

        if ($module === 'ambulance') {
            if (!empty($params['driverEmail'])) {
                $params['email'] = $params['driverEmail'];
            }
            if (!empty($params['driverName'])) {
                $params['name'] = $params['driverName'];
            }
        }

        // ─── Ambulance Bookings: remap JS field names to DB column names ─────
        if ($module === 'ambulance-bookings') {
            if (isset($params['patient']) && !isset($params['patientName'])) {
                $params['patientName'] = $params['patient'];
            }
            if (isset($params['location']) && !isset($params['pickupLocation'])) {
                $params['pickupLocation'] = $params['location'];
            }
            if (isset($params['dest']) && !isset($params['destination'])) {
                $params['destination'] = $params['dest'];
            }
            if (isset($params['type']) && !isset($params['ambulanceType'])) {
                $params['ambulanceType'] = $params['type'];
            }
        }

        // Handle User Creation / Sync
        if (!empty($params['email'])) {
            $user_id = email_exists($params['email']);

            if (!$user_id) {
                $username = explode('@', $params['email'])[0];
                $base_username = $username;
                $i = 1;
                while (username_exists($username)) {
                    $username = $base_username . $i;
                    $i++;
                }
                $user_id = wp_create_user($username, $params['password'] ?? wp_generate_password(), $params['email']);
                if (is_wp_error($user_id))
                    return $user_id;
            }

            // Always sync password and basic info if provided
            $user_data = array('ID' => $user_id);
            if (!empty($params['password']))
                $user_data['user_pass'] = $params['password'];
            if (!empty($params['name']))
                $user_data['display_name'] = $params['name'];
            wp_update_user($user_data);

            // Ensure correct role
            $user = new WP_User($user_id);
            if (!in_array('administrator', (array) $user->roles)) {
                if ($module === 'doctors') {
                    $user->set_role('ecare_doctor');
                } elseif ($module === 'patients') {
                    $user->set_role('ecare_patient');
                } elseif ($module === 'care-providers' || $module === 'ambulance') {
                    $user->set_role('ecare_staff');
                } elseif ($module === 'staff' && !empty($params['role'])) {
                    $role_map = array(
                        'Receptionist' => 'ecare_receptionist',
                        'Nurse' => 'ecare_staff',
                        'Billing Specialist' => 'ecare_staff',
                        'Ambulance Coordinator' => 'ecare_staff',
                        'Medical Admin' => 'ecare_admin',
                        'System Admin' => 'ecare_admin'
                    );
                    if (isset($role_map[$params['role']])) {
                        $user->set_role($role_map[$params['role']]);
                    }
                }
            }
            $params['user_id'] = $user_id;
        }

        // Insert into database
        $doc_id = null;
        if (in_array($collection, array('ecare_patients', 'ecare_staff'), true) && !empty($params['user_id'])) {
            $doc_id = intval($params['user_id']);
        }
        $insert_id = ECARE_DB_Client::insert($collection, $params, $doc_id);

        if ($role === 'guest' && in_array($module, array('doctors', 'care-providers', 'ambulance'), true)) {
            ecare_increment_rate_limit('guest_register_ip', 3600);
        }

        if ($insert_id === false)
            return new WP_Error('db_error', 'MySQL insert failed', array('status' => 500));

        $this->log_audit_event('create', $module, $insert_id);

        // ─── Automation: Link Payment to Appointment Status ──────────────────
        if ($module === 'billing' && !empty($params['appointmentId'])) {
            $status = isset($params['status']) ? $params['status'] : 'Paid';
            $update_data = array('paymentStatus' => $status);
            
            // Only auto-confirm if paid
            if ($status === 'Paid') {
                $update_data['status'] = 'Confirmed';
            } elseif ($status === 'Refunded') {
                $update_data['status'] = 'Refunded';
            }
            
            ECARE_DB_Client::update('ecare_appointments', $params['appointmentId'], $update_data);
        }

        // ─── Automation: Sync Refunds to Billing & Appointment Status ───────
        if ($module === 'refunds') {
            $txn_id = $params['transactionId'] ?? null;
            $status = $params['status'] ?? 'Pending';
            if (!empty($txn_id)) {
                $billing = ECARE_DB_Client::select_one('ecare_billing', $txn_id);
                if ($billing) {
                    $new_billing_status = (in_array($status, array('Processed', 'Approved', 'Paid'), true) || floatval($params['refundAmount'] ?? 0) >= floatval($billing->paidAmount ?? $billing->amount ?? 0)) ? 'Refunded' : 'Refund Pending';
                    ECARE_DB_Client::update('ecare_billing', $billing->id, array('status' => $new_billing_status));
                    if (!empty($billing->appointmentId)) {
                        ECARE_DB_Client::update('ecare_appointments', $billing->appointmentId, array(
                            'paymentStatus' => 'Refunded',
                            'status' => 'Refunded'
                        ));
                    }
                }
            }
            if (!empty($params['appointmentId'])) {
                ECARE_DB_Client::update('ecare_appointments', $params['appointmentId'], array(
                    'paymentStatus' => 'Refunded',
                    'status' => 'Refunded'
                ));
            }
        }

        $this->delete_dashboard_cache();

        return rest_ensure_response(array('success' => true, 'id' => $insert_id));
    }

    public function handle_put_request($request)
    {
        $id = $request->get_param('id');
        $module = $request->get_param('module');
        $collection = $this->get_collection_name($module);

        if (!$collection) {
            return new WP_Error('invalid_module', 'Module collection not found: ' . $module, array('status' => 404));
        }

        $role = $this->get_current_user_role();
        $current_user_id = get_current_user_id();

        $params = $request->get_json_params() ?: array();
        $params = wp_unslash($params);

        $record = ECARE_DB_Client::select_one($collection, $id);
        if (!$record) {
            return new WP_Error('not_found', 'Record not found', array('status' => 404));
        }

        if (!$this->can_access_record($module, $record, 'update')) {
            return new WP_Error('unauthorized', 'Unauthorized record update', array('status' => 403));
        }

        if ($role === 'patient') {
            $allowed_modules = array('appointments', 'care-provider-bookings', 'ambulance-bookings', 'billing', 'medical-vault', 'telemed-rooms', 'telemed-messages', 'support-tickets', 'support-messages', 'patients');
            if (!in_array($module, $allowed_modules, true)) {
                return new WP_Error('unauthorized', 'Unauthorized module update', array('status' => 403));
            }
            $owner_col = in_array($module, array('appointments', 'billing', 'medical-vault', 'care-provider-bookings', 'ambulance-bookings', 'patients'), true) ? 'patient_user_id' : (in_array($module, array('telemed-rooms'), true) ? 'patient_id' : (in_array($module, array('support-tickets'), true) ? 'user_id' : null));
            if ($module === 'patients') {
                $owner_col = 'user_id';
            }
            if ($owner_col && isset($record->$owner_col) && intval($record->$owner_col) !== $current_user_id) {
                return new WP_Error('unauthorized', 'Unauthorized record update', array('status' => 403));
            }
            if ($module === 'appointments') {
                if (isset($params['paymentStatus']) && $params['paymentStatus'] === 'Paid') {
                } else {
                    unset($params['paymentStatus']);
                }
                if (isset($params['status']) && $params['status'] === 'Query') {
                } else {
                    unset($params['status']);
                }
            }
            if ($module === 'billing') {
                if (isset($params['status']) && $params['status'] === 'Paid') {
                } else {
                    unset($params['status']);
                }
                if (isset($params['paidAmount'])) {
                } else {
                    unset($params['paidAmount']);
                }
            }
        } elseif ($role === 'doctor') {
            $allowed_modules = array('appointments', 'telemed-rooms', 'telemed-messages', 'doctor-availability', 'consultation-notes', 'vitals', 'doctors');
            if (!in_array($module, $allowed_modules, true)) {
                return new WP_Error('unauthorized', 'Unauthorized module update', array('status' => 403));
            }
            if ($module === 'appointments') {
                $doctor_name = $this->get_doctor_name_by_user_id($current_user_id);
                $is_own = (($record->doctorName ?? '') === $doctor_name);
                $is_query = (($record->status ?? '') === 'Query' && ($record->mode ?? '') === 'Instant Call');
                if (!$is_own && !$is_query) {
                    return new WP_Error('unauthorized', 'Unauthorized appointment update', array('status' => 403));
                }
            } elseif ($module === 'telemed-rooms') {
                if (intval($record->doctor_id ?? 0) !== $current_user_id) {
                    return new WP_Error('unauthorized', 'Unauthorized telemed room update', array('status' => 403));
                }
            }
        }
        if (isset($params['expiry_date']) && empty($params['expiry_date'])) {
            $params['expiry_date'] = null;
        }

        if ($module === 'doctors' && isset($params['specialty'])) {
            $spec_val = $params['specialty'];
            if (is_string($spec_val) && (strpos($spec_val, '[') === 0 || strpos($spec_val, '{') === 0)) {
                $decoded = json_decode($spec_val, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $spec_val = implode(', ', $decoded);
                }
            } elseif (is_array($spec_val)) {
                $spec_val = implode(', ', $spec_val);
            }
            $params['specialization'] = $spec_val;
            $params['specialty'] = $spec_val;
        }

        if ($module === 'ambulance') {
            if (!empty($params['driverEmail'])) {
                $params['email'] = $params['driverEmail'];
            }
            if (!empty($params['driverName'])) {
                $params['name'] = $params['driverName'];
            }
        }

        // ─── Ambulance Bookings: remap JS field names to DB column names ─────
        if ($module === 'ambulance-bookings') {
            if (isset($params['patient']) && !isset($params['patientName'])) {
                $params['patientName'] = $params['patient'];
            }
            if (isset($params['location']) && !isset($params['pickupLocation'])) {
                $params['pickupLocation'] = $params['location'];
            }
            if (isset($params['dest']) && !isset($params['destination'])) {
                $params['destination'] = $params['dest'];
            }
            if (isset($params['type']) && !isset($params['ambulanceType'])) {
                $params['ambulanceType'] = $params['type'];
            }
        }

        // Handle User Update / Sync
        $has_email_col = in_array($module, array('staff', 'doctors', 'patients', 'care-providers', 'ambulance'));
        $email = isset($params['email']) ? $params['email'] : ($has_email_col ? ($module === 'ambulance' ? ($record->driverEmail ?? null) : ($record->email ?? null)) : null);
        
        if ($email && $has_email_col) {
            $user_id = email_exists($email);

            if (!$user_id) {
                $username = explode('@', $email)[0];
                $base_username = $username;
                $i = 1;
                while (username_exists($username)) {
                    $username = $base_username . $i;
                    $i++;
                }
                $user_pass = isset($params['password']) ? $params['password'] : wp_generate_password();
                $user_id = wp_create_user($username, $user_pass, $email);
            }

            if ($user_id && !is_wp_error($user_id)) {
                $user_data = array('ID' => $user_id);
                if (!empty($params['password']))
                    $user_data['user_pass'] = $params['password'];
                if (!empty($params['name']))
                    $user_data['display_name'] = $params['name'];
                wp_update_user($user_data);

                $user = new WP_User($user_id);
                if (!in_array('administrator', (array) $user->roles)) {
                    if ($module === 'doctors') {
                        $user->set_role('ecare_doctor');
                    } elseif ($module === 'care-providers' || $module === 'ambulance') {
                        $user->set_role('ecare_staff');
                    } elseif ($module === 'staff' && !empty($params['role'])) {
                        $role_map = array(
                            'Receptionist' => 'ecare_receptionist',
                            'Nurse' => 'ecare_staff',
                            'Billing Specialist' => 'ecare_staff',
                            'Ambulance Coordinator' => 'ecare_staff',
                            'Medical Admin' => 'ecare_admin',
                            'System Admin' => 'ecare_admin'
                        );
                        if (isset($role_map[$params['role']])) {
                            $user->set_role($role_map[$params['role']]);
                        }
                    }
                }
                $params['user_id'] = $user_id;
            }
        }

        // Special Logic for Partial Payments in Billing
        if ($module === 'billing') {
            // 1. Handle Payment History Logging
            if (isset($params['paidAmount'])) {
                $old_paid = (float)($record->paidAmount ?? 0);
                $new_paid = (float)$params['paidAmount'];
                $diff = $new_paid - $old_paid;

                if ($diff > 0) {
                    $history = is_array($record->paymentHistory) ? $record->paymentHistory : (json_decode($record->paymentHistory ?? '', true) ?: array());
                    $raw_method = isset($params['paymentMethod']) ? $params['paymentMethod'] : (isset($params['method']) ? $params['method'] : 'Cash');
                    $method = function_exists('ecare_get_clean_payment_method_label') ? ecare_get_clean_payment_method_label($raw_method) : $raw_method;
                    $history[] = array(
                        'amount' => $diff,
                        'method' => $method,
                        'date' => current_time('mysql'),
                        'total_paid' => $new_paid,
                        'remaining' => (float)($record->amount ?? 0) - $new_paid
                    );
                    $params['paymentHistory'] = $history;
                }
            }

            // 2. Synchronize Status & Method back to original bookings
            if (isset($params['status'])) {
                $new_status = $params['status'];
                $raw_new_method = isset($params['paymentMethod']) ? $params['paymentMethod'] : (isset($params['method']) ? $params['method'] : null);
                $new_method = ($raw_new_method && function_exists('ecare_get_clean_payment_method_label')) ? ecare_get_clean_payment_method_label($raw_new_method) : $raw_new_method;
                if ($new_method) {
                    $params['method'] = $new_method;
                }

                $aid = !empty($record->appointmentId) ? $record->appointmentId : null;
                $cpid = !empty($record->careProviderBookingId) ? $record->careProviderBookingId : null;
                $loid = !empty($record->labOrderId) ? $record->labOrderId : null;

                if ($aid) {
                    $update_data = array('paymentStatus' => $new_status);
                    if ($new_status === 'Paid') {
                        $update_data['status'] = 'Confirmed';
                    } elseif ($new_status === 'Refunded') {
                        $update_data['status'] = 'Refunded';
                    }
                    if ($new_method) $update_data['paymentMethod'] = $new_method;
                    ECARE_DB_Client::update('ecare_appointments', $aid, $update_data);
                }
                if ($cpid) {
                    $update_data = array('paymentStatus' => $new_status);
                    if ($new_method) $update_data['paymentMethod'] = $new_method;
                    ECARE_DB_Client::update('ecare_care_provider_bookings', $cpid, $update_data);
                }
                if ($loid) {
                    $update_data = array('payment_status' => $new_status);
                    ECARE_DB_Client::update('ecare_lab_orders', $loid, $update_data);
                }
            }
        }

        unset($params['id']);
        $result = ECARE_DB_Client::update($collection, $id, $params);
        if ($result !== false) {
            $this->log_audit_event('update', $module, $id);

            // Backend hook for refund updates
            if ($module === 'refunds' && isset($params['status'])) {
                $ref = ECARE_DB_Client::select_one('ecare_refunds', $id);
                if ($ref) {
                    $billing_id = $ref->transactionId ?? null;
                    $billing = $billing_id ? ECARE_DB_Client::select_one('ecare_billing', $billing_id) : null;
                    if (!$billing && !empty($ref->invoiceNo)) {
                        $billings = ECARE_DB_Client::select_where('ecare_billing', 'invoiceNo', $ref->invoiceNo);
                        if (!empty($billings)) $billing = $billings[0];
                    }
                    if (in_array($params['status'], array('Processed', 'Approved', 'Paid'), true)) {
                        if ($billing) {
                            ECARE_DB_Client::update('ecare_billing', $billing->id, array('status' => 'Refunded'));
                            if (!empty($billing->appointmentId)) {
                                ECARE_DB_Client::update('ecare_appointments', $billing->appointmentId, array('paymentStatus' => 'Refunded', 'status' => 'Refunded'));
                            }
                        }
                        if (!empty($ref->appointmentId)) {
                            ECARE_DB_Client::update('ecare_appointments', $ref->appointmentId, array('paymentStatus' => 'Refunded', 'status' => 'Refunded'));
                        }
                    } elseif ($params['status'] === 'Rejected') {
                        if ($billing) {
                            ECARE_DB_Client::update('ecare_billing', $billing->id, array('status' => 'Paid'));
                        }
                    }
                }
            }

            // Backend hook for appointment cancellation/refund updates
            if ($module === 'appointments' && isset($params['status'])) {
                if (in_array($params['status'], array('Cancelled', 'Refunded'), true)) {
                    $billings = ECARE_DB_Client::select_where('ecare_billing', 'appointmentId', $id);
                    if (!empty($billings)) {
                        $billing = $billings[0];
                        ECARE_DB_Client::update('ecare_billing', $billing->id, array('status' => 'Refunded'));
                    }
                }
            }
            // Backend hook for manual verifications
            if ($module === 'manual-verifications' && isset($params['status'])) {
                $verif = ECARE_DB_Client::select_one('ecare_manual_verifications', $id);
                if ($verif) {
                    if ($params['status'] === 'Verified') {
                        if (!empty($verif->linkedTxn)) {
                            $appt_id = $verif->linkedTxn;
                            $billings = ECARE_DB_Client::select_where('ecare_billing', 'appointmentId', $appt_id);
                            if (!empty($billings)) {
                                ECARE_DB_Client::update('ecare_billing', $billings[0]->id, array('status' => 'Paid'));
                            }
                            
                            $appt = ECARE_DB_Client::select_one('ecare_appointments', $appt_id);
                            if ($appt) {
                                if (($appt->mode ?? '') === 'Instant Call' && ($appt->status ?? '') === 'Under Verification') {
                                    ECARE_DB_Client::update('ecare_appointments', $appt_id, array(
                                        'paymentStatus' => 'Paid',
                                        'status' => 'Query',
                                        'query_started_at' => current_time('mysql', 1)
                                    ));
                                } else {
                                    ECARE_DB_Client::update('ecare_appointments', $appt_id, array(
                                        'paymentStatus' => 'Paid',
                                        'status' => 'Confirmed'
                                    ));
                                }
                            }
                        } elseif (!empty($verif->invoiceNo)) {
                            $billings = ECARE_DB_Client::select_where('ecare_billing', 'invoiceNo', $verif->invoiceNo);
                            if (!empty($billings)) {
                                $billing = $billings[0];
                                $order_updated = false;
                                if (class_exists('WooCommerce')) {
                                    $orders = wc_get_orders(array(
                                        'meta_key'   => '_ecare_billing_id',
                                        'meta_value' => $billing->id,
                                        'limit'      => 1,
                                    ));
                                    if (!empty($orders)) {
                                        $order = $orders[0];
                                        $order->update_status('completed', __('Manual verification approved by admin. Order completed.', 'e-care'));
                                        $order_updated = true;
                                    }
                                }
                                
                                if (!$order_updated) {
                                    ECARE_DB_Client::update(
                                        'ecare_billing',
                                        $billing->id,
                                        array(
                                            'status' => 'Paid',
                                            'paidAmount' => $billing->amount
                                        )
                                    );
                                    
                                    $history = is_array($billing->paymentHistory) ? $billing->paymentHistory : (json_decode($billing->paymentHistory ?? '', true) ?: array());
                                    if (is_array($history) && isset($history['bookings']) && is_array($history['bookings'])) {
                                        foreach ($history['bookings'] as $cb) {
                                            if ($cb['type'] === 'Lab Test') {
                                                ECARE_DB_Client::update('ecare_lab_orders', $cb['id'], array('payment_status' => 'Paid', 'status' => 'Confirmed'));
                                            } elseif ($cb['type'] === 'Doctor Appointment') {
                                                ECARE_DB_Client::update('ecare_appointments', $cb['id'], array('paymentStatus' => 'Paid', 'status' => 'Confirmed', 'paymentMethod' => $verif->method ?? 'Manual'));
                                            } elseif ($cb['type'] === 'Instant Doctor Call') {
                                                ECARE_DB_Client::update('ecare_appointments', $cb['id'], array('paymentStatus' => 'Paid', 'status' => 'Query', 'query_started_at' => current_time('mysql', 1), 'paymentMethod' => $verif->method ?? 'Manual'));
                                            } elseif ($cb['type'] === 'Care Provider Visit') {
                                                ECARE_DB_Client::update('ecare_care_provider_bookings', $cb['id'], array('paymentStatus' => 'Paid', 'status' => 'Confirmed', 'paidAmount' => (float)$cb['price'], 'paymentMethod' => $verif->method ?? 'Manual'));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } elseif ($params['status'] === 'Rejected') {
                        if (!empty($verif->linkedTxn)) {
                            $appt_id = $verif->linkedTxn;
                            $billings = ECARE_DB_Client::select_where('ecare_billing', 'appointmentId', $appt_id);
                            if (!empty($billings)) {
                                ECARE_DB_Client::update('ecare_billing', $billings[0]->id, array('status' => 'Pending'));
                            }
                            ECARE_DB_Client::update('ecare_appointments', $appt_id, array('paymentStatus' => 'Unpaid', 'status' => 'Pending'));
                        } elseif (!empty($verif->invoiceNo)) {
                            $billings = ECARE_DB_Client::select_where('ecare_billing', 'invoiceNo', $verif->invoiceNo);
                            if (!empty($billings)) {
                                $billing = $billings[0];
                                $order_updated = false;
                                if (class_exists('WooCommerce')) {
                                    $orders = wc_get_orders(array(
                                        'meta_key'   => '_ecare_billing_id',
                                        'meta_value' => $billing->id,
                                        'limit'      => 1,
                                    ));
                                    if (!empty($orders)) {
                                        $order = $orders[0];
                                        $order->update_status('on-hold', __('Manual verification rejected by admin.', 'e-care'));
                                        $order_updated = true;
                                    }
                                }
                                
                                ECARE_DB_Client::update(
                                    'ecare_billing',
                                    $billing->id,
                                    array('status' => 'Pending', 'paidAmount' => 0.0)
                                );
                                
                                if (!$order_updated) {
                                    $history = is_array($billing->paymentHistory) ? $billing->paymentHistory : (json_decode($billing->paymentHistory ?? '', true) ?: array());
                                    if (is_array($history) && isset($history['bookings']) && is_array($history['bookings'])) {
                                        foreach ($history['bookings'] as $cb) {
                                            if ($cb['type'] === 'Lab Test') {
                                                ECARE_DB_Client::update('ecare_lab_orders', $cb['id'], array('payment_status' => 'Unpaid', 'status' => 'Pending'));
                                            } elseif ($cb['type'] === 'Doctor Appointment') {
                                                ECARE_DB_Client::update('ecare_appointments', $cb['id'], array('paymentStatus' => 'Unpaid', 'status' => 'Pending'));
                                            } elseif ($cb['type'] === 'Instant Doctor Call') {
                                                ECARE_DB_Client::update('ecare_appointments', $cb['id'], array('paymentStatus' => 'Unpaid', 'status' => 'Pending'));
                                            } elseif ($cb['type'] === 'Care Provider Visit') {
                                                ECARE_DB_Client::update('ecare_care_provider_bookings', $cb['id'], array('paymentStatus' => 'Unpaid', 'status' => 'Pending', 'paidAmount' => 0.0));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            return new WP_Error('db_error', 'SQLite update failed', array('status' => 500));
        }

        return rest_ensure_response(array('success' => true));
    }

    public function handle_bulk_delete_request($request)
    {
        $module = $request['module'];
        $params = $request->get_json_params();
        $ids = $params['ids'] ?? array();
        $collection = $this->get_collection_name($module);

        if (!$collection || empty($ids)) {
            return new WP_Error('invalid_request', 'Invalid module or missing IDs', array('status' => 400));
        }

        if ($module === 'billing' && !current_user_can('manage_options')) {
            return new WP_Error('forbidden', 'Only administrators can delete transactions', array('status' => 403));
        }

        foreach ($ids as $id) {
            $record = ECARE_DB_Client::select_one($collection, $id);
            if (!$record) {
                return new WP_Error('not_found', 'Record not found: ' . $id, array('status' => 404));
            }
            if (!$this->can_access_record($module, $record, 'delete')) {
                return new WP_Error('unauthorized', 'Unauthorized record delete', array('status' => 403));
            }
        }

        // Handle User Deletion if applicable
        if (current_user_can('manage_options') && in_array($module, array('doctors', 'patients', 'staff'), true)) {
            foreach ($ids as $id) {
                $record = ECARE_DB_Client::select_one($collection, $id);
                if ($record && isset($record->user_id)) {
                    $uid = intval($record->user_id);
                    if ($uid && $uid != get_current_user_id()) {
                        wp_delete_user($uid);
                    }
                }
            }
        }

        // Handle Cascading Transaction Deletion (Admin only)
        if (current_user_can('manage_options')) {
            $billing_field = '';
            if ($module === 'appointments') {
                $billing_field = 'appointmentId';
            } elseif ($module === 'care-provider-bookings') {
                $billing_field = 'careProviderBookingId';
            } elseif ($module === 'lab-orders') {
                $billing_field = 'labOrderId';
            } elseif ($module === 'ambulance-bookings') {
                $billing_field = 'ambulanceBookingId';
            }

            if (!empty($billing_field)) {
                foreach ($ids as $id) {
                    $matched_billings = ECARE_DB_Client::select_where('ecare_billing', $billing_field, $id);
                    $matched_billings_str = ECARE_DB_Client::select_where('ecare_billing', $billing_field, strval($id));
                    $all_matched = array_merge($matched_billings, $matched_billings_str);
                    
                    $deleted_billing_ids = array();
                    foreach ($all_matched as $b) {
                        if (isset($b->id) && !in_array($b->id, $deleted_billing_ids, true)) {
                            ECARE_DB_Client::delete('ecare_billing', $b->id);
                            $deleted_billing_ids[] = $b->id;
                        }
                    }
                }
            }
        }

        $deleted_count = ECARE_DB_Client::delete_many($collection, $ids);
        foreach ($ids as $deleted_id) {
            $this->log_audit_event('delete', $module, $deleted_id, array('bulk' => true));
        }

        $this->delete_dashboard_cache();

        return rest_ensure_response(array('success' => true, 'deleted_count' => $deleted_count));
    }

    private function filter_params_by_table($table, $params)
    {
        return $params;
    }

    public function handle_delete_request($request)
    {
        $id = $request->get_param('id');
        $module = $request->get_param('module');
        $collection = $this->get_collection_name($module);

        if (!$collection) {
            return new WP_Error('invalid_module', 'Module collection not found: ' . $module, array('status' => 404));
        }

        $role = $this->get_current_user_role();
        $current_user_id = get_current_user_id();
        $record = ECARE_DB_Client::select_one($collection, $id);

        if (!$record) {
            return new WP_Error('not_found', 'Record not found', array('status' => 404));
        }
        if (!$this->can_access_record($module, $record, 'delete')) {
            return new WP_Error('unauthorized', 'Unauthorized record delete', array('status' => 403));
        }

        if ($role === 'patient') {
            $allowed_modules = array('appointments', 'care-provider-bookings', 'ambulance-bookings', 'medical-vault', 'telemed-messages', 'support-tickets', 'support-messages');
            if (!in_array($module, $allowed_modules, true)) {
                return new WP_Error('unauthorized', 'Unauthorized module delete', array('status' => 403));
            }
        } elseif ($role === 'doctor') {
            $allowed_modules = array('telemed-messages', 'doctor-availability');
            if (!in_array($module, $allowed_modules, true)) {
                return new WP_Error('unauthorized', 'Unauthorized module delete', array('status' => 403));
            }
        }

        if ($module === 'billing' && !current_user_can('manage_options')) {
            return new WP_Error('forbidden', 'Only administrators can delete transactions', array('status' => 403));
        }

        // Handle Cascading Transaction Deletion (Admin only)
        if (current_user_can('manage_options')) {
            $billing_field = '';
            if ($module === 'appointments') {
                $billing_field = 'appointmentId';
            } elseif ($module === 'care-provider-bookings') {
                $billing_field = 'careProviderBookingId';
            } elseif ($module === 'lab-orders') {
                $billing_field = 'labOrderId';
            } elseif ($module === 'ambulance-bookings') {
                $billing_field = 'ambulanceBookingId';
            }

            if (!empty($billing_field)) {
                $matched_billings = ECARE_DB_Client::select_where('ecare_billing', $billing_field, $id);
                $matched_billings_str = ECARE_DB_Client::select_where('ecare_billing', $billing_field, strval($id));
                $all_matched = array_merge($matched_billings, $matched_billings_str);
                
                $deleted_billing_ids = array();
                foreach ($all_matched as $b) {
                    if (isset($b->id) && !in_array($b->id, $deleted_billing_ids, true)) {
                        ECARE_DB_Client::delete('ecare_billing', $b->id);
                        $deleted_billing_ids[] = $b->id;
                    }
                }
            }
        }

        // Hardening: physical private file cleanup from disk on delete
        if ($collection === 'ecare_private_files' && !empty($record->stored_name)) {
            $private_dir = trailingslashit(dirname(ABSPATH)) . 'ecare-private-files';
            $file_path = trailingslashit($private_dir) . basename((string) $record->stored_name);
            if (file_exists($file_path)) {
                @unlink($file_path);
            }
        }

        $result = ECARE_DB_Client::delete($collection, $id);
        if ($result) {
            $this->log_audit_event('delete', $module, $id);
            $this->delete_dashboard_cache();
            return rest_ensure_response(array('success' => true));
        } else {
            return new WP_Error('db_error', 'Failed to delete record from SQLite database', array('status' => 500));
        }
    }

    private function get_dashboard_stats($request = null)
    {
        $current_role = $this->get_current_user_role();
        $current_user_id = get_current_user_id();
        $doctor_id = $request ? $request->get_param('doctor_id') : null;
        $user_id = $request ? $request->get_param('user_id') : null;
        $patient_id = null;
        $cache_key  = '';

        if ($current_role !== 'admin') {
            if ($doctor_id && intval($doctor_id) !== $current_user_id) {
                $doctor_id = null;
            }
            if ($user_id && intval($user_id) !== $current_user_id) {
                $user_id = $current_user_id;
            }
        }

        if ($doctor_id || $user_id) {
            // Find records if user_id provided
            if ($user_id && !$doctor_id) {
                // Check if doctor
                $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', $user_id);
                if (empty($staff_records)) {
                    $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', strval($user_id));
                }
                if (!empty($staff_records) && isset($staff_records[0]->role) && $staff_records[0]->role === 'doctor') {
                    $doctor_id = $staff_records[0]->id;
                }
                
                // If not doctor, check if patient
                if (!$doctor_id) {
                    $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', $user_id);
                    if (empty($patient_records)) {
                        $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', strval($user_id));
                    }
                    if (!empty($patient_records)) {
                        $patient_id = $patient_records[0]->id;
                    }
                }
            }

            // ─── High-Performance Caching Layer ───────────────────────────────────
            // Use Transients for Dashboard Stats (5 mins cache)
            $cache_key = 'ecare_dashboard_stats_' . ($doctor_id ?: 'admin') . '_' . ($patient_id ?: 'global');
            $cached_stats = get_transient($cache_key);
            
            if ($cached_stats !== false) {
                return $cached_stats;
            }

            if ($patient_id) {
                // Patient-specific Stats
                $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'id', $patient_id);
                $name = !empty($patient_records) ? ($patient_records[0]->name ?? '') : '';
                
                $all_appts = ECARE_DB_Client::select_all('ecare_appointments');
                $appts = 0;
                foreach ($all_appts as $a) {
                    if ((isset($a->patient_user_id) && intval($a->patient_user_id) === intval($user_id)) ||
                        (isset($a->patientName) && $a->patientName === $name)) {
                        $appts++;
                    }
                }

                $all_labs = ECARE_DB_Client::select_all('ecare_lab_orders');
                $labs = 0;
                foreach ($all_labs as $l) {
                    if ((isset($l->patient_user_id) && intval($l->patient_user_id) === intval($user_id)) ||
                        (isset($l->patient_id) && (strval($l->patient_id) === strval($patient_id) || intval($l->patient_id) === intval($patient_id)))) {
                        $labs++;
                    }
                }

                $all_billings = ECARE_DB_Client::select_all('ecare_billing');
                $outstanding = 0;
                $outstanding_statuses = array('Pending', 'Partially Paid', 'Due', 'Under Verify');
                foreach ($all_billings as $b) {
                    $matches_patient = $this->record_matches_user($b, array('patient_user_id', 'patient_id', 'user_id'), $user_id) || $this->record_matches_user($b, array('patient_user_id', 'patient_id', 'user_id'), $patient_id);
                    if (!$matches_patient || !isset($b->status) || !in_array($b->status, $outstanding_statuses, true)) {
                        continue;
                    }
                    $amount = isset($b->amount) ? floatval($b->amount) : 0.0;
                    $paid = isset($b->paidAmount) ? floatval($b->paidAmount) : 0.0;
                    $outstanding += max(0, $amount - $paid);
                }

                // Health Trends - Merge Clinical Notes and Self-Reported Vitals
                $all_notes = ECARE_DB_Client::select_all('ecare_consultation_notes');
                $all_vitals = ECARE_DB_Client::select_all('ecare_patient_vitals');

                $combined = array();
                foreach($all_notes as $note) {
                    if (isset($note->patient_id) && strval($note->patient_id) === strval($patient_id)) {
                        $v = isset($note->vitals) ? (is_array($note->vitals) ? $note->vitals : json_decode($note->vitals, true)) : null;
                        if (is_array($v)) {
                            $combined[] = array(
                                'name' => date('M j', strtotime($note->created_at ?? '')),
                                'wellness' => isset($v['wellness']) ? (int)$v['wellness'] : 0,
                                'weight' => isset($v['weight']) ? (float)str_replace('kg', '', $v['weight']) : 0,
                                'bp' => isset($v['bp']) ? $v['bp'] : 'N/A',
                                'type' => 'Clinical',
                                'timestamp' => strtotime($note->created_at ?? '')
                            );
                        }
                    }
                }
                foreach($all_vitals as $log) {
                    if (isset($log->patient_user_id) && intval($log->patient_user_id) === intval($user_id)) {
                        $combined[] = array(
                            'name' => date('M j', strtotime($log->created_at ?? '')),
                            'wellness' => isset($log->wellness) ? (int)$log->wellness : 0,
                            'weight' => isset($log->weight) ? (float)$log->weight : 0,
                            'bp' => $log->bp ?? 'N/A',
                            'type' => 'Self',
                            'timestamp' => strtotime($log->created_at ?? '')
                        );
                    }
                }

                // Sort by timestamp
                usort($combined, function($a, $b) { return ($a['timestamp'] ?? 0) - ($b['timestamp'] ?? 0); });
                
                // Limit to last 12
                $healthTrends = array_slice($combined, -12);

                return array(
                    'total_appointments' => (int) $appts,
                    'total_lab_orders' => (int) $labs,
                    'outstanding_balance' => (float) $outstanding,
                    'health_trends' => $healthTrends
                );
            }

            if ($doctor_id) {
                $doc_record = ECARE_DB_Client::select_one('ecare_staff', $doctor_id);
                $doctor_name = $doc_record ? ($doc_record->name ?? '') : '';

                $all_appts = ECARE_DB_Client::select_all('ecare_appointments');
                $patients_list = array();
                $appts = 0;
                $today = 0;
                $today_date = current_time('Y-m-d');
                
                foreach ($all_appts as $a) {
                    if (isset($a->doctorName) && $a->doctorName === $doctor_name) {
                        $appt_status = strtolower(trim((string) ($a->status ?? '')));
                        if (in_array($appt_status, array('cancelled', 'expired', 'closed'), true)) {
                            continue;
                        }
                        $appts++;
                        if (isset($a->patientName)) {
                            $patients_list[] = $a->patientName;
                        }
                        if (isset($a->date) && $a->date === $today_date) {
                            $today++;
                        }
                    }
                }
                $patients = count(array_unique($patients_list));
                
                // Fetch settings to calculate dynamic share rate
                $settings = get_option('ecare_settings', array());
                $doctor_commission_rate = 20; // default 20% platform share
                if (isset($settings['serviceCommissions']['doctors']['enabled']) && $settings['serviceCommissions']['doctors']['enabled']) {
                    $doctor_commission_rate = isset($settings['serviceCommissions']['doctors']['rate']) ? (float)$settings['serviceCommissions']['doctors']['rate'] : 20;
                } else if (isset($settings['serviceCommissions']['doctors']) && isset($settings['serviceCommissions']['doctors']['enabled']) && !$settings['serviceCommissions']['doctors']['enabled']) {
                    $doctor_commission_rate = 0;
                }
                $doc_share_factor = (100 - $doctor_commission_rate) / 100;

                // Revenue for doctor (calculated from billing linked to their appointments)
                $all_billings = ECARE_DB_Client::select_all('ecare_billing');
                
                // Map appts for fast lookup
                $appt_map = array();
                foreach ($all_appts as $a) {
                    if (isset($a->id)) {
                        $appt_map[$a->id] = $a;
                    }
                }

                $lifetime_earned = 0.0;
                $pending_earned = 0.0;
                foreach ($all_billings as $b) {
                    if (isset($b->appointmentId) && isset($appt_map[$b->appointmentId])) {
                        $appt = $appt_map[$b->appointmentId];
                        if (isset($appt->doctorName) && $appt->doctorName === $doctor_name) {
                            $billing_status = trim((string) ($b->status ?? ''));
                            $paid_amount = isset($b->paidAmount) ? floatval($b->paidAmount) : 0.0;
                            $amount = isset($b->amount) ? floatval($b->amount) : 0.0;
                            if ($billing_status === 'Paid') {
                                $lifetime_earned += $paid_amount > 0 ? $paid_amount : $amount;
                            } elseif ($billing_status === 'Partially Paid') {
                                $lifetime_earned += $paid_amount;
                                $pending_earned += max(0, $amount - $paid_amount);
                            } elseif (!in_array($billing_status, array('Failed', 'Refunded'), true)) {
                                $pending_earned += max(0, $amount - $paid_amount);
                            }
                        }
                    }
                }

                // Total Completed Payouts
                $all_payouts = ECARE_DB_Client::select_all('ecare_payouts');
                $total_payouts = 0.0;
                foreach ($all_payouts as $p) {
                    if (isset($p->doctor_id) && strval($p->doctor_id) === strval($doctor_id) && isset($p->status) && in_array($p->status, array('Paid', 'Completed'), true)) {
                        $total_payouts += isset($p->amount) ? floatval($p->amount) : 0.0;
                    }
                }

                // Current Wallet Balance = (Total Lifetime Earnings * share) - Completed Payouts
                $wallet_balance = ($lifetime_earned * $doc_share_factor) - $total_payouts;

                return array(
                    'total_patients'     => (int) $patients,
                    'total_appointments' => (int) $appts,
                    'today_appointments' => (int) $today,
                    'total_revenue'      => (float) $lifetime_earned * $doc_share_factor,
                    'wallet_balance'     => (float) $wallet_balance,
                    'pending_settlements'=> (float) $pending_earned * $doc_share_factor,
                    'total_payouts'      => (float) $total_payouts,
                    'total_consultations'=> (int) $appts
                );
            }
        }

        $patients_all = ECARE_DB_Client::select_all('ecare_patients');
        $patients = count($patients_all);
        
        $appts_all = ECARE_DB_Client::select_all('ecare_appointments');
        $appts = 0;
        
        $today = 0;
        $today_date = current_time('Y-m-d');
        foreach ($appts_all as $a) {
            $appt_status = strtolower(trim((string) ($a->status ?? '')));
            if (in_array($appt_status, array('cancelled', 'expired', 'closed'), true)) {
                continue;
            }
            $appts++;
            if (isset($a->date) && $a->date === $today_date) {
                $today++;
            }
        }
        
        $billings_all = ECARE_DB_Client::select_all('ecare_billing');
        $revenue = 0.0;
        foreach ($billings_all as $b) {
            if (isset($b->status) && $b->status === 'Paid') {
                $revenue += isset($b->amount) ? floatval($b->amount) : 0.0;
            }
        }

        $final_stats = array(
            'total_patients' => (int) $patients,
            'total_appointments' => (int) $appts,
            'today_appointments' => (int) $today,
            'total_revenue' => (float) $revenue ?: 0,
        );

        if (!empty($cache_key)) {
            set_transient($cache_key, $final_stats, 5 * MINUTE_IN_SECONDS);
        }
        return $final_stats;
    }

    private function get_settings($request = null)
    {
        $settings = get_option('ecare_settings', array());
        if (!is_array($settings))
            $settings = array();

        $data = array(
            'siteName' => isset($settings['siteName']) ? $settings['siteName'] : get_bloginfo('name'),
            'siteAddress' => isset($settings['siteAddress']) ? $settings['siteAddress'] : '32 Doctors Road, City Center',
            'sitePhone' => isset($settings['sitePhone']) ? $settings['sitePhone'] : '+880 1234 567890',
            'siteEmail' => isset($settings['siteEmail']) ? $settings['siteEmail'] : 'info@ecare-management.com',
            'siteWebsite' => isset($settings['siteWebsite']) ? $settings['siteWebsite'] : 'www.ecare-management.com',
            'currency' => isset($settings['currency']) ? $settings['currency'] : 'BDT',
            'currencySymbol' => isset($settings['currencySymbol']) ? $settings['currencySymbol'] : '৳',
            'logo' => isset($settings['logo']) ? $settings['logo'] : '',
            'bgImage' => isset($settings['bgImage']) ? $settings['bgImage'] : '',
            'providerTypes' => isset($settings['providerTypes']) ? $settings['providerTypes'] : array(),
            'servicePricing' => isset($settings['servicePricing']) ? $settings['servicePricing'] : array(),
            'paymentGateways' => isset($settings['paymentGateways']) ? $settings['paymentGateways'] : array(),
            'jitsiServer' => isset($settings['jitsiServer']) ? $settings['jitsiServer'] : 'https://meet.jit.si',
            'telemedPaymentDeadline' => isset($settings['telemedPaymentDeadline']) ? $settings['telemedPaymentDeadline'] : 2,
            'consultationModes' => isset($settings['consultationModes']) ? $settings['consultationModes'] : array(),
            'primaryColor' => isset($settings['primaryColor']) ? $settings['primaryColor'] : '#1b3b2b',
            'platformCommission' => isset($settings['platformCommission']) ? $settings['platformCommission'] : 20,
            'serviceCommissions' => isset($settings['serviceCommissions']) ? $settings['serviceCommissions'] : array(),
            'instantCallFee' => isset($settings['instantCallFee']) ? $settings['instantCallFee'] : 500,
            'instantRefundDuration' => isset($settings['instantRefundDuration']) ? $settings['instantRefundDuration'] : 48,
            'standardRefundDuration' => isset($settings['standardRefundDuration']) ? $settings['standardRefundDuration'] : 7,
            'floatingWidgetEnabled' => isset($settings['floatingWidgetEnabled']) ? $settings['floatingWidgetEnabled'] : true,
            'woocommerceEnabled' => class_exists('WooCommerce'),
            'partialPayment' => isset($settings['partialPayment']) ? $settings['partialPayment'] : array('enabled' => false, 'minDepositPercent' => 30),
            'reminders' => isset($settings['reminders']) ? $settings['reminders'] : array(),
            'isWooCommerceActive' => class_exists('WooCommerce'),
            'termsUrl' => isset($settings['termsUrl']) ? $settings['termsUrl'] : '',
            'privacyUrl' => isset($settings['privacyUrl']) ? $settings['privacyUrl'] : '',
        );

        if ($this->can_manage_settings()) {
            $data['licenseKey'] = get_option('ecare_license_key', '');
            $data['supabaseUrl'] = get_option('ecare_supabase_url', '');
            $data['supabaseAnonKey'] = get_option('ecare_supabase_anon_key', '');
        }

        return $data;
    }

    public function handle_file_upload($request) {
        if (empty($_FILES)) {
            return new WP_Error('no_file', 'No files uploaded', array('status' => 400));
        }

        $purpose = sanitize_key($request->get_param('purpose') ?: 'clinical');
        $is_public = $purpose === 'public';
        $allowed_mimes = array(
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
        );

        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');



        $uploaded_files = array();
        foreach ($_FILES as $key => $file) {
            if (!empty($file['error'])) {
                return new WP_Error('upload_error', 'The file upload did not complete.', array('status' => 400));
            }
            if ((int) ($file['size'] ?? 0) <= 0 || (int) $file['size'] > 10 * MB_IN_BYTES) {
                return new WP_Error('invalid_file_size', 'Files must be between 1 byte and 10 MB.', array('status' => 400));
            }
            $checked = wp_check_filetype_and_ext($file['tmp_name'], $file['name'], $allowed_mimes);
            $mime = $checked['type'] ?? '';
            $extension = $checked['ext'] ?? '';
            if (!$mime || !$extension || !isset($allowed_mimes[$mime])) {
                return new WP_Error('invalid_file_type', 'Only PDF, JPG, PNG, and WebP files are allowed.', array('status' => 400));
            }

            if (!$is_public) {
                $private_dir = trailingslashit(dirname(ABSPATH)) . 'ecare-private-files';
                if (!wp_mkdir_p($private_dir)) {
                    return new WP_Error('storage_error', 'Private file storage is unavailable.', array('status' => 500));
                }
                $htaccess_path = trailingslashit($private_dir) . '.htaccess';
                if (!file_exists($htaccess_path)) {
                    @file_put_contents($htaccess_path, "Deny from all\nOptions -Indexes");
                }
                $file_id = wp_generate_uuid4();
                $stored_name = $file_id . '.' . $extension;
                $stored_path = trailingslashit($private_dir) . $stored_name;
                if (!move_uploaded_file($file['tmp_name'], $stored_path)) {
                    return new WP_Error('storage_error', 'The private file could not be stored.', array('status' => 500));
                }
                $record_id = ECARE_DB_Client::insert('ecare_private_files', array(
                    'owner_user_id' => get_current_user_id(),
                    'original_name' => sanitize_file_name($file['name']),
                    'stored_name' => $stored_name,
                    'mime_type' => $mime,
                    'size' => (int) $file['size'],
                    'purpose' => $purpose,
                ), $file_id);
                if (!$record_id) {
                    wp_delete_file($stored_path);
                    return new WP_Error('storage_error', 'The private file record could not be created.', array('status' => 500));
                }
                $this->log_audit_event('upload', 'private-files', $file_id, array(
                    'name' => sanitize_file_name($file['name']),
                    'mime_type' => $mime,
                    'size' => (int) $file['size'],
                    'purpose' => $purpose,
                ));
                $uploaded_files[] = array(
                    'id' => $file_id,
                    'url' => rest_url('ecare/v1/files/' . $file_id),
                    'name' => sanitize_file_name($file['name']),
                    'private' => true,
                );
                continue;
            }

            $attachment_id = media_handle_upload($key, 0);
            if (is_wp_error($attachment_id)) {
                return new WP_Error('upload_error', $attachment_id->get_error_message(), array('status' => 500));
            }
            $uploaded_files[] = array(
                'id' => $attachment_id,
                'url' => wp_get_attachment_url($attachment_id),
                'name' => basename(get_attached_file($attachment_id))
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'files' => $uploaded_files
        ));
    }

    public function handle_validate_promo($request) {
        $params = $request->get_json_params();
        $code = sanitize_text_field($params['code'] ?? '');

        if (empty($code)) {
            return new WP_Error('missing_code', 'Promo code is required', array('status' => 400));
        }

        $promos = ECARE_DB_Client::select_where('ecare_promo_codes', 'code', $code);

        $promo = null;
        foreach ($promos as $p) {
            if (isset($p->status) && strtolower($p->status) === 'active') {
                $promo = $p;
                break;
            }
        }

        if (!$promo) {
            return new WP_Error('invalid_code', 'Invalid or expired promo code', array('status' => 400));
        }

        if (!empty($promo->expiry_date) && 
            $promo->expiry_date !== '0000-00-00' && 
            $promo->expiry_date !== '0000-00-00 00:00:00' && 
            strtotime($promo->expiry_date) !== false && 
            strtotime($promo->expiry_date) < time()) {
            return new WP_Error('expired_code', 'This promo code has expired', array('status' => 400));
        }

        return rest_ensure_response(array(
            'success' => true,
            'promo' => $promo
        ));
    }

    public function handle_private_file_download($request) {
        $file_id = sanitize_text_field($request['id']);
        $file = ECARE_DB_Client::select_one('ecare_private_files', $file_id);
        if (!$file) {
            return new WP_Error('not_found', 'File not found.', array('status' => 404));
        }

        $user_id = get_current_user_id();
        $role = $this->get_current_user_role();
        $allowed = in_array($role, array('admin', 'staff'), true) || (int) ($file->owner_user_id ?? 0) === $user_id;
        if (!$allowed && $role === 'doctor') {
            foreach (ECARE_DB_Client::select_all('ecare_appointments') as $appointment) {
                if ($this->doctor_can_access_appointment($appointment, $user_id) && strpos((string) ($appointment->attachments ?? ''), $file_id) !== false) {
                    $allowed = true;
                    break;
                }
            }
        }
        if (!$allowed) {
            $this->log_audit_event('denied_download', 'private-files', $file_id, array('user_id' => $user_id));
            return new WP_Error('unauthorized', 'You do not have permission to access this file.', array('status' => 403));
        }

        $this->log_audit_event('download', 'private-files', $file_id, array('name' => $file->original_name ?? ''));

        $path = trailingslashit(dirname(ABSPATH)) . 'ecare-private-files/' . basename((string) ($file->stored_name ?? ''));
        if (!is_file($path) || !is_readable($path)) {
            return new WP_Error('not_found', 'Stored file not found.', array('status' => 404));
        }

        nocache_headers();
        header('X-Content-Type-Options: nosniff');
        header('Content-Type: ' . sanitize_mime_type($file->mime_type ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($path));
        header('Content-Disposition: inline; filename="' . sanitize_file_name($file->original_name ?? 'document') . '"');
        readfile($path);
        exit;
    }

    private function build_trusted_checkout($cart, $item_forms, $promo_code = '') {
        if (!is_array($cart) || empty($cart) || count($cart) > 50) {
            return new WP_Error('invalid_cart', 'The cart is empty or too large.', array('status' => 400));
        }

        $settings = get_option('ecare_settings', array());
        $trusted_cart = array();
        $subtotal = 0.0;

        foreach ($cart as $item) {
            if (!is_array($item) || empty($item['type']) || empty($item['id'])) {
                return new WP_Error('invalid_cart_item', 'A cart item is incomplete.', array('status' => 400));
            }

            $type = sanitize_key($item['type']);
            $trusted = $item;
            $price = null;

            if ($type === 'doctor_appointment') {
                $doctor_id = $item['doctor']['id'] ?? null;
                $doctor = ECARE_DB_Client::select_one('ecare_staff', $doctor_id);

                // Fallback: try looking up by user_id field if direct ID lookup failed
                if (!$doctor && $doctor_id) {
                    $by_user = ECARE_DB_Client::select_where('ecare_staff', 'user_id', (string) $doctor_id);
                    if (empty($by_user)) {
                        $by_user = ECARE_DB_Client::select_where('ecare_staff', 'id', (string) $doctor_id);
                    }
                    $doctor = !empty($by_user) ? $by_user[0] : null;
                }

                // Doctors use statuses like 'Available', 'In Session', 'Offline' — NOT 'active'.
                // Only block doctors explicitly marked as 'inactive' or 'suspended'.
                $doctor_status = strtolower((string) ($doctor->status ?? ''));
                $is_blocked = in_array($doctor_status, array('inactive', 'suspended', 'disabled'), true);
                $doctor_role = strtolower((string) ($doctor->role ?? ''));

                if (!$doctor || ($doctor_role !== 'doctor' && $doctor_role !== '') || $is_blocked) {
                    return new WP_Error('invalid_doctor', 'The selected doctor is unavailable.', array('status' => 409));
                }
                $price = (float) ($doctor->fee ?? 0);
                $trusted['doctor'] = (array) $doctor;
                $trusted['name'] = 'Doctor Consultation: Dr. ' . sanitize_text_field($doctor->name ?? 'Doctor');
                $form = is_array($item_forms[$item['id']] ?? null) ? $item_forms[$item['id']] : array();
                $proposed_appointment = array(
                    'doctor_id' => $doctor->user_id ?? $doctor->id,
                    'doctor_user_id' => $doctor->user_id ?? null,
                    'doctorName' => $doctor->name ?? '',
                    'date' => $form['bookingDate'] ?? '',
                    'time' => $form['bookingTime'] ?? '',
                    'mode' => $form['bookingMode'] ?? 'Video Consult',
                    'status' => 'Pending',
                );
                if (empty($proposed_appointment['date']) || empty($proposed_appointment['time'])) {
                    return new WP_Error('invalid_appointment_time', 'An appointment date and time are required.', array('status' => 400));
                }
                if ($this->find_conflicting_appointment($proposed_appointment)) {
                    return new WP_Error('appointment_conflict', 'This doctor was booked by someone else. Please choose another time.', array('status' => 409));
                }
            } elseif ($type === 'lab_test') {
                $test_id = $item['test_id'] ?? null;
                $test = ECARE_DB_Client::select_one('ecare_lab_tests', $test_id);
                if (!$test || strtolower((string) ($test->status ?? 'active')) !== 'active') {
                    return new WP_Error('invalid_lab_test', 'The selected lab test is unavailable.', array('status' => 409));
                }
                $price = (float) ($test->price ?? 0);
                $trusted['test_id'] = $test->id;
                $trusted['name'] = sanitize_text_field($test->name ?? 'Lab Test');
            } elseif ($type === 'care_provider') {
                $form = is_array($item_forms[$item['id']] ?? null) ? $item_forms[$item['id']] : array();
                $package_id = $form['packageId'] ?? $item['packageId'] ?? null;
                $package = null;
                foreach (($settings['servicePricing'] ?? array()) as $candidate) {
                    if ((string) ($candidate['id'] ?? '') === (string) $package_id) {
                        $package = $candidate;
                        break;
                    }
                }
                if (!$package) {
                    return new WP_Error('invalid_care_package', 'The selected care package is unavailable.', array('status' => 409));
                }
                $price = (float) ($package['price'] ?? 0);
                $trusted['packageId'] = $package['id'];
                $trusted['name'] = sanitize_text_field(($item['providerType'] ?? 'Home Care') . ' Service');
            } elseif ($type === 'instant_doctor_call') {
                $price = (float) ($settings['instantCallFee'] ?? 500);
                $trusted['name'] = 'Instant Doctor Call';
            } else {
                return new WP_Error('unsupported_cart_item', 'This cart item type is not supported.', array('status' => 400));
            }

            if ($price === null || !is_finite($price) || $price < 0) {
                return new WP_Error('invalid_price', 'A configured service price is invalid.', array('status' => 500));
            }

            $trusted['type'] = $type;
            $trusted['price'] = round($price, 2);
            $trusted['originalPrice'] = round($price, 2);
            $trusted_cart[] = $trusted;
            $subtotal += $price;
        }

        $discount = 0.0;
        $trusted_promo = null;
        $promo_code = sanitize_text_field((string) $promo_code);
        if ($promo_code !== '') {
            $promos = ECARE_DB_Client::select_where('ecare_promo_codes', 'code', $promo_code);
            foreach ($promos as $promo) {
                $active = strtolower((string) ($promo->status ?? '')) === 'active';
                $not_expired = empty($promo->expiry_date) || strtotime($promo->expiry_date) === false || strtotime($promo->expiry_date) >= time();
                if ($active && $not_expired) {
                    $trusted_promo = $promo;
                    break;
                }
            }
            if (!$trusted_promo) {
                return new WP_Error('invalid_promo', 'The promo code is invalid or expired.', array('status' => 400));
            }
            $value = max(0.0, (float) ($trusted_promo->discount_amount ?? 0));
            $discount = (($trusted_promo->discount_type ?? 'fixed') === 'percentage')
                ? $subtotal * min($value, 100.0) / 100.0
                : min($value, $subtotal);
        }

        return array(
            'cart' => $trusted_cart,
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'total' => round(max(0, $subtotal - $discount), 2),
            'promo' => $trusted_promo ? (array) $trusted_promo : null,
        );
    }

    public function handle_woocommerce_checkout($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('wc_missing', 'WooCommerce is not active.', array('status' => 500));
        }
        
        $params = $request->get_json_params();
        $cart = $params['cart'] ?? array();
        $itemForms = $params['itemForms'] ?? array();
        $contactNumber = $params['contactNumber'] ?? '';
        $appliedPromo = $params['appliedPromo'] ?? null;
        $currentUserId = get_current_user_id();
        $paymentMethod = $params['paymentMethod'] ?? '';
        $paymentType = $params['paymentType'] ?? 'full';
        $partialAmount = floatval($params['partialAmount'] ?? 0);
        $paymentNumber = $params['paymentNumber'] ?? '';
        $transactionId = $params['transactionId'] ?? '';

        $trusted_checkout = $this->build_trusted_checkout($cart, $itemForms, $appliedPromo['code'] ?? '');
        if (is_wp_error($trusted_checkout)) {
            return $trusted_checkout;
        }
        $cart = $trusted_checkout['cart'];
        $subtotal = $trusted_checkout['subtotal'];
        $discountAmount = $trusted_checkout['discount'];
        $totalPayable = $trusted_checkout['total'];
        $appliedPromo = $trusted_checkout['promo'];

        // Dynamic check if partial payment is enabled by the admin
        $settings = get_option('ecare_settings', array());
        $partial_settings = $settings['partialPayment'] ?? array('enabled' => false, 'minDepositPercent' => 30);
        $is_partial_enabled = !empty($partial_settings['enabled']);
        if (!$is_partial_enabled) {
            $paymentType = 'full';
            $partialAmount = 0.0;
        }
        if ($paymentType === 'partial') {
            $has_instant_call = false;
            foreach ($cart as $item) {
                if (($item['type'] ?? '') === 'instant_doctor_call') {
                    $has_instant_call = true;
                    break;
                }
            }
            $minimum_percent = max(1.0, min(100.0, (float) ($partial_settings['minDepositPercent'] ?? 30)));
            $minimum_deposit = round($totalPayable * $minimum_percent / 100, 2);
            if ($has_instant_call || $partialAmount < $minimum_deposit || $partialAmount >= $totalPayable) {
                return new WP_Error('invalid_partial_payment', 'The partial payment amount is not allowed for this cart.', array('status' => 400));
            }
            $partialAmount = round($partialAmount, 2);
        }

        // 1. Resolve user
        $user = get_userdata($currentUserId);
        if (!$user || !$user->exists()) {
            return new WP_Error('unauthorized', 'User session not found.', array('status' => 401));
        }

        // Generate invoice number
        $invoiceNo = 'INV-' . strtoupper(wp_generate_password(8, false));

        $createdBookings = array();

        // Get placeholder product
        $placeholder_id = $this->get_or_create_placeholder_product();
        if (is_wp_error($placeholder_id)) {
            return $placeholder_id;
        }

        // Start WooCommerce Order
        $order = wc_create_order(array(
            'customer_id' => $user->ID,
        ));
        
        if (is_wp_error($order)) {
            return new WP_Error('wc_order_failed', 'Could not create WooCommerce order: ' . $order->get_error_message(), array('status' => 500));
        }

        foreach ($cart as $item) {
            $form = $itemForms[$item['id']] ?? array();
            $item_price = isset($item['price']) ? (float)$item['price'] : 0.0;
            
            $booking_id = null;
            $booking_type = '';

            if ($item['type'] === 'lab_test') {
                $booking_type = 'Lab Test';
                $data = array(
                    'patientName' => $user->display_name,
                    'patient_id' => $user->ID,
                    'patient_user_id' => $user->ID,
                    'testName' => $item['name'],
                    'test_id' => $item['testId'] ?? 0,
                    'sample_type' => $item['sample_type'] ?? 'Blood',
                    'priority' => 'Normal',
                    'order_date' => $form['scheduledDate'] ?? current_time('Y-m-d'),
                    'price' => $item_price,
                    'payment_status' => 'Unpaid',
                    'status' => 'Pending',
                    'notes' => $form['clinicalNotes'] ?? ''
                );
                $booking_id = ECARE_DB_Client::insert('ecare_lab_orders', $data);
                
            } else if ($item['type'] === 'doctor_appointment') {
                $booking_type = 'Doctor Appointment';
                $trusted_doctor = $item['doctor'];
                $clean_payment_method = function_exists('ecare_get_clean_payment_method_label') ? ecare_get_clean_payment_method_label($paymentMethod) : 'Online Payment';
                $data = array(
                    'patientName' => $user->display_name,
                    'patient_id' => $user->ID,
                    'patient_user_id' => $user->ID,
                    'doctorName' => $trusted_doctor['name'] ?? 'Unassigned Doctor',
                    'doctor_id' => $trusted_doctor['user_id'] ?? $trusted_doctor['id'],
                    'doctor_user_id' => $trusted_doctor['user_id'] ?? null,
                    'date' => $form['bookingDate'] ?? current_time('Y-m-d'),
                    'time' => $form['bookingTime'] ?? '',
                    'specialty' => $trusted_doctor['specialty'] ?? $trusted_doctor['specialization'] ?? 'General',
                    'service' => 'Doctor Consultation',
                    'mode' => $form['bookingMode'] ?? 'Video Consult',
                    'paymentStatus' => 'Unpaid',
                    'status' => 'Pending',
                    'issuedBy' => $user->display_name,
                    'paymentMethod' => $clean_payment_method,
                    'promo_code' => $appliedPromo['code'] ?? null,
                    'discount_amount' => 0,
                    'reason' => $form['bookingReason'] ?? '',
                    'attachments' => isset($form['attachedFiles']) ? (is_array($form['attachedFiles']) ? json_encode($form['attachedFiles']) : $form['attachedFiles']) : ''
                );
                $booking_id = ECARE_DB_Client::insert('ecare_appointments', $data);
                
            } else if ($item['type'] === 'instant_doctor_call') {
                $booking_type = 'Instant Doctor Call';
                $clean_payment_method = function_exists('ecare_get_clean_payment_method_label') ? ecare_get_clean_payment_method_label($paymentMethod) : 'Online Payment';
                $data = array(
                    'patientName' => $user->display_name,
                    'patient_id' => $user->ID,
                    'patient_user_id' => $user->ID,
                    'doctorName' => 'Pending Broadcast',
                    'date' => current_time('Y-m-d'),
                    'time' => current_time('H:i'),
                    'specialty' => $item['specialty'] ?? $form['specialty'] ?? 'General',
                    'service' => 'Instant Virtual Consultation',
                    'mode' => 'Instant Call',
                    'paymentStatus' => 'Unpaid',
                    'status' => 'Pending',
                    'issuedBy' => $user->display_name,
                    'paymentMethod' => $clean_payment_method,
                    'promo_code' => $appliedPromo['code'] ?? null,
                    'discount_amount' => 0,
                    'reason' => $item['reason'] ?? $form['reason'] ?? '',
                    'attachments' => isset($item['attachedFiles']) ? (is_array($item['attachedFiles']) ? json_encode($item['attachedFiles']) : $item['attachedFiles']) : (isset($form['attachedFiles']) ? (is_array($form['attachedFiles']) ? json_encode($form['attachedFiles']) : $form['attachedFiles']) : '')
                );
                $booking_id = ECARE_DB_Client::insert('ecare_appointments', $data);
                
            } else if ($item['type'] === 'care_provider') {
                $booking_type = 'Care Provider Visit';
                
                $settings = get_option('ecare_settings', array());
                $servicePricing = $settings['servicePricing'] ?? array();
                $selectedPkg = null;
                foreach ($servicePricing as $p) {
                    if (strval($p['id'] ?? '') === strval($form['packageId'] ?? '')) {
                        $selectedPkg = $p;
                        break;
                    }
                }
                $durationLabel = $selectedPkg ? ($selectedPkg['name'] . ' (' . $selectedPkg['duration'] . ')') : 'Home Care Service';

                $clean_payment_method = function_exists('ecare_get_clean_payment_method_label') ? ecare_get_clean_payment_method_label($paymentMethod) : 'Online Payment';
                $data = array(
                    'patient_id' => $user->ID,
                    'patientName' => $user->display_name,
                    'patient_user_id' => $user->ID,
                    'providerName' => $form['providerName'] ?? 'Unassigned / Any',
                    'duration' => $durationLabel,
                    'price' => $item_price,
                    'date' => $form['bookingDate'] ?? current_time('Y-m-d'),
                    'time' => $form['bookingTime'] ?? '',
                    'location' => $form['location'] ?? '',
                    'notes' => $form['notes'] ?? '',
                    'paymentStatus' => 'Unpaid',
                    'paymentMethod' => $clean_payment_method,
                    'status' => 'Pending',
                    'paidAmount' => 0,
                    'issuedBy' => $user->display_name
                );
                $booking_id = ECARE_DB_Client::insert('ecare_care_provider_bookings', $data);
            }

            if ($booking_id) {
                $createdBookings[] = array(
                    'type' => $booking_type,
                    'id' => $booking_id,
                    'name' => $item['name'],
                    'price' => $item_price
                );
                
                $order_item = new WC_Order_Item_Product();
                $order_item->set_product(wc_get_product($placeholder_id));
                $order_item->set_name($item['name']);
                $item_original_price = isset($item['originalPrice']) ? (float)$item['originalPrice'] : $item_price;
                $order_item->set_subtotal($item_original_price);
                $order_item->set_total($item_original_price);
                $order_item->set_quantity(1);
                
                if ($item['type'] === 'doctor_appointment') {
                    $order_item->add_meta_data('Doctor', $item['doctor']['name'] ?? 'Unassigned');
                    $order_item->add_meta_data('Date & Time', ($form['bookingDate'] ?? '') . ' ' . ($form['bookingTime'] ?? ''));
                } else if ($item['type'] === 'care_provider') {
                    $order_item->add_meta_data('Provider Type', $form['providerType'] ?? 'Caregiver');
                    $order_item->add_meta_data('Provider Name', $form['providerName'] ?? 'Any Available');
                    $order_item->add_meta_data('Schedule', ($form['bookingDate'] ?? '') . ' ' . ($form['bookingTime'] ?? ''));
                } else if ($item['type'] === 'lab_test') {
                    $order_item->add_meta_data('Preferred Date', $form['scheduledDate'] ?? '');
                }
                
                $order_item->add_meta_data('_ecare_booking_type', $booking_type);
                $order_item->add_meta_data('_ecare_booking_id', $booking_id);
                
                $order->add_item($order_item);
            }
        }

        if ($discountAmount > 0) {
            $discount_item = new WC_Order_Item_Product();
            $discount_item->set_product(wc_get_product($placeholder_id));
            $discount_item->set_name('E-CARE Promo Discount (' . ($appliedPromo['code'] ?? 'Promo') . ')');
            $discount_item->set_subtotal(-$discountAmount);
            $discount_item->set_total(-$discountAmount);
            $discount_item->set_quantity(1);
            $order->add_item($discount_item);
        }

        if ($paymentType === 'partial' && $partialAmount > 0 && $partialAmount < $totalPayable) {
            $deferred_amount = $totalPayable - $partialAmount;
            $deferred_item = new WC_Order_Item_Product();
            $deferred_item->set_product(wc_get_product($placeholder_id));
            $deferred_item->set_name('E-CARE Remaining Balance (Pay Later)');
            $deferred_item->set_subtotal(-$deferred_amount);
            $deferred_item->set_total(-$deferred_amount);
            $deferred_item->set_quantity(1);
            $order->add_item($deferred_item);
        }

        $clean_initial_method = function_exists('ecare_get_clean_payment_method_label') ? ecare_get_clean_payment_method_label($paymentMethod) : 'Online Payment';
        $billingPayload = array(
            'invoiceNo' => $invoiceNo,
            'patientName' => $user->display_name,
            'category' => 'Combined Checkout',
            'description' => 'E-CARE Services Checkout',
            'amount' => $totalPayable,
            'paidAmount' => 0,
            'method' => $clean_initial_method,
            'methodType' => 'Gateway',
            'status' => 'Pending',
            'date' => current_time('Y-m-d'),
            'issuedBy' => $user->display_name,
            'paymentHistory' => json_encode(array(
                'contactNumber' => $contactNumber,
                'promoCode' => $appliedPromo['code'] ?? null,
                'originalSubtotal' => $subtotal,
                'discountAmount' => $discountAmount,
                'bookings' => $createdBookings
            ))
        );
        
        $firstLab = null;
        $firstAppt = null;
        $firstCP = null;
        foreach ($createdBookings as $cb) {
            if ($cb['type'] === 'Lab Test') $firstLab = $cb['id'];
            if (in_array($cb['type'], array('Doctor Appointment', 'Instant Doctor Call'))) $firstAppt = $cb['id'];
            if ($cb['type'] === 'Care Provider Visit') $firstCP = $cb['id'];
        }
        if ($firstLab) $billingPayload['labOrderId'] = $firstLab;
        if ($firstAppt) $billingPayload['appointmentId'] = $firstAppt;
        if ($firstCP) $billingPayload['careProviderBookingId'] = $firstCP;

        $billing_id = ECARE_DB_Client::insert('ecare_billing', $billingPayload);

        $order->set_billing_first_name($user->first_name ?: $user->display_name);
        $order->set_billing_last_name($user->last_name ?: '');
        $order->set_billing_phone($contactNumber);
        $order->set_billing_email($user->user_email);
        $order->set_billing_address_1('E-CARE Clinical Office / Patient Address');
        $order->set_billing_city('Dhaka');
        $order->set_billing_state('Dhaka');
        $order->set_billing_postcode('1212');
        $order->set_billing_country('BD');

        $order->calculate_totals();

        $order->update_meta_data('_ecare_billing_id', $billing_id);
        $order->update_meta_data('_ecare_booking_ids', json_encode(wp_list_pluck($createdBookings, 'id')));
        $order->update_meta_data('_ecare_bookings_data', json_encode($createdBookings));
        if ($paymentType === 'partial' && $partialAmount > 0 && $partialAmount < $totalPayable) {
            $order->update_meta_data('_ecare_is_partial_payment', 'yes');
            $order->update_meta_data('_ecare_partial_amount', $partialAmount);
            $order->update_meta_data('_ecare_full_amount', $totalPayable);
        }
        $order->save();

        $redirect_url = '';
        $order_completed = false;

        if (!empty($paymentMethod)) {
            $order->set_payment_method($paymentMethod);
            $order->save();

            // ── Offline/manual gateways ────────────────────────────────
            // COD / BACS (cheque) process entirely within E-CARE.
            // We must NOT call gateway->process_payment() — it calls WC()->cart->empty_cart()
            // which crashes in a REST context where WC()->cart is null.
            $offline_gateways = array('cod', 'bacs', 'cheque', 'woo_bkash', 'woo_rocket', 'woo_nagad', 'woo_upay');
            if (in_array($paymentMethod, $offline_gateways, true)) {
                $is_woo_manual = in_array($paymentMethod, array('woo_bkash', 'woo_rocket', 'woo_nagad', 'woo_upay'), true);
                
                // Determine clean gateway label
                $gateway_label = function_exists('ecare_get_clean_payment_method_label')
                    ? ecare_get_clean_payment_method_label($paymentMethod, $order)
                    : $paymentMethod;

                // COD: auto-confirm as processing. BACS/cheque/Mobile manual: on-hold
                $wc_status    = ($paymentMethod === 'cod') ? 'processing' : 'on-hold';
                $status_note  = ($paymentMethod === 'cod')
                    ? __('Cash on Delivery order confirmed via E-CARE checkout.', 'e-care')
                    : sprintf(__('%s payment received via E-CARE checkout. Awaiting manual verification.', 'e-care'), $gateway_label);

                $order->update_status($wc_status, $status_note);
                wc_reduce_stock_levels($order->get_id());

                $billing_status = $is_woo_manual ? 'Under Verify' : (($paymentMethod === 'cod') ? 'Paid' : 'Pending');

                // Update the E-CARE billing record to reflect the chosen gateway label
                ECARE_DB_Client::update('ecare_billing', $billing_id, array(
                    'method'     => $gateway_label,
                    'methodType' => 'WooCommerce Gateway',
                    'status'     => $billing_status,
                    'paidAmount' => ($billing_status === 'Paid') ? $totalPayable : 0.0,
                ));

                // If order status is immediately confirmed (processing/completed), update bookings directly
                if ($wc_status === 'processing' || $wc_status === 'completed') {
                    foreach ($createdBookings as $cb) {
                        if ($cb['type'] === 'Instant Doctor Call') {
                            ECARE_DB_Client::update('ecare_appointments', $cb['id'], array(
                                'paymentStatus' => 'Paid',
                                'status'        => 'Query',
                                'query_started_at' => current_time('mysql', 1),
                                'paymentMethod' => $gateway_label
                            ));
                        } elseif ($cb['type'] === 'Doctor Appointment') {
                            ECARE_DB_Client::update('ecare_appointments', $cb['id'], array(
                                'paymentStatus' => 'Paid',
                                'status'        => 'Confirmed',
                                'paymentMethod' => $gateway_label
                            ));
                        } elseif ($cb['type'] === 'Lab Test') {
                            ECARE_DB_Client::update('ecare_lab_orders', $cb['id'], array(
                                'payment_status' => 'Paid',
                                'status'        => 'Confirmed'
                            ));
                        } elseif ($cb['type'] === 'Care Provider Visit') {
                            ECARE_DB_Client::update('ecare_care_provider_bookings', $cb['id'], array(
                                'paymentStatus' => 'Paid',
                                'status'        => 'Confirmed',
                                'paidAmount'    => (float)$cb['price'],
                                'paymentMethod' => $gateway_label
                            ));
                        }
                    }
                }

                // If this is a mobile manual gateway, insert a manual verification log and update bookings
                if ($is_woo_manual) {
                    $clean_sender = sanitize_text_field(trim($paymentNumber));
                    $clean_trx = sanitize_text_field(trim($transactionId));

                    ECARE_DB_Client::insert('ecare_manual_verifications', array(
                        'invoiceNo'     => $invoiceNo,
                        'patientName'   => $user->display_name,
                        'method'        => $gateway_label,
                        'transactionId' => 'Sender: ' . $clean_sender . ' | TrxID: ' . $clean_trx,
                        'senderNumber'  => $clean_sender,
                        'trxId'         => $clean_trx,
                        'amount'        => $totalPayable,
                        'status'        => 'Pending',
                        'date'          => current_time('Y-m-d')
                    ));

                    foreach ($createdBookings as $cb) {
                        if ($cb['type'] === 'Lab Test') {
                            ECARE_DB_Client::update('ecare_lab_orders', $cb['id'], array('payment_status' => 'Under Verify'));
                        } elseif ($cb['type'] === 'Doctor Appointment') {
                            ECARE_DB_Client::update('ecare_appointments', $cb['id'], array(
                                'paymentStatus' => 'Under Verify',
                                'status'        => 'Under Verify'
                            ));
                        } elseif ($cb['type'] === 'Instant Doctor Call') {
                            ECARE_DB_Client::update('ecare_appointments', $cb['id'], array(
                                'paymentStatus' => 'Under Verify',
                                'status'        => 'Under Verify'
                            ));
                        } elseif ($cb['type'] === 'Care Provider Visit') {
                            ECARE_DB_Client::update('ecare_care_provider_bookings', $cb['id'], array(
                                'paymentStatus' => 'Under Verify',
                                'status'        => 'Pending'
                            ));
                        }
                    }
                }

                // Completed inline — no redirect needed
                $order_completed = true;

            } else {
                // ── Online gateways (Stripe, PayPal etc.) ───────────────────
                // Initialize WC session & cart context before calling process_payment()
                if (!WC()->session) {
                    $session_class = apply_filters('woocommerce_session_handler', 'WC_Session_Handler');
                    WC()->session = new $session_class();
                    WC()->session->init();
                }
                if (!WC()->cart) {
                    WC()->cart = new WC_Cart();
                }

                $available_gateways = WC()->payment_gateways->get_available_payment_gateways();
                if (isset($available_gateways[$paymentMethod])) {
                    $gateway = $available_gateways[$paymentMethod];
                    $result  = $gateway->process_payment($order->get_id());

                    if (isset($result['result']) && $result['result'] === 'success') {
                        $redirect_url = $result['redirect'] ?? '';
                    } else {
                        return new WP_Error('payment_processing_failed', 'WooCommerce payment processing failed.', array('status' => 400));
                    }
                } else {
                    // Gateway not found — mark pending
                    $order->update_status('pending', __('Payment gateway not found; awaiting manual processing.', 'e-care'));
                    $order_completed = true;
                }
            }
        }

        if (empty($redirect_url) && !$order_completed) {
            $redirect_url = $order->get_checkout_payment_url();
        }

        return rest_ensure_response(array(
            'success'    => true,
            'completed'  => $order_completed,
            'checkout_url' => $redirect_url ?: null,
            'order_id'   => $order->get_id(),
            'invoice_no' => $invoiceNo
        ));
    }

    public function handle_woocommerce_cart_sync($request) {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('wc_missing', 'WooCommerce is not active.', array('status' => 500));
        }

        $params = $request->get_json_params();
        $cart_items = $params['cart'] ?? array();
        $item_forms = $params['itemForms'] ?? array();
        $trusted_checkout = $this->build_trusted_checkout($cart_items, $item_forms, '');
        if (is_wp_error($trusted_checkout)) {
            return $trusted_checkout;
        }
        $cart_items = $trusted_checkout['cart'];

        $placeholder_id = $this->get_or_create_placeholder_product();
        if (is_wp_error($placeholder_id)) {
            return $placeholder_id;
        }

        // Bootstrap WooCommerce sessions & cart context if not fully loaded by REST API
        if (null === WC()->session) {
            $session_class = apply_filters('woocommerce_session_handler', 'WC_Session_Handler');
            WC()->session = new $session_class();
            WC()->session->init();
        }
        if (null === WC()->customer) {
            $user_id = get_current_user_id();
            WC()->customer = new WC_Customer($user_id ? $user_id : 0, true);
        }
        if (WC()->customer) {
            WC()->customer->set_billing_country('BD');
            WC()->customer->set_shipping_country('BD');
            WC()->customer->save();
        }
        if (null === WC()->cart) {
            WC()->cart = new WC_Cart();
        }

        WC()->cart->empty_cart();

        foreach ($cart_items as $item) {
            $form = $item_forms[$item['id']] ?? array();
            $item_price = isset($item['price']) ? (float)$item['price'] : 0.0;
            $item_name = $item['name'] ?? 'E-CARE Service';

            // Merge form fields into booking data
            $booking_data = array_merge($item, array('form_fields' => $form));

            WC()->cart->add_to_cart($placeholder_id, 1, 0, array(), array(
                'ecare_custom_price' => $item_price,
                'ecare_custom_name'  => $item_name,
                'ecare_booking_data' => $booking_data
            ));
        }

        WC()->cart->calculate_totals();

        // Capture checkout shortcode output
        if (!defined('WOOCOMMERCE_CHECKOUT')) {
            define('WOOCOMMERCE_CHECKOUT', true);
        }
        
        ob_start();
        echo do_shortcode('[woocommerce_checkout]');
        $checkout_html = ob_get_clean();

        return rest_ensure_response(array(
            'success' => true,
            'cart_count' => WC()->cart->get_cart_contents_count(),
            'total' => (float) WC()->cart->get_total('edit'),
            'checkout_html' => $checkout_html
        ));
    }

    public function handle_ajax_cart_sync() {
        if (!class_exists('WooCommerce')) {
            wp_send_json_error('WooCommerce is not active.', 500);
        }

        if (!is_user_logged_in()) {
            wp_send_json_error('Unauthorized', 401);
        }

        if (!check_ajax_referer('ecare_cart_sync_nonce', 'nonce', false)) {
            wp_send_json_error('Invalid nonce', 403);
        }

        // Parse POST input
        $cart_items = isset($_POST['cart']) ? $_POST['cart'] : array();
        $item_forms = isset($_POST['itemForms']) ? $_POST['itemForms'] : array();
        
        // If they are JSON strings, decode them
        if (is_string($cart_items)) {
            $cart_items = json_decode(stripslashes($cart_items), true);
        }
        if (is_string($item_forms)) {
            $item_forms = json_decode(stripslashes($item_forms), true);
        }

        $trusted_checkout = $this->build_trusted_checkout($cart_items, $item_forms, '');
        if (is_wp_error($trusted_checkout)) {
            wp_send_json_error($trusted_checkout->get_error_message(), $trusted_checkout->get_error_data()['status'] ?? 400);
        }
        $cart_items = $trusted_checkout['cart'];

        $placeholder_id = $this->get_or_create_placeholder_product();
        if (is_wp_error($placeholder_id)) {
            wp_send_json_error($placeholder_id->get_error_message(), 500);
        }

        if (WC()->customer) {
            WC()->customer->set_billing_country('BD');
            WC()->customer->set_shipping_country('BD');
            WC()->customer->save();
        }

        // Empty WooCommerce Cart
        if (WC()->cart) {
            WC()->cart->empty_cart();
            
            foreach ($cart_items as $item) {
                $form = $item_forms[$item['id']] ?? array();
                $item_price = isset($item['price']) ? (float)$item['price'] : 0.0;
                $item_name = $item['name'] ?? 'E-CARE Service';

                // Merge form fields into booking data
                $booking_data = array_merge($item, array('form_fields' => $form));

                WC()->cart->add_to_cart($placeholder_id, 1, 0, array(), array(
                    'ecare_custom_price' => $item_price,
                    'ecare_custom_name'  => $item_name,
                    'ecare_booking_data' => $booking_data
                ));
            }

            WC()->cart->calculate_totals();
        }

        // Capture checkout shortcode HTML
        if (!defined('WOOCOMMERCE_CHECKOUT')) {
            define('WOOCOMMERCE_CHECKOUT', true);
        }
        
        ob_start();
        echo do_shortcode('[woocommerce_checkout]');
        $checkout_html = ob_get_clean();

        wp_send_json_success(array(
            'cart_count' => WC()->cart->get_cart_contents_count(),
            'total' => (float) WC()->cart->get_total('edit'),
            'checkout_html' => $checkout_html
        ));
    }

    private function get_or_create_placeholder_product() {
        $slug = 'ecare-service-placeholder';
        $posts = get_posts(array(
            'post_type' => 'product',
            'post_status' => 'any',
            'name' => $slug,
            'posts_per_page' => 1
        ));

        if (!empty($posts)) {
            return $posts[0]->ID;
        }

        $product_id = wp_insert_post(array(
            'post_title' => 'E-CARE Service Booking',
            'post_name' => $slug,
            'post_status' => 'publish',
            'post_type' => 'product',
        ));

        if (is_wp_error($product_id)) {
            return $product_id;
        }

        if ($product_id) {
            update_post_meta($product_id, '_price', '0');
            update_post_meta($product_id, '_regular_price', '0');
            update_post_meta($product_id, '_virtual', 'yes');
            update_post_meta($product_id, '_visibility', 'hidden');
        }

        return $product_id;
    }

    public function handle_pay_remaining_balance($request) {
        $billing_id = sanitize_text_field($request['id']);
        $params = $request->get_json_params() ?: array();
        $payment_method = $params['paymentMethod'] ?? '';
        $contactNumber = $params['contactNumber'] ?? '';

        $billing = ECARE_DB_Client::select_one('ecare_billing', $billing_id);

        if (!$billing) {
            return new WP_Error('not_found', 'Billing record not found.', array('status' => 404));
        }

        $remaining = floatval($billing->amount) - floatval($billing->paidAmount);
        if ($remaining <= 0) {
            return new WP_Error('already_paid', 'Remaining balance is already paid.', array('status' => 400));
        }

        // Create new WC order for the remaining balance
        $placeholder_id = $this->get_or_create_placeholder_product();
        if (is_wp_error($placeholder_id)) {
            return $placeholder_id;
        }

        $user_id = get_current_user_id() ?: intval($billing->patient_user_id ?? 0);
        $order = wc_create_order(array(
            'customer_id' => $user_id,
        ));

        if (is_wp_error($order)) {
            return new WP_Error('wc_order_failed', 'Could not create WooCommerce order: ' . $order->get_error_message(), array('status' => 500));
        }

        // Add line item
        $order_item = new WC_Order_Item_Product();
        $order_item->set_product(wc_get_product($placeholder_id));
        $order_item->set_name('E-CARE Remaining Balance Payment - Invoice #' . ($billing->invoiceNo ?: $billing_id));
        $order_item->set_subtotal($remaining);
        $order_item->set_total($remaining);
        $order_item->set_quantity(1);
        $order->add_item($order_item);

        $order->set_billing_first_name($billing->patientName ?? 'Patient');
        $order->set_billing_phone($contactNumber ?: $order->get_billing_phone());
        $order->calculate_totals();

        // Save metadata for remaining balance completion hook
        $order->update_meta_data('_ecare_billing_id', $billing_id);
        $order->update_meta_data('_ecare_payment_type', 'remaining_balance');
        $order->save();

        $redirect_url = '';
        $order_completed = false;

        if (!empty($payment_method)) {
            $order->set_payment_method($payment_method);
            $order->save();

            $offline_gateways = array('cod', 'bacs', 'cheque');
            if (in_array($payment_method, $offline_gateways, true)) {
                $wc_status = ($payment_method === 'cod') ? 'processing' : 'on-hold';
                $status_note = ($payment_method === 'cod')
                    ? __('Cash payment for remaining balance confirmed.', 'e-care')
                    : __('Check payment received. Awaiting bank confirmation.', 'e-care');

                $order->update_status($wc_status, $status_note);

                // Update original billing record immediately
                $gateway_label = function_exists('ecare_get_clean_payment_method_label') 
                    ? ecare_get_clean_payment_method_label($payment_method, $order) 
                    : (($payment_method === 'cod') ? 'Cash on Delivery' : 'Bank Transfer');
                
                $new_paid_amount = floatval($billing->paidAmount) + $remaining;
                $new_status = ($new_paid_amount >= floatval($billing->amount)) ? 'Paid' : 'Partially Paid';
                
                $history = json_decode($billing->paymentHistory ?? '', true) ?: array();
                if (!isset($history['installments'])) {
                    $history['installments'] = array();
                }
                $history['installments'][] = array(
                    'order_id' => $order->get_id(),
                    'amount' => $remaining,
                    'date' => current_time('mysql'),
                    'method' => $gateway_label
                );

                ECARE_DB_Client::update('ecare_billing', $billing_id, array(
                    'paidAmount' => $new_paid_amount,
                    'status' => $new_status,
                    'method' => $gateway_label,
                    'paymentHistory' => json_encode($history)
                ));

                // Update bookings
                $this->update_billing_bookings_payment_status($billing, $new_status);

                $order_completed = true;
            } else {
                // Online payment gateways
                if (!WC()->session) {
                    $session_class = apply_filters('woocommerce_session_handler', 'WC_Session_Handler');
                    WC()->session = new $session_class();
                    WC()->session->init();
                }
                if (!WC()->cart) {
                    WC()->cart = new WC_Cart();
                }

                $available_gateways = WC()->payment_gateways->get_available_payment_gateways();
                if (isset($available_gateways[$payment_method])) {
                    $gateway = $available_gateways[$payment_method];
                    $result  = $gateway->process_payment($order->get_id());

                    if (isset($result['result']) && $result['result'] === 'success') {
                        $redirect_url = $result['redirect'] ?? '';
                    } else {
                        return new WP_Error('payment_processing_failed', 'Payment processing failed.', array('status' => 400));
                    }
                } else {
                    $order->update_status('pending', __('Awaiting manual processing.', 'e-care'));
                    $order_completed = true;
                }
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'completed' => $order_completed,
            'checkout_url' => $redirect_url ?: null,
            'order_id' => $order->get_id()
        ));
    }

    private function update_billing_bookings_payment_status($billing, $status) {
        $payment_status = ($status === 'Paid') ? 'Paid' : 'Partially Paid';
        $booking_status = ($status === 'Paid') ? 'Confirmed' : 'Pending';

        if (!empty($billing->appointmentId)) {
            $appointment = ECARE_DB_Client::select_one('ecare_appointments', $billing->appointmentId);
            $appointment_update = array('paymentStatus' => $payment_status, 'status' => $booking_status);
            if ($status === 'Paid' && $appointment && (($appointment->mode ?? '') === 'Instant Call')) {
                $appointment_update['status'] = 'Query';
                $appointment_update['query_started_at'] = current_time('mysql', 1);
            }
            ECARE_DB_Client::update('ecare_appointments', $billing->appointmentId, $appointment_update);
        }
        if (!empty($billing->careProviderBookingId)) {
            ECARE_DB_Client::update('ecare_care_provider_bookings', $billing->careProviderBookingId, array(
                'paymentStatus' => $payment_status,
                'status' => $booking_status,
                'paidAmount' => ($status === 'Paid' ? floatval($billing->amount) : floatval($billing->paidAmount))
            ));
        }
        if (!empty($billing->labOrderId)) {
            ECARE_DB_Client::update('ecare_lab_orders', $billing->labOrderId, array('payment_status' => ($payment_status === 'Partially Paid' ? 'Partial' : $payment_status), 'status' => $booking_status));
        }
    }

    public function search_doctors($request) {
        $search = sanitize_text_field($request->get_param('q'));
        $specialty = sanitize_text_field($request->get_param('specialty'));

        $staff_members = ECARE_DB_Client::select_all('ecare_staff');

        $results = array();
        foreach ($staff_members as $member) {
            // Check role is doctor
            if (!isset($member->role) || strtolower($member->role) !== 'doctor') {
                continue;
            }

            // Check status is Active or Available
            $status = isset($member->status) ? strtolower($member->status) : '';
            if ($status !== 'active' && $status !== 'available') {
                continue;
            }

            // If search q parameter provided, search by name
            if (!empty($search)) {
                $name = isset($member->name) ? $member->name : '';
                if (stripos($name, $search) === false) {
                    continue;
                }
            }

            // If we got here, this doctor is a candidate. Convert to associative array for consistency
            $doc_arr = array(
                'id' => $member->id ?? '',
                'name' => $member->name ?? '',
                'specialty' => $member->specialty ?? '',
                'specialization' => $member->specialization ?? '',
                'status' => $member->status ?? '',
                'avatar' => $member->avatar ?? '',
                'role' => $member->role ?? '',
                'fee' => $member->fee ?? '',
                'degrees' => $member->degrees ?? '',
                'experience' => $member->experience ?? '',
            );
            $results[] = $doc_arr;
        }

        if (!empty($results) && !empty($specialty)) {
            $spec_lower = strtolower(trim($specialty));
            $filtered = [];
            foreach ($results as $doc) {
                $spec_val = !empty($doc['specialization']) ? $doc['specialization'] : (!empty($doc['specialty']) ? $doc['specialty'] : '');
                
                if (empty($spec_val)) {
                    continue;
                }

                $parsed_specs = [];
                // If it's array/object already, or is a json string
                if (is_array($spec_val)) {
                    $parsed_specs = $spec_val;
                } else if (is_string($spec_val)) {
                    $first_char = substr(trim($spec_val), 0, 1);
                    if ($first_char === '[' || $first_char === '{') {
                        $decoded = json_decode($spec_val, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            $parsed_specs = $decoded;
                        }
                    }
                }

                if (empty($parsed_specs)) {
                    $spec_val_lower = strtolower(trim(is_string($spec_val) ? $spec_val : ''));
                    if (strpos($spec_val_lower, $spec_lower) !== false) {
                        $filtered[] = $doc;
                    }
                } else {
                    $matched = false;
                    foreach ($parsed_specs as $s) {
                        if (is_string($s) && strtolower(trim($s)) === $spec_lower) {
                            $matched = true;
                            break;
                        }
                    }
                    if ($matched) {
                        $filtered[] = $doc;
                    }
                }
            }
            $results = $filtered;
        }

        // Decode any JSON fields (such as photos or custom fields)
        foreach ($results as &$row) {
            foreach ($row as $key => $value) {
                if (is_string($value) && (strpos($value, '[') === 0 || strpos($value, '{') === 0)) {
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row[$key] = $decoded;
                    }
                }
            }
        }
        unset($row);

        return rest_ensure_response($results);
    }

    public function handle_get_settings_admins($request) {
        $ecare_admins = get_users(array('role' => 'ecare_admin'));
        $all_users = get_users(array('number' => 100, 'role__not_in' => array('ecare_admin')));
        
        $admins_data = array();
        foreach ($ecare_admins as $admin) {
            $admins_data[] = array(
                'id' => $admin->ID,
                'name' => $admin->display_name,
                'email' => $admin->user_email,
                'avatar' => get_avatar_url($admin->ID)
            );
        }

        $candidates_data = array();
        foreach ($all_users as $u) {
            $candidates_data[] = array(
                'id' => $u->ID,
                'name' => $u->display_name,
                'email' => $u->user_email,
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'admins' => $admins_data,
            'candidates' => $candidates_data
        ));
    }

    public function handle_promote_settings_admin($request) {
        $user_id = intval($request->get_param('user_id'));
        if (!$user_id) {
            return new WP_Error('invalid_user_id', 'Invalid user ID', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', array('status' => 404));
        }

        $user->add_role('ecare_admin');
        return rest_ensure_response(array('success' => true, 'message' => "User {$user->display_name} promoted to E-CARE Admin."));
    }

    public function handle_demote_settings_admin($request) {
        $user_id = intval($request->get_param('user_id'));
        if (!$user_id) {
            return new WP_Error('invalid_user_id', 'Invalid user ID', array('status' => 400));
        }

        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', array('status' => 404));
        }

        $user->remove_role('ecare_admin');
        return rest_ensure_response(array('success' => true, 'message' => "E-CARE Admin role removed from {$user->display_name}."));
    }

    public function handle_run_reminders($request) {
        if (!class_exists('ECARE_Reminders')) {
            return new WP_Error('reminder_engine_missing', 'Reminder engine is not available.', array('status' => 500));
        }

        $engine = new ECARE_Reminders();
        $result = $engine->process_due_reminders(true);

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Reminder sweep completed.',
            'result' => $result,
        ));
    }

    public function handle_test_reminders(WP_REST_Request $request) {
        if (!class_exists('ECARE_Reminders')) {
            require_once ECARE_PATH . 'includes/class-ecare-reminders.php';
        }

        $params = $request->get_json_params() ?: array();
        $engine = new ECARE_Reminders();
        $result = $engine->test_reminder($params);

        return rest_ensure_response(array(
            'success'     => true,
            'diagnostics' => $result,
        ));
    }

    public function handle_run_appointment_lifecycle($request) {
        if (!class_exists('ECARE_AppointmentLifecycle')) {
            return new WP_Error('appointment_lifecycle_missing', 'Appointment lifecycle engine is not available.', array('status' => 500));
        }

        $engine = new ECARE_AppointmentLifecycle();
        $result = $engine->process_due_updates();

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Appointment lifecycle sweep completed.',
            'result' => $result,
        ));
    }

    public function handle_health_check($request) {
        global $wpdb;
        $table     = $wpdb->prefix . 'ecare_documents';
        $exists    = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
        $isHealthy = ($exists === $table);

        // Quick write-test query
        if ($isHealthy) {
            $result = $wpdb->query("SELECT 1 FROM {$table} LIMIT 1");
            if ($result === false) $isHealthy = false;
        }

        $mysql_version = $wpdb->db_version();

        return rest_ensure_response(array(
            'success'       => true,
            'isHealthy'     => $isHealthy,
            'missingTables' => $isHealthy ? array() : array('wp_ecare_documents table is missing — click Repair Sync to create it.'),
            'phpVersion'    => phpversion(),
            'dbVersion'     => 'MySQL ' . $mysql_version,
            'wpVersion'     => get_bloginfo('version')
        ));
    }

    public function handle_repair_db($request) {
        ECARE_DB::create_tables();
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'MySQL database table has been verified and repaired successfully.'
        ));
    }

    public function handle_database_cleanup($request) {
        $role = $this->get_current_user_role();
        if ($role !== 'admin') {
            return new WP_Error('rest_forbidden', __('You do not have permission to clean the database.', 'e-care-management'), array('status' => 403));
        }

        $categories = $request->get_param('categories');
        if (!is_array($categories) || empty($categories)) {
            return new WP_Error('invalid_params', __('No data categories selected for cleanup.', 'e-care-management'), array('status' => 400));
        }

        $cleaned = array();
        $errors = array();

        $category_map = array(
            'appointments'  => array('ecare_appointments', 'ecare_consultation_notes', 'ecare_patient_vitals'),
            'billing'       => array('ecare_billing', 'ecare_refunds', 'ecare_manual_verifications'),
            'patients'      => array('ecare_patients', 'ecare_medical_vault'),
            'doctors'       => array('ecare_staff', 'ecare_doctor_availability', 'ecare_payouts'),
            'services'      => array('ecare_services', 'ecare_specialities'),
            'ambulance'     => array('ecare_ambulance', 'ecare_ambulance_bookings'),
            'care'          => array('ecare_care_providers', 'ecare_care_provider_bookings'),
            'labs'          => array('ecare_lab_tests', 'ecare_lab_orders', 'ecare_lab_locations'),
            'notifications' => array('ecare_notifications')
        );

        foreach ($categories as $category) {
            if (isset($category_map[$category])) {
                foreach ($category_map[$category] as $collection) {
                    if (ECARE_DB_Client::delete_collection($collection) !== false) {
                        $cleaned[] = $collection;
                    } else {
                        $errors[] = sprintf("Failed to clean collection %s", $collection);
                    }
                }
            }
        }

        if (!empty($errors)) {
            return rest_ensure_response(array(
                'success' => false,
                'message' => implode(' | ', $errors),
                'cleaned' => $cleaned
            ));
        }

        $this->delete_dashboard_cache();

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Selected database collections cleaned up successfully.', 'e-care-management'),
            'cleaned' => $cleaned
        ));
    }

    public function handle_onboarding_complete($request) {
        $params = $request->get_json_params() ?: array();
        $params = wp_unslash($params);

        // Update settings options
        $settings = get_option('ecare_settings', array());
        if (!is_array($settings)) {
            $settings = array();
        }

        $whitelist = array(
            'siteName',
            'siteAddress',
            'sitePhone',
            'siteEmail',
            'siteWebsite',
            'logo',
            'bgImage',
            'primaryColor',
            'reminders',
            'licenseKey',
            'firebaseConfig'
        );

        $filtered = array();
        foreach ($whitelist as $key) {
            if (isset($params[$key])) {
                $filtered[$key] = $params[$key];
            }
        }

        $new_settings = array_merge($settings, $filtered);
        update_option('ecare_settings', $new_settings);

        // Sync standalone options
        if (isset($new_settings['primaryColor'])) {
            update_option('ecare_primary_color', $new_settings['primaryColor']);
        }
        if (isset($new_settings['logo'])) {
            update_option('ecare_auth_logo', $new_settings['logo']);
        }
        if (isset($new_settings['bgImage'])) {
            update_option('ecare_auth_bg_image', $new_settings['bgImage']);
        }
        if (isset($new_settings['licenseKey'])) {
            update_option('ecare_license_key', $new_settings['licenseKey']);
        }
        if (isset($new_settings['firebaseConfig']) && is_array($new_settings['firebaseConfig'])) {
            update_option('ecare_firebase_api_key', $new_settings['firebaseConfig']['apiKey'] ?? '');
            update_option('ecare_firebase_auth_domain', $new_settings['firebaseConfig']['authDomain'] ?? '');
            update_option('ecare_firebase_project_id', $new_settings['firebaseConfig']['projectId'] ?? '');
            update_option('ecare_firebase_storage_bucket', $new_settings['firebaseConfig']['storageBucket'] ?? '');
            update_option('ecare_firebase_messaging_sender_id', $new_settings['firebaseConfig']['messagingSenderId'] ?? '');
            update_option('ecare_firebase_app_id', $new_settings['firebaseConfig']['appId'] ?? '');
        }

        // Promote the current user to ecare_admin
        $current_user = wp_get_current_user();
        if ($current_user && $current_user->exists()) {
            $current_user->add_role('ecare_admin');
        }

        // Set setup completed flag
        update_option('ecare_setup_completed', 'yes');

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Onboarding setup completed successfully.',
            'settings' => $new_settings
        ));
    }

    public function handle_system_reset($request) {
        $role = $this->get_current_user_role();
        if ($role !== 'admin') {
            return new WP_Error('rest_forbidden', __('You do not have permission to reset the system.', 'e-care-management'), array('status' => 403));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'ecare_documents';

        // 1. Truncate/empty the documents table
        $wpdb->query("TRUNCATE TABLE {$table}");

        // 2. Delete E-CARE WordPress options
        $options_to_delete = array(
            'ecare_settings',
            'ecare_setup_completed',
            'ecare_auth_bg_image',
            'ecare_auth_logo',
            'ecare_license_key',
            'ecare_primary_color',
            'ecare_firebase_api_key',
            'ecare_firebase_auth_domain',
            'ecare_firebase_project_id',
            'ecare_firebase_storage_bucket',
            'ecare_firebase_messaging_sender_id',
            'ecare_firebase_app_id'
        );

        foreach ($options_to_delete as $option) {
            delete_option($option);
        }

        // 3. Clear transient/dashboard cache
        $this->delete_dashboard_cache();
        delete_transient('ecare_setup_errors');

        // 4. Remove E-CARE roles from users (except standard administrator)
        $roles_to_clean = array('ecare_doctor', 'ecare_patient', 'ecare_receptionist', 'ecare_staff', 'ecare_admin');
        foreach ($roles_to_clean as $role_slug) {
            $users = get_users(array('role' => $role_slug, 'fields' => 'ID', 'number' => -1));
            foreach ($users as $uid) {
                $user_obj = new WP_User($uid);
                $user_obj->remove_role($role_slug);
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('System has been successfully reset to its initial state.', 'e-care-management')
        ));
    }

    // ─── Daily.co Video Calling Integration ──────────────────────────────────

    /**
     * Tests the Daily.co API key by pinging the Daily.co REST API.
     *
     * POST /ecare/v1/telemed/test-daily
     * Body: { api_key?: string }
     */
    public function handle_test_daily_connection(WP_REST_Request $request)
    {
        $params   = $request->get_json_params() ?: array();
        $settings = get_option('ecare_settings', array());
        $api_key  = trim($params['api_key'] ?? $settings['dailyApiKey'] ?? '');

        if (empty($api_key)) {
            return new WP_Error(
                'daily_no_key',
                __('Please enter a Daily.co API Key to test the connection.', 'e-care-management'),
                array('status' => 400)
            );
        }

        $response = wp_remote_get('https://api.daily.co/v1/', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ),
            'timeout' => 15,
        ));

        if (is_wp_error($response)) {
            return new WP_Error(
                'daily_connection_failed',
                sprintf(__('Failed to connect to Daily.co API: %s', 'e-care-management'), $response->get_error_message()),
                array('status' => 500)
            );
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200) {
            $msg = $body['info'] ?? $body['error'] ?? __('Daily.co API Key is invalid or expired. Please check your Daily.co dashboard.', 'e-care-management');
            return new WP_Error('daily_auth_failed', $msg, array('status' => $code));
        }

        $domain_id   = $body['domain_id'] ?? '';
        $domain_name = $body['domain_name'] ?? '';

        return rest_ensure_response(array(
            'success'     => true,
            'message'     => __('Daily.co API connected successfully!', 'e-care-management'),
            'domain_id'   => $domain_id,
            'domain_name' => $domain_name,
        ));
    }

    /**
     * Generates a Jitsi Meet session for a telemedicine consultation.
     *
     * POST /ecare/v1/telemed/token
     * Body: { room_id: int }
     * Returns: { room_name, jitsi_server, user_name, is_owner, expires_at }
     *
     * No external API calls needed — Jitsi Meet public server is free & open.
     */
    public function handle_telemed_token_request(WP_REST_Request $request)
    {
        $params  = $request->get_json_params() ?: array();
        $raw_id  = $params['room_id'] ?? $params['id'] ?? $params['appointment_id'] ?? $request->get_param('room_id') ?? $request->get_param('id') ?? 0;
        $room_id = intval($raw_id);

        if (!$room_id) {
            $room_id = 1;
        }

        // Load Jitsi server from settings (defaults to public meet.jit.si)
        $settings     = get_option('ecare_settings', array());
        $jitsi_server = trim($settings['jitsiServer'] ?? 'https://meet.jit.si');
        if (empty($jitsi_server)) {
            $jitsi_server = 'https://meet.jit.si';
        }

        // Room resolution: by id, or appointment_id, or auto-creation
        $room = ECARE_DB_Client::select_one('ecare_telemed_rooms', $room_id);
        if (!$room) {
            $rooms = ECARE_DB_Client::select_where('ecare_telemed_rooms', 'appointment_id', $room_id);
            if (!empty($rooms)) {
                $room = $rooms[0];
            } else {
                // Auto-create room record so token request never fails
                $current_user_id = get_current_user_id();
                $insert_id = ECARE_DB_Client::insert('ecare_telemed_rooms', array(
                    'appointment_id' => $room_id,
                    'patient_id'     => $current_user_id ?: 0,
                    'doctor_id'      => null,
                    'status'         => 'Active',
                    'type'           => 'Instant',
                    'call_status'    => 'connected',
                    'created_at'     => current_time('mysql'),
                    'updated_at'     => current_time('mysql'),
                ));
                $room = array('id' => $insert_id ?: $room_id);
            }
        }

        $effective_room_id = is_array($room) ? ($room['id'] ?? $room_id) : ($room->id ?? $room_id);
        $current_user_id   = get_current_user_id();
        $is_doctor         = false;
        $user_name         = 'Participant';

        if ($current_user_id > 0) {
            $user_obj = get_userdata($current_user_id);
            if ($user_obj) {
                $user_name = trim($user_obj->first_name . ' ' . $user_obj->last_name);
                if (empty($user_name)) {
                    $user_name = $user_obj->display_name ?: $user_obj->user_login;
                }
            }
            $ecare_role     = get_user_meta($current_user_id, 'ecare_role', true);
            $room_doctor_id = is_array($room) ? ($room['doctor_id'] ?? 0) : ($room->doctor_id ?? 0);
            if ($ecare_role === 'doctor' || intval($room_doctor_id) === $current_user_id || current_user_can('manage_options')) {
                $is_doctor = true;
                if (stripos($user_name, 'dr.') === false && stripos($user_name, 'doctor') === false) {
                    $user_name = 'Dr. ' . $user_name;
                }
            }
        }

        // Generate deterministic Jitsi room name from room ID
        // Room name must be URL-safe: lowercase alphanumeric + dashes only
        $room_name  = 'ecare-room-' . $effective_room_id;
        $exp_ts     = time() + 7200; // 2 hours validity

        return rest_ensure_response(array(
            'room_name'    => $room_name,
            'jitsi_server' => $jitsi_server,
            'user_name'    => $user_name,
            'is_owner'     => $is_doctor,
            'expires_at'   => $exp_ts,
            // Backwards compatibility keys (ignored by Jitsi hook)
            'room_url'     => rtrim($jitsi_server, '/') . '/' . $room_name,
            'token'        => '',
            'app_id'       => 'jitsi',
            'channel'      => $room_name,
            'uid'          => $current_user_id > 0 ? $current_user_id : rand(100000, 999999),
        ));
    }


    /**
     * Creates or retrieves a Daily.co room for the session.
     */
    private function create_or_get_daily_room($api_key, $effective_room_id, $room_record)
    {
        $existing_url  = is_array($room_record) ? ($room_record['daily_room_url'] ?? '') : ($room_record->daily_room_url ?? '');
        $existing_name = is_array($room_record) ? ($room_record['daily_room_name'] ?? '') : ($room_record->daily_room_name ?? '');
        $existing_exp  = is_array($room_record) ? ($room_record['daily_room_exp'] ?? 0) : ($room_record->daily_room_exp ?? 0);

        // If active room exists and has at least 5 minutes before expiration, reuse it
        if (!empty($existing_url) && !empty($existing_name) && intval($existing_exp) > (time() + 300)) {
            return array(
                'url'  => $existing_url,
                'name' => $existing_name,
                'exp'  => intval($existing_exp),
            );
        }

        // Generate sanitized unique Daily room name (lowercase alphanumeric and dashes)
        $unique_suffix = substr(md5(uniqid((string)mt_rand(), true)), 0, 6);
        $room_name     = 'ecare-room-' . $effective_room_id . '-' . $unique_suffix;
        $exp_timestamp = time() + 7200; // 2 hours room validity

        $request_body = array(
            'name'       => $room_name,
            'privacy'    => 'private', // Secure private room accessible only via meeting tokens
            'properties' => array(
                'exp'                => $exp_timestamp,
                'eject_at_room_exp'  => true,
                'enable_screenshare' => true,
                'enable_chat'        => true,
                'start_video_off'    => false,
                'start_audio_off'    => false,
            ),
        );

        $response = wp_remote_post('https://api.daily.co/v1/rooms', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ),
            'body'    => wp_json_encode($request_body),
            'timeout' => 15,
        ));

        if (is_wp_error($response)) {
            return new WP_Error(
                'daily_room_error',
                sprintf(__('Failed to create Daily.co room: %s', 'e-care-management'), $response->get_error_message()),
                array('status' => 500)
            );
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200) {
            $msg = $body['info'] ?? $body['error'] ?? __('Failed to initialize Daily.co room. Please check Daily.co API key.', 'e-care-management');
            return new WP_Error('daily_api_error', $msg, array('status' => $code));
        }

        $url = $body['url'] ?? '';
        if (empty($url)) {
            return new WP_Error('daily_bad_response', __('Daily.co did not return a valid room URL.', 'e-care-management'), array('status' => 500));
        }

        // Cache room details in telemed room document
        if (!empty($effective_room_id)) {
            ECARE_DB_Client::update('ecare_telemed_rooms', $effective_room_id, array(
                'daily_room_url'  => $url,
                'daily_room_name' => $room_name,
                'daily_room_exp'  => $exp_timestamp,
            ));
        }

        return array(
            'url'  => $url,
            'name' => $room_name,
            'exp'  => $exp_timestamp,
        );
    }

    /**
     * Creates a Daily.co meeting token for secure participant admission.
     */
    private function create_daily_meeting_token($api_key, $room_name, $user_name, $user_id, $is_owner, $exp_ts)
    {
        $properties = array(
            'room_name'          => $room_name,
            'user_name'          => $user_name,
            'is_owner'           => (bool)$is_owner,
            'exp'                => intval($exp_ts),
            'enable_screenshare' => true,
        );

        if ($user_id > 0) {
            $properties['user_id'] = (string)$user_id;
        }

        $response = wp_remote_post('https://api.daily.co/v1/meeting-tokens', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ),
            'body'    => wp_json_encode(array('properties' => $properties)),
            'timeout' => 15,
        ));

        if (is_wp_error($response)) {
            return new WP_Error(
                'daily_token_error',
                sprintf(__('Failed to create Daily.co meeting token: %s', 'e-care-management'), $response->get_error_message()),
                array('status' => 500)
            );
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200 || empty($body['token'])) {
            $msg = $body['info'] ?? $body['error'] ?? __('Failed to generate Daily.co meeting token.', 'e-care-management');
            return new WP_Error('daily_token_failed', $msg, array('status' => $code ?: 500));
        }

        return $body['token'];
    }

    /**
     * Generates a short-lived Agora RTC (and RTM) token for authorized consultation participants.
     *
     * POST /ecare/v1/telemed/agora/token
     * Request body: { room_id: int, appointment_id?: int }
     *
     * Strict clinical security verification:
     * 1. Requires authenticated WordPress user.
     * 2. Resolves room and appointment from E-CARE storage.
     * 3. Validates user relationship (doctor/patient/admin).
     * 4. Validates appointment lifecycle state and payment.
     * 5. Derives channel name server-side ('ecare_telemed_{room_id}').
     * 6. Generates role-based deterministic UID.
     * 7. Returns short-lived RTC token and sanitized config. NEVER returns certificate.
     */
    public function handle_agora_token_request(WP_REST_Request $request)
    {
        $current_user_id = get_current_user_id();
        if ($current_user_id <= 0) {
            return new WP_Error('ecare_unauthenticated', __('You must be logged in to request a consultation token.', 'e-care-management'), array('status' => 401));
        }

        $params = $request->get_json_params() ?: array();
        $room_id = intval($params['room_id'] ?? $params['id'] ?? $request->get_param('room_id') ?? $request->get_param('id') ?? 0);
        $appointment_id = intval($params['appointment_id'] ?? $request->get_param('appointment_id') ?? 0);

        if ($room_id <= 0 && $appointment_id <= 0) {
            return new WP_Error('ecare_missing_params', __('Consultation room ID or appointment ID is required.', 'e-care-management'), array('status' => 400));
        }

        // Validate session authorization via ECARE_Agora_Service
        $session = ECARE_Agora_Service::validate_session_access($room_id, $appointment_id, $current_user_id);
        if (is_wp_error($session)) {
            return $session;
        }

        // Generate Agora RTC token
        $rtc_result = ECARE_Agora_Service::generate_rtc_token($session['channel'], $session['uid'], 'publisher');
        if (is_wp_error($rtc_result)) {
            return $rtc_result;
        }

        // Generate optional Agora Signaling (RTM) token
        $rtm_token = ECARE_Agora_Service::generate_rtm_token($session['uid']);

        // Record join timestamp in telemed room
        ECARE_Agora_Service::update_room_presence(
            $session['effective_room_id'],
            $current_user_id,
            $session['role'],
            'joined'
        );

        $config = ECARE_Agora_Service::get_config();

        return rest_ensure_response(array(
            'success'   => true,
            'provider'  => 'agora',
            'appId'     => $rtc_result['app_id'],
            'channel'   => $rtc_result['channel'],
            'uid'       => $rtc_result['uid'],
            'rtcToken'  => $rtc_result['rtc_token'],
            'rtmToken'  => $rtm_token ?: '',
            'expiresAt' => $rtc_result['expires_at'],
            'userName'  => $session['user_name'],
            'role'      => $session['role'],
            'config'    => array(
                'video'       => $config['video_enabled'],
                'audio'       => $config['audio_enabled'],
                'screenShare' => $config['screen_share_enabled'],
                'signaling'   => $config['signaling_enabled'],
            ),
        ));
    }

    /**
     * Test Agora connection & token generation diagnostics (Admin only).
     *
     * POST /ecare/v1/telemed/agora/test
     */
    public function handle_test_agora_connection(WP_REST_Request $request)
    {
        $params     = $request->get_json_params() ?: array();
        $raw_app_id = isset($params['app_id']) ? trim(sanitize_text_field($params['app_id'])) : '';
        $raw_cert   = isset($params['app_certificate']) ? trim(sanitize_text_field($params['app_certificate'])) : '';

        $app_id   = !empty($raw_app_id) ? $raw_app_id : null;
        $app_cert = (!empty($raw_cert) && strpos($raw_cert, '•') === false && strpos($raw_cert, '*') === false) ? $raw_cert : null;

        $diagnostics = ECARE_Agora_Service::test_connection($app_id, $app_cert);

        if (!$diagnostics['configured']) {
            return new WP_Error('agora_test_failed', $diagnostics['message'], array('status' => 400, 'diagnostics' => $diagnostics));
        }

        return rest_ensure_response(array(
            'success'     => true,
            'diagnostics' => $diagnostics,
        ));
    }

    /**
     * Updates session lifecycle presence in ecare_telemed_rooms.
     *
     * POST /ecare/v1/telemed/room/presence
     * Body: { room_id: int, event: 'joined'|'left'|'ended' }
     */
    public function handle_telemed_room_presence(WP_REST_Request $request)
    {
        $current_user_id = get_current_user_id();
        if ($current_user_id <= 0) {
            return new WP_Error('ecare_unauthenticated', __('Authentication required.', 'e-care-management'), array('status' => 401));
        }

        $params = $request->get_json_params() ?: array();
        $room_id = intval($params['room_id'] ?? 0);
        $event = sanitize_key($params['event'] ?? 'joined');

        if ($room_id <= 0 || !in_array($event, array('joined', 'left', 'ended'), true)) {
            return new WP_Error('ecare_invalid_params', __('Invalid room ID or event parameter.', 'e-care-management'), array('status' => 400));
        }

        $session = ECARE_Agora_Service::validate_session_access($room_id, 0, $current_user_id);
        if (is_wp_error($session)) {
            return $session;
        }

        $success = ECARE_Agora_Service::update_room_presence(
            $session['effective_room_id'],
            $current_user_id,
            $session['role'],
            $event
        );

        return rest_ensure_response(array('success' => $success));
    }
}


