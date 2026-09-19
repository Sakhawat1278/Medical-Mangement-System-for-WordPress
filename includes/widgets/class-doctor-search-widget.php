<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class ECARE_Doctor_Search_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_doctor_search_widget';
    }

    public function get_title() {
        return esc_html__('E-CARE AJAX Doctor Search', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-search';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {
        // ─────────────────────────────────────────────────────────────────────
        // ─── CONTENT TAB ─────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────
        $this->start_controls_section(
            'section_content_search',
            [
                'label' => __('Search Options', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'placeholder_text',
            [
                'label' => __('Placeholder Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Search doctors by name...', 'e-care-management'),
                'placeholder' => __('Search doctors by name...', 'e-care-management'),
            ]
        );

        $this->add_control(
            'show_specialty_filter',
            [
                'label' => __('Show Specialty Filter', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'e-care-management'),
                'label_off' => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'search_limit',
            [
                'label' => __('Results Limit', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 20,
                'step' => 1,
                'default' => 5,
            ]
        );

        $this->add_control(
            'doctors_page_url',
            [
                'label' => __('Doctors Page URL', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::URL,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => [
                    'url' => home_url('/ecare-doctors'),
                    'is_external' => false,
                    'nofollow' => false,
                ],
                'placeholder' => __('https://your-link.com/ecare-doctors', 'e-care-management'),
                'description' => __('Target URL to redirect when booking. Specialty/Doctor parameters will be appended.', 'e-care-management'),
            ]
        );

        $this->end_controls_section();

        // ─────────────────────────────────────────────────────────────────────
        // ─── STYLE TAB ───────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────
        $this->start_controls_section(
            'section_style_search_bar',
            [
                'label' => __('Search Bar & Filters', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'bar_bg_color',
            [
                'label' => __('Search Box Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--bar-bg: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'bar_border_color',
            [
                'label' => __('Border Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#cbd5e1',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--bar-border: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'primary_accent_color',
            [
                'label' => __('Focus / Accent Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1b3b2b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--accent-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => __('Border Radius', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 16,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_dropdown',
            [
                'label' => __('Dropdown Results', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'dropdown_bg',
            [
                'label' => __('Dropdown Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => 'rgba(255, 255, 255, 0.98)',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--dropdown-bg: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'doctor_name_color',
            [
                'label' => __('Doctor Name Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--name-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'specialty_text_color',
            [
                'label' => __('Specialty Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#64748b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--spec-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'hover_bg_color',
            [
                'label' => __('Row Hover Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#f8fafc',
                'selectors' => [
                    '{{WRAPPER}} .ecare-doctor-search-wrapper' => '--hover-bg: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();

        $all_specialities = ECARE_DB_Client::select_all('ecare_specialities');
        $specialities = array();
        if (is_array($all_specialities)) {
            foreach ($all_specialities as $s) {
                if (isset($s->status) && $s->status === 'Active') {
                    $specialities[] = $s;
                }
            }
        }

        // Sort by name ASC
        usort($specialities, function($a, $b) {
            $a_name = isset($a->name) ? $a->name : '';
            $b_name = isset($b->name) ? $b->name : '';
            return strcasecmp($a_name, $b_name);
        });

        $bar_bg = !empty($settings['bar_bg_color']) ? $settings['bar_bg_color'] : '#ffffff';
        $bar_border = !empty($settings['bar_border_color']) ? $settings['bar_border_color'] : '#cbd5e1';
        $accent_color = !empty($settings['primary_accent_color']) ? $settings['primary_accent_color'] : '#1b3b2b';
        $radius = isset($settings['border_radius']['size']) ? $settings['border_radius']['size'] . 'px' : '16px';

        $dropdown_bg = !empty($settings['dropdown_bg']) ? $settings['dropdown_bg'] : 'rgba(255, 255, 255, 0.98)';
        $name_color = !empty($settings['doctor_name_color']) ? $settings['doctor_name_color'] : '#0f172a';
        $spec_color = !empty($settings['specialty_text_color']) ? $settings['specialty_text_color'] : '#64748b';
        $hover_bg = !empty($settings['hover_bg_color']) ? $settings['hover_bg_color'] : '#f8fafc';

        // Unique ID for scoping script and styles
        $widget_id = 'ecare-search-' . $this->get_id();
        ?>
        <div id="<?php echo esc_attr($widget_id); ?>" class="ecare-doctor-search-wrapper">
            
            <style>
                :where(.elementor-element-<?php echo esc_attr($this->get_id()); ?>) .ecare-doctor-search-wrapper {
                    --accent-color: <?php echo esc_attr($accent_color); ?>;
                    --border-radius: <?php echo esc_attr($radius); ?>;
                    --bar-bg: <?php echo esc_attr($bar_bg); ?>;
                    --bar-border: <?php echo esc_attr($bar_border); ?>;
                    --dropdown-bg: <?php echo esc_attr($dropdown_bg); ?>;
                    --name-color: <?php echo esc_attr($name_color); ?>;
                    --spec-color: <?php echo esc_attr($spec_color); ?>;
                    --hover-bg: <?php echo esc_attr($hover_bg); ?>;
                }
                :where(#<?php echo esc_attr($widget_id); ?>).ecare-doctor-search-wrapper {
                    position: relative;
                    width: 100%;
                    max-width: 680px;
                    margin: 0 auto;
                    font-family: inherit;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-bar-inner {
                    display: flex;
                    align-items: center;
                    background: var(--bar-bg);
                    border: 1px solid var(--bar-border);
                    border-radius: var(--border-radius);
                    padding: 4px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-bar-inner:focus-within {
                    border-color: var(--accent-color);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 3px rgba(26, 142, 110, 0.15);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-icon-prefix {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-left: 14px;
                    color: #94a3b8;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-icon-prefix svg {
                    width: 20px;
                    height: 20px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-input {
                    flex: 1;
                    border: none !important;
                    outline: none !important;
                    background: transparent !important;
                    padding: 12px 14px !important;
                    font-size: 1rem !important;
                    color: #1e293b !important;
                    height: auto !important;
                    line-height: normal !important;
                    box-shadow: none !important;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-input::placeholder {
                    color: #94a3b8;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                    margin: 0 8px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-wrapper {
                    position: relative;
                    user-select: none;
                    cursor: pointer;
                    min-width: 135px;
                    max-width: 180px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    color: #475569;
                    padding: 8px 12px;
                    border-radius: 8px;
                    background: transparent;
                    transition: all 0.2s;
                    gap: 6px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-trigger:hover {
                    background: rgba(0, 0, 0, 0.02);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-arrow {
                    width: 14px;
                    height: 14px;
                    color: #64748b;
                    transition: transform 0.2s ease;
                    flex-shrink: 0;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-wrapper.open .ecare-custom-select-arrow {
                    transform: rotate(180deg);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-options {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    background: var(--dropdown-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 12px;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
                    width: 200px;
                    overflow: hidden;
                    z-index: 10000;
                    display: none;
                    box-sizing: border-box;
                    animation: ecare-fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-wrapper.open .ecare-custom-select-options {
                    display: block;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-option {
                    padding: 10px 14px;
                    font-size: 0.85rem;
                    color: #334155;
                    transition: all 0.2s;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-option:hover {
                    background: var(--hover-bg);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-option.active {
                    background: rgba(26, 142, 110, 0.08);
                    color: var(--accent-color);
                    font-weight: 600;
                }
                @keyframes ecare-fade-in {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Results Dropdown */
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-results-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 8px;
                    background: var(--dropdown-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 12px;
                    box-shadow: none !important;
                    max-height: 380px;
                    overflow-y: auto;
                    z-index: 9999;
                    display: none;
                    box-sizing: border-box;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    border-bottom: 1px solid #f1f5f9;
                    transition: all 0.2s ease;
                    text-decoration: none !important;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-item:last-child {
                    border-bottom: none;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-item:hover {
                    background: var(--hover-bg);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-avatar-wrapper {
                    position: relative;
                    width: 36px;
                    height: 36px;
                    flex-shrink: 0;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #f1f5f9;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-avatar svg {
                    width: 18px;
                    height: 18px;
                    color: #94a3b8;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-status-badge {
                    position: absolute;
                    bottom: -1px;
                    right: -1px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    background: #94a3b8; /* Offline/Other defaults */
                    z-index: 10;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-status-badge.status-available {
                    background: #10b981;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
                    animation: ecare-search-pulse 2s infinite;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-name {
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--name-color);
                    margin: 0;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-spec {
                    font-size: 0.75rem;
                    color: var(--spec-color);
                    margin: 0;
                    line-height: 1.3;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-btn {
                    display: inline-block;
                    padding: 5px 12px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    background: var(--accent-color);
                    color: #ffffff !important;
                    border: none;
                    cursor: pointer;
                    text-decoration: none !important;
                    transition: all 0.2s ease;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-result-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
                
                /* Loading & Empty States */
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-state-row {
                    padding: 24px;
                    text-align: center;
                    color: #64748b;
                    font-size: 0.9rem;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e2e8f0;
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    animation: ecare-search-spin 0.8s linear infinite;
                    margin: 0 auto 8px auto;
                }

                @keyframes ecare-search-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes ecare-search-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                
                @media (max-width: 480px) {
                    :where(#<?php echo esc_attr($widget_id); ?>) .ecare-search-divider {
                        display: none;
                    }
                    :where(#<?php echo esc_attr($widget_id); ?>) .ecare-custom-select-wrapper {
                        display: none;
                    }
                }
            </style>
            <div class="ecare-search-bar-inner">
                <div class="ecare-search-icon-prefix">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                
                <input 
                    type="text" 
                    class="ecare-search-input" 
                    placeholder="<?php echo esc_attr($settings['placeholder_text']); ?>" 
                    autocomplete="off"
                />

                <?php if ($settings['show_specialty_filter'] === 'yes'): ?>
                    <div class="ecare-search-divider"></div>
                    <div class="ecare-custom-select-wrapper">
                        <div class="ecare-custom-select-trigger">
                            <span class="ecare-custom-select-label"><?php echo esc_html__('All Specialties', 'e-care-management'); ?></span>
                            <svg class="ecare-custom-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        <div class="ecare-custom-select-options">
                            <div class="ecare-custom-select-option active" data-value=""><?php echo esc_html__('All Specialties', 'e-care-management'); ?></div>
                            <?php foreach ($specialities as $spec): ?>
                                <div class="ecare-custom-select-option" data-value="<?php echo esc_attr($spec->name); ?>"><?php echo esc_html($spec->name); ?></div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <div class="ecare-search-results-dropdown"></div>
        </div>

        <script>
        (function() {
            function initDoctorSearch() {
                const wrapper = document.getElementById("<?php echo esc_attr($widget_id); ?>");
                if (!wrapper) return;

                if (wrapper.getAttribute('data-ecare-bound') === '1') return;
                wrapper.setAttribute('data-ecare-bound', '1');

                const input = wrapper.querySelector(".ecare-search-input");
                const dropdown = wrapper.querySelector(".ecare-search-results-dropdown");

                // Custom Dropdown elements
                const selectWrapper = wrapper.querySelector(".ecare-custom-select-wrapper");
                const selectTrigger = wrapper.querySelector(".ecare-custom-select-trigger");
                const selectLabel = wrapper.querySelector(".ecare-custom-select-label");
                const selectOptions = wrapper.querySelector(".ecare-custom-select-options");
                let selectedSpecialty = '';

                if (selectTrigger && selectWrapper) {
                    selectTrigger.addEventListener("click", function(e) {
                        e.stopPropagation();
                        selectWrapper.classList.toggle("open");
                    });

                    const optionsList = selectWrapper.querySelectorAll(".ecare-custom-select-option");
                    optionsList.forEach(opt => {
                        opt.addEventListener("click", function(e) {
                            e.stopPropagation();
                            optionsList.forEach(o => o.classList.remove("active"));
                            opt.classList.add("active");
                            
                            selectedSpecialty = opt.getAttribute("data-value") || '';
                            selectLabel.textContent = opt.textContent;
                            selectWrapper.classList.remove("open");
                            
                            // Trigger search
                            doSearch();
                        });
                    });
                }

                let debounceTimer;
                const apiUrl = "<?php echo esc_url_raw(rest_url('ecare/v1/doctors/search')); ?>";
                <?php
                    $raw_url = '';
                    if (!empty($settings['doctors_page_url'])) {
                        if (is_array($settings['doctors_page_url'])) {
                            $raw_url = !empty($settings['doctors_page_url']['url']) ? $settings['doctors_page_url']['url'] : '';
                        } else {
                            $raw_url = $settings['doctors_page_url'];
                        }
                    }
                    if (empty($raw_url)) {
                        $raw_url = home_url('/ecare-doctors');
                    }
                ?>
                const bookingPageUrl = "<?php echo esc_url($raw_url); ?>";
                const resultsLimit = parseInt("<?php echo esc_attr($settings['search_limit']); ?>") || 5;

                const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                }[char]));

                const safeHttpUrl = (value) => {
                    try {
                        const url = new URL(String(value || ''), window.location.origin);
                        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
                    } catch (e) {
                        return '';
                    }
                };

                function doSearch() {
                    const query = input.value.trim();
                    const specialty = selectedSpecialty;

                    if (query === '' && specialty === '') {
                        dropdown.innerHTML = '';
                        dropdown.style.display = 'none';
                        return;
                    }

                    // Show Loading State
                    dropdown.style.display = 'block';
                    dropdown.innerHTML = `
                        <div class="ecare-search-state-row">
                            <div class="ecare-search-spinner"></div>
                            Searching doctors...
                        </div>
                    `;

                    const fetchUrl = new URL(apiUrl);
                    if (query) fetchUrl.searchParams.append('q', query);
                    if (specialty) fetchUrl.searchParams.append('specialty', specialty);

                    fetch(fetchUrl)
                        .then(response => response.json())
                        .then(data => {
                            if (!Array.isArray(data) || data.length === 0) {
                                dropdown.innerHTML = `<div class="ecare-search-state-row">No doctors found matching your query.</div>`;
                                return;
                            }

                            // Limit results
                            const sliced = data.slice(0, resultsLimit);
                            let html = '';

                            sliced.forEach(doc => {
                                const isAvailable = doc.status === 'Available';
                                const statusClass = isAvailable ? 'status-available' : '';
                                
                                // Image parsing (supports doc.avatar or doc.photo fallback)
                                let imgHtml = `
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                `;
                                let avatarUrl = '';
                                if (doc.avatar) {
                                    if (typeof doc.avatar === 'string') {
                                        avatarUrl = doc.avatar;
                                    } else if (typeof doc.avatar === 'object' && doc.avatar.url) {
                                        avatarUrl = doc.avatar.url;
                                    }
                                } else if (doc.photo) {
                                    if (typeof doc.photo === 'string') {
                                        avatarUrl = doc.photo;
                                    } else if (typeof doc.photo === 'object' && doc.photo.url) {
                                        avatarUrl = doc.photo.url;
                                    }
                                }
                                avatarUrl = safeHttpUrl(avatarUrl);
                                if (avatarUrl) {
                                    imgHtml = `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(doc.name)}" />`;
                                }

                                // Dynamic target url with parameters
                                const target = new URL(bookingPageUrl);
                                target.searchParams.append('doctor', String(doc.name || ''));
                                if (doc.specialization) {
                                    target.searchParams.append('specialty', String(doc.specialization));
                                } else if (doc.specialty) {
                                    target.searchParams.append('specialty', String(doc.specialty));
                                }

                                // Decode designation / specialty text display
                                let displaySpec = 'General Medicine';
                                if (doc.specialization) {
                                    displaySpec = doc.specialization;
                                } else if (doc.specialty) {
                                    displaySpec = doc.specialty;
                                }

                                // Extra details
                                let extraInfo = '';
                                if (doc.degrees) {
                                    extraInfo += ` • ${doc.degrees}`;
                                }
                                if (doc.experience) {
                                    extraInfo += ` • ${doc.experience} yrs exp`;
                                }
                                if (doc.fee && parseFloat(doc.fee) > 0) {
                                    extraInfo += ` • Fee: ৳${parseFloat(doc.fee)}`;
                                }

                                const safeTarget = safeHttpUrl(target.toString());

                                html += `
                                    <a href="${escapeHtml(safeTarget)}" class="ecare-search-result-item">
                                        <div class="ecare-search-result-left">
                                            <div class="ecare-search-avatar-wrapper">
                                                <div class="ecare-search-result-avatar">
                                                    ${imgHtml}
                                                </div>
                                                <span class="ecare-search-status-badge ${statusClass}"></span>
                                            </div>
                                            <div class="ecare-search-result-info">
                                                <h4 class="ecare-search-result-name">${escapeHtml(doc.name)}</h4>
                                                <p class="ecare-search-result-spec">${escapeHtml(displaySpec + extraInfo)}</p>
                                            </div>
                                        </div>
                                        <span class="ecare-search-result-btn">Consult Now</span>
                                    </a>
                                `;
                            });

                            dropdown.innerHTML = html;
                        })
                        .catch(err => {
                            console.error("E-CARE Search Error:", err);
                            dropdown.innerHTML = `<div class="ecare-search-state-row">Failed to fetch search results. Please try again.</div>`;
                        });
                }

                // Bind Event Listeners
                input.addEventListener("input", function() {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(doSearch, 300);
                });

                // Close dropdown when clicking outside
                document.addEventListener("click", function(e) {
                    if (selectWrapper) {
                        selectWrapper.classList.remove("open");
                    }
                    if (!wrapper.contains(e.target)) {
                        dropdown.style.display = 'none';
                    }
                });

                // Re-open if clicking on search box when results exist
                input.addEventListener("focus", function() {
                    if (dropdown.innerHTML !== '') {
                        dropdown.style.display = 'block';
                    }
                });
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initDoctorSearch);
            } else {
                initDoctorSearch();
            }

            if (window.elementorFrontend && window.elementorFrontend.hooks) {
                elementorFrontend.hooks.addAction('frontend/element_ready/ecare_doctor_search_widget.default', initDoctorSearch);
            }
        })();
        </script>
        <?php
    }
}
