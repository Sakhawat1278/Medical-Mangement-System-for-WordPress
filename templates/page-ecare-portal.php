<?php
/**
 * Template Name: E-CARE Clinical Portal
 * Template Post Type: page
 *
 * Renders the E-CARE dashboard React app in complete isolation on the frontend.
 * No theme styles, no WP admin bar, no WP scripts — only the app bundle.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Redirect to login if user is not authenticated or has no E-CARE role
if (!is_user_logged_in() || ECARE_Roles::get_ecare_role() === 'none') {
    wp_redirect(home_url('/ecare-login'));
    exit;
}

// If setup is not completed, only administrators can access the portal to complete onboarding.
// Non-administrators (users) should be redirected to the login page.
$is_setup_completed = get_option('ecare_setup_completed', '') === 'yes';
if (!$is_setup_completed && !current_user_can('manage_options') && ECARE_Roles::get_ecare_role() !== 'admin') {
    wp_logout();
    wp_redirect(home_url('/ecare-login?error=setup_pending'));
    exit;
}

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title><?php echo esc_html(get_bloginfo('name')); ?> — Clinical Portal</title>

  <!-- Hard reset to isolate from WordPress themes -->
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #f8fafc !important;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
    }
    #wpadminbar { display: none !important; }
    html.wp-toolbar { padding-top: 0 !important; }
  </style>

  <?php
    $manifest_path = ECARE_PATH . 'dist/.vite/manifest.json';
    $plugin_url    = ECARE_URL;
    $css_url       = '';
    $js_file       = '';

    if (file_exists($manifest_path)) {
        $manifest = json_decode(file_get_contents($manifest_path), true);
        $entry_key = 'src/main.jsx';
        
        if (isset($manifest[$entry_key])) {
            $js_file = $manifest[$entry_key]['file'];
            
            // Collect all CSS from entry and its imports
            $css_files = $manifest[$entry_key]['css'] ?? [];
            if (isset($manifest[$entry_key]['imports'])) {
                foreach ($manifest[$entry_key]['imports'] as $import_key) {
                    if (isset($manifest[$import_key]['css'])) {
                        $css_files = array_merge($css_files, $manifest[$import_key]['css']);
                    }
                }
            }

            if (!empty($css_files)) {
                $css_url = $plugin_url . 'dist/' . $css_files[0];
            }
        }
    }
    
    // Call wp_head to fetch the theme's settings, stylesheets, and customizer styles/fonts
    wp_head();
  ?>
</head>
<body style="margin:0;padding:0;background:#f8fafc;overflow:hidden;">

  <!-- E-CARE App Mount Point -->
  <div id="ecare-admin-root"></div>

  <?php
    $current_user = wp_get_current_user();
    $ecare_role   = ECARE_Roles::get_ecare_role($current_user);

    // Fetch granular permissions
    $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', $current_user->ID);
    if (empty($staff_records)) {
        $staff_records = ECARE_DB_Client::select_where('ecare_staff', 'user_id', (string) $current_user->ID);
    }
    $staff_record = !empty($staff_records) ? $staff_records[0] : null;
    $permissions = [];
    if ($staff_record && !empty($staff_record->permissions)) {
        $permissions = is_array($staff_record->permissions) ? $staff_record->permissions : json_decode($staff_record->permissions, true);
    }

    // Gather ecare caps
    $all_caps   = $current_user->allcaps ?? [];
    $ecare_caps = array_keys(array_filter($all_caps, function($granted, $cap) {
        return $granted && strpos($cap, 'ecare_') === 0;
    }, ARRAY_FILTER_USE_BOTH));

    // Custom avatar persistence check
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
        'ecareRole'   => $ecare_role,
        'wpRoles'     => $current_user->roles,
        'caps'        => $ecare_caps,
        'permissions' => $permissions,
        'avatar'      => !empty($custom_avatar) ? $custom_avatar : get_avatar_url($current_user->ID),
    ];

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

    $settings = get_option('ecare_settings', []);
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
    
    echo "<script>
      window.ecareConfig = " . json_encode([
          'apiUrl'           => esc_url_raw(ecare_adjust_url(rest_url('ecare/v1/'))),
          'nonce'            => wp_create_nonce('wp_rest'),
          'cssUrl'           => $css_url,
          'baseUrl'          => ecare_adjust_url(home_url('/ecare-portal')),
          'logoutUrl'        => ecare_adjust_url(home_url('/ecare-logout')),
          'wsUrl'            => 'http://localhost:3001',
          'logo'             => $settings['logo'] ?? esc_url_raw(get_option('ecare_auth_logo', '')),
          'bgImage'          => $settings['bgImage'] ?? esc_url_raw(get_option('ecare_auth_bg_image', '')),
          'siteName'         => $settings['siteName'] ?? get_bloginfo('name'),
          'siteAddress'      => $settings['siteAddress'] ?? '32 Doctors Road, City Center',
          'sitePhone'        => $settings['sitePhone'] ?? '+880 1234 567890',
          'siteEmail'        => $settings['siteEmail'] ?? 'info@ecare-management.com',
          'siteWebsite'      => $settings['siteWebsite'] ?? 'www.ecare-management.com',
          'isSetupCompleted' => $is_setup_completed,
          'user'             => $user_data,
          'settings'         => $client_settings
      ], JSON_UNESCAPED_SLASHES) . ";
    </script>\n";

    // Load Main JS bundle
    if ($js_file) {
        echo '<script type="module" src="' . esc_url($plugin_url . 'dist/' . $js_file) . '"></script>' . "\n";
    }
    
    // Call wp_footer to output footer scripts and tracking styles/fonts
    wp_footer();
  ?>

</body>
</html>
<?php
exit;
