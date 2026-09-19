<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE Standalone Doctors Archive public page:
 *  - Registers the [ecare_doctors] shortcode
 *  - Injects CSS to strip the theme container's padding/background/border
 *  - Enqueues the Vite-built React bundle and passes config to the window
 */
class ECARE_DoctorsPage {

    const PAGE_SLUG = 'ecare-doctors';

    public function __construct() {
        add_shortcode('ecare_doctors', [$this, 'render_shortcode']);
        add_filter('body_class', [$this, 'add_body_class']);

        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_doctors_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;

        /* ── CSS: strip ALL theme spacing & hide page title on doctors page ── */
        $output  = '<style>';
        $output .= '
            /* Core content wrappers */
            body.ecare-doctors-page-active .entry-content,
            body.ecare-doctors-page-active .post-content,
            body.ecare-doctors-page-active .page-content,
            body.ecare-doctors-page-active article,
            body.ecare-doctors-page-active article.page,
            body.ecare-doctors-page-active .hentry,
            body.ecare-doctors-page-active .site-content,
            body.ecare-doctors-page-active #content,
            body.ecare-doctors-page-active #primary,
            body.ecare-doctors-page-active .content-area,
            body.ecare-doctors-page-active main,
            body.ecare-doctors-page-active .site-main,
            body.ecare-doctors-page-active #page,
            body.ecare-doctors-page-active .page-wrapper,
            body.ecare-doctors-page-active .site-inner,
            body.ecare-doctors-page-active .site-wrapper {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            /* Hide page title / entry header entirely */
            body.ecare-doctors-page-active .entry-header,
            body.ecare-doctors-page-active .page-header,
            body.ecare-doctors-page-active .post-header,
            body.ecare-doctors-page-active .entry-title,
            body.ecare-doctors-page-active h1.entry-title,
            body.ecare-doctors-page-active h1.page-title,
            body.ecare-doctors-page-active .page-title-wrap,
            body.ecare-doctors-page-active .ast-page-header,
            body.ecare-doctors-page-active .inside-page-header,
            body.ecare-doctors-page-active .site-header-content {
                display: none !important;
            }
            /* Container / grid classes */
            body.ecare-doctors-page-active .container,
            body.ecare-doctors-page-active .container-fluid,
            body.ecare-doctors-page-active .wp-container,
            body.ecare-doctors-page-active .inner-container,
            body.ecare-doctors-page-active .site-inner {
                padding:   0 !important;
            }
            /* Gutenberg / block editor */
            body.ecare-doctors-page-active .wp-block-group,
            body.ecare-doctors-page-active .wp-block-post-content,
            body.ecare-doctors-page-active .wp-block-group__inner-container,
            body.ecare-doctors-page-active .wp-site-blocks,
            body.ecare-doctors-page-active .wp-block-template-part,
            body.ecare-doctors-page-active .is-layout-constrained,
            body.ecare-doctors-page-active .is-layout-flow,
            body.ecare-doctors-page-active .is-layout-constrained > *:not(.alignwide):not(.alignfull),
            body.ecare-doctors-page-active .wp-block-post,
            body.ecare-doctors-page-active .wp-block-query-loop {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            /* Common theme-specific selectors (Astra, GeneratePress, OceanWP, Kadence, Hello/Elementor) */
            body.ecare-doctors-page-active .ast-container,
            body.ecare-doctors-page-active .ast-article-post,
            body.ecare-doctors-page-active .generate-columns-container,
            body.ecare-doctors-page-active .inside-article,
            body.ecare-doctors-page-active .ocean-container,
            body.ecare-doctors-page-active .oceanwp-container,
            body.ecare-doctors-page-active .kadence-column,
            body.ecare-doctors-page-active .entry-content-wrap,
            body.ecare-doctors-page-active .elementor-section,
            body.ecare-doctors-page-active .elementor-container,
            body.ecare-doctors-page-active .elementor-column-wrap {
                padding:    0 !important;
                background: transparent !important;
            }
            body.ecare-doctors-page-active {
                --ecare-container-width: ' . ecare_get_container_width() . 'px;
            }
            /* Our wrapper */
            body.ecare-doctors-page-active .ecare-doctors-wrapper {
                width:      100% !important;
                max-width:  var(--ecare-container-width, 1180px) !important;
                padding:    0 !important;
                margin:     0 auto !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
        ';
        $output .= '</style>' . "\n";

        /* ── Root mount point ── */
        $output .= '<div class="ecare-doctors-wrapper" style="width:100%;max-width:' . ecare_get_container_width() . 'px;margin:0 auto;padding:0;">';
        $output .= '<div id="ecare-doctors-root"></div>';
        $output .= '</div>';

        // ── JS: forcibly strip padding from every ancestor of our root ──
        $output .= '<script>
        (function() {
            function stripAncestors() {
                var el = document.getElementById("ecare-doctors-root");
                if (!el) return;
                var node = el.parentElement;
                while (node && node !== document.body) {
                    node.style.setProperty("padding",       "0",    "important");
                    node.style.setProperty("padding-top",   "0",    "important");
                    node.style.setProperty("padding-right",  "0",   "important");
                    node.style.setProperty("padding-bottom", "0",   "important");
                    node.style.setProperty("padding-left",   "0",   "important");
                    node.style.setProperty("background",     "transparent","important");
                    node.style.setProperty("border",         "none","important");
                    node.style.setProperty("box-shadow",     "none","important");
                    node = node.parentElement;
                }
            }
            stripAncestors();
            document.addEventListener("DOMContentLoaded", stripAncestors);
            window.addEventListener("load", stripAncestors);
        })();
        </script>' . "\n";

        /* ── Resolve Vite-built assets from manifest ── */
        $manifest_path   = ECARE_PATH . 'dist/.vite/manifest.json';
        $plugin_url      = ECARE_URL;
        $doctors_css_url = '';
        $doctors_js_file = '';

        if (file_exists($manifest_path)) {
            $manifest   = json_decode(file_get_contents($manifest_path), true);
            $doctors_entry = $manifest['src/doctorsPage.jsx'] ?? null;

            if ($doctors_entry) {
                $doctors_js_file = $doctors_entry['file'];

                // Collect all CSS files (entry + imports)
                $css_files = $doctors_entry['css'] ?? [];
                if (isset($doctors_entry['imports'])) {
                    foreach ($doctors_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }

                if (!empty($css_files)) {
                    $doctors_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        /* ── Build and pass config to window ── */
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];
        $client_settings = function_exists('ecare_get_client_settings') ? ecare_get_client_settings($settings) : $settings;

        // If the user is logged in, pass their details
        $user_data = null;
        $current_user = wp_get_current_user();
        if ($current_user->ID) {
            $ecare_role = class_exists('ECARE_Roles') ? ECARE_Roles::get_ecare_role($current_user) : 'patient';
            $user_data = [
                'id'        => $current_user->ID,
                'name'      => $current_user->display_name,
                'email'     => $current_user->user_email,
                'ecareRole' => $ecare_role,
            ];
            $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', $current_user->ID);
            if (empty($patient_records)) {
                $patient_records = ECARE_DB_Client::select_where('ecare_patients', 'user_id', (string) $current_user->ID);
            }
            $patient_record = !empty($patient_records) ? $patient_records[0] : null;
            if ($patient_record) {
                $user_data['phone']   = $patient_record->phone ?? '';
                $user_data['address'] = $patient_record->address ?? '';
                $user_data['avatar']  = $patient_record->avatar ?? '';
            }
        }

        $wc_gateways = [];
        if (class_exists('WooCommerce') && WC()->payment_gateways()) {
            foreach (WC()->payment_gateways()->get_available_payment_gateways() as $gateway_id => $gateway) {
                if ($gateway->enabled === 'yes') {
                    $wc_gateways[$gateway_id] = [
                        'id'          => $gateway->id,
                        'title'       => ecare_get_clean_payment_method_label($gateway->get_title() ?: $gateway_id),
                        'description' => $gateway->get_description(),
                        'icon'        => $gateway->get_icon(),
                    ];
                }
            }
        }

        $config_data = [
            'loginUrl'           => ecare_adjust_url(home_url('/ecare-login')),
            'portalUrl'          => ecare_adjust_url(admin_url('admin.php?page=e-care-management')),
            'cartUrl'            => ecare_adjust_url(home_url('/ecare-cart')),
            'apiUrl'             => esc_url_raw(ecare_adjust_url(rest_url('ecare/v1'))),
            'nonce'              => wp_create_nonce('wp_rest'),
            'registerNonce'      => wp_create_nonce('ecare_register'),
            'siteName'           => get_bloginfo('name'),
            'siteUrl'            => ecare_adjust_url(home_url()),
            'bgImage'            => esc_url_raw(!empty($settings['bgImage'])   ? $settings['bgImage']   : get_option('ecare_auth_bg_image', '')),
            'logo'               => esc_url_raw(!empty($settings['logo'])      ? $settings['logo']      : get_option('ecare_auth_logo', '')),
            'primaryColor'       => !empty($settings['primaryColor'])          ? $settings['primaryColor'] : get_option('ecare_primary_color', '#1b3b2b'),
            'cssUrl'             => esc_url_raw($doctors_css_url),
            'settings'           => $client_settings,
            'user'               => $user_data,
            'woocommerceEnabled' => class_exists('WooCommerce'),
            'wcGateways'         => $wc_gateways,
        ];

        if ($doctors_js_file) {
            $output .= '<script>window.ecareConfig = ' . json_encode($config_data) . '; window.ecareAuthConfig = window.ecareConfig;</script>';
            $output .= '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $doctors_js_file) . '"></script>';
        }

        return $output;
    }

    public function add_body_class($classes) {
        if ($this->is_rendered) {
            $classes[] = 'ecare-doctors-page-active';
        }
        return $classes;
    }

    /* ── Auto-create Doctors Page ─────────────────────────────────────────── */

    public static function create_doctors_page() {
        $existing = get_page_by_path(self::PAGE_SLUG);
        if ($existing) {
            $template = get_post_meta($existing->ID, '_wp_page_template', true);
            if ($template !== 'default' && $template !== '') {
                update_post_meta($existing->ID, '_wp_page_template', 'default');
            }
            if (trim($existing->post_content) === '') {
                wp_update_post([
                    'ID'           => $existing->ID,
                    'post_content' => '[ecare_doctors]',
                ]);
            }
            return;
        }

        $page_id = wp_insert_post([
            'post_title'   => 'Doctors Registry',
            'post_name'    => self::PAGE_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '[ecare_doctors]',
            'meta_input'   => ['_wp_page_template' => 'default'],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            update_option('ecare_doctors_page_id', $page_id);
        }
    }

    public static function delete_doctors_page() {
        $page_id = get_option('ecare_doctors_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_doctors_page_id');
        }
    }
}
