<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE Standalone Blood Bank public page:
 *  - Registers the [ecare_blood_bank] shortcode
 *  - Auto-creates a WordPress page titled "Blood Bank"
 *  - Injects CSS to strip the theme container's padding/background/border
 *  - Enqueues the Vite-built React bundle and passes config to the window
 */
class ECARE_BloodBankPage {

    const PAGE_SLUG = 'ecare-blood-bank';

    public function __construct() {
        add_shortcode('ecare_blood_bank', [$this, 'render_shortcode']);
        add_filter('body_class', [$this, 'add_body_class']);

        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_blood_bank_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;

        /* ── CSS: strip ALL theme spacing & hide page title ── */
        $output  = '<style>';
        $output .= '
            body.ecare-blood-bank-page-active .entry-content,
            body.ecare-blood-bank-page-active .post-content,
            body.ecare-blood-bank-page-active .page-content,
            body.ecare-blood-bank-page-active article,
            body.ecare-blood-bank-page-active article.page,
            body.ecare-blood-bank-page-active .hentry,
            body.ecare-blood-bank-page-active .site-content,
            body.ecare-blood-bank-page-active #content,
            body.ecare-blood-bank-page-active #primary,
            body.ecare-blood-bank-page-active .content-area,
            body.ecare-blood-bank-page-active main,
            body.ecare-blood-bank-page-active .site-main,
            body.ecare-blood-bank-page-active #page,
            body.ecare-blood-bank-page-active .page-wrapper,
            body.ecare-blood-bank-page-active .site-inner,
            body.ecare-blood-bank-page-active .site-wrapper {
                padding:    0 !important;
                background: transparent !important;
                border:     none !important;
                box-shadow: none !important;
            }
            body.ecare-blood-bank-page-active .entry-header,
            body.ecare-blood-bank-page-active .page-header,
            body.ecare-blood-bank-page-active .post-header,
            body.ecare-blood-bank-page-active .entry-title,
            body.ecare-blood-bank-page-active h1.entry-title,
            body.ecare-blood-bank-page-active h1.page-title,
            body.ecare-blood-bank-page-active .page-title-wrap,
            body.ecare-blood-bank-page-active .ast-page-header,
            body.ecare-blood-bank-page-active .inside-page-header,
            body.ecare-blood-bank-page-active .site-header-content {
                display: none !important;
            }
            body.ecare-blood-bank-page-active .container,
            body.ecare-blood-bank-page-active .container-fluid,
            body.ecare-blood-bank-page-active .wp-container,
            body.ecare-blood-bank-page-active .inner-container,
            body.ecare-blood-bank-page-active .site-inner,
            body.ecare-blood-bank-page-active .ast-container,
            body.ecare-blood-bank-page-active .ast-article-post,
            body.ecare-blood-bank-page-active .generate-columns-container,
            body.ecare-blood-bank-page-active .inside-article,
            body.ecare-blood-bank-page-active .elementor-section,
            body.ecare-blood-bank-page-active .elementor-container,
            body.ecare-blood-bank-page-active .wp-block-group,
            body.ecare-blood-bank-page-active .wp-block-post-content,
            body.ecare-blood-bank-page-active .is-layout-constrained,
            body.ecare-blood-bank-page-active .is-layout-flow {
                padding:    0 !important;
                background: transparent !important;
            }
            body.ecare-blood-bank-page-active {
                --ecare-container-width: ' . ecare_get_container_width() . 'px;
            }
            body.ecare-blood-bank-page-active .ecare-blood-bank-wrapper {
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
        $output .= '<div class="ecare-blood-bank-wrapper">';
        $output .= '<div id="ecare-blood-bank-root"></div>';
        $output .= '</div>';

        /* ── Resolve Vite build JS & CSS paths from manifest.json ── */
        $plugin_url     = ECARE_URL;
        $manifest_path  = ECARE_PATH . 'dist/.vite/manifest.json';
        $blood_js_file  = '';
        $blood_css_url  = '';

        if (file_exists($manifest_path)) {
            $manifest    = json_decode(file_get_contents($manifest_path), true);
            $blood_entry = $manifest['src/bloodBankPage.jsx'] ?? null;

            if ($blood_entry) {
                $blood_js_file = $blood_entry['file'];

                $css_files = $blood_entry['css'] ?? [];
                if (isset($blood_entry['imports'])) {
                    foreach ($blood_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }

                if (!empty($css_files)) {
                    $blood_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        /* ── Build and pass config to window ── */
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];
        $client_settings = function_exists('ecare_get_client_settings') ? ecare_get_client_settings($settings) : $settings;

        $current_user = wp_get_current_user();
        $ecare_role   = ECARE_Roles::get_ecare_role($current_user);

        $user_payload = null;
        if (is_user_logged_in()) {
            $user_payload = [
                'id'          => $current_user->ID,
                'name'        => $current_user->display_name ?: $current_user->user_login,
                'email'       => $current_user->user_email,
                'role'        => $ecare_role,
                'ecareRole'   => $ecare_role,
                'permissions' => []
            ];
        }

        $config = [
            'apiUrl'     => esc_url_raw(rest_url('ecare/v1/')),
            'nonce'      => wp_create_nonce('wp_rest'),
            'user'       => $user_payload,
            'settings'   => $client_settings,
            'cssUrl'     => esc_url($blood_css_url),
            'portalUrl'  => esc_url(get_permalink(get_page_by_path('ecare-portal')) ?: home_url('/ecare-portal/')),
            'homeUrl'    => esc_url(home_url('/')),
        ];

        $output .= '<script type="text/javascript">';
        $output .= 'window.ecareConfig = ' . wp_json_encode($config) . ';';
        $output .= '</script>' . "\n";

        if (!empty($blood_js_file)) {
            $js_url = esc_url($plugin_url . 'dist/' . $blood_js_file);
            $output .= '<script type="module" src="' . $js_url . '"></script>' . "\n";
        }

        return $output;
    }

    public function add_body_class($classes) {
        if ($this->is_blood_bank_page()) {
            $classes[] = 'ecare-blood-bank-page-active';
        }
        return $classes;
    }

    public function is_blood_bank_page() {
        if ($this->is_rendered) {
            return true;
        }
        if (is_page(self::PAGE_SLUG)) {
            return true;
        }
        global $post;
        if ($post && has_shortcode($post->post_content, 'ecare_blood_bank')) {
            return true;
        }
        return false;
    }

    public static function create_blood_bank_page() {
        $page = get_page_by_path(self::PAGE_SLUG);
        if (!$page) {
            wp_insert_post([
                'post_title'     => 'Blood Bank',
                'post_name'      => self::PAGE_SLUG,
                'post_content'   => '[ecare_blood_bank]',
                'post_status'    => 'publish',
                'post_type'      => 'page',
                'comment_status' => 'closed',
            ]);
        }
    }
}

new ECARE_BloodBankPage();
