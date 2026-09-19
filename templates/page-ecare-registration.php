<?php
/**
 * Template Name: E-CARE Public Registration
 * Template Post Type: page
 *
 * Renders the E-CARE public registration React app wrapped with the theme's header and footer.
 */

if (!defined('ABSPATH')) {
    exit;
}

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
        
        // Collect all CSS from entry and its imports
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

// Fetch the theme header
get_header();
?>

<!-- E-CARE Public Registration React Mount Point -->
<div id="ecare-registration-root"></div>

<?php
// Pass config to the React registration app
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

echo "<script>
  window.ecareAuthConfig = " . json_encode([
      'loginUrl'         => $login_url,
      'portalUrl'        => $portal_url,
      'apiUrl'           => esc_url_raw($api_url),
      'nonce'            => $nonce,
      'registerNonce'    => $register_nonce,
      'siteName'         => get_bloginfo('name'),
      'siteUrl'          => ecare_adjust_url(home_url()),
      'bgImage'          => esc_url_raw($bg_image),
      'logo'             => esc_url_raw($logo),
      'primaryColor'     => $primary_color,
      'cssUrl'           => esc_url_raw($registration_css_url),
      'termsUrl'         => esc_url_raw($settings['termsUrl'] ?? ''),
      'privacyUrl'       => esc_url_raw($settings['privacyUrl'] ?? ''),
  ], JSON_UNESCAPED_SLASHES) . ";
</script>\n";

// Load the registration JS bundle
if ($registration_js_file) {
    echo '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $registration_js_file) . '"></script>' . "\n";
}

// Fetch the theme footer
get_footer();

// Exit to guarantee no default post looping happens after
exit;
