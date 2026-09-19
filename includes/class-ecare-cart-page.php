<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE Standalone Cart public page:
 *  - Registers the [ecare_cart] shortcode
 *  - Injects CSS to strip the theme container's padding/background/border
 *  - Enqueues the Vite-built React bundle and passes config to the window
 */
class ECARE_CartPage {

    const PAGE_SLUG = 'ecare-cart';

    public function __construct() {
        add_shortcode('ecare_cart', [$this, 'render_shortcode']);
        add_filter('body_class', [$this, 'add_body_class']);

        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_cart_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;

        /* ── CSS: hide page title on cart page ── */
        $output  = '<style>';
        $output .= '
            /* Hide page title / entry header entirely */
            body.ecare-cart-page-active .entry-header,
            body.ecare-cart-page-active .page-header,
            body.ecare-cart-page-active .post-header,
            body.ecare-cart-page-active .entry-title,
            body.ecare-cart-page-active h1.entry-title,
            body.ecare-cart-page-active h1.page-title,
            body.ecare-cart-page-active .page-title-wrap,
            body.ecare-cart-page-active .ast-page-header,
            body.ecare-cart-page-active .inside-page-header,
            body.ecare-cart-page-active .site-header-content {
                display: none !important;
            }
        ';
        $output .= '</style>' . "\n";

        /* ── Root mount point ── */
        $output .= '<div class="ecare-cart-wrapper" style="width:100%;max-width:' . ecare_get_container_width() . 'px;margin:0 auto;padding:0;">';
        $output .= '<div id="ecare-cart-root"></div>';
        $output .= '</div>';

        if (class_exists('WooCommerce')) {
            // Empty wrapper — populated dynamically via admin-ajax after cart items are synced
            $output .= '<div style="display:none !important;" id="ecare-hidden-wc-checkout-wrapper"></div>';
        }

        /* ── Resolve Vite build JS & CSS paths from manifest.json ── */
        $plugin_url    = ECARE_URL;
        $manifest_path = ECARE_PATH . 'dist/.vite/manifest.json';
        $cart_js_file  = '';
        $cart_css_url  = '';

        if (file_exists($manifest_path)) {
            $manifest   = json_decode(file_get_contents($manifest_path), true);
            $cart_entry = $manifest['src/cartPage.jsx'] ?? null;

            if ($cart_entry) {
                $cart_js_file = $cart_entry['file'];

                // Collect all CSS files (entry + imports)
                $css_files = $cart_entry['css'] ?? [];
                if (isset($cart_entry['imports'])) {
                    foreach ($cart_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }

                if (!empty($css_files)) {
                    $cart_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        /* ── Build and pass config to window ── */
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];
        $client_settings = function_exists('ecare_get_client_settings') ? ecare_get_client_settings($settings) : $settings;

        $wc_gateways = [];
        if (class_exists('WooCommerce')) {
            $available = WC()->payment_gateways->payment_gateways();
            foreach ($available as $id => $gateway) {
                if ($gateway->enabled === 'yes') {
                    $wc_gateways[$id] = [
                        'id'          => $id,
                        'title'       => function_exists('ecare_get_clean_payment_method_label') ? ecare_get_clean_payment_method_label($gateway->get_title() ?: $id) : $gateway->get_title(),
                        'description' => $gateway->get_description(),
                        'icon'        => $gateway->get_icon(),
                    ];
                }
            }
        }

        /* ── Build user payload ── */
        $current_user = wp_get_current_user();
        $ecare_role   = ECARE_Roles::get_ecare_role($current_user);

        // Fetch granular permissions from staff table
        $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', $current_user->ID);
        if (empty($staff_records)) {
            $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', (string) $current_user->ID);
        }
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
            if (empty($patient_records)) {
                $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', (string) $current_user->ID);
            }
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
                if (empty($patient_records)) {
                    $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', (string) $current_user->ID);
                }
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

        $config_data = [
            'loginUrl'          => ecare_adjust_url(home_url('/ecare-login')),
            'portalUrl'         => ecare_adjust_url(home_url('/ecare-portal')),
            'adminPortalUrl'    => ecare_adjust_url(admin_url('admin.php?page=e-care-management')),
            'apiUrl'            => esc_url_raw(ecare_adjust_url(rest_url('ecare/v1'))),
            'ajaxUrl'           => esc_url_raw(admin_url('admin-ajax.php')),
            'cartSyncNonce'     => wp_create_nonce('ecare_cart_sync_nonce'),
            'nonce'             => wp_create_nonce('wp_rest'),
            'registerNonce'     => wp_create_nonce('ecare_register'),
            'siteName'          => get_bloginfo('name'),
            'siteUrl'           => home_url(),
            'bgImage'           => esc_url_raw(!empty($settings['bgImage'])   ? $settings['bgImage']   : get_option('ecare_auth_bg_image', '')),
            'logo'              => esc_url_raw(!empty($settings['logo'])      ? $settings['logo']      : get_option('ecare_auth_logo', '')),
            'primaryColor'      => !empty($settings['primaryColor'])          ? $settings['primaryColor'] : get_option('ecare_primary_color', '#1b3b2b'),
            'cssUrl'            => esc_url_raw($cart_css_url),
            'settings'          => $client_settings,
            'wcGateways'        => $wc_gateways,
            'user'              => $user_data,
        ];

        if ($cart_js_file) {
            $output .= '<script>window.ecareConfig = ' . json_encode($config_data) . '; window.ecareAuthConfig = window.ecareConfig;</script>';
            $output .= '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $cart_js_file) . '"></script>';
        }

        return $output;
    }

    public function add_body_class($classes) {
        global $post;
        if ($this->is_rendered || (function_exists('ecare_is_ecare_page') && ecare_is_ecare_page($post))) {
            $classes[] = 'ecare-cart-page-active';
            $classes[] = 'ecare-plugin-page-active';
        }
        return $classes;
    }

    /* ── Auto-create Cart Page ─────────────────────────────────────────── */

    public static function create_cart_page() {
        $existing = get_page_by_path(self::PAGE_SLUG);
        if ($existing) {
            $template = get_post_meta($existing->ID, '_wp_page_template', true);
            if ($template !== 'default' && $template !== '') {
                update_post_meta($existing->ID, '_wp_page_template', 'default');
            }
            if (trim($existing->post_content) === '') {
                wp_update_post([
                    'ID'           => $existing->ID,
                    'post_content' => '[ecare_cart]',
                ]);
            }
            return;
        }

        $page_id = wp_insert_post([
            'post_title'   => 'Checkout Cart',
            'post_name'    => self::PAGE_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '[ecare_cart]',
            'meta_input'   => ['_wp_page_template' => 'default'],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            update_option('ecare_cart_page_id', $page_id);
        }
    }

    public static function delete_cart_page() {
        $page_id = get_option('ecare_cart_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_cart_page_id');
        }
    }
}
