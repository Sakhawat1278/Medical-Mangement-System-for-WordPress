<?php
/**
 * Template Name: E-CARE Auth
 * Template Post Type: page
 *
 * Renders the E-CARE login/signup React app in complete isolation.
 * No theme styles, no WP admin bar, no WP scripts — only the auth bundle.
 */

if (!defined('ABSPATH')) {
    exit;
}

// If already logged in as an E-CARE user, skip the login page and go to the portal
if ( is_user_logged_in() && ECARE_Roles::get_ecare_role() !== 'none' ) {
    wp_redirect(home_url('/ecare-portal'));
    exit;
}

// Kill all theme output and render our own minimal HTML shell
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title><?php echo esc_html(get_bloginfo('name')); ?> — E-CARE Portal</title>

  <!-- ── Hard reset: nuke all inherited WP / theme styles ── -->
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #f1f5f9 !important;
      overflow-x: hidden;
    }
    /* Hide any WP admin bar that might load */
    #wpadminbar { display: none !important; }
    html.wp-toolbar { padding-top: 0 !important; }
  </style>

  <?php
    // Detect bundled assets from Vite manifest
    $manifest_path = ECARE_PATH . 'dist/.vite/manifest.json';
    $plugin_url    = ECARE_URL;
    $auth_css_url  = '';
    $auth_js_file  = '';

    if (file_exists($manifest_path)) {
        $manifest = json_decode(file_get_contents($manifest_path), true);
        $auth_entry = $manifest['src/auth.jsx'] ?? null;
        
        if ($auth_entry) {
            $auth_js_file = $auth_entry['file'];
            
            // Collect all CSS from entry and its imports
            $css_files = $auth_entry['css'] ?? [];
            if (isset($auth_entry['imports'])) {
                foreach ($auth_entry['imports'] as $import_key) {
                    if (isset($manifest[$import_key]['css'])) {
                        $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                    }
                }
            }

            if (!empty($css_files)) {
                $auth_css_url = $plugin_url . 'dist/' . $css_files[0];
            }
        }
    }
  ?>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;overflow:hidden;">

  <!-- E-CARE Auth React Mount Point -->
  <div id="ecare-auth-root"></div>

  <?php
    // Pass config to the React auth app
    $portal_url     = ecare_adjust_url(admin_url('admin.php?page=e-care-management'));
    $login_url      = ecare_adjust_url(wp_login_url($portal_url));
    $forgot_url     = ecare_adjust_url(wp_lostpassword_url());
    $api_url        = ecare_adjust_url(rest_url('ecare/v1'));
    $nonce          = wp_create_nonce('wp_rest');
    $register_nonce = wp_create_nonce('ecare_register');
    $bg_image       = get_option('ecare_auth_bg_image', '');
    $logo           = get_option('ecare_auth_logo', '');

    $settings      = get_option('ecare_settings');
    if (!is_array($settings)) $settings = [];
    
    $primary_color = !empty($settings['primaryColor']) ? $settings['primaryColor'] : get_option('ecare_primary_color', '#1b3b2b');

    echo "<script>
      window.ecareAuthConfig = " . json_encode([
          'loginUrl'            => $login_url,
          'portalUrl'           => $portal_url,
          'forgotPasswordUrl'   => $forgot_url,
          'apiUrl'              => esc_url_raw($api_url),
          'nonce'               => $nonce,
          'registerNonce'       => $register_nonce,
          'siteName'            => get_bloginfo('name'),
          'siteUrl'             => ecare_adjust_url(home_url()),
          'bgImage'             => esc_url_raw($bg_image),
          'logo'                => esc_url_raw($logo),
          'primaryColor'        => $primary_color,
          'cssUrl'              => esc_url_raw($auth_css_url),
          'termsUrl'            => esc_url_raw($settings['termsUrl'] ?? ''),
          'privacyUrl'          => esc_url_raw($settings['privacyUrl'] ?? ''),
          'socialLoginEnabled'  => (bool) ($settings['socialLoginEnabled'] ?? false),
          'firebaseConfig'      => [
              'apiKey'            => $settings['firebaseConfig']['apiKey'] ?? get_option('ecare_firebase_api_key', ''),
              'authDomain'        => $settings['firebaseConfig']['authDomain'] ?? get_option('ecare_firebase_auth_domain', ''),
              'projectId'         => $settings['firebaseConfig']['projectId'] ?? get_option('ecare_firebase_project_id', ''),
              'storageBucket'     => $settings['firebaseConfig']['storageBucket'] ?? get_option('ecare_firebase_storage_bucket', ''),
              'messagingSenderId' => $settings['firebaseConfig']['messagingSenderId'] ?? get_option('ecare_firebase_messaging_sender_id', ''),
              'appId'             => $settings['firebaseConfig']['appId'] ?? get_option('ecare_firebase_app_id', ''),
          ],
      ], JSON_UNESCAPED_SLASHES) . ";
      window.ecareConfig = window.ecareAuthConfig;
    </script>\n";

    // Load the auth JS bundle
    if ($auth_js_file) {
        echo '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $auth_js_file) . '"></script>' . "\n";
    }
  ?>

</body>
</html>
<?php
// Exit to prevent WordPress from appending anything
exit;
