<?php
/**
 * Plugin Name: E-CARE Management System
 * Description: A massive clinic management system with full style isolation and custom high-performance database.
 * Version: 1.0.0
 * Author: Sakhawat Hossain
 * Text Domain: e-care-management
 */

if (!defined('ABSPATH')) {
    exit;
}

// Prevent PHP deprecation notices (e.g. from Hostinger WP_DEBUG / PHP 8.1+) from polluting WordPress activation output buffer
if (defined('WP_SANDBOX_SCRAPING') && WP_SANDBOX_SCRAPING) {
    @ini_set('display_errors', '0');
}

define('ECARE_PATH', plugin_dir_path(__FILE__));

// Dynamic URL detection to prevent CORS issues (e.g. dynamic/different ports in local dev)
$ecare_url = plugin_dir_url(__FILE__);
if (!empty($_SERVER['HTTP_HOST'])) {
    $parsed_url = parse_url($ecare_url);
    if (is_array($parsed_url) && !empty($parsed_url['path'])) {
        $scheme = is_ssl() ? 'https' : 'http';
        $ecare_url = $scheme . '://' . $_SERVER['HTTP_HOST'] . $parsed_url['path'];
    }
}
define('ECARE_URL', $ecare_url);

if (!function_exists('ecare_adjust_url')) {
    function ecare_adjust_url($url) {
        if (empty($url) || !is_string($url)) return $url;
        if (!empty($_SERVER['HTTP_HOST'])) {
            $parsed = parse_url($url);
            if (is_array($parsed)) {
                $scheme = is_ssl() ? 'https' : 'http';
                $path = $parsed['path'] ?? '';
                $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
                $fragment = isset($parsed['fragment']) ? '#' . $parsed['fragment'] : '';
                $url = $scheme . '://' . $_SERVER['HTTP_HOST'] . $path . $query . $fragment;
            }
        }
        return $url;
    }
}

if (!function_exists('ecare_get_container_width')) {
    function ecare_get_container_width() {
        $width = 1140;
        $opt_width = get_option('elementor_container_width');
        if (!empty($opt_width)) {
            return (int) $opt_width;
        }
        $active_kit_id = get_option('elementor_active_kit');
        if ($active_kit_id) {
            $kit_settings = get_post_meta($active_kit_id, '_elementor_page_settings', true);
            if (is_array($kit_settings)) {
                if (!empty($kit_settings['container_width'])) {
                    if (is_array($kit_settings['container_width'])) {
                        return (int) ($kit_settings['container_width']['size'] ?? $width);
                    }
                    return (int) $kit_settings['container_width'];
                }
            }
        }
        return $width;
    }
}

if (!function_exists('ecare_get_client_settings')) {
    function ecare_get_client_settings($settings, $include_sensitive = false) {
        if (!is_array($settings)) {
            $settings = array();
        }

        if (!empty($settings['agoraAppCertificate']) || !empty(get_option('ecare_agora_app_certificate', ''))) {
            $settings['hasAgoraAppCertificate'] = true;
        }
        unset(
            $settings['agoraAppCertificate'],
            $settings['ecare_agora_app_certificate']
        );

        if (!$include_sensitive) {
            unset(
                $settings['dailyApiKey'],
                $settings['licenseKey'],
                $settings['supabaseUrl'],
                $settings['supabaseAnonKey']
            );
        }

        return $settings;
    }
}

if (!function_exists('ecare_get_client_ip')) {
    function ecare_get_client_ip() {
        $ip = '127.0.0.1';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return sanitize_text_field(trim($ip));
    }
}

if (!function_exists('ecare_is_rate_limited')) {
    function ecare_is_rate_limited($action, $limit = 5, $identifier = '') {
        $ip = ecare_get_client_ip();
        $key_source = $action . '_' . $ip;
        if (!empty($identifier)) {
            $key_source .= '_' . $identifier;
        }
        $transient_key = 'ecare_rate_' . md5($key_source);
        $attempts = (int) get_transient($transient_key);
        return $attempts >= $limit;
    }
}

if (!function_exists('ecare_increment_rate_limit')) {
    function ecare_increment_rate_limit($action, $period = 900, $identifier = '') {
        $ip = ecare_get_client_ip();
        $key_source = $action . '_' . $ip;
        if (!empty($identifier)) {
            $key_source .= '_' . $identifier;
        }
        $transient_key = 'ecare_rate_' . md5($key_source);
        $attempts = (int) get_transient($transient_key);
        set_transient($transient_key, $attempts + 1, $period);
    }
}

if (!function_exists('ecare_clear_rate_limit')) {
    function ecare_clear_rate_limit($action, $identifier = '') {
        $ip = ecare_get_client_ip();
        $key_source = $action . '_' . $ip;
        if (!empty($identifier)) {
            $key_source .= '_' . $identifier;
        }
        $transient_key = 'ecare_rate_' . md5($key_source);
        delete_transient($transient_key);
    }
}

if (!function_exists('ecare_get_clean_payment_method_label')) {
    function ecare_get_clean_payment_method_label($method_key_or_title = '', $order = null) {
        $raw = trim((string)$method_key_or_title);

        if ($order && is_a($order, 'WC_Order')) {
            $wc_title = trim((string)$order->get_payment_method_title());
            if (!empty($wc_title) && strtolower($wc_title) !== 'woocommerce') {
                $raw = $wc_title;
            } elseif (empty($raw)) {
                $raw = trim((string)$order->get_payment_method());
            }
        }

        if (empty($raw)) {
            return 'Online Payment';
        }

        // Direct exact match checks first
        $lower_raw = strtolower($raw);
        $direct_map = [
            'woo_bkash'            => 'bKash',
            'bkash'                => 'bKash',
            'woo_rocket'           => 'Rocket',
            'rocket'               => 'Rocket',
            'woo_nagad'            => 'Nagad',
            'nagad'                => 'Nagad',
            'woo_upay'             => 'Upay',
            'upay'                 => 'Upay',
            'cod'                  => 'Cash on Delivery',
            'cash on delivery'     => 'Cash on Delivery',
            'bacs'                 => 'Bank Transfer',
            'direct bank transfer' => 'Bank Transfer',
            'bank transfer'        => 'Bank Transfer',
            'cheque'               => 'Cheque',
            'check payments'       => 'Cheque',
            'cash'                 => 'Cash',
            'credit'               => 'Credit',
            'stripe'               => 'Stripe / Card',
            'paypal'               => 'PayPal',
            'sslcommerz'           => 'SSLCommerz',
            'amarpay'              => 'Aamarpay',
            'aamarpay'             => 'Aamarpay',
            'razorpay'             => 'Razorpay',
            'shurjopay'            => 'Shurjopay',
            'woocommerce'          => 'Online Payment',
            'woocommerce gateway'  => 'Online Payment',
        ];

        if (isset($direct_map[$lower_raw])) {
            return $direct_map[$lower_raw];
        }

        // Clean prefix like "WooCommerce - bKash", "woo_bkash", "WooCommerce bKash", "WC bKash"
        $cleaned = preg_replace('/^(woocommerce|woo_|woocommerce_|wc_)\s*[-_:]?\s*/i', '', $raw);
        $cleaned = trim($cleaned);

        $lower_cleaned = strtolower($cleaned);
        if (isset($direct_map[$lower_cleaned])) {
            return $direct_map[$lower_cleaned];
        }

        if (empty($cleaned) || $lower_cleaned === 'woocommerce' || $lower_cleaned === 'woocommerce gateway') {
            return 'Online Payment';
        }

        // If it looks like an identifier with underscores/dashes (e.g. "city_bank"), convert to title case
        if (strpos($cleaned, '_') !== false || strpos($cleaned, '-') !== false) {
            return ucwords(str_replace(['_', '-'], ' ', $cleaned));
        }

        return $cleaned;
    }
}

if (!function_exists('ecare_is_ecare_page')) {
    function ecare_is_ecare_page($post_obj = null) {
        if (!$post_obj) {
            global $post;
            $post_obj = $post;
        }
        if (!$post_obj) {
            return false;
        }

        // Check by slug
        $slugs = [
            'ecare-portal', 
            'ecare-login', 
            'ecare-registration', 
            'ecare-doctors', 
            'ecare-ambulance-booking', 
            'ecare-lab-booking', 
            'ecare-care-provider-booking',
            'ecare-cart',
            'checkout-cart',
            'cart'
        ];
        if (in_array($post_obj->post_name, $slugs, true)) {
            return true;
        }

        // Check by shortcodes
        if (!empty($post_obj->post_content)) {
            $shortcodes = [
                'ecare_doctors', 
                'ecare_registration', 
                'ecare_login_form', 
                'ecare_booking', 
                'ecare_ambulance_booking', 
                'ecare_lab_booking', 
                'ecare_care_provider_booking', 
                'ecare_instant_booking', 
                'ecare_cart_page',
                'ecare_cart'
            ];
            foreach ($shortcodes as $shortcode) {
                if (has_shortcode($post_obj->post_content, $shortcode)) {
                    return true;
                }
            }
        }

        return false;
    }
}

// Core includes with safe file path resolution
$ecare_core_files = [
    'includes/class-ecare-db.php',
    'includes/class-ecare-db-client.php',
    'includes/class-ecare-roles.php',
    'includes/class-ecare-auth.php',
    'includes/class-ecare-registration.php',
    'includes/class-ecare-instant-booking.php',
    'includes/class-ecare-cart-page.php',
    'includes/class-ecare-doctors-page.php',
    'includes/class-ecare-ambulance-booking.php',
    'includes/class-ecare-lab-booking.php',
    'includes/class-ecare-care-provider-booking.php',
    'includes/services/class-ecare-agora-service.php',
    'includes/class-ecare-api.php',
    'includes/class-ecare-elementor.php',
    'includes/class-ecare-setup.php',
    'includes/class-ecare-reminders.php',
    'includes/class-ecare-appointment-lifecycle.php',
    'includes/class-ecare-floating-widget.php',
    'includes/class-ecare-privacy.php',
];

foreach ($ecare_core_files as $file) {
    $path = ECARE_PATH . $file;
    if (file_exists($path)) {
        require_once $path;
    } else {
        $matches = glob(ECARE_PATH . '*/' . $file);
        if (!empty($matches) && file_exists($matches[0])) {
            require_once $matches[0];
        }
    }
}


class ECARE_Management_System {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        register_activation_hook(__FILE__,   [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);

        add_action('admin_menu',             [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts',  [$this, 'enqueue_admin_assets']);
        add_action('wp_enqueue_scripts',     [$this, 'enqueue_frontend_assets']);
        add_filter('script_loader_tag', [$this, 'add_module_type_to_script'], 10, 3);
        add_filter('option_ecare_settings', [$this, 'force_woocommerce_settings']);

        // Auto-apply any new DB columns on every admin load (idempotent, safe to run repeatedly)
        add_action('admin_init', ['ECARE_DB', 'ensure_columns_exist']);

        // Auto-create any new tables when DB version changes
        add_action('init', ['ECARE_DB', 'maybe_upgrade']);

        // Sync role capabilities for all existing users on every admin load
        add_action('admin_init', ['ECARE_Roles', 'sync_existing_role_caps']);

        // Auto-create Portal page if it does not exist
        add_action('admin_init', ['ECARE_Auth', 'create_portal_page']);

        // Enforce hide_title for existing E-CARE pages
        add_action('admin_init', [$this, 'enforce_hide_title_on_existing_pages']);

        // Initialize REST API & auth page
        new ECARE_API();
        new ECARE_Auth();
        new ECARE_Registration();
        new ECARE_InstantBooking();
        new ECARE_CartPage();
        new ECARE_DoctorsPage();
        new ECARE_AmbulanceBooking();
        new ECARE_LabBooking();
        new ECARE_CareProviderBooking();
        new ECARE_Setup();
        new ECARE_Reminders();
        new ECARE_AppointmentLifecycle();
        new ECARE_FloatingWidget();
        new ECARE_Privacy();

        // Ensure new roles are synchronized
        add_action('init', ['ECARE_Roles', 'register_roles']);

        // Hide WP Admin Bar for all clinical users
        add_filter('show_admin_bar', [$this, 'should_show_admin_bar']);

        // Prevent caching on E-CARE frontend pages
        add_action('template_redirect', [$this, 'disable_caching_for_ecare_pages']);

        // Clear E-CARE local storage cart on WooCommerce thank you page
        add_action('wp_footer', [$this, 'clear_ecare_cart_on_thankyou']);

        // Hide page titles dynamically on E-CARE pages
        add_filter('body_class', [$this, 'add_ecare_body_class']);
        add_action('wp_head', [$this, 'hide_ecare_page_titles_css']);
        add_action('save_post_page', [$this, 'enforce_hide_title_meta'], 10, 3);
    }

    /**
     * Add body class for E-CARE pages so CSS can target them.
     */
    public function add_ecare_body_class($classes) {
        if (ecare_is_ecare_page()) {
            $classes[] = 'ecare-plugin-page-active';
        }
        return $classes;
    }

    public function hide_ecare_page_titles_css() {
        if (ecare_is_ecare_page()) {
            echo '<style id="ecare-hide-title-css">

                /* ── 1. Hide page titles ─────────────────────────────────── */
                body.ecare-plugin-page-active .entry-title,
                body.ecare-plugin-page-active .page-header,
                body.ecare-plugin-page-active .elementor-page-title,
                body.ecare-plugin-page-active header.entry-header,
                body.ecare-plugin-page-active .page-title-wrap {
                    display: none !important;
                }

                /* ── 2. Strip ONLY top/bottom spacing from theme wrappers ── */
                /*    NEVER reset left/right — that collapses the layout.     */

                /* WordPress core */
                body.ecare-plugin-page-active #primary,
                body.ecare-plugin-page-active #content,
                body.ecare-plugin-page-active #main,
                body.ecare-plugin-page-active .site-content,
                body.ecare-plugin-page-active .content-area,
                body.ecare-plugin-page-active article.page,
                body.ecare-plugin-page-active .entry-content,
                body.ecare-plugin-page-active .post-content {
                    margin-top:    0 !important;
                    margin-bottom: 0 !important;
                    padding-top:   0 !important;
                    padding-bottom: 0 !important;
                }

                /* Astra theme */
                body.ecare-plugin-page-active .ast-article-post,
                body.ecare-plugin-page-active .ast-page-builder-template,
                body.ecare-plugin-page-active .ast-inner-page-builder,
                body.ecare-plugin-page-active .ast-separate-container,
                body.ecare-plugin-page-active #ast-content-id {
                    margin-top:    0 !important;
                    margin-bottom: 0 !important;
                    padding-top:   0 !important;
                    padding-bottom: 0 !important;
                }

                /* GeneratePress */
                body.ecare-plugin-page-active .inside-article,
                body.ecare-plugin-page-active .inside-page-hero {
                    margin-top:    0 !important;
                    margin-bottom: 0 !important;
                    padding-top:   0 !important;
                    padding-bottom: 0 !important;
                }

                /* OceanWP */
                body.ecare-plugin-page-active .site-main {
                    margin-top:    0 !important;
                    margin-bottom: 0 !important;
                    padding-top:   0 !important;
                    padding-bottom: 0 !important;
                }

                /* ── 3. Desktop @media overrides (top/bottom only) ─────── */
                @media (min-width: 921px) {
                    body.ecare-plugin-page-active #primary,
                    body.ecare-plugin-page-active #content {
                        margin-top:    0 !important;
                        margin-bottom: 0 !important;
                        padding-top:   0 !important;
                        padding-bottom: 0 !important;
                    }
                }

                @media (min-width: 1200px) {
                    body.ecare-plugin-page-active.ast-plain-container.ast-no-sidebar #primary,
                    body.ecare-plugin-page-active #primary {
                        margin-top:    0 !important;
                        margin-bottom: 0 !important;
                    }
                }

            </style>';
        }
    }

    /**
     * Enforce Elementor hide_title meta when an E-CARE page is saved.
     */
    public function enforce_hide_title_meta($post_id, $post, $update) {
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (ecare_is_ecare_page($post)) {
            $settings = get_post_meta($post_id, '_elementor_page_settings', true);
            if (!is_array($settings)) {
                $settings = [];
            }
            $settings['hide_title'] = 'yes';
            update_post_meta($post_id, '_elementor_page_settings', $settings);
        }
    }

    /**
     * One-time sweep to apply hide_title to existing pages.
     */
    public function enforce_hide_title_on_existing_pages() {
        if (get_option('ecare_hide_titles_enforced_v2')) {
            return;
        }

        $slugs = [
            'ecare-portal', 
            'ecare-login', 
            'ecare-registration', 
            'ecare-doctors', 
            'ecare-ambulance-booking', 
            'ecare-lab-booking', 
            'ecare-care-provider-booking',
            'ecare-cart',
            'checkout-cart',
            'cart'
        ];

        foreach ($slugs as $slug) {
            $page = get_page_by_path($slug);
            if ($page) {
                $settings = get_post_meta($page->ID, '_elementor_page_settings', true);
                if (!is_array($settings)) $settings = [];
                $settings['hide_title'] = 'yes';
                update_post_meta($page->ID, '_elementor_page_settings', $settings);
            }
        }

        update_option('ecare_hide_titles_enforced_v2', time());
    }

    /**
     * Hide the WP Admin bar for any user recognized by the E-CARE system.
     */
    public function should_show_admin_bar($show) {
        if (ECARE_Roles::get_ecare_role() !== 'none') {
            return false;
        }
        return $show;
    }

    /**
     * Block /wp-admin access for clinical roles (Doctor, Patient, Staff).
     * This keeps users within the E-CARE ecosystem.
     */
    public function restrict_admin_access() {
        if (defined('DOING_AJAX') && DOING_AJAX) {
            return;
        }

        $role = ECARE_Roles::get_ecare_role();
        // If they are an E-CARE role (Doctor, Patient, Staff, Receptionist), restrict them completely from wp-admin and send to frontend portal
        if (in_array($role, ['doctor', 'patient', 'staff', 'receptionist'])) {
            wp_redirect(home_url('/ecare-portal'));
            exit;
        }
    }

    public function add_module_type_to_script($tag, $handle, $src) {
        if ('ecare-react-app' === $handle) {
            $tag = '<script type="module" src="' . esc_url($src) . '"></script>' . "\n";
        }
        return $tag;
    }

    /**
     * Set cache control headers and define DONOTCACHEPAGE for all E-CARE clinical portal pages
     * and shortcode-embedded pages to prevent conflicts with caching plugins like LiteSpeed Cache.
     */
    public function disable_caching_for_ecare_pages() {
        global $post;

        $is_ecare = false;

        // Check if we are on one of the created ecare pages by slug
        if (is_page() && $post) {
            $slugs = [
                'ecare-portal', 
                'ecare-login', 
                'ecare-registration', 
                'ecare-doctors', 
                'ecare-ambulance-booking', 
                'ecare-lab-booking', 
                'ecare-care-provider-booking'
            ];
            if (in_array(get_post_field('post_name', $post), $slugs, true)) {
                $is_ecare = true;
            }
        }

        // Also check if post content contains any of our shortcodes
        if ($post && !empty($post->post_content)) {
            $shortcodes = [
                'ecare_doctors', 
                'ecare_registration', 
                'ecare_login_form', 
                'ecare_booking', 
                'ecare_ambulance_booking', 
                'ecare_lab_booking', 
                'ecare_care_provider_booking', 
                'ecare_instant_booking', 
                'ecare_cart_page'
            ];
            foreach ($shortcodes as $shortcode) {
                if (has_shortcode($post->post_content, $shortcode)) {
                    $is_ecare = true;
                    break;
                }
            }
        }

        if ($is_ecare) {
            if (!defined('DONOTCACHEPAGE')) {
                define('DONOTCACHEPAGE', true);
            }

            // Prevent caching headers for LiteSpeed & other caching plugins
            nocache_headers();

            // LiteSpeed Cache specific force no cache action
            do_action('litespeed_control_force_nocache');

            // Set direct header for LiteSpeed Web Server
            header('X-LiteSpeed-Cache-Control: no-cache');
        }
    }

    /* ── Lifecycle ────────────────────────────────────────────────────── */

    public function activate() {
        try {
            ECARE_DB::create_tables();
            ECARE_Roles::register_roles();
            ECARE_Reminders::activate();
            ECARE_AppointmentLifecycle::activate();
            ECARE_Auth::create_login_page();
            ECARE_Auth::create_portal_page();
            ECARE_Registration::create_registration_page();
            ECARE_AmbulanceBooking::create_ambulance_booking_page();
            ECARE_LabBooking::create_lab_booking_page();
            ECARE_CareProviderBooking::create_care_provider_booking_page();
            flush_rewrite_rules();
        } catch (\Throwable $e) {
            $err_msg = "E-CARE Activation Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine();
            if (defined('WP_CONTENT_DIR')) {
                @file_put_contents(WP_CONTENT_DIR . '/uploads/ecare_activation_error.log', $err_msg . "\n" . $e->getTraceAsString());
            }
            wp_die('<div style="padding:20px;background:#fff5f5;border:1px solid #ffc1c1;color:#a94442;font-family:sans-serif;"><strong>' . esc_html($err_msg) . '</strong><pre>' . esc_html($e->getTraceAsString()) . '</pre></div>');
        }
    }

    public function deactivate() {
        ECARE_Roles::remove_roles();
        ECARE_Reminders::deactivate();
        ECARE_AppointmentLifecycle::deactivate();
        ECARE_Auth::delete_login_page();
        ECARE_Auth::delete_portal_page();
        ECARE_Registration::delete_registration_page();
        ECARE_AmbulanceBooking::delete_ambulance_booking_page();
        ECARE_LabBooking::delete_lab_booking_page();
        ECARE_CareProviderBooking::delete_care_provider_booking_page();
        flush_rewrite_rules();
    }

    /* ── Admin Menu ───────────────────────────────────────────────────── */

    public function add_admin_menu() {
        // Only users with ecare_access (or WP admin) can see the menu
        $capability = current_user_can('manage_options') ? 'manage_options' : 'ecare_access';

        add_menu_page(
            'E-CARE',
            'E-CARE',
            $capability,
            'e-care-management',
            [$this, 'render_admin_page'],
            'dashicons-building',
            2
        );
    }

    public function render_admin_page() {
        // Hard block anyone without access
        if (!ECARE_Roles::current_user_can_access()) {
            wp_die(__('You do not have permission to access the E-CARE system.', 'e-care-management'));
        }

        echo '<div id="ecare-admin-root"></div>';

        // Hide WP Admin UI for full-screen experience
        ?>
        <style>
            #adminmenuback, #adminmenuwrap, #wpadminbar, #wpfooter {
                display: none !important;
            }
            #wpcontent, #wpbody-content {
                margin-left: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100vh !important;
            }
            #wpbody { padding-top: 0 !important; }
            html.wp-toolbar { padding-top: 0 !important; }
            #wpbody-content > div:not(#ecare-admin-root) { display: none !important; }
        </style>
        <?php
    }

    /* ── Asset Enqueue ────────────────────────────────────────────────── */

    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_e-care-management') {
            return;
        }

        // Prevent conflicts
        wp_dequeue_script('svg-painter');
        wp_dequeue_script('heartbeat');
        wp_enqueue_media();

        $settings = get_option('ecare_settings', []);

        $manifest_path = ECARE_PATH . 'dist/.vite/manifest.json';

        if (!file_exists($manifest_path)) {
            echo '<div class="notice notice-warning"><p>Please run <code>npm run build</code> to generate the E-CARE assets.</p></div>';
            return;
        }

        $manifest  = json_decode(file_get_contents($manifest_path), true);
        $entry_key = 'src/main.jsx';

        if (!isset($manifest[$entry_key])) {
            return;
        }

        $js_file  = $manifest[$entry_key]['file'];
        
        // Collect all CSS from entry and its imports
        $css_files = $manifest[$entry_key]['css'] ?? [];
        if (isset($manifest[$entry_key]['imports'])) {
            foreach ($manifest[$entry_key]['imports'] as $import_key) {
                if (isset($manifest[$import_key]['css'])) {
                    $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                }
            }
        }

        $css_url = !empty($css_files) ? ECARE_URL . 'dist/' . $css_files[0] : '';

        wp_enqueue_style('ecare-google-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap', [], null);

        wp_enqueue_script('ecare-react-app', ECARE_URL . 'dist/' . $js_file, [], time(), true);

        if ($css_url) {
            wp_enqueue_style('ecare-styles', $css_url, [], time());
        }

        /* ── Build user payload ── */
        $current_user = wp_get_current_user();
        $ecare_role   = ECARE_Roles::get_ecare_role($current_user);

        // Fetch granular permissions from staff table
        $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', $current_user->ID);
        $staff_record = !empty($staff_records) ? $staff_records[0] : null;
        $permissions = [];
        if ($staff_record && !empty($staff_record->permissions)) {
            $permissions = is_array($staff_record->permissions) ? $staff_record->permissions : json_decode($staff_record->permissions, true);
        }

        // Gather all ecare_* capabilities the user actually has
        $all_caps   = $current_user->allcaps ?? [];
        $ecare_caps = array_keys(array_filter($all_caps, function($granted, $cap) {
            return $granted && strpos($cap, 'ecare_') === 0;
        }, ARRAY_FILTER_USE_BOTH));

        // Fetch custom avatar from clinical tables to ensure persistence on reload
        $custom_avatar = '';
        if ($ecare_role === 'doctor' || $ecare_role === 'admin' || $ecare_role === 'receptionist' || $ecare_role === 'staff') {
            $custom_avatar = ($staff_record && isset($staff_record->avatar)) ? $staff_record->avatar : '';
        } elseif ($ecare_role === 'patient') {
            $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', $current_user->ID);
            $patient_record = !empty($patient_records) ? $patient_records[0] : null;
            $custom_avatar = ($patient_record && isset($patient_record->avatar)) ? $patient_record->avatar : '';
        }

        $user_data = [
            'id'          => $current_user->ID,
            'name'        => $current_user->display_name,
            'email'       => $current_user->user_email,
            'ecareRole'   => $ecare_role,          // 'admin' | 'doctor' | 'patient' | 'receptionist' | 'none'
            'wpRoles'     => $current_user->roles,
            'caps'        => $ecare_caps,           // array of granted ecare_* caps
            'permissions' => $permissions,          // Array of strings (abilities)
            'avatar'      => !empty($custom_avatar) ? $custom_avatar : get_avatar_url($current_user->ID),
        ];

        // Fetch extra data for specific roles
        if ($ecare_role === 'patient') {
            if (!isset($patient_record)) {
                $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', $current_user->ID);
                $patient_record = !empty($patient_records) ? $patient_records[0] : null;
            }
            if ($patient_record) {
                $user_data['bloodGroup'] = $patient_record->bloodGroup ?? '';
                $user_data['age']        = $patient_record->age ?? '';
                $user_data['gender']     = $patient_record->gender ?? '';
                $user_data['phone']      = $patient_record->phone ?? '';
                $user_data['address']    = $patient_record->address ?? '';
            }
        }

        $wc_gateways = [];
        if (class_exists('WooCommerce')) {
            $available = WC()->payment_gateways->payment_gateways();
            foreach ($available as $id => $gateway) {
                if ($gateway->enabled === 'yes') {
                    $wc_gateways[$id] = [
                        'id'          => $id,
                        'title'       => ecare_get_clean_payment_method_label($gateway->get_title() ?: $id),
                        'description' => $gateway->get_description(),
                        'icon'        => $gateway->get_icon(),
                    ];
                }
            }
        }

        $client_settings = is_array($settings) ? $settings : [];
        if (!empty($client_settings['agoraAppCertificate']) || !empty(get_option('ecare_agora_app_certificate', ''))) {
            $client_settings['hasAgoraAppCertificate'] = true;
        }
        unset(
            $client_settings['agoraAppCertificate'],
            $client_settings['ecare_agora_app_certificate']
        );
        $can_manage_settings = current_user_can('manage_options') || current_user_can('ecare_manage_settings') || $ecare_role === 'admin';
        if (!$can_manage_settings) {
            unset(
                $client_settings['dailyApiKey'],
                $client_settings['licenseKey'],
                $client_settings['supabaseUrl'],
                $client_settings['supabaseAnonKey']
            );
        }

        wp_localize_script('ecare-react-app', 'ecareConfig', [
            'apiUrl'    => esc_url_raw(ecare_adjust_url(rest_url('ecare/v1/'))),
            'nonce'     => wp_create_nonce('wp_rest'),
            'cssUrl'    => $css_url,
            'baseUrl'   => ecare_adjust_url(admin_url('admin.php?page=e-care-management')),
            'logoutUrl' => ecare_adjust_url(home_url('/ecare-logout')),
            'forgotPasswordUrl' => esc_url_raw(wp_lostpassword_url(ecare_adjust_url(home_url('/ecare-login')))),
            'isSetupCompleted' => get_option('ecare_setup_completed', '') === 'yes',
            'socialLoginEnabled' => (bool) ($settings['socialLoginEnabled'] ?? false),
            'firebaseConfig' => [
                'apiKey'            => $settings['firebaseConfig']['apiKey'] ?? get_option('ecare_firebase_api_key', ''),
                'authDomain'        => $settings['firebaseConfig']['authDomain'] ?? get_option('ecare_firebase_auth_domain', ''),
                'projectId'         => $settings['firebaseConfig']['projectId'] ?? get_option('ecare_firebase_project_id', ''),
                'storageBucket'     => $settings['firebaseConfig']['storageBucket'] ?? get_option('ecare_firebase_storage_bucket', ''),
                'messagingSenderId' => $settings['firebaseConfig']['messagingSenderId'] ?? get_option('ecare_firebase_messaging_sender_id', ''),
                'appId'             => $settings['firebaseConfig']['appId'] ?? get_option('ecare_firebase_app_id', ''),
            ],
            'primaryColor'=> $settings['primaryColor'] ?? get_option('ecare_primary_color', '#1b3b2b'),
            'logo'      => $settings['logo'] ?? esc_url_raw(get_option('ecare_auth_logo', '')),
            'bgImage'   => $settings['bgImage'] ?? esc_url_raw(get_option('ecare_auth_bg_image', '')),
            'siteName'    => $settings['siteName'] ?? get_bloginfo('name'),
            'siteAddress' => $settings['siteAddress'] ?? '32 Doctors Road, City Center',
            'sitePhone'   => $settings['sitePhone'] ?? '+880 1234 567890',
            'siteEmail'   => $settings['siteEmail'] ?? 'info@ecare-management.com',
            'siteWebsite' => $settings['siteWebsite'] ?? 'www.ecare-management.com',
            'user'        => $user_data,
            'settings'    => $client_settings,
            'wcGateways'  => $wc_gateways
        ]);

        // Also expose as ecareAuthConfig so AuthApp.jsx (login/signup page) can read it
        wp_add_inline_script('ecare-react-app', 'window.ecareAuthConfig = window.ecareConfig;', 'after');
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style('ecare-google-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap', [], null);
    }

    public function force_woocommerce_settings($value) {
        if (!is_array($value)) {
            $value = [];
        }
        $is_wc_active = class_exists('WooCommerce');
        $value['woocommerceEnabled'] = $is_wc_active;
        $value['isWooCommerceActive'] = $is_wc_active;

        // Dynamically merge/sync standalone options so that changes made on
        // the native WP Admin Setup page (ecare-setup) are reflected everywhere
        $value['primaryColor'] = get_option('ecare_primary_color', $value['primaryColor'] ?? '#1b3b2b');
        $value['logo']         = get_option('ecare_auth_logo', $value['logo'] ?? '');
        $value['bgImage']      = get_option('ecare_auth_bg_image', $value['bgImage'] ?? '');
        $value['licenseKey']   = get_option('ecare_license_key', $value['licenseKey'] ?? '');

        if (!isset($value['firebaseConfig']) || !is_array($value['firebaseConfig'])) {
            $value['firebaseConfig'] = [];
        }

        $firebase_keys = [
            'apiKey'            => 'ecare_firebase_api_key',
            'authDomain'        => 'ecare_firebase_auth_domain',
            'projectId'         => 'ecare_firebase_project_id',
            'storageBucket'     => 'ecare_firebase_storage_bucket',
            'messagingSenderId' => 'ecare_firebase_messaging_sender_id',
            'appId'             => 'ecare_firebase_app_id',
        ];

        foreach ($firebase_keys as $sub_key => $option_name) {
            $opt_val = get_option($option_name);
            if (!empty($opt_val)) {
                $value['firebaseConfig'][$sub_key] = $opt_val;
            }
        }

        return $value;
    }

    /**
     * Clear E-CARE local storage cart on WooCommerce thank you page.
     */
    public function clear_ecare_cart_on_thankyou() {
        if (function_exists('is_order_received_page') && is_order_received_page()) {
            ?>
            <script type="text/javascript">
                try {
                    const storeData = localStorage.getItem('ecare-storage-v5');
                    if (storeData) {
                        const parsed = JSON.parse(storeData);
                        if (parsed && parsed.state) {
                            parsed.state.cart = [];
                            localStorage.setItem('ecare-storage-v5', JSON.stringify(parsed));
                            window.dispatchEvent(new CustomEvent('ecare_cart_updated', { detail: { cart: [] } }));
                        }
                    }
                } catch (e) {
                    console.error('Failed to clear E-CARE cart on thank you page', e);
                }
            </script>
            <?php
        }
    }
}

ECARE_Management_System::get_instance();
