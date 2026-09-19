<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE Lab Booking public page:
 *  - Registers the [ecare_lab_booking_request] shortcode
 *  - Auto-creates a WordPress page titled "Lab Test Booking"
 *  - Injects CSS to strip the theme container's padding/background/border
 *  - Enqueues the Vite-built React bundle and passes config to the window
 */
class ECARE_LabBooking {

    const PAGE_SLUG = 'ecare-lab-booking';

    public function __construct() {
        add_shortcode('ecare_lab_booking_request', [$this, 'render_shortcode']);
        add_filter('body_class', [$this, 'add_body_class']);

        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_lab_booking_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;

        /* ── CSS: strip ALL theme spacing & hide page title ── */
        $output  = '<style>';
        $output .= '
            body.ecare-lab-booking-page-active .entry-content,
            body.ecare-lab-booking-page-active .post-content,
            body.ecare-lab-booking-page-active .page-content,
            body.ecare-lab-booking-page-active article,
            body.ecare-lab-booking-page-active article.page,
            body.ecare-lab-booking-page-active .hentry,
            body.ecare-lab-booking-page-active .site-content,
            body.ecare-lab-booking-page-active #content,
            body.ecare-lab-booking-page-active #primary,
            body.ecare-lab-booking-page-active .content-area,
            body.ecare-lab-booking-page-active main,
            body.ecare-lab-booking-page-active .site-main,
            body.ecare-lab-booking-page-active #page,
            body.ecare-lab-booking-page-active .page-wrapper,
            body.ecare-lab-booking-page-active .site-inner,
            body.ecare-lab-booking-page-active .site-wrapper {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            body.ecare-lab-booking-page-active .entry-header,
            body.ecare-lab-booking-page-active .page-header,
            body.ecare-lab-booking-page-active .post-header,
            body.ecare-lab-booking-page-active .entry-title,
            body.ecare-lab-booking-page-active h1.entry-title,
            body.ecare-lab-booking-page-active h1.page-title,
            body.ecare-lab-booking-page-active .page-title-wrap,
            body.ecare-lab-booking-page-active .ast-page-header,
            body.ecare-lab-booking-page-active .inside-page-header,
            body.ecare-lab-booking-page-active .site-header-content {
                display: none !important;
            }
            body.ecare-lab-booking-page-active .container,
            body.ecare-lab-booking-page-active .container-fluid,
            body.ecare-lab-booking-page-active .wp-container,
            body.ecare-lab-booking-page-active .inner-container,
            body.ecare-lab-booking-page-active .site-inner,
            body.ecare-lab-booking-page-active .ast-container,
            body.ecare-lab-booking-page-active .ast-article-post,
            body.ecare-lab-booking-page-active .generate-columns-container,
            body.ecare-lab-booking-page-active .inside-article,
            body.ecare-lab-booking-page-active .elementor-section,
            body.ecare-lab-booking-page-active .elementor-container,
            body.ecare-lab-booking-page-active .wp-block-group,
            body.ecare-lab-booking-page-active .wp-block-post-content,
            body.ecare-lab-booking-page-active .is-layout-constrained,
            body.ecare-lab-booking-page-active .is-layout-flow {
                padding:    0 !important;
                background: transparent !important;
            }
            body.ecare-lab-booking-page-active {
                --ecare-container-width: ' . ecare_get_container_width() . 'px;
            }
            body.ecare-lab-booking-page-active .ecare-lab-booking-wrapper {
                width:      100% !important;
                max-width:  var(--ecare-container-width, 100%) !important;
                padding:    0 !important;
                margin:     0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
        ';
        $output .= '</style>' . "\n";

        /* ── Root mount point ── */
        $output .= '<div class="ecare-lab-booking-wrapper" style="width:100%;max-width:' . ecare_get_container_width() . 'px;margin:0 auto;padding:0;">';
        $output .= '<div id="ecare-lab-booking-root"></div>';
        $output .= '</div>';

        /* ── JS: forcibly strip padding from every ancestor ── */
        $output .= '<script>
        (function() {
            function stripAncestors() {
                var el = document.getElementById("ecare-lab-booking-root");
                if (!el) return;
                var node = el.parentElement;
                while (node && node !== document.body) {
                    node.style.setProperty("padding",        "0",           "important");
                    node.style.setProperty("padding-top",    "0",           "important");
                    node.style.setProperty("padding-right",  "0",           "important");
                    node.style.setProperty("padding-bottom", "0",           "important");
                    node.style.setProperty("padding-left",   "0",           "important");
                    node.style.setProperty("background",     "transparent", "important");
                    node.style.setProperty("border",         "none",        "important");
                    node.style.setProperty("box-shadow",     "none",        "important");
                    node = node.parentElement;
                }
            }
            stripAncestors();
            document.addEventListener("DOMContentLoaded", stripAncestors);
            window.addEventListener("load", stripAncestors);
        })();
        </script>' . "\n";

        /* ── Resolve Vite-built assets from manifest ── */
        $manifest_path  = ECARE_PATH . 'dist/.vite/manifest.json';
        $plugin_url     = ECARE_URL;
        $lab_css_url    = '';
        $lab_js_file    = '';

        if (file_exists($manifest_path)) {
            $manifest  = json_decode(file_get_contents($manifest_path), true);
            $lab_entry = $manifest['src/labBooking.jsx'] ?? null;

            if ($lab_entry) {
                $lab_js_file = $lab_entry['file'];

                $css_files = $lab_entry['css'] ?? [];
                if (isset($lab_entry['imports'])) {
                    foreach ($lab_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }
                if (!empty($css_files)) {
                    $lab_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        /* ── Build config payload ── */
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];
        $client_settings = function_exists('ecare_get_client_settings') ? ecare_get_client_settings($settings) : $settings;

        // If the user is logged in, pass their details
        $user_data = null;
        $current_user = wp_get_current_user();
        if ($current_user->ID) {
            $ecare_role = ECARE_Roles::get_ecare_role($current_user);
            $user_data = [
                'id'        => $current_user->ID,
                'name'      => $current_user->display_name,
                'email'     => $current_user->user_email,
                'ecareRole' => $ecare_role,
            ];
        }

        $config_data = [
            'loginUrl'      => ecare_adjust_url(home_url('/ecare-login')),
            'portalUrl'     => ecare_adjust_url(admin_url('admin.php?page=e-care-management')),
            'apiUrl'        => esc_url_raw(ecare_adjust_url(rest_url('ecare/v1'))),
            'nonce'         => wp_create_nonce('wp_rest'),
            'siteName'      => get_bloginfo('name'),
            'siteUrl'       => ecare_adjust_url(home_url()),
            'bgImage'       => esc_url_raw(!empty($settings['bgImage'])  ? $settings['bgImage']  : get_option('ecare_auth_bg_image', '')),
            'logo'          => esc_url_raw(!empty($settings['logo'])     ? $settings['logo']     : get_option('ecare_auth_logo', '')),
            'primaryColor'  => !empty($settings['primaryColor'])         ? $settings['primaryColor'] : get_option('ecare_primary_color', '#1b3b2b'),
            'cssUrl'        => esc_url_raw($lab_css_url),
            'user'          => $user_data,
            'settings'      => $client_settings,
        ];

        if ($lab_js_file) {
            $output .= '<script>window.ecareConfig = ' . json_encode($config_data) . ';</script>';
            $output .= '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $lab_js_file) . '"></script>';
        }

        return $output;
    }

    public function add_body_class($classes) {
        if ($this->is_rendered) {
            $classes[] = 'ecare-lab-booking-page-active';
        }
        return $classes;
    }

    /* ── Auto-create Page ──────────────────────────────────────────────── */

    public static function create_lab_booking_page() {
        $existing = get_page_by_path(self::PAGE_SLUG);
        if ($existing) {
            if (trim($existing->post_content) === '') {
                wp_update_post([
                    'ID'           => $existing->ID,
                    'post_content' => '[ecare_lab_booking_request]',
                ]);
            }
            update_post_meta($existing->ID, '_wp_page_template', 'default');
            return;
        }

        $page_id = wp_insert_post([
            'post_title'   => 'Lab Test Booking',
            'post_name'    => self::PAGE_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '[ecare_lab_booking_request]',
            'meta_input'   => ['_wp_page_template' => 'default'],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            update_option('ecare_lab_booking_page_id', $page_id);
        }
    }

    public static function delete_lab_booking_page() {
        $page_id = get_option('ecare_lab_booking_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_lab_booking_page_id');
        }
    }
}
