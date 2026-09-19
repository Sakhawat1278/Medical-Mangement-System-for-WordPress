<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Specialities_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_specialities_widget';
    }

    public function get_title() {
        return __('E-CARE Specialties Grid', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-gallery-grid';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {

        // ─────────────────────────────────────────────────────────────────────
        // ─── CONTENT TAB ─────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        $this->start_controls_section(
            'section_content_header',
            [
                'label' => __('Header Section', 'e-care-management'),
            ]
        );

        $this->add_control(
            'title_text',
            [
                'label' => __('Widget Title', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Our Medical Specialties', 'e-care-management'),
                'placeholder' => __('Enter widget title', 'e-care-management'),
            ]
        );

        $this->add_control(
            'subtitle_text',
            [
                'label' => __('Widget Subtitle', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('Consult with our highly qualified clinical specialists across specialized medical departments.', 'e-care-management'),
                'placeholder' => __('Enter widget subtitle', 'e-care-management'),
            ]
        );

        $this->add_control(
            'show_header',
            [
                'label' => __('Show Header Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'e-care-management'),
                'label_off' => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_content_layout',
            [
                'label' => __('Layout Settings', 'e-care-management'),
            ]
        );

        $this->add_responsive_control(
            'columns',
            [
                'label' => __('Grid Columns', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => '4',
                'tablet_default' => '2',
                'mobile_default' => '1',
                'options' => [
                    '1' => '1 Column',
                    '2' => '2 Columns',
                    '3' => '3 Columns',
                    '4' => '4 Columns',
                    '5' => '5 Columns',
                    '6' => '6 Columns',
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialties-grid' => 'grid-template-columns: repeat({{VALUE}}, minmax(0, 1fr));',
                ],
            ]
        );

        $this->add_responsive_control(
            'grid_gap',
            [
                'label' => __('Grid Gap (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 60,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 24,
                ],
                'tablet_default' => [
                    'unit' => 'px',
                    'size' => 16,
                ],
                'mobile_default' => [
                    'unit' => 'px',
                    'size' => 12,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialties-grid' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'show_doctor_count',
            [
                'label' => __('Show Doctor Count', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'e-care-management'),
                'label_off' => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'doctors_page_url',
            [
                'label' => __('Doctors Search Page URL', 'e-care-management'),
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
                'description' => __('Specialty parameters will be dynamically appended to this URL when a card is clicked.', 'e-care-management'),
            ]
        );

        $this->end_controls_section();

        // ─────────────────────────────────────────────────────────────────────
        // ─── STYLE TAB ───────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        $this->start_controls_section(
            'section_style_colors',
            [
                'label' => __('Typography & Colors', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => __('Widget Title Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialties-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .ecare-specialties-title',
            ]
        );

        $this->add_control(
            'subtitle_color',
            [
                'label' => __('Widget Subtitle Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#64748b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialties-subtitle' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'subtitle_typography',
                'selector' => '{{WRAPPER}} .ecare-specialties-subtitle',
            ]
        );

        $this->add_control(
            'card_title_color',
            [
                'label' => __('Card Title Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1e293b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialty-name' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_subtext_color',
            [
                'label' => __('Card Subtext Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#64748b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialty-desc' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_border_radius',
            [
                'label' => __('Card Border Radius', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 12,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-specialty-card' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    private function get_inline_svg_icon($icon_name, $color) {
        $icon_name = strtolower(trim($icon_name));
        $stroke_color = !empty($color) ? $color : 'currentColor';
        
        $paths_file = dirname(__FILE__) . '/healthicons-paths.php';
        $paths = file_exists($paths_file) ? require $paths_file : [];
        
        $aliases = [
            'heartbeat' => 'heartbeatoutline',
            'heart' => 'heartoutline',
            'cardiology' => 'heartoutline',
            'brain' => 'neurologyoutline',
            'mentalhealth' => 'neurologyoutline',
            'psych' => 'neurologyoutline',
            'psychiatry' => 'neurologyoutline',
            'lung' => 'lungsoutline',
            'pulmo' => 'lungsoutline',
            'nephro' => 'kidneys',
            'gastro' => 'stomach',
            'gastrology' => 'stomach',
            'bone' => 'orthopaedicsoutline',
            'ortho' => 'orthopaedicsoutline',
            'orthopedics' => 'orthopaedicsoutline',
            'dental' => 'tooth',
            'dentistry' => 'tooth',
            'opthal' => 'eyeoutline',
            'ophthalmology' => 'eyeoutline',
            'ent' => 'ear',
            'derma' => 'skincancer',
            'dermatology' => 'skincancer',
            'skin' => 'skincancer',
            'baby' => 'baby0203moutline',
            'child' => 'baby0203moutline',
            'pedia' => 'baby0203moutline',
            'pediatrics' => 'baby0203moutline',
            'pediatric' => 'baby0203moutline',
            'blood' => 'bloodbag',
            'hema' => 'bloodbag',
            'lab' => 'microscopeoutline',
            'test' => 'microscopeoutline',
            'general' => 'stethoscope',
            'emergency' => 'ambulance',
            'cross' => 'hospital',
            'firstaid' => 'hospital',
            'surgery' => 'generalsurgery'
        ];
        
        $target_key = $icon_name;
        if (isset($aliases[$icon_name])) {
            $target_key = $aliases[$icon_name];
        }
        
        if (isset($paths[$target_key])) {
            return '<svg viewBox="0 0 48 48" fill="' . esc_attr($stroke_color) . '" xmlns="http://www.w3.org/2000/svg" style="width: 22px; height: 22px; display: block;">
                ' . $paths[$target_key] . '
            </svg>';
        }
        
        // Fallback default hospital/cross SVG
        return '<svg viewBox="0 0 24 24" fill="none" stroke="' . esc_attr($stroke_color) . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; display: block;">
            <path d="M19 10.5H5a1.5 1.5 0 0 0-1.5 1.5v0A1.5 1.5 0 0 0 5 13.5h14a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5z"/>
            <path d="M10.5 19V5a1.5 1.5 0 0 1 1.5-1.5h0a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h0a1.5 1.5 0 0 1-1.5-1.5z"/>
        </svg>';
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

        if (empty($specialities)) {
            if (\Elementor\Plugin::$instance->editor->is_edit_mode()) {
                echo '<div style="padding: 2rem; text-align: center; border: 1.5px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; color: #64748b;">' . esc_html__('No active E-CARE specialties found in database.', 'e-care-management') . '</div>';
            }
            return;
        }

        // Fetch all active/available doctors to match React's specialization fallback logic
        $all_staff = ECARE_DB_Client::select_all('ecare_staff');
        $doctors_raw = array();
        if (is_array($all_staff)) {
            foreach ($all_staff as $member) {
                $role_val = isset($member->role) ? $member->role : '';
                $status_val = isset($member->status) ? $member->status : '';
                if ($role_val === 'doctor' && in_array($status_val, array('Active', 'Available'), true)) {
                    $doctors_raw[] = array(
                        'specialty' => isset($member->specialty) ? $member->specialty : '',
                        'specialization' => isset($member->specialization) ? $member->specialization : '',
                    );
                }
            }
        }

        $doctor_counts = [];
        if (!empty($specialities)) {
            foreach ($specialities as $specialty) {
                $spec_name_lower = strtolower(trim($specialty->name));
                $count = 0;
                if (!empty($doctors_raw)) {
                    foreach ($doctors_raw as $doc) {
                        $spec_val = '';
                        if (!empty($doc['specialization'])) {
                            $spec_val = $doc['specialization'];
                        } elseif (!empty($doc['specialty'])) {
                            $spec_val = $doc['specialty'];
                        }

                        if (empty($spec_val)) {
                            continue;
                        }

                        // Replicate React array or substring matching logic
                        $parsed_specs = [];
                        if (is_string($spec_val)) {
                            $first_char = substr(trim($spec_val), 0, 1);
                            if ($first_char === '[' || $first_char === '{') {
                                $decoded = json_decode($spec_val, true);
                                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                                    $parsed_specs = $decoded;
                                }
                            }
                        }

                        if (empty($parsed_specs)) {
                            $spec_val_lower = strtolower(trim($spec_val));
                            if (strpos($spec_val_lower, $spec_name_lower) !== false) {
                                        $count++;
                            }
                        } else {
                            $matched = false;
                            foreach ($parsed_specs as $s) {
                                if (is_string($s) && strtolower(trim($s)) === $spec_name_lower) {
                                    $matched = true;
                                    break;
                                }
                            }
                            if ($matched) {
                                $count++;
                            }
                        }
                    }
                }
                $doctor_counts[$spec_name_lower] = $count;
            }
        }

        // Columns & Layout resolution with defensive defaults
        $cols_desktop = isset($settings['columns']) ? $settings['columns'] : '4';
        $cols_tablet  = isset($settings['columns_tablet']) ? $settings['columns_tablet'] : '2';
        $cols_mobile  = isset($settings['columns_mobile']) ? $settings['columns_mobile'] : '1';
        
        $grid_gap     = isset($settings['grid_gap']['size']) ? $settings['grid_gap']['size'] . 'px' : '24px';
        $border_rad   = isset($settings['card_border_radius']['size']) ? $settings['card_border_radius']['size'] . (isset($settings['card_border_radius']['unit']) ? $settings['card_border_radius']['unit'] : 'px') : '20px';

        // Colors resolution with defensive defaults
        $title_color        = !empty($settings['title_color']) ? $settings['title_color'] : '#0f172a';
        $subtitle_color     = !empty($settings['subtitle_color']) ? $settings['subtitle_color'] : '#64748b';
        $card_title_color   = !empty($settings['card_title_color']) ? $settings['card_title_color'] : '#1e293b';
        $card_subtext_color = !empty($settings['card_subtext_color']) ? $settings['card_subtext_color'] : '#64748b';

        $widget_id = 'ecare-spec-' . $this->get_id();
        ?>
        <div class="ecare-specialties-widget-wrapper" id="<?php echo esc_attr($widget_id); ?>" style="--cols-desktop: <?php echo esc_attr($cols_desktop); ?>; --cols-tablet: <?php echo esc_attr($cols_tablet); ?>; --cols-mobile: <?php echo esc_attr($cols_mobile); ?>; --grid-gap: <?php echo esc_attr($grid_gap); ?>; --card-border-radius: <?php echo esc_attr($border_rad); ?>;">
            <style>
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-container {
                    width: 100%;
                    box-sizing: border-box;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-header {
                    text-align: center;
                    margin-bottom: 1.25rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 0 0 10px 0;
                    line-height: 1.25;
                    letter-spacing: -0.025em;
                    color: <?php echo esc_attr($title_color); ?>;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-subtitle {
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin: 0;
                    color: <?php echo esc_attr($subtitle_color); ?>;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-grid {
                    display: grid;
                    grid-template-columns: repeat(var(--cols-desktop), minmax(0, 1fr));
                    gap: var(--grid-gap);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-card {
                    background: #ffffff;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: var(--card-border-radius);
                    padding: 0.5rem 1rem;
                    display: flex;
                    flex-direction: row;
                    align-items: center !important;
                    gap: 0.85rem;
                    text-decoration: none !important;
                    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.005);
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                    cursor: pointer;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--theme-color);
                    box-shadow: 0 12px 20px -8px var(--theme-color-shadow), 0 4px 4px -4px rgba(0, 0, 0, 0.01);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-color-bar {
                    width: 4px;
                    height: 32px;
                    border-radius: 99px;
                    background: var(--theme-color);
                    flex-shrink: 0;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-icon-container {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--theme-color-bg);
                    color: var(--theme-color);
                    transition: all 0.3s ease;
                    z-index: 1;
                    flex-shrink: 0;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-card:hover .ecare-specialty-icon-container {
                    transform: scale(1.06);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-icon-container svg, 
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-icon-container img {
                    width: 22px;
                    height: 22px;
                    object-fit: contain;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-info {
                    display: flex;
                    flex-direction: column;
                    justify-content: center !important;
                    align-self: center !important;
                    gap: 3px;
                    width: 100%;
                    z-index: 1;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-name {
                    font-size: 1.05rem;
                    font-weight: 700;
                    margin: 0 !important;
                    padding: 0 !important;
                    color: <?php echo esc_attr($card_title_color); ?>;
                    line-height: 1.2 !important;
                    transition: color 0.2s ease;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-card:hover .ecare-specialty-name {
                    color: var(--theme-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialty-desc {
                    font-size: 0.85rem;
                    font-weight: 400;
                    text-transform: none;
                    letter-spacing: normal;
                    margin: 0 !important;
                    padding: 0 !important;
                    color: <?php echo esc_attr($card_subtext_color); ?>;
                    line-height: 1.2 !important;
                    display: flex;
                    align-items: center;
                }
                
                @media (max-width: 1024px) {
                    :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-grid {
                        grid-template-columns: repeat(var(--cols-tablet), minmax(0, 1fr));
                    }
                }
                @media (max-width: 767px) {
                    :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-grid {
                        grid-template-columns: repeat(var(--cols-mobile), minmax(0, 1fr));
                    }
                    :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-title {
                        font-size: 1.6rem;
                    }
                    :where(#<?php echo esc_attr($widget_id); ?>) .ecare-specialties-header {
                        margin-bottom: 0.75rem;
                    }
                }
            </style>
            
            <div class="ecare-specialties-container">
                <?php if ($settings['show_header'] === 'yes'): ?>
                    <?php if ((isset($settings['title_text']) && $settings['title_text'] !== '') || (isset($settings['subtitle_text']) && $settings['subtitle_text'] !== '')) : ?>
                        <div class="ecare-specialties-header">
                            <?php if (isset($settings['title_text']) && $settings['title_text'] !== '') : ?>
                                <h2 class="ecare-specialties-title"><?php echo esc_html($settings['title_text']); ?></h2>
                            <?php endif; ?>
                            <?php if (isset($settings['subtitle_text']) && $settings['subtitle_text'] !== '') : ?>
                                <p class="ecare-specialties-subtitle"><?php echo esc_html($settings['subtitle_text']); ?></p>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
                
                <div class="ecare-specialties-grid">
                    <?php foreach ($specialities as $specialty): 
                        $theme_color = !empty($specialty->color) ? $specialty->color : '#1b3b2b';
                        $theme_color_bg = $theme_color . '15'; // 8% opacity background
                        $theme_color_glow = $theme_color . '08'; // very soft glow
                        $theme_color_shadow = $theme_color . '15'; // soft colored shadow
                        
                        $spec_key = strtolower(trim($specialty->name));
                        $count = isset($doctor_counts[$spec_key]) ? $doctor_counts[$spec_key] : 0;
                        
                        // Dynamically append parameter to doctors page search
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
                        $target_url = esc_url(add_query_arg('specialty', $specialty->name, $raw_url));
                        $target_attr = '';
                        $rel_attr = '';
                        if (!empty($settings['doctors_page_url']) && is_array($settings['doctors_page_url'])) {
                            $target_attr = !empty($settings['doctors_page_url']['is_external']) ? ' target="_blank"' : '';
                            $rel_attr = !empty($settings['doctors_page_url']['nofollow']) ? ' rel="nofollow"' : '';
                        }
                    ?>
                        <a href="<?php echo $target_url; ?>"<?php echo $target_attr . $rel_attr; ?> class="ecare-specialty-card" style="--theme-color: <?php echo esc_attr($theme_color); ?>; --theme-color-bg: <?php echo esc_attr($theme_color_bg); ?>; --theme-color-glow: <?php echo esc_attr($theme_color_glow); ?>; --theme-color-shadow: <?php echo esc_attr($theme_color_shadow); ?>;">
                            <div class="ecare-specialty-color-bar"></div>
                            <div class="ecare-specialty-icon-container">
                                <?php 
                                $is_custom_svg = !empty($specialty->icon) && (strpos($specialty->icon, 'http') === 0 || strpos($specialty->icon, '/') === 0 || strpos($specialty->icon, '.svg') !== false);
                                if ($is_custom_svg) {
                                    echo '<img src="' . esc_url($specialty->icon) . '" style="width: 22px; height: 22px; object-fit: contain; display: block;" alt="" />';
                                } else {
                                    echo $this->get_inline_svg_icon($specialty->icon, $theme_color); 
                                }
                                ?>
                            </div>
                            <div class="ecare-specialty-info">
                                <h3 class="ecare-specialty-name"><?php echo esc_html($specialty->name); ?></h3>
                                <?php if ($settings['show_doctor_count'] === 'yes'): ?>
                                    <p class="ecare-specialty-desc">
                                        <?php if ($count > 0): ?>
                                            <?php echo esc_html($count) . ' ' . esc_html(_n('doctor available', 'doctors available', $count, 'e-care-management')); ?>
                                        <?php else: ?>
                                            <?php echo esc_html__('no doctors available', 'e-care-management'); ?>
                                        <?php endif; ?>
                                    </p>
                                <?php endif; ?>
                            </div>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
    }
}
