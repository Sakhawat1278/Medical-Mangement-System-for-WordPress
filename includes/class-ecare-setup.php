<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * E-CARE Master Setup Page
 * Handles global configuration, branding, admin management, and system health.
 */
class ECARE_Setup {

    public function __construct() {
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_init', [$this, 'handle_actions']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_setup_scripts']);
        
        // WooCommerce order status updates listener
        add_action('woocommerce_order_status_changed', [$this, 'handle_wc_order_status_changed'], 10, 4);

        // WooCommerce native checkout custom overrides
        add_action('woocommerce_before_calculate_totals', [$this, 'handle_woocommerce_before_calculate_totals'], 10, 1);
        add_filter('woocommerce_cart_item_name', [$this, 'handle_woocommerce_cart_item_name'], 10, 3);
        add_action('woocommerce_checkout_create_order_line_item', [$this, 'handle_woocommerce_checkout_create_order_line_item'], 10, 4);
        add_action('woocommerce_checkout_order_created', [$this, 'handle_woocommerce_checkout_order_created'], 10, 1);

        // Allow SVG uploads in WordPress Media Library
        add_filter('upload_mimes', [$this, 'allow_svg_uploads']);
        add_filter('wp_check_filetype_and_ext', [$this, 'check_svg_filetype_and_ext'], 10, 4);
    }

    public function enqueue_setup_scripts($hook) {
        if (strpos($hook, 'ecare-setup') !== false) {
            wp_enqueue_media();
        }
    }

    public function register_settings() {
        register_setting('ecare_setup_group', 'ecare_auth_bg_image');
        register_setting('ecare_setup_group', 'ecare_auth_logo');
        register_setting('ecare_setup_group', 'ecare_license_key');
        register_setting('ecare_setup_group', 'ecare_primary_color');
        register_setting('ecare_setup_group', 'ecare_firebase_api_key');
        register_setting('ecare_setup_group', 'ecare_firebase_auth_domain');
        register_setting('ecare_setup_group', 'ecare_firebase_project_id');
        register_setting('ecare_setup_group', 'ecare_firebase_storage_bucket');
        register_setting('ecare_setup_group', 'ecare_firebase_messaging_sender_id');
        register_setting('ecare_setup_group', 'ecare_firebase_app_id');
    }

    public function handle_actions() {
        if (!current_user_can('manage_options')) return;

        $action_performed = false;

        // 1. Promote User to E-CARE Admin
        if (isset($_POST['ecare_promote_user']) && !empty($_POST['user_id'])) {
            check_admin_referer('ecare_manage_admins');
            $user_id = intval($_POST['user_id']);
            $user = get_user_by('id', $user_id);
            if ($user) {
                $user->add_role('ecare_admin');
                add_settings_error('ecare_setup', 'promoted', "User '{$user->display_name}' is now an E-CARE Dashboard Admin.", 'updated');
                $action_performed = true;
            }
        }

        // 2. Demote User
        if (isset($_POST['ecare_demote_user']) && !empty($_POST['user_id'])) {
            check_admin_referer('ecare_manage_admins');
            $user_id = intval($_POST['user_id']);
            $user = get_user_by('id', $user_id);
            if ($user) {
                $user->remove_role('ecare_admin');
                add_settings_error('ecare_setup', 'demoted', "E-CARE Admin role removed from '{$user->display_name}'.", 'updated');
                $action_performed = true;
            }
        }

        // 3. Repair Database
        if (isset($_POST['ecare_repair_db'])) {
            check_admin_referer('ecare_repair_db_nonce');
            ECARE_DB::create_tables();
            add_settings_error('ecare_setup', 'db_repaired', "Database tables synchronized and repaired successfully.", 'updated');
            $action_performed = true;
        }

        if ($action_performed) {
            set_transient('ecare_setup_errors', get_settings_errors('ecare_setup'), 30);
            wp_safe_redirect(admin_url('admin.php?page=ecare-setup&settings-updated=true'));
            exit;
        }
    }

    public function render_setup_page() {
        $bg_image = get_option('ecare_auth_bg_image');
        $logo     = get_option('ecare_auth_logo');
        $license  = get_option('ecare_license_key');
        $primary  = get_option('ecare_primary_color', '#1b3b2b');
        
        $ecare_admins = get_users(['role' => 'ecare_admin']);
        $all_users    = get_users(['number' => 100, 'role__not_in' => ['ecare_admin']]);

        // Health Check - MySQL database integrity check
        $missing = [];
        if (!ECARE_DB::is_healthy()) {
            $missing[] = 'mysql_db';
        }

        ?>
        <style>
            .ecare-setup-root {
                --e-p: <?php echo esc_attr($primary); ?>;
                --e-p-bg: #f0fdf4;
                --e-text: #1e293b;
                --e-muted: #64748b;
                --e-bg: #f8fafc;
                --e-border: #e2e8f0;
                
                font-family: inherit;
                color: var(--e-text);
                margin: 20px 20px 40px 0;
                max-width: 1200px;
            }

            .ecare-setup-root * { box-sizing: border-box; }

            .ecare-setup-root h1 {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--e-text);
                margin-bottom: 0.25rem;
                letter-spacing: -0.02em;
            }

            .ecare-setup-root p.subtitle {
                color: var(--e-muted);
                font-size: 0.875rem;
                margin-bottom: 2rem;
            }

            /* Minimal Tabs */
            .ecare-tabs {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                border-bottom: 1px solid var(--e-border);
                padding-bottom: 0;
            }
            .ecare-tab-item {
                padding: 0.75rem 1.25rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--e-muted);
                cursor: pointer;
                transition: all 0.2s;
                border-bottom: 2px solid transparent;
                background: none;
                border-top: none;
                border-left: none;
                border-right: none;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ecare-tab-item:hover { color: var(--e-text); }
            .ecare-tab-item.active {
                color: var(--e-p);
                border-bottom-color: var(--e-p);
            }
            .ecare-tab-item .dashicons { font-size: 18px; width: 18px; height: 18px; line-height: 18px; }

            /* Grid Layout */
            .ecare-setup-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 1.5rem;
            }

            /* Cards */
            .ecare-card {
                background: white;
                border: 1px solid var(--e-border);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                transition: border-color 0.2s;
            }
            .ecare-card:hover { border-color: var(--e-p); }
            .ecare-card h3 {
                font-size: 1rem;
                font-weight: 700;
                margin: 0 0 1.25rem 0;
                color: var(--e-text);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .ecare-card h3 .dashicons { color: var(--e-p); }

            /* Forms */
            .ecare-field { margin-bottom: 1.25rem; }
            .ecare-field label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--e-muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
            .ecare-input {
                width: 100%;
                padding: 0.6rem 1rem;
                border: 1px solid var(--e-border);
                border-radius: 8px;
                font-size: 0.875rem;
                color: var(--e-text);
                background: white;
                transition: all 0.2s;
            }
            .ecare-input:focus { border-color: var(--e-p); outline: none; box-shadow: 0 0 0 3px var(--e-p-bg); }

            .ecare-preview {
                width: 100%;
                height: 100px;
                background: var(--e-bg);
                border-radius: 10px;
                border: 1px dashed var(--e-border);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 0.75rem;
                overflow: hidden;
            }
            .ecare-preview img { max-height: 80%; width: auto; border-radius: 4px; }

            /* Buttons */
            .ecare-btn {
                background: var(--e-p);
                color: white;
                border: none;
                padding: 0.7rem 1.5rem;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ecare-btn:hover { background: #157359; transform: translateY(-1px); }
            .ecare-btn-outline {
                background: white;
                border: 1px solid var(--e-border);
                color: var(--e-muted);
                padding: 0.5rem 1rem;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 0.8125rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .ecare-btn-outline:hover { border-color: var(--e-p); color: var(--e-p); }

            /* Admin Rows */
            .ecare-admin-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem;
                border-radius: 10px;
                background: var(--e-bg);
                margin-bottom: 0.5rem;
            }
            .ecare-admin-avatar { width: 36px; height: 36px; border-radius: 8px; background: #e2e8f0; }
            .ecare-admin-info { flex: 1; }
            .ecare-admin-name { font-weight: 600; font-size: 0.875rem; margin: 0; }
            .ecare-admin-email { font-size: 0.75rem; color: var(--e-muted); margin: 0; }

            /* Shortcodes */
            .ecare-code {
                background: #f1f5f9;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-family: inherit;
                font-size: 0.8125rem;
                color: var(--e-text);
                border: 1px solid var(--e-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .ecare-code strong { color: var(--e-p); }

            /* Health Pulse */
            .ecare-pulse { width: 10px; height: 10px; border-radius: 50%; background: #10b981; position: relative; }
            .ecare-pulse::after {
                content: '';
                position: absolute;
                width: 100%; height: 100%;
                border-radius: 50%;
                background: inherit;
                animation: ecare-pulse-anim 2s infinite;
            }
            @keyframes ecare-pulse-anim { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
            .ecare-pulse.error { background: #ef4444; }

            /* Tab Visibility */
            .tab-pane { display: none; }
            .tab-pane.active { display: block; animation: ecare-fade-in 0.3s ease; }
            @keyframes ecare-fade-in { from { opacity: 0; } to { opacity: 1; } }
        </style>

        <div class="ecare-setup-root">
            <h1>E-CARE Master Setup</h1>
            <p class="subtitle">System architecture, branding, and administrative core settings.</p>

            <div class="ecare-tabs">
                <button class="ecare-tab-item active" onclick="ecSwitchTab('branding')"><span class="dashicons dashicons-art"></span> Identity</button>
                <button class="ecare-tab-item" onclick="ecSwitchTab('admins')"><span class="dashicons dashicons-admin-users"></span> Admins</button>
                <button class="ecare-tab-item" onclick="ecSwitchTab('system')"><span class="dashicons dashicons-shield"></span> Health</button>
                <button class="ecare-tab-item" onclick="ecSwitchTab('firebase')"><span class="dashicons dashicons-cloud"></span> Firebase</button>
                <button class="ecare-tab-item" onclick="ecSwitchTab('public')"><span class="dashicons dashicons-editor-code"></span> Shortcuts</button>
            </div>

            <?php 
                $errors = get_transient('ecare_setup_errors');
                if ($errors) {
                    foreach ($errors as $error) {
                        echo '<div class="notice notice-'.esc_attr($error['type']).' is-dismissible" style="border-radius:8px; margin-bottom:1.5rem;"><p>'.esc_html($error['message']).'</p></div>';
                    }
                    delete_transient('ecare_setup_errors');
                }
            ?>

            <div class="ecare-setup-grid">
                
                <div class="ecare-main-column">
                    <!-- Tab: Branding -->
                    <div id="pane-branding" class="tab-pane active">
                        <div class="ecare-card">
                            <h3><span class="dashicons dashicons-art"></span> Visual Identity</h3>
                            <form method="post" action="options.php">
                                <?php settings_fields('ecare_setup_group'); ?>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                    <div class="ecare-field">
                                        <label>Portal Logo</label>
                                        <div class="ecare-preview" id="logo_prev">
                                            <?php if ($logo): ?><img src="<?php echo esc_url($logo); ?>" /><?php else: ?><span class="dashicons dashicons-image-filter"></span><?php endif; ?>
                                        </div>
                                        <div style="display:flex; gap:8px;">
                                            <input type="text" name="ecare_auth_logo" id="ecare_auth_logo" value="<?php echo esc_attr($logo); ?>" class="ecare-input" />
                                            <button type="button" class="ecare-btn-outline ec-upload" data-target="ecare_auth_logo" data-preview="logo_prev">Browse</button>
                                        </div>
                                    </div>
                                    <div class="ecare-field">
                                        <label>Login Background</label>
                                        <div class="ecare-preview" id="bg_prev">
                                            <?php if ($bg_image): ?><img src="<?php echo esc_url($bg_image); ?>" /><?php else: ?><span class="dashicons dashicons-format-image"></span><?php endif; ?>
                                        </div>
                                        <div style="display:flex; gap:8px;">
                                            <input type="text" name="ecare_auth_bg_image" id="ecare_auth_bg_image" value="<?php echo esc_attr($bg_image); ?>" class="ecare-input" />
                                            <button type="button" class="ecare-btn-outline ec-upload" data-target="ecare_auth_bg_image" data-preview="bg_prev">Browse</button>
                                        </div>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--e-border);">
                                    <div class="ecare-field">
                                        <label>Primary Brand Color</label>
                                        <div style="display:flex; gap:10px; align-items:center;">
                                            <input type="color" name="ecare_primary_color" value="<?php echo esc_attr($primary); ?>" style="width:40px; height:40px; border:none; padding:0; background:none; cursor:pointer;" />
                                            <input type="text" value="<?php echo esc_attr($primary); ?>" class="ecare-input" readonly />
                                        </div>
                                    </div>
                                    <div class="ecare-field">
                                        <label>Infrastructure Key</label>
                                        <input type="password" name="ecare_license_key" value="<?php echo esc_attr($license); ?>" class="ecare-input" placeholder="••••••••••••••••" />
                                    </div>
                                </div>
                                <div style="margin-top: 1.5rem; text-align: right;">
                                    <button type="submit" class="ecare-btn">Save Identity</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Tab: Admins -->
                    <div id="pane-admins" class="tab-pane">
                        <div class="ecare-card">
                            <h3><span class="dashicons dashicons-admin-users"></span> Dashboard Permissions</h3>
                            <p style="font-size: 0.8125rem; color: var(--e-muted); margin-bottom: 1.5rem;">Administrators listed here have full clinical access but are restricted from core WordPress settings.</p>
                            
                            <div style="margin-bottom: 2rem;">
                                <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 1rem; display: block;">Active Admins</label>
                                <?php if ($ecare_admins): ?>
                                    <?php foreach ($ecare_admins as $admin): ?>
                                        <div class="ecare-admin-item">
                                            <div class="ecare-admin-avatar">
                                                <img src="<?php echo get_avatar_url($admin->ID); ?>" style="width:100%; height:100%; border-radius:inherit;" />
                                            </div>
                                            <div class="ecare-admin-info">
                                                <p class="ecare-admin-name"><?php echo esc_html($admin->display_name); ?></p>
                                                <p class="ecare-admin-email"><?php echo esc_html($admin->user_email); ?></p>
                                            </div>
                                            <form method="post" style="margin:0;">
                                                <?php wp_nonce_field('ecare_manage_admins'); ?>
                                                <input type="hidden" name="user_id" value="<?php echo $admin->ID; ?>" />
                                                <button type="submit" name="ecare_demote_user" class="ecare-btn-outline" style="padding: 4px 10px; font-size: 11px;">Revoke</button>
                                            </form>
                                        </div>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <div style="padding: 2rem; background: var(--e-bg); border-radius: 12px; text-align: center; border: 1px dashed var(--e-border);">
                                        <p style="font-size: 0.8125rem; color: var(--e-muted); margin:0;">No dedicated dashboard admins assigned.</p>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <div style="background: var(--e-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--e-border);">
                                <h4 style="margin:0 0 1rem 0; font-size:0.9rem;">Elevate New Admin</h4>
                                <form method="post" style="display: flex; gap: 10px;">
                                    <?php wp_nonce_field('ecare_manage_admins'); ?>
                                    <select name="user_id" class="ecare-input" style="flex:1;">
                                        <option value="">Select candidate...</option>
                                        <?php foreach ($all_users as $u): ?>
                                            <option value="<?php echo $u->ID; ?>"><?php echo esc_html($u->display_name); ?> (<?php echo esc_html($u->user_email); ?>)</option>
                                        <?php endforeach; ?>
                                    </select>
                                    <button type="submit" name="ecare_promote_user" class="ecare-btn">Promote</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: System Health -->
                    <div id="pane-system" class="tab-pane">
                        <div class="ecare-card">
                            <h3><span class="dashicons dashicons-shield"></span> Infrastructure Integrity</h3>
                            
                            <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: var(--e-bg); border-radius: 12px; margin-bottom: 1.5rem;">
                                <div class="ecare-pulse <?php echo !empty($missing) ? 'error' : ''; ?>"></div>
                                <div style="flex: 1;">
                                    <h4 style="margin:0 0 4px 0; font-size:0.95rem;">Database Health</h4>
                                    <p style="margin:0; font-size:0.8125rem; color: var(--e-muted);">
                                        <?php if (empty($missing)): ?>
                                            MySQL Database clinical infrastructure is connected and healthy.
                                        <?php else: ?>
                                            MySQL database tables are missing or not writable. Please click Repair Sync to restore them.
                                        <?php endif; ?>
                                    </p>
                                </div>
                                <form method="post">
                                    <?php wp_nonce_field('ecare_repair_db_nonce'); ?>
                                    <button type="submit" name="ecare_repair_db" class="ecare-btn" style="background:#1e293b;">Repair Sync</button>
                                </form>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div style="padding: 1rem; border: 1px solid var(--e-border); border-radius: 10px; text-align: center;">
                                    <div style="font-weight: 700; color: var(--e-p);">PHP 8.2+</div>
                                    <div style="font-size: 0.7rem; color: var(--e-muted); text-transform: uppercase; font-weight: 800;">Runtime</div>
                                </div>
                                <div style="padding: 1rem; border: 1px solid var(--e-border); border-radius: 10px; text-align: center;">
                                    <div style="font-weight: 700; color: var(--e-p);">SQL 8.0</div>
                                    <div style="font-size: 0.7rem; color: var(--e-muted); text-transform: uppercase; font-weight: 800;">Storage</div>
                                </div>
                                <div style="padding: 1rem; border: 1px solid var(--e-border); border-radius: 10px; text-align: center;">
                                    <div style="font-weight: 700; color: var(--e-p);">Active</div>
                                    <div style="font-size: 0.7rem; color: var(--e-muted); text-transform: uppercase; font-weight: 800;">Security</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Shortcodes -->
                    <div id="pane-public" class="tab-pane">
                        <div class="ecare-card">
                            <h3><span class="dashicons dashicons-editor-code"></span> Integration Shortcodes</h3>
                            <p style="font-size: 0.8125rem; color: var(--e-muted); margin-bottom: 1.5rem;">Embed these clinical modules anywhere on your public website.</p>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div style="padding: 1.25rem; border: 1px solid var(--e-border); border-radius: 12px;">
                                    <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.75rem; display: block;">Patient Registration</label>
                                    <div class="ecare-code">
                                        <strong>[ecare_registration]</strong>
                                        <button class="ec-copy" onclick="ecCopy(this)">Copy</button>
                                    </div>
                                </div>
                                <div style="padding: 1.25rem; border: 1px solid var(--e-border); border-radius: 12px;">
                                    <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.75rem; display: block;">Login Gateway</label>
                                    <div class="ecare-code">
                                        <strong>[ecare_login_form]</strong>
                                        <button class="ec-copy" onclick="ecCopy(this)">Copy</button>
                                    </div>
                                </div>
                                <div style="padding: 1.25rem; border: 1px solid var(--e-border); border-radius: 12px;">
                                    <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.75rem; display: block;">Smart Booking</label>
                                    <div class="ecare-code">
                                        <strong>[ecare_booking]</strong>
                                        <button class="ec-copy" onclick="ecCopy(this)">Copy</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Tab: Firebase -->
                    <div id="pane-firebase" class="tab-pane">
                        <div class="ecare-card">
                            <h3><span class="dashicons dashicons-cloud"></span> Firebase Realtime Database & Cloud Firestore</h3>
                            <p style="font-size: 0.8125rem; color: var(--e-muted); margin-bottom: 1.5rem;">Configure your Firebase project settings to enable Firestore database services, real-time consultation features, scheduling, and billing logs.</p>
                            <form method="post" action="options.php">
                                <?php settings_fields('ecare_setup_group'); ?>
                                <div class="ecare-field">
                                    <label>Firebase API Key</label>
                                    <input type="text" name="ecare_firebase_api_key" value="<?php echo esc_attr(get_option('ecare_firebase_api_key')); ?>" class="ecare-input" placeholder="AIzaSy..." />
                                </div>
                                <div class="ecare-field">
                                    <label>Firebase Auth Domain</label>
                                    <input type="text" name="ecare_firebase_auth_domain" value="<?php echo esc_attr(get_option('ecare_firebase_auth_domain')); ?>" class="ecare-input" placeholder="project-id.firebaseapp.com" />
                                </div>
                                <div class="ecare-field">
                                    <label>Firebase Project ID</label>
                                    <input type="text" name="ecare_firebase_project_id" value="<?php echo esc_attr(get_option('ecare_firebase_project_id')); ?>" class="ecare-input" placeholder="project-id" />
                                </div>
                                <div class="ecare-field">
                                    <label>Firebase Storage Bucket</label>
                                    <input type="text" name="ecare_firebase_storage_bucket" value="<?php echo esc_attr(get_option('ecare_firebase_storage_bucket')); ?>" class="ecare-input" placeholder="project-id.appspot.com" />
                                </div>
                                <div class="ecare-field">
                                    <label>Firebase Messaging Sender ID</label>
                                    <input type="text" name="ecare_firebase_messaging_sender_id" value="<?php echo esc_attr(get_option('ecare_firebase_messaging_sender_id')); ?>" class="ecare-input" placeholder="123456789012" />
                                </div>
                                <div class="ecare-field">
                                    <label>Firebase App ID</label>
                                    <input type="text" name="ecare_firebase_app_id" value="<?php echo esc_attr(get_option('ecare_firebase_app_id')); ?>" class="ecare-input" placeholder="1:123456789012:web:abcd1234efgh" />
                                </div>
                                <div style="margin-top: 1.5rem; text-align: right;">
                                    <button type="submit" class="ecare-btn">Save Firebase Config</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="ecare-side-column">
                    <div class="ecare-card" style="background: var(--e-p); color: white; border: none;">
                        <h3 style="color: white; margin-bottom: 0.75rem;"><span class="dashicons dashicons-external" style="color:white;"></span> Quick Access</h3>
                        <p style="font-size: 0.8125rem; opacity: 0.9; margin-bottom: 1.25rem;">Navigate to the main clinical command center.</p>
                        <a href="<?php echo ecare_adjust_url(admin_url('admin.php?page=e-care-management')); ?>" class="ecare-btn" style="background: white; color: var(--e-p); width: 100%; justify-content: center;">Open Dashboard</a>
                    </div>
                    
                    <div class="ecare-card">
                        <h3><span class="dashicons dashicons-info"></span> Statistics</h3>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; padding: 0.5rem 0; border-bottom: 1px solid var(--e-bg);">
                            <span style="color: var(--e-muted);">Clinical Staff</span>
                            <span style="font-weight: 700;"><?php echo count(ECARE_DB_Client::select_all('ecare_staff')); ?></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; padding: 0.5rem 0; border-bottom: 1px solid var(--e-bg);">
                            <span style="color: var(--e-muted);">Registered Patients</span>
                            <span style="font-weight: 700;"><?php echo count(ECARE_DB_Client::select_all('ecare_patients')); ?></span>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <script>
            function ecSwitchTab(id) {
                document.querySelectorAll('.ecare-tab-item').forEach(b => b.classList.remove('active'));
                event.currentTarget.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.getElementById('pane-' + id).classList.add('active');
            }

            function ecCopy(btn) {
                const text = btn.previousElementSibling.innerText;
                navigator.clipboard.writeText(text);
                const original = btn.innerText;
                btn.innerText = 'Copied';
                setTimeout(() => btn.innerText = original, 2000);
            }

            jQuery(document).ready(function($){
                $('.ec-upload').click(function(e) {
                    e.preventDefault();
                    var button = $(this);
                    var target = $('#' + button.data('target'));
                    var prevId = button.data('preview');

                    var frame = wp.media({
                        title: 'E-CARE Identity Asset',
                        button: { text: 'Use Asset' },
                        multiple: false
                    });

                    frame.on('select', function() {
                        var asset = frame.state().get('selection').first().toJSON();
                        target.val(asset.url);
                        if (prevId) {
                            $('#' + prevId).html('<img src="' + asset.url + '" />');
                        }
                    });

                    frame.open();
                });
            });
        </script>
        <?php
    }

    public function handle_wc_order_status_changed($order_id, $old_status, $new_status, $order) {
        $is_paid_status = in_array($new_status, array('processing', 'completed'));
        
        $billing_id = $order->get_meta('_ecare_billing_id');
        if (!$billing_id) {
            return;
        }

        $payment_type = $order->get_meta('_ecare_payment_type');
        
        $billing = ECARE_DB_Client::select_one('ecare_billing', $billing_id);
        if (!$billing) {
            return;
        }

        // ─── Remaining Balance Payment Order ───────────────────────
        if ($payment_type === 'remaining_balance') {
            if ($is_paid_status) {
                $order_total = (float)$order->get_total();
                
                $history = json_decode($billing->paymentHistory ?? '', true) ?: array();
                if (!isset($history['installments'])) {
                    $history['installments'] = array();
                }

                // Check for duplicate status changes
                $already_added = false;
                foreach ($history['installments'] as $inst) {
                    if (isset($inst['order_id']) && intval($inst['order_id']) === intval($order_id)) {
                        $already_added = true;
                        break;
                    }
                }

                $clean_method = function_exists('ecare_get_clean_payment_method_label')
                    ? ecare_get_clean_payment_method_label('', $order)
                    : ($order->get_payment_method_title() ?: 'Online Payment');

                if (!$already_added) {
                    $history['installments'][] = array(
                        'order_id' => $order_id,
                        'amount' => $order_total,
                        'date' => current_time('mysql'),
                        'method' => $clean_method
                    );

                    $new_paid_amount = (float)($billing->paidAmount ?? 0) + $order_total;
                    $new_status = ($new_paid_amount >= (float)($billing->amount ?? 0)) ? 'Paid' : 'Partially Paid';

                    ECARE_DB_Client::update('ecare_billing', $billing_id, array(
                        'paidAmount' => $new_paid_amount,
                        'status' => $new_status,
                        'method' => $clean_method,
                        'paymentHistory' => json_encode($history)
                    ));

                    // Update linked bookings
                    $payment_status = ($new_status === 'Paid') ? 'Paid' : 'Partially Paid';
                    $booking_status = ($new_status === 'Paid') ? 'Confirmed' : 'Pending';

                    if (!empty($billing->appointmentId)) {
                        $appointment = ECARE_DB_Client::select_one('ecare_appointments', $billing->appointmentId);
                        $appointment_update = array('paymentStatus' => $payment_status, 'status' => $booking_status);
                        if ($new_status === 'Paid' && $appointment && (($appointment->mode ?? '') === 'Instant Call')) {
                            $appointment_update['status'] = 'Query';
                            $appointment_update['query_started_at'] = current_time('mysql', 1);
                        }
                        ECARE_DB_Client::update('ecare_appointments', $billing->appointmentId, $appointment_update);
                    }
                    if (!empty($billing->careProviderBookingId)) {
                        ECARE_DB_Client::update('ecare_care_provider_bookings', $billing->careProviderBookingId, array('paymentStatus' => $payment_status, 'status' => $booking_status, 'paidAmount' => $new_paid_amount));
                    }
                    if (!empty($billing->labOrderId)) {
                        ECARE_DB_Client::update('ecare_lab_orders', $billing->labOrderId, array('payment_status' => ($payment_status === 'Partially Paid' ? 'Partial' : $payment_status), 'status' => $booking_status));
                    }
                }
            }
            return;
        }

        // ─── Initial Checkout Order ───────────────────────────────
        $is_partial = $order->get_meta('_ecare_is_partial_payment') === 'yes';
        $full_amount = (float)$order->get_meta('_ecare_full_amount') ?: (float)$order->get_total();
        
        $payment_status = $is_paid_status ? ($is_partial ? 'Partially Paid' : 'Paid') : 'Unpaid';
        $booking_status = $is_paid_status ? 'Confirmed' : 'Pending';
        
        $total_amount = (float)$order->get_total();
        $clean_method = function_exists('ecare_get_clean_payment_method_label')
            ? ecare_get_clean_payment_method_label('', $order)
            : ($order->get_payment_method_title() ?: 'Online Payment');

        // Installment details
        $history = json_decode($billing->paymentHistory ?? '', true) ?: array();
        if (!isset($history['installments'])) {
            $history['installments'] = array();
        }

        if ($is_paid_status) {
            $already_added = false;
            foreach ($history['installments'] as $inst) {
                if (isset($inst['order_id']) && intval($inst['order_id']) === intval($order_id)) {
                    $already_added = true;
                    break;
                }
            }
            if (!$already_added) {
                $history['installments'][] = array(
                    'order_id' => $order_id,
                    'amount' => $total_amount,
                    'date' => current_time('mysql'),
                    'method' => $clean_method
                );
            }
        }

        ECARE_DB_Client::update('ecare_billing', $billing_id, array(
            'status' => $is_paid_status ? ($is_partial ? 'Partially Paid' : 'Paid') : 'Pending',
            'paidAmount' => $is_paid_status ? $total_amount : 0.0,
            'method' => $clean_method,
            'paymentHistory' => json_encode($history)
        ));

        // Update booking tables
        $bookings_data_raw = $order->get_meta('_ecare_bookings_data');
        $bookings_data = json_decode(wp_unslash($bookings_data_raw), true);
        if (is_array($bookings_data)) {
            foreach ($bookings_data as $b) {
                if ($b['type'] === 'Lab Test') {
                    ECARE_DB_Client::update('ecare_lab_orders', $b['id'], array(
                        'payment_status' => $payment_status === 'Partially Paid' ? 'Partial' : $payment_status,
                        'status' => $booking_status
                    ));
                    
                } else if ($b['type'] === 'Doctor Appointment') {
                        ECARE_DB_Client::update('ecare_appointments', $b['id'], array(
                            'paymentStatus' => $payment_status,
                            'status' => $booking_status,
                            'paymentMethod' => $clean_method
                    ));
                    
                } else if ($b['type'] === 'Instant Doctor Call') {
                        ECARE_DB_Client::update('ecare_appointments', $b['id'], array(
                            'paymentStatus' => $payment_status,
                            'status' => $is_paid_status ? 'Query' : 'Pending',
                            'paymentMethod' => $clean_method,
                            'query_started_at' => $is_paid_status ? current_time('mysql', 1) : null
                    ));
                    
                } else if ($b['type'] === 'Care Provider Visit') {
                    ECARE_DB_Client::update('ecare_care_provider_bookings', $b['id'], array(
                        'paymentStatus' => $payment_status,
                        'status' => $booking_status,
                        'paidAmount' => $is_paid_status ? ($is_partial ? ($total_amount / $full_amount) * (float)$b['price'] : (float)$b['price']) : 0.0,
                        'paymentMethod' => $clean_method
                    ));
                }
            }
        }
    }

    public function handle_woocommerce_calculate_totals($cart) {
        if (is_admin() && !defined('DOING_AJAX')) {
            return;
        }
        foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
            if (isset($cart_item['ecare_custom_price'])) {
                $cart_item['data']->set_price($cart_item['ecare_custom_price']);
            }
        }
    }

    public function handle_woocommerce_cart_item_name($product_name, $cart_item, $cart_item_key) {
        if (isset($cart_item['ecare_custom_name'])) {
            return $cart_item['ecare_custom_name'];
        }
        return $product_name;
    }

    public function handle_woocommerce_checkout_create_order_line_item($item, $cart_item_key, $values, $order) {
        if (isset($values['ecare_custom_name'])) {
            $item->set_name($values['ecare_custom_name']);
        }
        if (isset($values['ecare_booking_data'])) {
            $item->add_meta_data('_ecare_booking_data', json_encode($values['ecare_booking_data']));
        }
    }

    public function handle_woocommerce_checkout_order_created($order) {
        // Prevent duplicate creation if checkout already generated this
        if ($order->get_meta('_ecare_billing_id')) {
            return;
        }

        $user_id = $order->get_customer_id();
        $user = get_userdata($user_id);
        $patient_name = $user ? $user->display_name : 'Guest Patient';

        $createdBookings = array();

        foreach ($order->get_items() as $item_id => $item) {
            $booking_data_raw = $item->get_meta('_ecare_booking_data');
            if (empty($booking_data_raw)) {
                continue;
            }

            $booking_data = json_decode(wp_unslash($booking_data_raw), true);
            if (!is_array($booking_data)) {
                continue;
            }

            $item_price = (float)$item->get_total();
            $form = $booking_data['form_fields'] ?? array();
            
            $booking_id = null;
            $booking_type = '';

            $clean_method = function_exists('ecare_get_clean_payment_method_label')
                ? ecare_get_clean_payment_method_label('', $order)
                : ($order->get_payment_method_title() ?: 'Online Payment');

            if ($booking_data['type'] === 'lab_test') {
                $booking_type = 'Lab Test';
                $data = array(
                    'patientName' => $patient_name,
                    'patient_id' => $user_id,
                    'patient_user_id' => $user_id,
                    'testName' => $booking_data['name'],
                    'test_id' => $booking_data['testId'] ?? 0,
                    'sample_type' => $booking_data['sample_type'] ?? 'Blood',
                    'priority' => 'Normal',
                    'order_date' => $form['scheduledDate'] ?? current_time('Y-m-d'),
                    'price' => $item_price,
                    'payment_status' => 'Unpaid',
                    'status' => 'Pending',
                    'notes' => $form['clinicalNotes'] ?? ''
                );
                $booking_id = ECARE_DB_Client::insert('ecare_lab_orders', $data);
                
            } else if ($booking_data['type'] === 'doctor_appointment') {
                $booking_type = 'Doctor Appointment';
                $data = array(
                    'patientName' => $patient_name,
                    'patient_id' => $user_id,
                    'patient_user_id' => $user_id,
                    'doctorName' => $booking_data['doctor']['name'] ?? 'Unassigned Doctor',
                    'date' => $form['bookingDate'] ?? current_time('Y-m-d'),
                    'time' => $form['bookingTime'] ?? '',
                    'specialty' => $booking_data['doctor']['specialty'] ?? $booking_data['doctor']['specialization'] ?? 'General',
                    'service' => 'Doctor Consultation',
                    'mode' => $form['bookingMode'] ?? 'Video Consult',
                    'status' => 'Pending',
                    'paymentStatus' => 'Unpaid',
                    'paymentMethod' => $clean_method,
                    'type' => 'Doctor Appointment',
                    'fee' => $item_price,
                    'notes' => $form['symptoms'] ?? '',
                    'booking_date' => current_time('mysql')
                );
                $booking_id = ECARE_DB_Client::insert('ecare_appointments', $data);

            } else if ($booking_data['type'] === 'instant_call') {
                $booking_type = 'Instant Doctor Call';
                $data = array(
                    'patientName' => $patient_name,
                    'patient_id' => $user_id,
                    'patient_user_id' => $user_id,
                    'doctorName' => $booking_data['doctor']['name'] ?? 'On-Call Doctor',
                    'date' => current_time('Y-m-d'),
                    'time' => current_time('H:i'),
                    'specialty' => $booking_data['doctor']['specialty'] ?? $booking_data['doctor']['specialization'] ?? 'General Physician',
                    'service' => 'Instant Consultation',
                    'mode' => 'Instant Call',
                    'status' => 'Pending',
                    'paymentStatus' => 'Unpaid',
                    'paymentMethod' => $clean_method,
                    'type' => 'Instant Doctor Call',
                    'fee' => $item_price,
                    'notes' => $form['symptoms'] ?? 'Immediate medical consultation requested',
                    'booking_date' => current_time('mysql')
                );
                $booking_id = ECARE_DB_Client::insert('ecare_appointments', $data);

            } else if ($booking_data['type'] === 'care_provider') {
                $booking_type = 'Care Provider Visit';
                $data = array(
                    'patientName' => $patient_name,
                    'patient_id' => $user_id,
                    'patient_user_id' => $user_id,
                    'providerName' => $booking_data['provider']['name'] ?? 'Care Provider',
                    'providerType' => $booking_data['provider']['type'] ?? 'Nurse',
                    'serviceType' => $booking_data['serviceType'] ?? 'Home Care',
                    'scheduledDate' => $form['startDate'] ?? current_time('Y-m-d'),
                    'shift' => $form['shift'] ?? 'Day',
                    'duration' => $form['duration'] ?? '1 Day',
                    'price' => $item_price,
                    'paidAmount' => 0.0,
                    'paymentStatus' => 'Unpaid',
                    'paymentMethod' => $clean_method,
                    'status' => 'Pending',
                    'notes' => $form['patientCondition'] ?? ''
                );
                $booking_id = ECARE_DB_Client::insert('ecare_care_provider_bookings', $data);
            }

            if ($booking_id) {
                $createdBookings[] = array(
                    'id' => $booking_id,
                    'type' => $booking_type,
                    'name' => $booking_data['name'] ?? '',
                    'price' => $item_price
                );
            }
        }

        if (empty($createdBookings)) {
            return;
        }

        $order_total = (float)$order->get_total();
        $is_partial = $order->get_meta('_ecare_is_partial_payment') === 'yes';
        $full_amount = (float)$order->get_meta('_ecare_full_amount') ?: $order_total;
        $clean_method = function_exists('ecare_get_clean_payment_method_label')
            ? ecare_get_clean_payment_method_label('', $order)
            : ($order->get_payment_method_title() ?: 'Online Payment');

        $billingPayload = array(
            'invoiceNo' => 'INV-' . strtoupper(wp_generate_password(8, false)),
            'patientName' => $patient_name,
            'service' => count($createdBookings) > 1 ? 'Multiple Services' : ($createdBookings[0]['type'] ?? 'Medical Service'),
            'amount' => $full_amount,
            'paidAmount' => 0.0,
            'discount' => 0.0,
            'tax' => 0.0,
            'status' => 'Pending',
            'date' => current_time('Y-m-d'),
            'dueDate' => current_time('Y-m-d'),
            'method' => $clean_method,
            'methodType' => 'WooCommerce Gateway',
            'paymentHistory' => json_encode(array(
                'order_id' => $order->get_id(),
                'is_partial' => $is_partial,
                'full_amount' => $full_amount,
                'bookings' => $createdBookings
            ))
        );

        $firstLab = null;
        $firstAppt = null;
        $firstCP = null;
        foreach ($createdBookings as $cb) {
            if ($cb['type'] === 'Lab Test') $firstLab = $cb['id'];
            if (in_array($cb['type'], array('Doctor Appointment', 'Instant Doctor Call'))) $firstAppt = $cb['id'];
            if ($cb['type'] === 'Care Provider Visit') $firstCP = $cb['id'];
        }
        if ($firstLab) $billingPayload['labOrderId'] = $firstLab;
        if ($firstAppt) $billingPayload['appointmentId'] = $firstAppt;
        if ($firstCP) $billingPayload['careProviderBookingId'] = $firstCP;

        $billing_id = ECARE_DB_Client::insert('ecare_billing', $billingPayload);

        $order->update_meta_data('_ecare_billing_id', $billing_id);
        $order->update_meta_data('_ecare_booking_ids', json_encode(wp_list_pluck($createdBookings, 'id')));
        $order->update_meta_data('_ecare_bookings_data', json_encode($createdBookings));
        $order->save();
    }

    public function allow_svg_uploads($mimes) {
        $mimes['svg'] = 'image/svg+xml';
        $mimes['svgz'] = 'image/svg+xml';
        return $mimes;
    }

    public function check_svg_filetype_and_ext($data, $file, $filename, $mimes) {
        $filetype = wp_check_filetype($filename, $mimes);
        if ($filetype['ext'] === 'svg') {
            $data['ext'] = 'svg';
            $data['type'] = 'image/svg+xml';
        }
        return $data;
    }
}
