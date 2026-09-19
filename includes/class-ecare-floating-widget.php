<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Renders a modern, interactive, and professional floating instant call widget globally in the site footer.
 * Allows users to quickly initiate instant video consultations with online doctors.
 */
class ECARE_FloatingWidget {

    public function __construct() {
        // Enqueue only on public frontend pages
        add_action('wp_footer', [$this, 'render_widget']);
    }

    public function render_widget() {
        // Don't render in admin panel to prevent distraction
        if (is_admin()) {
            return;
        }

        global $wpdb;
        $settings = get_option('ecare_settings');
        if (!is_array($settings)) {
            $settings = [];
        }

        // ── Admin toggle: respect the "Floating Instant Call Widget" setting ──
        // Default to enabled (true) when the key has never been saved yet.
        $widget_enabled = isset($settings['floatingWidgetEnabled'])
            ? (bool) $settings['floatingWidgetEnabled']
            : true;

        if (!$widget_enabled) {
            return;
        }

        // ── Role guard: show only to guests OR patients ──
        // Any other logged-in role (doctor, ecare_admin, administrator, staff, etc.)
        // should NOT see the widget — they already have dashboard access.
        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            $roles = (array) $user->roles;
            // Allow only if the user's roles include exactly 'ecare_patient' (and nothing elevated)
            $allowed_roles    = ['ecare_patient'];
            $has_patient_role = !empty(array_intersect($allowed_roles, $roles));
            if (!$has_patient_role) {
                return;
            }
        }

        // Configuration values
        $primary_color = !empty($settings['primaryColor']) ? $settings['primaryColor'] : '#1b3b2b';
        $fee = isset($settings['instantCallFee']) ? intval($settings['instantCallFee']) : 500;
        $instant_booking_page_id = get_option('ecare_instant_booking_page_id');
        $destination_url = $instant_booking_page_id ? get_permalink($instant_booking_page_id) : home_url('/ecare-instant-booking');

        // Fetch active specialties ONLY from doctors who currently have instantCallStatus === 'Active'
        $specialities_list = [];
        $has_active_instant_doctors = false;

        if (class_exists('ECARE_DB_Client')) {
            $all_staff = ECARE_DB_Client::select_all('ecare_staff');
            $active_specs_set = [];
            $has_general = false;

            foreach ($all_staff as $staff_member) {
                $role = isset($staff_member->role) ? $staff_member->role : '';
                $instant_status = isset($staff_member->instantCallStatus) 
                    ? $staff_member->instantCallStatus 
                    : (isset($staff_member->instant_call_status) ? $staff_member->instant_call_status : '');
                $status = isset($staff_member->status) ? $staff_member->status : '';

                if ($role === 'doctor' && $instant_status === 'Active' && !in_array($status, ['Inactive', 'Pending'], true)) {
                    $has_active_instant_doctors = true;

                    // Extract doctor specialties
                    $spec_field = '';
                    if (!empty($staff_member->specialization)) $spec_field = $staff_member->specialization;
                    elseif (!empty($staff_member->specialty)) $spec_field = $staff_member->specialty;
                    elseif (!empty($staff_member->speciality)) $spec_field = $staff_member->speciality;

                    $doctor_specs = [];
                    if (is_array($spec_field)) {
                        $doctor_specs = $spec_field;
                    } elseif (is_string($spec_field)) {
                        $spec_str = trim($spec_field);
                        if (strpos($spec_str, '[') === 0 || strpos($spec_str, '{') === 0) {
                            $decoded = json_decode($spec_str, true);
                            if (is_array($decoded)) {
                                $doctor_specs = $decoded;
                            }
                        }
                        if (empty($doctor_specs)) {
                            $doctor_specs = array_map('trim', explode(',', $spec_str));
                        }
                    }

                    $doctor_specs = array_filter(array_map('trim', $doctor_specs));
                    if (empty($doctor_specs)) {
                        $has_general = true;
                    } else {
                        foreach ($doctor_specs as $s_name) {
                            $s_lower = strtolower($s_name);
                            if (in_array($s_lower, ['general', 'general physician', 'general practice', 'general medicine'], true)) {
                                $has_general = true;
                            } else {
                                $active_specs_set[$s_name] = $s_name;
                            }
                        }
                    }
                }
            }

            if ($has_general) {
                $specialities_list[] = (object) ['name' => 'General Medicine'];
            }

            foreach ($active_specs_set as $s_name) {
                $specialities_list[] = (object) ['name' => $s_name];
            }
        }

        // Convert Hex to RGBA for shadows
        list($r, $g, $b) = sscanf($primary_color, "#%02x%02x%02x");
        $shadow_rgba = "rgba($r, $g, $b, 0.4)";
        $hover_rgba  = "rgba($r, $g, $b, 0.1)";
        ?>

        
        <!-- E-CARE Floating Instant Call Widget -->
        <div id="ecare-floating-widget" class="ecare-fw-container">
            
            <!-- Floating Text Tooltip/Label -->
            <div class="ecare-fw-label">
                <span class="ecare-fw-label-pulse"></span>
                <span>Talk to a Doctor Now (5 mins)</span>
            </div>

            <!-- Floating Trigger Button -->
            <button class="ecare-fw-trigger"
                aria-label="Start Instant Doctor Call"
                style="--accent-color:<?php echo esc_attr($primary_color); ?>;--accent-shadow:<?php echo esc_attr($shadow_rgba); ?>;--accent-hover:<?php echo esc_attr($hover_rgba); ?>;"
            >
                <!-- Outer Pulsing Circles -->
                <span class="ecare-fw-ripple"></span>
                <!-- Phone/Call icon -->
                <svg class="ecare-fw-icon" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="display:block;width:24px;height:24px;color:#fff;stroke:#fff;">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" style="stroke:#ffffff;"></path>
                </svg>
                <!-- Online Status badge -->
                <span class="ecare-fw-badge"></span>
            </button>

            <!-- Expanded Consultation Panel -->
            <div class="ecare-fw-panel">
                <!-- Header Banner -->
                <div class="ecare-fw-header">
                    <div class="ecare-fw-header-title">
                        <span class="ecare-fw-live-signal"></span>
                        <h4>Instant Consultation</h4>
                    </div>
                    <p>Connect with a certified doctor in 5 minutes</p>
                    <button class="ecare-fw-close-btn" aria-label="Close panel" style="all:unset;box-sizing:border-box;position:absolute;top:10px;right:12px;width:24px;height:24px;text-align:center;line-height:24px;background:rgba(255,255,255,0.15);border-radius:50%;color:rgba(255,255,255,0.9);font-size:16px;font-weight:400;cursor:pointer;z-index:10;padding:0;margin:0;">&times;</button>
                </div>

                <!-- Panel Body -->
                <div class="ecare-fw-body">
                    <p class="ecare-fw-desc">
                        Get immediate medical assistance via safe and secure video consultation. Speak directly with a clinical practitioner.
                    </p>

                    <!-- Fee Badge -->
                    <div class="ecare-fw-fee-row">
                        <span class="ecare-fw-fee-label">Consultation Fee:</span>
                        <span class="ecare-fw-fee-val">৳<?php echo esc_html($fee); ?></span>
                    </div>

                    <?php if (!empty($specialities_list)): ?>
                        <?php $first_spec = $specialities_list[0]->name; ?>
                        <!-- Specialty Selector Input -->
                        <div class="ecare-fw-select-group">
                            <label>Select Specialty</label>
                            <div class="ecare-fw-dropdown-wrapper">
                                <div class="ecare-fw-dropdown-trigger">
                                    <span class="ecare-fw-selected-val"><?php echo esc_html($first_spec); ?></span>
                                    <svg class="ecare-fw-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                <div class="ecare-fw-dropdown-options">
                                    <?php foreach ($specialities_list as $index => $spec): ?>
                                        <div class="ecare-fw-dropdown-option <?php echo $index === 0 ? 'active' : ''; ?>" data-value="<?php echo esc_attr($spec->name); ?>">
                                            <?php echo esc_html($spec->name); ?>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>

                        <!-- Call to Action Link -->
                        <a href="<?php echo esc_url(add_query_arg('specialty', $first_spec, $destination_url)); ?>" class="ecare-fw-cta-btn">
                            <span>Start Call Now</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    <?php else: ?>
                        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 14px; margin: 12px 0 16px; color: #9a3412; font-size: 0.8rem; line-height: 1.45;">
                            <strong style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-weight: 700; color: #c2410c;">
                                <span style="display:inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ea580c;"></span>
                                Clinicians Currently Offline
                            </strong>
                            No doctors currently have instant consultation mode enabled. You can schedule a regular appointment or check back shortly.
                        </div>
                        <a href="<?php echo esc_url(home_url('/ecare-doctors')); ?>" class="ecare-fw-cta-btn" style="background: #334155;">
                            <span>Find Doctors & Book</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    <?php endif; ?>
                </div>
            </div>

        </div>

        <style>
            /* Design Tokens Variables */
            .ecare-fw-container {
                --accent-color: <?php echo esc_attr($primary_color); ?>;
                --accent-shadow: <?php echo esc_attr($shadow_rgba); ?>;
                --accent-hover: <?php echo esc_attr($hover_rgba); ?>;
                
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 999999;
                font-family: inherit;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            .ecare-fw-container * {
                box-sizing: border-box;
            }

            /* Tooltip Label */
            .ecare-fw-label {
                position: absolute;
                right: 70px;
                bottom: 12px;
                background: #0f172a;
                color: #ffffff;
                font-size: 0.8rem;
                font-weight: 700;
                padding: 8px 16px;
                border-radius: 30px;
                white-space: nowrap;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                transform: translateX(10px);
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .ecare-fw-label-pulse {
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                animation: ecare-fw-dot-pulse 2s infinite;
            }
            .ecare-fw-container:hover .ecare-fw-label {
                opacity: 1;
                transform: translateX(0);
            }

            /* Trigger Button — fully hardened against theme resets */
            #ecare-floating-widget .ecare-fw-trigger {
                all: unset !important;
                box-sizing: border-box !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 56px !important;
                height: 56px !important;
                min-width: 56px !important;
                min-height: 56px !important;
                border-radius: 50% !important;
                background: linear-gradient(135deg, var(--accent-color) 0%, #0d9488 100%) !important;
                border: none !important;
                outline: none !important;
                cursor: pointer !important;
                position: relative !important;
                color: #ffffff !important;
                box-shadow: 0 10px 25px -5px var(--accent-shadow), 0 8px 10px -6px var(--accent-shadow) !important;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                font-size: 0 !important;
                line-height: 0 !important;
                vertical-align: middle !important;
                text-align: center !important;
            }
            #ecare-floating-widget .ecare-fw-trigger:hover {
                transform: scale(1.06) rotate(-5deg) !important;
                box-shadow: 0 20px 30px -5px var(--accent-shadow) !important;
            }
            #ecare-floating-widget .ecare-fw-trigger:focus {
                outline: none !important;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4) !important;
            }
            .ecare-fw-ripple {
                position: absolute !important;
                inset: 0 !important;
                border-radius: 50% !important;
                animation: ecare-fw-btn-pulse 2s infinite !important;
                pointer-events: none !important;
                display: block !important;
            }
            /* SVG Phone Icon — hardened so theme cannot hide it */
            #ecare-floating-widget .ecare-fw-trigger .ecare-fw-icon {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: 24px !important;
                height: 24px !important;
                min-width: 24px !important;
                min-height: 24px !important;
                max-width: 24px !important;
                max-height: 24px !important;
                color: #ffffff !important;
                stroke: #ffffff !important;
                fill: none !important;
                z-index: 2 !important;
                position: relative !important;
                flex-shrink: 0 !important;
                animation: ecare-fw-shake 5s infinite ease-in-out !important;
                pointer-events: none !important;
            }
            #ecare-floating-widget .ecare-fw-trigger .ecare-fw-icon path,
            #ecare-floating-widget .ecare-fw-trigger .ecare-fw-icon polyline {
                stroke: #ffffff !important;
                color: #ffffff !important;
            }
            #ecare-floating-widget .ecare-fw-badge {
                position: absolute !important;
                top: -2px !important;
                right: -2px !important;
                width: 14px !important;
                height: 14px !important;
                border-radius: 50% !important;
                background: #10b981 !important;
                border: 2px solid #ffffff !important;
                z-index: 3 !important;
                display: block !important;
            }

            /* Expanded Panel */
            .ecare-fw-panel {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 320px;
                background: rgba(255, 255, 255, 0.96);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                overflow: hidden;
                display: none;
                z-index: 999999;
                opacity: 0;
                transform: translateY(15px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .ecare-fw-panel.open {
                display: block;
                opacity: 1;
                transform: translateY(0);
            }

            /* Header Section */
            .ecare-fw-header {
                background: linear-gradient(135deg, var(--accent-color) 0%, #115e59 100%);
                color: #ffffff;
                padding: 16px 20px;
                position: relative;
            }
            .ecare-fw-header-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }
            .ecare-fw-header-title h4 {
                font-size: 0.95rem;
                font-weight: 700;
                color: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1 !important;
            }
            .ecare-fw-live-signal {
                width: 7px;
                height: 7px;
                background: #10b981;
                border-radius: 50%;
                display: inline-block;
                animation: ecare-fw-dot-pulse 2.2s infinite;
            }
            .ecare-fw-header p {
                font-size: 0.72rem;
                color: rgba(255, 255, 255, 0.8);
                margin: 0 !important;
                padding: 0 !important;
                font-weight: 500;
            }
            /* Close Button — fully hardened against theme button styles */
            #ecare-floating-widget .ecare-fw-close-btn {
                all: unset !important;
                box-sizing: border-box !important;
                position: absolute !important;
                top: 10px !important;
                right: 12px !important;
                width: 24px !important;
                height: 24px !important;
                display: block !important;
                text-align: center !important;
                line-height: 24px !important;
                background: rgba(255, 255, 255, 0.15) !important;
                border: none !important;
                border-radius: 50% !important;
                color: rgba(255, 255, 255, 0.9) !important;
                font-size: 16px !important;
                font-weight: 400 !important;
                cursor: pointer !important;
                outline: none !important;
                padding: 0 !important;
                margin: 0 !important;
                text-decoration: none !important;
                text-transform: none !important;
                letter-spacing: normal !important;

                transition: background 0.2s ease !important;
                z-index: 10 !important;
            }
            #ecare-floating-widget .ecare-fw-close-btn:hover {
                background: rgba(255, 255, 255, 0.28) !important;
                color: #ffffff !important;
            }
            #ecare-floating-widget .ecare-fw-close-btn:focus {
                outline: none !important;
            }

            /* Body Section */
            .ecare-fw-body {
                padding: 18px 20px 20px;
            }
            .ecare-fw-desc {
                font-size: 0.78rem;
                color: #475569;
                line-height: 1.45;
                margin: 0 0 14px 0 !important;
            }

            /* Fee Row */
            .ecare-fw-fee-row {
                background: var(--accent-hover);
                border: 1px solid rgba(26, 142, 110, 0.15);
                border-radius: 8px;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            .ecare-fw-fee-label {
                font-size: 0.72rem;
                font-weight: 700;
                color: #334155;
            }
            .ecare-fw-fee-val {
                font-size: 0.95rem;
                font-weight: 800;
                color: var(--accent-color);
            }

            /* Dropdown Group */
            .ecare-fw-select-group {
                margin-bottom: 20px;
            }
            .ecare-fw-select-group label {
                display: block;
                font-size: 0.65rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
                margin-bottom: 6px;
            }
            .ecare-fw-dropdown-wrapper {
                position: relative;
                user-select: none;
            }
            .ecare-fw-dropdown-trigger {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #1e293b;
                background: #ffffff;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .ecare-fw-dropdown-trigger:hover {
                border-color: var(--accent-color);
            }
            .ecare-fw-arrow {
                width: 14px;
                height: 14px;
                color: #64748b;
                transition: transform 0.2s ease;
            }
            .ecare-fw-dropdown-wrapper.open .ecare-fw-arrow {
                transform: rotate(180deg);
                color: var(--accent-color);
            }
            .ecare-fw-dropdown-wrapper.open .ecare-fw-dropdown-trigger {
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px var(--accent-hover);
            }
            .ecare-fw-dropdown-options {
                position: absolute;
                bottom: 100%;
                left: 0;
                right: 0;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
                margin-bottom: 6px;
                max-height: 150px;
                overflow-y: auto;
                display: none;
                z-index: 10;
            }
            .ecare-fw-dropdown-wrapper.open .ecare-fw-dropdown-options {
                display: block;
            }
            .ecare-fw-dropdown-option {
                padding: 8px 12px;
                font-size: 0.78rem;
                color: #334155;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .ecare-fw-dropdown-option:hover {
                background: #f8fafc;
                color: var(--accent-color);
            }
            .ecare-fw-dropdown-option.active {
                background: var(--accent-hover);
                color: var(--accent-color);
                font-weight: 700;
            }

            /* CTA Button Link */
            .ecare-fw-cta-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                background: var(--accent-color);
                color: #ffffff !important;
                border-radius: 8px;
                padding: 11px;
                font-size: 0.8rem;
                font-weight: 700;
                text-decoration: none !important;
                box-shadow: 0 4px 12px var(--accent-shadow);
                transition: all 0.2s ease;
                border: none;
                cursor: pointer;
            }
            .ecare-fw-cta-btn:hover {
                background: #115e59;
                transform: translateY(-1px);
                box-shadow: 0 8px 16px var(--accent-shadow);
            }
            .ecare-fw-cta-btn svg {
                width: 15px;
                height: 15px;
                transition: transform 0.2s ease;
            }
            .ecare-fw-cta-btn:hover svg {
                transform: translateX(3px);
            }

            /* Animations Keyframes */
            @keyframes ecare-fw-btn-pulse {
                0% { box-shadow: 0 0 0 0 var(--accent-shadow); }
                70% { box-shadow: 0 0 0 12px rgba(26, 142, 110, 0); }
                100% { box-shadow: 0 0 0 0 rgba(26, 142, 110, 0); }
            }
            @keyframes ecare-fw-dot-pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
                70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            @keyframes ecare-fw-shake {
                0%, 90%, 100% { transform: rotate(0deg) scale(1); }
                91%, 95%, 99% { transform: rotate(-10deg) scale(1.05); }
                93%, 97% { transform: rotate(10deg) scale(1.05); }
            }

            /* Mobile Adjustments */
            @media (max-width: 480px) {
                .ecare-fw-container {
                    bottom: 16px;
                    right: 16px;
                }
                .ecare-fw-label {
                    display: none !important;
                }
                .ecare-fw-panel {
                    width: 290px;
                    right: 0;
                }
            }
        </style>

        <script>
        (function() {
            const container = document.getElementById("ecare-floating-widget");
            if (!container) return;

            const trigger = container.querySelector(".ecare-fw-trigger");
            const panel = container.querySelector(".ecare-fw-panel");
            const closeBtn = container.querySelector(".ecare-fw-close-btn");
            const label = container.querySelector(".ecare-fw-label");

            // Dropdown elements
            const dropdown = container.querySelector(".ecare-fw-dropdown-wrapper");
            const dropdownTrigger = container.querySelector(".ecare-fw-dropdown-trigger");
            const selectedValText = container.querySelector(".ecare-fw-selected-val");
            const options = container.querySelectorAll(".ecare-fw-dropdown-option");
            const ctaBtn = container.querySelector(".ecare-fw-cta-btn");
            const baseUrl = "<?php echo esc_url($destination_url); ?>";

            function togglePanel(e) {
                e.stopPropagation();
                const isOpen = panel.classList.contains("open");
                if (isOpen) {
                    panel.classList.remove("open");
                    setTimeout(() => { panel.style.display = "none"; }, 300);
                } else {
                    panel.style.display = "block";
                    // Request animation frame to ensure transition triggers
                    requestAnimationFrame(() => {
                        panel.classList.add("open");
                    });
                    // Hide tooltip label when panel opens
                    if (label) label.style.opacity = "0";
                }
            }

            function closePanel() {
                panel.classList.remove("open");
                setTimeout(() => { panel.style.display = "none"; }, 300);
            }

            if (trigger) trigger.addEventListener("click", togglePanel);
            if (closeBtn) closeBtn.addEventListener("click", closePanel);

            // Specialty selector toggling
            if (dropdownTrigger) {
                dropdownTrigger.addEventListener("click", function(e) {
                    e.stopPropagation();
                    if (dropdown) dropdown.classList.toggle("open");
                });
            }

            // Selecting option
            if (options) {
                options.forEach(opt => {
                    opt.addEventListener("click", function(e) {
                        e.stopPropagation();
                        options.forEach(o => o.classList.remove("active"));
                        opt.classList.add("active");
                        
                        const value = opt.getAttribute("data-value");
                        if (selectedValText) selectedValText.textContent = value;
                        if (dropdown) dropdown.classList.remove("open");

                        // Update CTA link URL
                        if (ctaBtn) {
                            try {
                                const url = new URL(baseUrl, window.location.origin);
                                url.searchParams.set("specialty", value);
                                ctaBtn.setAttribute("href", url.toString());
                            } catch(err) {
                                ctaBtn.setAttribute("href", baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'specialty=' + encodeURIComponent(value));
                            }
                        }
                    });
                });
            }

            // Close elements when clicking outside
            document.addEventListener("click", function(e) {
                if (container && !container.contains(e.target)) {
                    closePanel();
                }
                if (dropdown && !dropdown.contains(e.target)) {
                    dropdown.classList.remove("open");
                }
            });
        })();
        </script>
        <?php
    }
}
