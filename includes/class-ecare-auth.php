<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE authentication page setup:
 *  - Registers the custom page template so WP recognises it
 *  - Auto-creates the /ecare-login page on activation
 *  - Adds the REST API endpoint for new user registration requests
 */
class ECARE_Auth {

    const PAGE_SLUG     = 'ecare-login';
    const TEMPLATE_FILE = 'templates/page-ecare-auth.php';

    const PORTAL_SLUG          = 'ecare-portal';
    const PORTAL_TEMPLATE_FILE = 'templates/page-ecare-portal.php';

    const LOGOUT_SLUG = 'ecare-logout';

    public function __construct() {
        // Register template in WP's template picker
        add_filter('theme_page_templates', [$this, 'register_template']);
        add_filter('template_include',     [$this, 'load_template']);

        // Aggressively intercept routes to ensure 100% theme isolation
        add_action('template_redirect', [$this, 'intercept_login_route'], 1);

        // REST: user registration request endpoint
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // Shortcodes
        add_shortcode('ecare_registration', [$this, 'render_registration_shortcode']);
        add_shortcode('ecare_login_form',   [$this, 'render_login_shortcode']);
        add_shortcode('ecare_booking',      [$this, 'render_booking_shortcode']);
    }

    /* ── Page Template & Route Interception ─────────────────────────────── */

    public function intercept_login_route() {
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        if (strpos($request_uri, '/' . self::LOGOUT_SLUG) !== false) {
            wp_logout();
            wp_redirect(ecare_adjust_url(home_url('/ecare-login')));
            exit;
        }

        if (strpos($request_uri, '/' . self::PAGE_SLUG) !== false) {
            $plugin_template = ECARE_PATH . self::TEMPLATE_FILE;
            if (file_exists($plugin_template)) {
                include $plugin_template;
                exit; // Stop WordPress completely to guarantee 0% theme interference
            }
        }
        if (strpos($request_uri, '/' . self::PORTAL_SLUG) !== false) {
            $plugin_template = ECARE_PATH . self::PORTAL_TEMPLATE_FILE;
            if (file_exists($plugin_template)) {
                include $plugin_template;
                exit; // Stop WordPress completely to guarantee 0% theme interference
            }
        }
    }

    public function register_template($templates) {
        $templates[self::TEMPLATE_FILE] = __('E-CARE Auth Page', 'e-care-management');
        $templates[self::PORTAL_TEMPLATE_FILE] = __('E-CARE Portal Page', 'e-care-management');
        return $templates;
    }

    public function load_template($template) {
        global $post;
        if (!$post) return $template;

        $page_template = get_post_meta($post->ID, '_wp_page_template', true);

        if ($page_template === self::TEMPLATE_FILE) {
            $plugin_template = ECARE_PATH . self::TEMPLATE_FILE;
            if (file_exists($plugin_template)) {
                return $plugin_template;
            }
        }
        if ($page_template === self::PORTAL_TEMPLATE_FILE) {
            $plugin_template = ECARE_PATH . self::PORTAL_TEMPLATE_FILE;
            if (file_exists($plugin_template)) {
                return $plugin_template;
            }
        }
        return $template;
    }
    /* ── Auto-create Login & Portal Pages ───────────────────────────────── */

    /**
     * Called on plugin activation. Creates the E-CARE login page if it doesn't exist.
     */
    public static function create_login_page() {
        $existing = get_page_by_path(self::PAGE_SLUG);
        if ($existing) {
            return; // Already exists
        }

        $page_id = wp_insert_post([
            'post_title'   => 'E-CARE Portal Login',
            'post_name'    => self::PAGE_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '',
            'meta_input'   => [
                '_wp_page_template' => self::TEMPLATE_FILE,
            ],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            // Store the page ID for later reference
            update_option('ecare_login_page_id', $page_id);
        }
    }

    /**
     * Called on plugin deactivation. Deletes the generated login page.
     */
    public static function delete_login_page() {
        $page_id = get_option('ecare_login_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_login_page_id');
        }
    }

    /**
     * Called on plugin activation. Creates the E-CARE portal page if it doesn't exist.
     */
    public static function create_portal_page() {
        $existing = get_page_by_path(self::PORTAL_SLUG);
        if ($existing) {
            return; // Already exists
        }

        $page_id = wp_insert_post([
            'post_title'   => 'E-CARE Clinical Portal',
            'post_name'    => self::PORTAL_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '',
            'meta_input'   => [
                '_wp_page_template' => self::PORTAL_TEMPLATE_FILE,
            ],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            // Store the page ID for later reference
            update_option('ecare_portal_page_id', $page_id);
        }
    }

    /**
     * Called on plugin deactivation. Deletes the generated portal page.
     */
    public static function delete_portal_page() {
        $page_id = get_option('ecare_portal_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_portal_page_id');
        }
    }

    /* ── REST API: Registration Request ─────────────────────────────────── */

    public function register_rest_routes() {
        register_rest_route('ecare/v1', '/login', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_login'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('ecare/v1', '/firebase-login', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_firebase_login'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('ecare/v1', '/register', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_registration'],
            'permission_callback' => '__return_true', // Public endpoint
            'args'                => [
                'name'       => ['required' => true,  'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'email'      => ['required' => true,  'type' => 'string', 'sanitize_callback' => 'sanitize_email'],
                'password'   => ['required' => true,  'type' => 'string'],
                'role'       => ['required' => false, 'type' => 'string', 'default' => 'patient', 'enum' => ['patient']],
                'phone'      => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'notes'      => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field'],
                'dob'        => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'gender'     => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'bloodGroup' => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'address'    => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'city'       => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'zip'        => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'middlename' => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        register_rest_route('ecare/v1', '/forgot-password', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_forgot_password'],
            'permission_callback' => '__return_true',
            'args'                => [
                'login' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        register_rest_route('ecare/v1', '/reset-password', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_reset_password'],
            'permission_callback' => '__return_true',
            'args'                => [
                'key'      => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'login'    => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'password' => ['required' => true, 'type' => 'string'],
            ],
        ]);
    }

    public function handle_login(WP_REST_Request $request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');
        $remember = $request->get_param('remember') === true;

        // Rate limiting: 5 attempts per 15 minutes per IP or Username
        if (ecare_is_rate_limited('login_ip', 5) || ecare_is_rate_limited('login_user', 5, strtolower($username))) {
            return new WP_Error('too_many_requests', 'Too many failed login attempts. Please try again in 15 minutes.', ['status' => 429]);
        }

        $credentials = [
            'user_login'    => $username,
            'user_password' => $password,
            'remember'      => $remember,
        ];

        $user = wp_signon($credentials, is_ssl());

        if (is_wp_error($user)) {
            // Increment rate limits on failed attempt
            ecare_increment_rate_limit('login_ip', 900);
            ecare_increment_rate_limit('login_user', 900, strtolower($username));

            $error_code = $user->get_error_code();
            $raw_message = $user->get_error_message();

            // Strip HTML tags and clean up default WP error formatting
            $clean_message = wp_strip_all_tags($raw_message);
            $clean_message = preg_replace('/^Error:\s*/i', '', $clean_message);

            if (in_array($error_code, ['invalid_username', 'invalid_email'])) {
                if (is_email($username)) {
                    $clean_message = sprintf('The email address "%s" is not registered on this site. Please check your email or register a new account.', esc_html($username));
                } else {
                    $clean_message = sprintf('The username "%s" is not registered on this site. Please check your username or register a new account.', esc_html($username));
                }
            } elseif ($error_code === 'incorrect_password') {
                $clean_message = 'The password you entered is incorrect. Please try again or click "Forgot Your Password?" to reset it.';
            }

            return new WP_Error('login_failed', $clean_message, ['status' => 401]);
        }

        // Check if user has an E-CARE role (by role slug OR by ecare_access capability)
        $allowed_roles = ['administrator', 'ecare_admin', 'ecare_doctor', 'ecare_receptionist', 'ecare_staff', 'ecare_patient'];
        $user_roles = (array) $user->roles;
        $has_access = false;

        // Primary check: role slug
        foreach ($user_roles as $role) {
            if (in_array($role, $allowed_roles)) {
                $has_access = true;
                break;
            }
        }

        // Fallback check: ecare_access capability (handles edge cases)
        if (!$has_access && user_can($user->ID, 'ecare_access')) {
            $has_access = true;
        }

        // Auto-fix: subscriber users who registered via E-CARE form got the wrong role
        // because ecare_patient role didn't exist yet when they registered.
        // Detect them by the ecare_approval_status usermeta set during registration.
        if (!$has_access && in_array('subscriber', $user_roles)) {
            $approval_status = get_user_meta($user->ID, 'ecare_approval_status', true);
            if ($approval_status !== '') {
                // This is an E-CARE registered user — ensure roles exist and fix their role
                ECARE_Roles::register_roles();
                $ecare_user = new WP_User($user->ID);
                $ecare_user->set_role('ecare_patient');
                $user_roles = ['ecare_patient'];
                $has_access = true;
            }
        }

        if (!$has_access) {
            ecare_increment_rate_limit('login_ip', 900);
            ecare_increment_rate_limit('login_user', 900, strtolower($username));
            $role_list = implode(', ', $user_roles) ?: 'none';
            return new WP_Error('unauthorized', "You do not have permission to access the E-CARE clinical portal. (Roles: {$role_list})", ['status' => 403]);
        }

        // Check if account is Pending in clinical DB (only for non-admin roles)
        if (!in_array('administrator', $user_roles) && !in_array('ecare_admin', $user_roles)) {
            // Check staff/doctor status
            $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', intval($user->ID));
            if (empty($staff_records)) {
                $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', strval($user->ID));
            }
            if (!empty($staff_records) && ($staff_records[0]->status ?? '') === 'Pending') {
                ecare_increment_rate_limit('login_ip', 900);
                ecare_increment_rate_limit('login_user', 900, strtolower($username));
                return new WP_Error('pending_approval', 'Your account is currently pending administrator approval. Please wait for an admin to activate your profile.', ['status' => 403]);
            }

            // Check care provider status
            $cp_records = ECARE_DB_Client::select_where('ecare_care_providers', 'user_id', intval($user->ID));
            if (empty($cp_records)) {
                $cp_records = ECARE_DB_Client::select_where('ecare_care_providers', 'user_id', strval($user->ID));
            }
            if (!empty($cp_records) && ($cp_records[0]->status ?? '') === 'Pending') {
                ecare_increment_rate_limit('login_ip', 900);
                ecare_increment_rate_limit('login_user', 900, strtolower($username));
                return new WP_Error('pending_approval', 'Your account is currently pending administrator approval. Please wait for an admin to activate your profile.', ['status' => 403]);
            }

            // Check ambulance operator status
            $amb_records = ECARE_DB_Client::select_where('ecare_ambulance', 'user_id', intval($user->ID));
            if (empty($amb_records)) {
                $amb_records = ECARE_DB_Client::select_where('ecare_ambulance', 'user_id', strval($user->ID));
            }
            if (!empty($amb_records) && ($amb_records[0]->status ?? '') === 'Pending') {
                ecare_increment_rate_limit('login_ip', 900);
                ecare_increment_rate_limit('login_user', 900, strtolower($username));
                return new WP_Error('pending_approval', 'Your account is currently pending administrator approval. Please wait for an admin to activate your profile.', ['status' => 403]);
            }
        }

        // Clear rate limits on successful authentication
        ecare_clear_rate_limit('login_ip');
        ecare_clear_rate_limit('login_user', strtolower($username));

        // Log them in (wp_signon already sets cookies)
        wp_set_current_user($user->ID);

        return rest_ensure_response([
            'success'   => true,
            'user_id'   => $user->ID,
            'user'      => $this->format_user_response($user),
            'redirect'  => home_url('/ecare-portal')
        ]);
    }

    public function handle_registration(WP_REST_Request $request) {
        // Honeypot validation
        $honeypot = $request->get_param('middlename');
        if (!empty($honeypot)) {
            return new WP_Error('spam_detected', 'Spam registration detected.', ['status' => 400]);
        }

        // Rate limiting: 3 registrations per hour per IP
        if (ecare_is_rate_limited('register_ip', 3)) {
            return new WP_Error('too_many_requests', 'Too many registration attempts. Please try again in an hour.', ['status' => 429]);
        }

        $name     = $request->get_param('name');
        $email    = $request->get_param('email');
        $password = $request->get_param('password');
        $role     = 'patient'; // Force role to patient for all public signups
        $phone      = $request->get_param('phone') ?: '';
        $notes      = $request->get_param('notes') ?: '';
        $dob        = $request->get_param('dob') ?: '';
        $gender     = $this->normalize_gender_value($request->get_param('gender') ?: '');
        $bloodGroup = $request->get_param('bloodGroup') ?: '';
        $address    = $request->get_param('address') ?: '';
        $city       = $request->get_param('city') ?: '';
        $zip        = $request->get_param('zip') ?: '';

        // Validate email uniqueness
        if (email_exists($email)) {
            return new WP_Error('email_exists', 'An account with this email address already exists.', ['status' => 409]);
        }

        // Validate password strength
        if (strlen($password) < 8) {
            return new WP_Error('weak_password', 'Password must be at least 8 characters.', ['status' => 400]);
        }

        // Ensure all ecare roles exist before assigning (roles may not exist if
        // plugin was installed but not activated via WP admin)
        ECARE_Roles::register_roles();

        // Map role to WP role slug
        $wp_role_map = [
            'doctor'       => 'ecare_doctor',
            'patient'      => 'ecare_patient',
            'receptionist' => 'ecare_receptionist',
        ];
        $wp_role = $wp_role_map[$role] ?? 'ecare_patient';

        // Create the WP user (pending approval — no publish capability)
        $username = sanitize_user(strtolower(str_replace(' ', '.', $name)) . '.' . wp_generate_password(4, false));

        $user_id = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            return new WP_Error('registration_failed', $user_id->get_error_message(), ['status' => 500]);
        }

        // Set display name and assign role
        wp_update_user([
            'ID'           => $user_id,
            'display_name' => $name,
            'role'         => $wp_role,
        ]);

        // Store additional metadata
        update_user_meta($user_id, 'ecare_phone',           $phone);
        update_user_meta($user_id, 'ecare_notes',           $notes);
        update_user_meta($user_id, 'ecare_approval_status', 'approved');  // patients auto-approved on portal signup
        update_user_meta($user_id, 'ecare_registered_at',   current_time('mysql'));
        update_user_meta($user_id, 'ecare_dob',             $dob);
        update_user_meta($user_id, 'ecare_gender',          $gender);
        update_user_meta($user_id, 'ecare_blood_group',     $bloodGroup);
        update_user_meta($user_id, 'ecare_address',         $address);
        update_user_meta($user_id, 'ecare_city',            $city);
        update_user_meta($user_id, 'ecare_zip',             $zip);

        // Auto-create ecare_patients record so they immediately appear in the admin Patients list
        $extra = [
            'dob'        => $dob,
            'gender'     => $gender,
            'bloodGroup' => $bloodGroup,
            'address'    => $address,
            'city'       => $city,
            'zip'        => $zip,
        ];
        $this->ensure_patient_record($user_id, $name, $email, $phone, $extra);

        // Notify admin
        $admin_email = get_option('admin_email');
        $subject     = sprintf('[E-CARE] New %s registration: %s', ucfirst($role), $name);
        $body        = sprintf(
            "A new %s has registered on the E-CARE portal.

" .
            "Name:  %s
Email: %s
Phone: %s
Role:  %s

Notes:
%s

" .
            "Review in E-CARE → Patients.",
            $role, $name, $email, $phone, $role, $notes
        );
        wp_mail($admin_email, $subject, $body);

        // Increment rate limit transient on successful registration
        ecare_increment_rate_limit('register_ip', 3600);

        return rest_ensure_response([
            'success' => true,
            'message' => 'Account created successfully. You can now sign in.',
            'user_id' => $user_id,
        ]);
    }

    public function handle_forgot_password(WP_REST_Request $request) {
        $login = $request->get_param('login');
        if (empty($login)) {
            return new WP_Error('empty_login', 'Please enter a username or email address.', ['status' => 400]);
        }
        
        $user_data = get_user_by('email', $login);
        if (!$user_data) {
            $user_data = get_user_by('login', $login);
        }
        
        if (!$user_data) {
            // Return success even if user not found to prevent user enumeration
            return rest_ensure_response(['success' => true, 'message' => 'If that account exists, a password reset email has been sent.']);
        }
        
        $key = get_password_reset_key($user_data);
        if (is_wp_error($key)) {
            return $key;
        }
        
        $reset_link = ecare_adjust_url(home_url('/ecare-login?action=rp&key=' . $key . '&login=' . rawurlencode($user_data->user_login)));
        
        $site_name = wp_specialchars_decode(get_option('blogname'), ENT_QUOTES);
        $message = __('Someone has requested a password reset for the following account:') . "\r\n\r\n";
        $message .= sprintf(__('Site Name: %s'), $site_name) . "\r\n\r\n";
        $message .= sprintf(__('Username: %s'), $user_data->user_login) . "\r\n\r\n";
        $message .= __('If this was a mistake, just ignore this email and nothing will happen.') . "\r\n\r\n";
        $message .= __('To reset your password, visit the following address:') . "\r\n\r\n";
        $message .= $reset_link . "\r\n";
        
        $title = sprintf(__('[%s] Password Reset'), $site_name);
        
        $mail_sent = wp_mail($user_data->user_email, $title, $message);
        
        if (!$mail_sent) {
            return new WP_Error('mail_failed', 'The email could not be sent. Please contact the site administrator.', ['status' => 500]);
        }
        
        return rest_ensure_response(['success' => true, 'message' => 'If that account exists, a password reset email has been sent.']);
    }

    public function handle_reset_password(WP_REST_Request $request) {
        $key = $request->get_param('key');
        $login = $request->get_param('login');
        $password = $request->get_param('password');
        
        $user = check_password_reset_key($key, $login);
        if (is_wp_error($user)) {
            return new WP_Error('invalid_key', 'The password reset link is invalid or has expired. Please request a new one.', ['status' => 400]);
        }
        
        if (strlen($password) < 8) {
            return new WP_Error('weak_password', 'Password must be at least 8 characters.', ['status' => 400]);
        }
        
        reset_password($user, $password);
        
        return rest_ensure_response(['success' => true, 'message' => 'Your password has been successfully reset.']);
    }

    /* ── Shortcode Renderers ────────────────────────────────────────────── */

    public function render_registration_shortcode() {
        $url = home_url('/' . self::PAGE_SLUG . '#/signup');
        return '<a href="'.esc_url($url).'" class="ecare-portal-btn">Register as Patient/Doctor</a>
                <style>.ecare-portal-btn { background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }</style>';
    }

    public function render_login_shortcode() {
        $url = home_url('/' . self::PAGE_SLUG);
        return '<a href="'.esc_url($url).'" class="ecare-portal-btn">Access Clinical Portal</a>
                <style>.ecare-portal-btn { background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }</style>';
    }

    public function render_booking_shortcode() {
        $url = home_url('/' . self::PAGE_SLUG . '#/signup'); // Booking usually requires login
        return '<a href="'.esc_url($url).'" class="ecare-portal-btn ecare-booking-btn">Book Appointment Now</a>
                <style>.ecare-booking-btn { background: #10b981; }</style>';
    }

    private function verify_firebase_id_token($id_token) {
        if (empty($id_token)) {
            return new WP_Error('invalid_token', 'Firebase ID token is empty.', ['status' => 400]);
        }

        $project_id = get_option('ecare_firebase_project_id', '');
        if (empty($project_id)) {
            return new WP_Error('config_missing', 'Firebase project ID is not configured in E-CARE settings.', ['status' => 500]);
        }

        // Split token into header, payload, signature
        $parts = explode('.', $id_token);
        if (count($parts) !== 3) {
            return new WP_Error('invalid_token', 'Invalid token format.', ['status' => 400]);
        }

        list($header_b64, $payload_b64, $sig_b64) = $parts;

        // Base64Url decode helper
        $b64_decode = function($input) {
            $remainder = strlen($input) % 4;
            if ($remainder) {
                $padlen = 4 - $remainder;
                $input .= str_repeat('=', $padlen);
            }
            return base64_decode(strtr($input, '-_', '+/'));
        };

        $header = json_decode($b64_decode($header_b64), true);
        $payload = json_decode($b64_decode($payload_b64), true);

        if (!$header || !$payload) {
            return new WP_Error('invalid_token', 'Failed to decode token JSON.', ['status' => 400]);
        }

        // Verify claims
        // 1. Check expiration
        if (empty($payload['exp']) || $payload['exp'] < time()) {
            return new WP_Error('token_expired', 'Firebase ID token has expired.', ['status' => 401]);
        }

        // 2. Check issuer
        $expected_iss = "https://securetoken.google.com/{$project_id}";
        if (empty($payload['iss']) || $payload['iss'] !== $expected_iss) {
            return new WP_Error('invalid_issuer', 'Invalid token issuer.', ['status' => 401]);
        }

        // 3. Check audience
        if (empty($payload['aud']) || $payload['aud'] !== $project_id) {
            return new WP_Error('invalid_audience', 'Invalid token audience.', ['status' => 401]);
        }

        // 4. Verify cryptographic signature
        // Fetch public keys from Google
        $cert_res = wp_remote_get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
        if (is_wp_error($cert_res)) {
            return new WP_Error('cert_fetch_failed', 'Failed to fetch Google public certificates.', ['status' => 500]);
        }

        $certs = json_decode(wp_remote_retrieve_body($cert_res), true);
        if (empty($certs) || !is_array($certs)) {
            return new WP_Error('cert_parse_failed', 'Failed to parse Google public certificates.', ['status' => 500]);
        }

        $kid = $header['kid'] ?? '';
        if (empty($kid) || !isset($certs[$kid])) {
            return new WP_Error('invalid_key_id', 'Public key ID matching token kid not found.', ['status' => 401]);
        }

        $pub_key_pem = $certs[$kid];
        $signature = $b64_decode($sig_b64);
        $data_to_verify = $header_b64 . '.' . $payload_b64;

        $ok = openssl_verify($data_to_verify, $signature, $pub_key_pem, OPENSSL_ALGO_SHA256);
        if ($ok !== 1) {
            return new WP_Error('signature_verification_failed', 'Firebase ID token signature verification failed.', ['status' => 401]);
        }

        return $payload; // Return verified claims
    }

    public function handle_firebase_login(WP_REST_Request $request) {
        // Rate limiting: 10 attempts per 15 minutes per IP
        if (ecare_is_rate_limited('fb_login_ip', 10)) {
            return new WP_Error('too_many_requests', 'Too many login attempts. Please try again in 15 minutes.', ['status' => 429]);
        }
        ecare_increment_rate_limit('fb_login_ip', 900);

        $id_token = $request->get_param('idToken');
        $claims = $this->verify_firebase_id_token($id_token);

        if (is_wp_error($claims)) {
            return $claims;
        }

        // Token is verified! Extract values.
        $uid          = $claims['sub'] ?? '';
        $email        = $claims['email'] ?? '';
        $phone_number = $claims['phone_number'] ?? '';
        $name         = $claims['name'] ?? $request->get_param('name') ?? '';

        // If name is still empty, let's derive it or default it
        if (empty($name)) {
            if (!empty($email)) {
                $name = explode('@', $email)[0];
            } elseif (!empty($phone_number)) {
                $name = 'Patient ' . substr($phone_number, -4);
            } else {
                $name = 'Firebase User';
            }
            $name = ucwords(str_replace(['.', '_', '-'], ' ', $name));
        }

        $user = null;

        // 1. Try matching user
        if (!empty($email)) {
            $user = get_user_by('email', $email);
        }

        if (!$user && !empty($phone_number)) {
            // Find user by meta key ecare_phone
            $users = get_users([
                'meta_key'   => 'ecare_phone',
                'meta_value' => $phone_number,
                'number'     => 1,
            ]);
            if (!empty($users)) {
                $user = $users[0];
            }
        }

        // 2. If user exists, log them in
        if ($user) {
            // Ensure they have the correct roles/capabilities
            $user_roles = (array) $user->roles;
            $allowed_roles = ['administrator', 'ecare_admin', 'ecare_doctor', 'ecare_receptionist', 'ecare_staff', 'ecare_patient'];
            $has_access = false;
            foreach ($user_roles as $role) {
                if (in_array($role, $allowed_roles)) {
                    $has_access = true;
                    break;
                }
            }

            if (!$has_access) {
                // If they exist but have no ecare role, auto-assign ecare_patient
                $user->set_role('ecare_patient');
            }

            // Check if doctor/staff/provider/ambulance status is pending approval in DB
            if (!in_array('administrator', $user_roles) && !in_array('ecare_admin', $user_roles)) {
                $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', intval($user->ID));
                if (empty($staff_records)) $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', strval($user->ID));
                if (!empty($staff_records) && ($staff_records[0]->status ?? '') === 'Pending') {
                    return new WP_Error('pending_approval', 'Your account is currently pending administrator approval.', ['status' => 403]);
                }
                $cp_records = ECARE_DB_Client::select_where('ecare_care_providers', 'user_id', intval($user->ID));
                if (empty($cp_records)) $cp_records = ECARE_DB_Client::select_where('ecare_care_providers', 'user_id', strval($user->ID));
                if (!empty($cp_records) && ($cp_records[0]->status ?? '') === 'Pending') {
                    return new WP_Error('pending_approval', 'Your account is currently pending administrator approval.', ['status' => 403]);
                }
                $amb_records = ECARE_DB_Client::select_where('ecare_ambulance', 'user_id', intval($user->ID));
                if (empty($amb_records)) $amb_records = ECARE_DB_Client::select_where('ecare_ambulance', 'user_id', strval($user->ID));
                if (!empty($amb_records) && ($amb_records[0]->status ?? '') === 'Pending') {
                    return new WP_Error('pending_approval', 'Your account is currently pending administrator approval.', ['status' => 403]);
                }
            }

            // Log user in
            wp_set_current_user($user->ID);
            wp_set_auth_cookie($user->ID, true);

            // Sync/Verify ecare_patients record exists for patients
            if (in_array('ecare_patient', (array)$user->roles)) {
                $extra = [
                    'gender'     => $this->normalize_gender_value($request->get_param('gender') ?? ''),
                    'dob'        => sanitize_text_field($request->get_param('dob') ?? ''),
                    'bloodGroup' => sanitize_text_field($request->get_param('bloodGroup') ?? ''),
                    'address'    => sanitize_text_field($request->get_param('address') ?? ''),
                    'city'       => sanitize_text_field($request->get_param('city') ?? ''),
                    'zip'        => sanitize_text_field($request->get_param('zip') ?? ''),
                ];
                $this->ensure_patient_record($user->ID, $name, $email ?: ($phone_number . '@e-care.local'), $phone_number, $extra);
            }

            return rest_ensure_response([
                'success'   => true,
                'user_id'   => $user->ID,
                'user'      => $this->format_user_response($user),
                'redirect'  => home_url('/ecare-portal')
            ]);
        }

        // 3. If user doesn't exist, auto-register them as ecare_patient (since patient role is self-registering anyway)
        ECARE_Roles::register_roles();

        // Generate username
        $base_username = !empty($email) ? explode('@', $email)[0] : 'phone_' . substr($phone_number, -4);
        $username = sanitize_user(strtolower($base_username) . '.' . wp_generate_password(4, false));
        $dummy_email = !empty($email) ? $email : 'phone_' . substr($phone_number, -4) . '_' . wp_generate_password(4, false) . '@e-care.local';

        $password = wp_generate_password(16, false);
        $user_id = wp_create_user($username, $password, $dummy_email);

        if (is_wp_error($user_id)) {
            return new WP_Error('registration_failed', $user_id->get_error_message(), ['status' => 500]);
        }

        // Assign name and patient role
        wp_update_user([
            'ID'           => $user_id,
            'display_name' => $name,
            'role'         => 'ecare_patient',
        ]);

        // Metadata
        update_user_meta($user_id, 'ecare_phone',           $phone_number);
        update_user_meta($user_id, 'ecare_approval_status', 'approved');
        update_user_meta($user_id, 'ecare_registered_at',   current_time('mysql'));

        // Extra metadata if provided during Phone/Google Signup
        $extra = [
            'gender'     => $this->normalize_gender_value($request->get_param('gender') ?? ''),
            'dob'        => sanitize_text_field($request->get_param('dob') ?? ''),
            'bloodGroup' => sanitize_text_field($request->get_param('bloodGroup') ?? ''),
            'address'    => sanitize_text_field($request->get_param('address') ?? ''),
            'city'       => sanitize_text_field($request->get_param('city') ?? ''),
            'zip'        => sanitize_text_field($request->get_param('zip') ?? ''),
        ];

        // Auto-create in patients collection
        $this->ensure_patient_record($user_id, $name, $dummy_email, $phone_number, $extra);

        // Log user in
        wp_set_current_user($user_id);
        wp_set_auth_cookie($user_id, true);

        return rest_ensure_response([
            'success'   => true,
            'user_id'   => $user_id,
            'user'      => $this->format_user_response($user_id),
            'redirect'  => home_url('/ecare-portal')
        ]);
    }

    /**
     * Formats a WordPress user into the E-CARE standardized user profile object.
     */
    public function format_user_response($user) {
        if (is_numeric($user)) {
            $user = get_user_by('id', intval($user));
        }
        if (!$user || !is_a($user, 'WP_User')) {
            return null;
        }

        $ecare_role = class_exists('ECARE_Roles') ? ECARE_Roles::get_ecare_role($user) : 'patient';
        $user_data = [
            'id'        => $user->ID,
            'name'      => $user->display_name ?: $user->user_login,
            'email'     => $user->user_email,
            'ecareRole' => $ecare_role,
            'wpRoles'   => (array) $user->roles,
            'phone'     => get_user_meta($user->ID, 'ecare_phone', true) ?: '',
            'avatar'    => get_avatar_url($user->ID),
        ];

        $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', intval($user->ID));
        if (empty($patient_records)) {
            $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', strval($user->ID));
        }
        $patient_record = !empty($patient_records) ? $patient_records[0] : null;
        if ($patient_record) {
            if (!empty($patient_record->phone))   $user_data['phone']   = $patient_record->phone;
            if (!empty($patient_record->address)) $user_data['address'] = $patient_record->address;
            if (!empty($patient_record->avatar))  $user_data['avatar']  = $patient_record->avatar;
        }

        return $user_data;
    }

    /**
     * Ensures a patient record exists in the DB.
     * Creates one if not found, using data from the WordPress user.
     */
    private function ensure_patient_record($user_id, $name, $email, $phone, $extra = []) {
        $patients = ECARE_DB_Client::select_where('ecare_patients', 'user_id', intval($user_id));
        if (empty($patients)) {
            $patients = ECARE_DB_Client::select_where('ecare_patients', 'user_id', strval($user_id));
        }

        if (empty($patients)) {
            ECARE_DB_Client::insert('ecare_patients', [
                'user_id'    => intval($user_id),
                'name'       => $name,
                'email'      => $email,
                'phone'      => $phone,
                'gender'     => $extra['gender'] ?? '',
                'dob'        => $extra['dob'] ?? '',
                'bloodGroup' => $extra['bloodGroup'] ?? '',
                'address'    => $extra['address'] ?? '',
                'city'       => $extra['city'] ?? '',
                'zip'        => $extra['zip'] ?? '',
                'created_at' => current_time('mysql', 1)
            ], intval($user_id));
        }
    }

    /**
     * Normalizes gender values into the canonical patient format.
     */
    private function normalize_gender_value($gender) {
        $gender = strtoupper(trim(sanitize_text_field((string) $gender)));

        $map = [
            'MALE'   => 'MALE',
            'FEMALE' => 'FEMALE',
            'OTHER'  => 'OTHER',
            'M'      => 'MALE',
            'F'      => 'FEMALE',
            'MAN'    => 'MALE',
            'WOMAN'  => 'FEMALE',
        ];

        return $map[$gender] ?? '';
    }
}
