<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the E-CARE public registration page setup:
 *  - Enqueues the registration React bundle on the page
 *  - Hooks into standard page content loop for 100% theme compatibility
 *  - Automatically overrides empty theme sidebars for registration
 */
class ECARE_Registration {

    const PAGE_SLUG = 'ecare-registration';

    public function __construct() {
        // Register Shortcode
        add_shortcode('ecare_registration', [$this, 'render_shortcode']);
        
        // Add custom body class when shortcode is used
        add_filter('body_class', [$this, 'add_body_class']);

        // Defensive check: ensure page exists
        if (is_admin()) {
            add_action('admin_init', [$this, 'ensure_page_exists']);
        }
    }

    public function ensure_page_exists() {
        self::create_registration_page();
    }

    private $is_rendered = false;

    public function render_shortcode($atts) {
        $this->is_rendered = true;
        
        $container_width = ecare_get_container_width();
        $output = '<div class="ecare-registration-wrapper" style="width: 100%; max-width: ' . $container_width . 'px; margin: 0 auto;">
                    <style>
                        body.ecare-registration-page-active {
                            --ecare-container-width: ' . $container_width . 'px;
                        }
                    </style>
                    <div id="ecare-registration-root"></div>
                </div>';

        // Detect bundled assets from Vite manifest
        $manifest_path = ECARE_PATH . 'dist/.vite/manifest.json';
        $plugin_url    = ECARE_URL;
        $registration_css_url = '';
        $registration_js_file  = '';

        if (file_exists($manifest_path)) {
            $manifest = json_decode(file_get_contents($manifest_path), true);
            $registration_entry = $manifest['src/registration.jsx'] ?? null;
            
            if ($registration_entry) {
                $registration_js_file = $registration_entry['file'];
                
                // Collect CSS files
                $css_files = $registration_entry['css'] ?? [];
                if (isset($registration_entry['imports'])) {
                    foreach ($registration_entry['imports'] as $import_key) {
                        if (isset($manifest[$import_key]['css'])) {
                            $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                        }
                    }
                }

                if (!empty($css_files)) {
                    $registration_css_url = $plugin_url . 'dist/' . $css_files[0];
                }
            }
        }

        // Pass config configuration to the React registration app
        $portal_url     = ecare_adjust_url(admin_url('admin.php?page=e-care-management'));
        $login_url      = ecare_adjust_url(home_url('/ecare-login'));
        $api_url        = ecare_adjust_url(rest_url('ecare/v1'));
        $nonce          = wp_create_nonce('wp_rest');
        $register_nonce = wp_create_nonce('ecare_register');

        $settings      = get_option('ecare_settings');
        if (!is_array($settings)) $settings = [];

        $primary_color = !empty($settings['primaryColor']) ? $settings['primaryColor'] : get_option('ecare_primary_color', '#1b3b2b');
        $bg_image      = !empty($settings['bgImage']) ? $settings['bgImage'] : get_option('ecare_auth_bg_image', '');
        $logo          = !empty($settings['logo']) ? $settings['logo'] : get_option('ecare_auth_logo', '');

        $config_data = [
            'loginUrl'         => $login_url,
            'portalUrl'        => $portal_url,
            'apiUrl'           => esc_url_raw($api_url),
            'nonce'            => $nonce,
            'registerNonce'    => $register_nonce,
            'siteName'         => get_bloginfo('name'),
            'siteUrl'          => home_url(),
            'bgImage'          => esc_url_raw($bg_image),
            'logo'             => esc_url_raw($logo),
            'primaryColor'     => $primary_color,
            'cssUrl'           => esc_url_raw($registration_css_url),
        ];

        if ($registration_js_file) {
            $output .= '<script>window.ecareAuthConfig = ' . json_encode($config_data) . ';</script>';
            $output .= '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $registration_js_file) . '"></script>';
        }

        return $output;
    }

    public function add_body_class($classes) {
        if ($this->is_rendered) {
            $classes[] = 'ecare-registration-page-active';
        }
        return $classes;
    }

    /* ── Auto-create Registration Page ─────────────────────────────────── */

    public static function create_registration_page() {
        $existing = get_page_by_path(self::PAGE_SLUG);
        if ($existing) {
            // Revert custom template mapping to let WP load standard page.php template
            $template = get_post_meta($existing->ID, '_wp_page_template', true);
            if ($template !== 'default' && $template !== '') {
                update_post_meta($existing->ID, '_wp_page_template', 'default');
            }
            
            // If the content is entirely empty, inject the shortcode
            if (trim($existing->post_content) === '') {
                wp_update_post([
                    'ID'           => $existing->ID,
                    'post_content' => '[ecare_registration]'
                ]);
            }
            return;
        }

        $page_id = wp_insert_post([
            'post_title'   => 'E-CARE Service Registration',
            'post_name'    => self::PAGE_SLUG,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '[ecare_registration]',
            'meta_input'   => [
                '_wp_page_template' => 'default',
            ],
        ]);

        if ($page_id && !is_wp_error($page_id)) {
            update_option('ecare_registration_page_id', $page_id);
        }
    }

    public static function delete_registration_page() {
        $page_id = get_option('ecare_registration_page_id');
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('ecare_registration_page_id');
        }
    }
}
