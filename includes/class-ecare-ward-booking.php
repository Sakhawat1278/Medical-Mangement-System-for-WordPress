<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE Ward & Cabin Booking public page:
 *  - Registers the [ecare_ward_booking] and [ecare_cabin_booking] shortcodes
 *  - Auto-creates a WordPress page titled "Ward & Cabin Booking"
 *  - Injects CSS to strip the theme container's padding/background/border
 *  - Enqueues the Vite-built React bundle and passes config to window.ecareConfig
 */
class ECARE_WardBooking {

    const PAGE_SLUG = 'ecare-ward-booking';

    public function __construct() {
        add_shortcode('ecare_ward_booking', [$this, 'render_shortcode']);
        add_shortcode('ecare_cabin_booking', [$this, 'render_shortcode']);
        add_filter('body_class', [$this, 'add_body_class']);

        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_ward_booking_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;

        /* ── CSS: strip ALL theme spacing & hide page title ── */
        $output  = '<style>';
        $output .= '
            body.ecare-ward-booking-page-active .entry-content,
            body.ecare-ward-booking-page-active .post-content,
            body.ecare-ward-booking-page-active .page-content,
            body.ecare-ward-booking-page-active article,
            body.ecare-ward-booking-page-active article.page,
            body.ecare-ward-booking-page-active .hentry,
            body.ecare-ward-booking-page-active .site-content,
            body.ecare-ward-booking-page-active #content,
            body.ecare-ward-booking-page-active #primary,
            body.ecare-ward-booking-page-active .content-area,
            body.ecare-ward-booking-page-active main,
            body.ecare-ward-booking-page-active .site-main,
            body.ecare-ward-booking-page-active #page,
            body.ecare-ward-booking-page-active .page-wrapper,
            body.ecare-ward-booking-page-active .site-inner,
            body.ecare-ward-booking-page-active .site-wrapper {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            body.ecare-ward-booking-page-active .entry-header,
            body.ecare-ward-booking-page-active .page-header,
            body.ecare-ward-booking-page-active .post-header,
            body.ecare-ward-booking-page-active .entry-title,
            body.ecare-ward-booking-page-active h1.entry-title,
            body.ecare-ward-booking-page-active h1.page-title,
            body.ecare-ward-booking-page-active .page-title-wrap,
            body.ecare-ward-booking-page-active .ast-page-header,
            body.ecare-ward-booking-page-active .inside-page-header,
            body.ecare-ward-booking-page-active .site-header-content {
                display: none !important;
            }
            body.ecare-ward-booking-page-active .container,
            body.ecare-ward-booking-page-active .container-fluid,
            body.ecare-ward-booking-page-active .wp-container,
            body.ecare-ward-booking-page-active .inner-container,
            body.ecare-ward-booking-page-active .site-inner,
            body.ecare-ward-booking-page-active .ast-container,
            body.ecare-ward-booking-page-active .ast-article-post,
            body.ecare-ward-booking-page-active .generate-columns-container,
            body.ecare-ward-booking-page-active .inside-article,
            body.ecare-ward-booking-page-active .elementor-section,
            body.ecare-ward-booking-page-active .elementor-container,
            body.ecare-ward-booking-page-active .wp-block-group,
            body.ecare-ward-booking-page-active .wp-block-post-content,
            body.ecare-ward-booking-page-active .is-layout-constrained,
            body.ecare-ward-booking-page-active .is-layout-flow {
                padding:    0 !important;
                background: transparent !important;
            }
            body.ecare-ward-booking-page-active {
                --ecare-container-width: ' . (function_exists('ecare_get_container_width') ? ecare_get_container_width() : 1280) . 'px;
            }
            body.ecare-ward-booking-page-active .ecare-ward-booking-wrapper {
                width:      100% !important;
                max-width:  var(--ecare-container-width, 100%) !important;
                padding:    0 !important;
                margin:     0 auto !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
        ';
        $output .= '</style>' . "\n";

        /* ── Root mount point ── */
        $output .= '<div class="ecare-ward-booking-wrapper">';
        $output .= '<div id="ecare-ward-booking-root"></div>';
        $output .= '</div>';

        /* ── JS: forcibly strip padding from ancestors ── */
        $output .= '<script>
        (function() {
            function stripAncestors() {
                var el = document.getElementById("ecare-ward-booking-root");
                if (!el) return;
                var node = el.parentElement;
                while (node && node !== document.body) {
                    node.style.setProperty("padding",        "0",           "important");
                    node.style.setProperty("padding-top",    "0",           "important");
                    node.style.setProperty("padding-right",  "0",           "important");
                    node.style.setProperty("padding-bottom", "0",           "important");
                    node.style.setProperty("padding-left",   "0",           "important");
                    node.style.setProperty("margin",         "0 auto",      "important");
                    node.style.setProperty("background",     "transparent", "important");
                    node.style.setProperty("border",         "none",        "important");
                    node.style.setProperty("box-shadow",     "none",        "important");
                    node = node.parentElement;
                }
            }
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", stripAncestors);
            } else {
                stripAncestors();
            }
        })();
        </script>' . "\n";

        /* ── Resolve Vite asset from manifest ── */
        $manifest_path = ECARE_PATH . 'dist/.vite/manifest.json';
        if (!file_exists($manifest_path)) {
            $manifest_path = ECARE_PATH . 'dist/manifest.json';
        }

        $ward_js_file = null;
        $ward_css_url = '';
        $plugin_url   = trailingslashit(plugins_url('', dirname(__FILE__)));

        if (file_exists($manifest_path)) {
            $manifest = json_decode(file_get_contents($manifest_path), true);
            $entry_key = 'src/wardBooking.jsx';

            if (isset($manifest[$entry_key])) {
                $ward_entry   = $manifest[$entry_key];
                $ward_js_file = $ward_entry['file'];

                $css_files = [];
                if (!empty($ward_entry['css'])) {
                    $css_files = array_merge($css_files, $ward_entry['css']);
                }
                if (!empty($ward_entry['imports'])) {
                    foreach ($ward_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }
                if (!empty($css_files)) {
                    $ward_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        /* ── Build config payload ── */
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];
        $client_settings = function_exists('ecare_get_client_settings') ? ecare_get_client_settings($settings) : $settings;

        $user_data = null;
        $current_user = wp_get_current_user();
        if ($current_user && $current_user->ID) {
            $user_data = [
                'id'        => $current_user->ID,
                'name'      => $current_user->display_name,
                'email'     => $current_user->user_email,
                'phone'     => get_user_meta($current_user->ID, 'phone', true) ?: '',
                'ecareRole' => 'patient',
            ];
        }

        $config_data = [
            'loginUrl'      => function_exists('ecare_adjust_url') ? ecare_adjust_url(home_url('/ecare-login')) : home_url('/ecare-login'),
            'portalUrl'     => function_exists('ecare_adjust_url') ? ecare_adjust_url(admin_url('admin.php?page=e-care-management')) : admin_url('admin.php?page=e-care-management'),
            'apiUrl'        => esc_url_raw(function_exists('ecare_adjust_url') ? ecare_adjust_url(rest_url('ecare/v1')) : rest_url('ecare/v1')),
            'nonce'         => wp_create_nonce('wp_rest'),
            'siteName'      => get_bloginfo('name'),
            'siteUrl'       => function_exists('ecare_adjust_url') ? ecare_adjust_url(home_url()) : home_url(),
            'bgImage'       => esc_url_raw(!empty($settings['bgImage']) ? $settings['bgImage'] : get_option('ecare_auth_bg_image', '')),
            'logo'          => esc_url_raw(!empty($settings['logo']) ? $settings['logo'] : get_option('ecare_auth_logo', '')),
            'primaryColor'  => !empty($settings['primaryColor']) ? $settings['primaryColor'] : get_option('ecare_primary_color', '#0284c7'),
            'cssUrl'        => esc_url_raw($ward_css_url),
            'user'          => $user_data,
            'settings'      => $client_settings,
        ];

        if ($ward_js_file) {
            $output .= '<script>window.ecareConfig = ' . json_encode($config_data) . ';</script>';
            $output .= '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $ward_js_file) . '"></script>';
        }

        return $output;
    }

    public function add_body_class($classes) {
        if ($this->is_rendered || is_page(self::PAGE_SLUG)) {
            $classes[] = 'ecare-ward-booking-page-active';
            $classes[] = 'ecare-plugin-page-active';
        }
        return $classes;
    }

    public static function create_ward_booking_page() {
        $page = get_page_by_path(self::PAGE_SLUG);
        if (!$page) {
            wp_insert_post([
                'post_title'     => 'Ward & Cabin Booking',
                'post_name'      => self::PAGE_SLUG,
                'post_content'   => '[ecare_ward_booking]',
                'post_status'    => 'publish',
                'post_type'      => 'page',
                'comment_status' => 'closed',
            ]);
        }
    }
}
