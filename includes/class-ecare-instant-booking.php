<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE Instant Booking public page:
 *  - Registers the [ecare_instant_booking] shortcode
 *  - Injects CSS to strip the theme container's padding/background/border
 *  - Enqueues the Vite-built React bundle and passes config to the window
 */
class ECARE_InstantBooking {

    const PAGE_SLUG = 'ecare-instant-booking';

    public function __construct() {
        add_shortcode('ecare_instant_booking', [$this, 'render_shortcode']);
        add_filter('body_class', [$this, 'add_body_class']);

        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_instant_booking_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;

        /* ── CSS: strip ALL theme spacing & hide page title on booking page ── */
        $output  = '<style>';
        $output .= '
            /* Core content wrappers */
            body.ecare-instant-booking-page-active .entry-content,
            body.ecare-instant-booking-page-active .post-content,
            body.ecare-instant-booking-page-active .page-content,
            body.ecare-instant-booking-page-active article,
            body.ecare-instant-booking-page-active article.page,
            body.ecare-instant-booking-page-active .hentry,
            body.ecare-instant-booking-page-active .site-content,
            body.ecare-instant-booking-page-active #content,
            body.ecare-instant-booking-page-active #primary,
            body.ecare-instant-booking-page-active .content-area,
            body.ecare-instant-booking-page-active main,
            body.ecare-instant-booking-page-active .site-main,
            body.ecare-instant-booking-page-active #page,
            body.ecare-instant-booking-page-active .page-wrapper,
            body.ecare-instant-booking-page-active .site-inner,
            body.ecare-instant-booking-page-active .site-wrapper {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            /* Hide page title / entry header entirely */
            body.ecare-instant-booking-page-active .entry-header,
            body.ecare-instant-booking-page-active .page-header,
            body.ecare-instant-booking-page-active .post-header,
            body.ecare-instant-booking-page-active .entry-title,
            body.ecare-instant-booking-page-active h1.entry-title,
            body.ecare-instant-booking-page-active h1.page-title,
            body.ecare-instant-booking-page-active .page-title-wrap,
            body.ecare-instant-booking-page-active .ast-page-header,
            body.ecare-instant-booking-page-active .inside-page-header,
            body.ecare-instant-booking-page-active .site-header-content {
                display: none !important;
            }
            /* Container / grid classes */
            body.ecare-instant-booking-page-active .container,
            body.ecare-instant-booking-page-active .container-fluid,
            body.ecare-instant-booking-page-active .wp-container,
            body.ecare-instant-booking-page-active .inner-container,
            body.ecare-instant-booking-page-active .site-inner {
                padding:   0 !important;
            }
            /* Gutenberg / block editor */
            body.ecare-instant-booking-page-active .wp-block-group,
            body.ecare-instant-booking-page-active .wp-block-post-content,
            body.ecare-instant-booking-page-active .wp-block-group__inner-container,
            body.ecare-instant-booking-page-active .wp-site-blocks,
            body.ecare-instant-booking-page-active .wp-block-template-part,
            body.ecare-instant-booking-page-active .is-layout-constrained,
            body.ecare-instant-booking-page-active .is-layout-flow,
            body.ecare-instant-booking-page-active .is-layout-constrained > *:not(.alignwide):not(.alignfull),
            body.ecare-instant-booking-page-active .wp-block-post,
            body.ecare-instant-booking-page-active .wp-block-query-loop {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            /* Common theme-specific selectors (Astra, GeneratePress, OceanWP, Kadence, Hello/Elementor) */
            body.ecare-instant-booking-page-active .ast-container,
            body.ecare-instant-booking-page-active .ast-article-post,
            body.ecare-instant-booking-page-active .generate-columns-container,
            body.ecare-instant-booking-page-active .inside-article,
            body.ecare-instant-booking-page-active .ocean-container,
            body.ecare-instant-booking-page-active .oceanwp-container,
            body.ecare-instant-booking-page-active .kadence-column,
            body.ecare-instant-booking-page-active .entry-content-wrap,
            body.ecare-instant-booking-page-active .elementor-section,
            body.ecare-instant-booking-page-active .elementor-container,
            body.ecare-instant-booking-page-active .elementor-column-wrap {
                padding:    0 !important;
                background: transparent !important;
            }
            body.ecare-instant-booking-page-active {
                --ecare-container-width: ' . ecare_get_container_width() . 'px;
            }
            /* Our wrapper */
            body.ecare-instant-booking-page-active .ecare-instant-booking-wrapper {
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
        $output .= '<div class="ecare-instant-booking-wrapper" style="width:100%;max-width:' . ecare_get_container_width() . 'px;margin:0 auto;padding:0;">';
        $output .= '<div id="ecare-instant-booking-root"></div>';
        $output .= '</div>';

        // ── JS: forcibly strip padding from every ancestor of our root ──
        $output .= '<script>
        (function() {
            function stripAncestors() {
                var el = document.getElementById("ecare-instant-booking-root");
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
        $booking_css_url = '';
        $booking_js_file = '';

        if (file_exists($manifest_path)) {
            $manifest      = json_decode(file_get_contents($manifest_path), true);
            $booking_entry = $manifest['src/instantBooking.jsx'] ?? null;

            if ($booking_entry) {
                $booking_js_file = $booking_entry['file'];

                // Collect all CSS files (entry + imports)
                $css_files = $booking_entry['css'] ?? [];
                if (isset($booking_entry['imports'])) {
                    foreach ($booking_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }

                if (!empty($css_files)) {
                    $booking_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        /* ── Build and pass config to window ── */
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];
        $client_settings = function_exists('ecare_get_client_settings') ? ecare_get_client_settings($settings) : $settings;

        $config_data = [
            'loginUrl'      => ecare_adjust_url(home_url('/ecare-login')),
            'portalUrl'     => ecare_adjust_url(admin_url('admin.php?page=e-care-management')),
            'apiUrl'        => esc_url_raw(ecare_adjust_url(rest_url('ecare/v1'))),
            'nonce'         => wp_create_nonce('wp_rest'),
            'registerNonce' => wp_create_nonce('ecare_register'),
            'siteName'      => get_bloginfo('name'),
            'siteUrl'       => ecare_adjust_url(home_url()),
            'bgImage'       => esc_url_raw(!empty($settings['bgImage'])   ? $settings['bgImage']   : get_option('ecare_auth_bg_image', '')),
            'logo'          => esc_url_raw(!empty($settings['logo'])      ? $settings['logo']      : get_option('ecare_auth_logo', '')),
            'primaryColor'  => !empty($settings['primaryColor'])          ? $settings['primaryColor'] : get_option('ecare_primary_color', '#1b3b2b'),
            'cssUrl'        => esc_url_raw($booking_css_url),
            'settings'      => $client_settings,
        ];

        if ($booking_js_file) {
            $output .= '<script>window.ecareConfig = ' . json_encode($config_data) . '; window.ecareAuthConfig = window.ecareConfig;</script>';
            $output .= '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $booking_js_file) . '"></script>';
        }

        return $output;
    }

    public function add_body_class($classes) {
        if ($this->is_rendered) {
            $classes[] = 'ecare-instant-booking-page-active';
        }
        return $classes;
    }

    /* ── Auto-create Booking Page ─────────────────────────────────────────── */

    public static function create_instant_booking_page() {
        $existing = get_page_by_path(self::PAGE_SLUG);
        if ($existing) {
            $template = get_post_meta($existing->ID, '_wp_page_template', true);
            if ($template !== 'default' && $template !== '') {
                update_post_meta($existing->ID, '_wp_page_template', 'default');
            }
            if (trim($existing->post_content) === '') {
                wp_update_post([
                    'ID'           => $existing->ID,
                    'post_content' => '[ecare_instant_booking]',
                ]);
            }
            return;
        }

        $page_id = wp_insert_post([
            'post_title'   => 'Instant Call Booking',
            'post_name'    => self::PAGE_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '[ecare_instant_booking]',
            'meta_input'   => ['_wp_page_template' => 'default'],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            update_option('ecare_instant_booking_page_id', $page_id);
        }
    }

    public static function delete_instant_booking_page() {
        $page_id = get_option('ecare_instant_booking_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_instant_booking_page_id');
        }
    }
}
