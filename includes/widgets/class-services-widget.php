<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class ECARE_Services_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_services_widget';
    }

    public function get_title() {
        return __('E-CARE Services Tabs', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-tabs';
    }

    public function get_categories() {
        return ['general'];
    }

    private function get_currency_symbol() {
        $settings = get_option('ecare_settings', array());
        if (!empty($settings['currencySymbol'])) {
            return $settings['currencySymbol'];
        }

        return html_entity_decode('&#2547;', ENT_QUOTES, 'UTF-8');
    }

    private function get_watermark_svg($index) {
        switch ($index % 6) {
            case 0:
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>';
            case 1:
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>';
            case 2:
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>';
            case 3:
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
            case 4:
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
            case 5:
            default:
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 10.5H13.5V5a1.5 1.5 0 0 0-3 0v5.5H5a1.5 1.5 0 0 0 0 3h5.5V19a1.5 1.5 0 0 0 3 0v-5.5H19a1.5 1.5 0 0 0 0-3z"/></svg>';
        }
    }

    private function get_service_options() {
        $options = array();

        if (!class_exists('ECARE_DB_Client')) {
            return $options;
        }

        $services = ECARE_DB_Client::select_all('ecare_services');
        $active_services = array();

        if (is_array($services)) {
            foreach ($services as $service) {
                if (($service->status ?? '') !== 'Active') {
                    continue;
                }

                $active_services[] = $service;
            }
        }

        usort($active_services, function ($a, $b) {
            $a_name = isset($a->name) ? (string) $a->name : '';
            $b_name = isset($b->name) ? (string) $b->name : '';
            return strcasecmp($a_name, $b_name);
        });

        foreach ($active_services as $service) {
            $label = trim((string) ($service->name ?? ''));
            $speciality = trim((string) ($service->speciality ?? ''));

            if ($label === '') {
                continue;
            }

            if ($speciality !== '') {
                $label .= ' - ' . $speciality;
            }

            $options[(string) ($service->id ?? $label)] = $label;
        }

        return $options;
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
                'default' => __('Our Healthcare Services', 'e-care-management'),
                'placeholder' => __('Enter widget title', 'e-care-management'),
            ]
        );

        $this->add_control(
            'subtitle_text',
            [
                'label' => __('Widget Subtitle', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('Select a medical specialty department below to filter and book our premium clinical services.', 'e-care-management'),
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
                'label' => __('Layout & Routing', 'e-care-management'),
            ]
        );

        $this->add_control(
            'layout_type',
            [
                'label' => __('Layout Type', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'grid',
                'options' => [
                    'grid' => __('Grid Layout', 'e-care-management'),
                    'slider' => __('Slider Carousel', 'e-care-management'),
                ],
            ]
        );

        $this->add_control(
            'card_style',
            [
                'label' => __('Card Style', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'detailed',
                'options' => [
                    'detailed' => __('Detailed Card Layout', 'e-care-management'),
                    'minimal' => __('Clean Minimal (Title & Image Only)', 'e-care-management'),
                ],
            ]
        );

        $this->add_responsive_control(
            'columns',
            [
                'label' => __('Grid Columns', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => '3',
                'tablet_default' => '2',
                'mobile_default' => '1',
                'options' => [
                    '1' => '1 Column',
                    '2' => '2 Columns',
                    '3' => '3 Columns',
                    '4' => '4 Columns',
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr);',
                ],
            ]
        );

        $this->add_control(
            'grid_gap',
            [
                'label' => __('Grid Gap (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 60,
                        'step' => 2,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 24,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-grid' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => __('Card Border Radius (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 40,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 12,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
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
                'description' => __('Specialty and service query parameters will be appended when booking a service.', 'e-care-management'),
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_content_services',
            [
                'label' => __('Services List', 'e-care-management'),
            ]
        );

        $repeater = new \Elementor\Repeater();

        $repeater->add_control(
            'service_category',
            [
                'label' => __('Specialty Tab / Category', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('General', 'e-care-management'),
                'description' => __('This will group this card under the corresponding Specialty Tab at the top.', 'e-care-management'),
            ]
        );

        $repeater->add_control(
            'service_title',
            [
                'label' => __('Title', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Cold, Cough, Allergy & Fever', 'e-care-management'),
                'label_block' => true,
            ]
        );

        $repeater->add_control(
            'service_desc',
            [
                'label' => __('Description (only for Detailed mode)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('Consult for common illnesses like fever, cough, cold, flu, etc.', 'e-care-management'),
            ]
        );

        $repeater->add_control(
            'service_price',
            [
                'label' => __('Price (e.g. 50 or Varies)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '120',
            ]
        );

        $repeater->add_control(
            'service_badge',
            [
                'label' => __('Badge (e.g. New)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
            ]
        );

        $repeater->add_control(
            'service_link',
            [
                'label' => __('Link URL', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::URL,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => [
                    'url' => home_url('/ecare-doctors'),
                    'is_external' => false,
                    'nofollow' => false,
                ],
                'placeholder' => __('https://your-link.com', 'e-care-management'),
                'label_block' => true,
            ]
        );

        $repeater->add_control(
            'service_image',
            [
                'label' => __('Cutout Image (Bottom-Right)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::MEDIA,
            ]
        );

        $repeater->add_control(
            'service_bg_color',
            [
                'label' => __('Custom Background Color (optional)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
            ]
        );

        $repeater->add_control(
            'service_accent_color',
            [
                'label' => __('Custom Accent / Title Color (optional)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
            ]
        );

        $this->add_control(
            'services_list',
            [
                'label' => __('Services Cards', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::REPEATER,
                'fields' => $repeater->get_controls(),
                'title_field' => '{{{ service_title }}} ({{{ service_category }}})',
                'default' => [
                    [
                        'service_title' => __('Cold, Cough, Allergy & Fever', 'e-care-management'),
                        'service_category' => __('General', 'e-care-management'),
                    ],
                    [
                        'service_title' => __('Cardiology Consultation', 'e-care-management'),
                        'service_category' => __('Specialist', 'e-care-management'),
                    ],
                ],
            ]
        );

        $this->end_controls_section();

        // ─────────────────────────────────────────────────────────────────────
        // ─── STYLE TAB ───────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        $this->start_controls_section(
            'section_style_header',
            [
                'label' => __('Typography & Headers', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => __('Title Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1e293b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .ecare-services-title',
            ]
        );

        $this->add_control(
            'subtitle_color',
            [
                'label' => __('Subtitle Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#64748b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-subtitle' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'subtitle_typography',
                'selector' => '{{WRAPPER}} .ecare-services-subtitle',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_tabs',
            [
                'label' => __('Tabs Styling', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'tab_bg_color',
            [
                'label' => __('Tab Item Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#f1f5f9',
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-tab-btn' => 'background: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_text_color',
            [
                'label' => __('Tab Item Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#475569',
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-tab-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_active_bg',
            [
                'label' => __('Active Tab Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1b3b2b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-tab-btn.active' => 'background: {{VALUE}} !important;',
                ],
            ]
        );

        $this->add_control(
            'tab_active_text',
            [
                'label' => __('Active Tab Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .ecare-services-tab-btn.active' => 'color: {{VALUE}} !important;',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_cards',
            [
                'label' => __('Cards & Buttons', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'card_color_mode',
            [
                'label' => __('Color Palette Mode', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'presets',
                'options' => [
                    'presets' => __('Themed Presets (Green, Red, Violet, etc.)', 'e-care-management'),
                    'custom' => __('Custom Unified Colors', 'e-care-management'),
                ],
            ]
        );

        $this->add_control(
            'card_bg_color',
            [
                'label' => __('Card Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'condition' => [
                    'card_color_mode' => 'custom',
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card' => 'background: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_border_color',
            [
                'label' => __('Card Border Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#e2e8f0',
                'condition' => [
                    'card_color_mode' => 'custom',
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_title_hover_color',
            [
                'label' => __('Title Hover Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0d9488',
                'condition' => [
                    'card_color_mode' => 'custom',
                ],
            ]
        );

        $this->add_control(
            'watermark_custom_color',
            [
                'label' => __('Watermark Icon Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => 'rgba(0, 0, 0, 0.05)',
                'condition' => [
                    'card_color_mode' => 'custom',
                ],
            ]
        );

        $this->add_control(
            'card_title_color',
            [
                'label' => __('Card Title Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'card_title_typography',
                'selector' => '{{WRAPPER}} .ecare-service-card-title',
            ]
        );

        $this->add_control(
            'card_desc_color',
            [
                'label' => __('Card Description Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#475569',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-desc' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'card_desc_typography',
                'selector' => '{{WRAPPER}} .ecare-service-card-desc',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'card_box_shadow',
                'selector' => '{{WRAPPER}} .ecare-service-card',
            ]
        );

        $this->add_control(
            'card_price_color',
            [
                'label' => __('Price Value Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-price-value' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_btn_bg',
            [
                'label' => __('Button Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#f8fafc',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-btn' => 'background: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_btn_text',
            [
                'label' => __('Button Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1e293b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_btn_hover_bg',
            [
                'label' => __('Button Hover Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1b3b2b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-btn:hover' => 'background: {{VALUE}}; border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_btn_hover_text',
            [
                'label' => __('Button Hover Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'card_height',
            [
                'label' => __('Card Height (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 150,
                        'max' => 450,
                        'step' => 5,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 240,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card' => 'height: {{SIZE}}{{UNIT}} !important;',
                ],
            ]
        );

        $this->add_control(
            'card_image_width',
            [
                'label' => __('Cutout Image Width (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 50,
                        'max' => 250,
                        'step' => 5,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 140,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-card-image-wrap' => 'width: {{SIZE}}{{UNIT}} !important;',
                ],
            ]
        );

        $this->add_control(
            'card_image_height',
            [
                'label' => __('Cutout Image Height (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 50,
                        'max' => 250,
                        'step' => 5,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 120,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-card-image-wrap' => 'height: {{SIZE}}{{UNIT}} !important;',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_navigation',
            [
                'label' => __('Slider Navigation', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
                'condition' => [
                    'layout_type' => 'slider',
                ],
            ]
        );

        $this->add_responsive_control(
            'nav_btn_size',
            [
                'label' => __('Nav Button Circle Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 20,
                        'max' => 100,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 44,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-slider-btn' => 'width: {{SIZE}}{{UNIT}} !important; height: {{SIZE}}{{UNIT}} !important;',
                ],
            ]
        );

        $this->add_responsive_control(
            'nav_arrow_size',
            [
                'label' => __('Nav Arrow Icon Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 50,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 18,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-slider-btn svg' => 'width: {{SIZE}}{{UNIT}} !important; height: {{SIZE}}{{UNIT}} !important;',
                ],
            ]
        );

        $this->end_controls_section();

        // ─────────────────────────────────────────────────────────────────────
        // ─── WATERMARK STYLES SECTION ────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────
        $this->start_controls_section(
            'section_style_watermark',
            [
                'label' => __('Watermark Icons', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'show_watermark',
            [
                'label' => __('Show Watermarks', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'e-care-management'),
                'label_off' => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'watermark_size',
            [
                'label' => __('Watermark Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 30,
                        'max' => 180,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 76,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-watermark' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'show_watermark' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'watermark_opacity',
            [
                'label' => __('Normal Opacity', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 0.5,
                        'step' => 0.01,
                    ],
                ],
                'default' => [
                    'size' => 0.08,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card-watermark' => 'opacity: {{SIZE}};',
                ],
                'condition' => [
                    'show_watermark' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'watermark_opacity_hover',
            [
                'label' => __('Hover Opacity', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 0.8,
                        'step' => 0.01,
                    ],
                ],
                'default' => [
                    'size' => 0.15,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-service-card:hover .ecare-service-card-watermark' => 'opacity: {{SIZE}};',
                ],
                'condition' => [
                    'show_watermark' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'watermark_position',
            [
                'label' => __('Watermark Position', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'bottom-left',
                'options' => [
                    'bottom-left' => __('Bottom Left', 'e-care-management'),
                    'bottom-right' => __('Bottom Right', 'e-care-management'),
                    'top-left' => __('Top Left', 'e-care-management'),
                    'top-right' => __('Top Right', 'e-care-management'),
                ],
                'condition' => [
                    'show_watermark' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();

        $layout_type = isset($settings['layout_type']) ? $settings['layout_type'] : 'grid';
        $card_style = isset($settings['card_style']) ? $settings['card_style'] : 'detailed';

        $services_repeater = isset($settings['services_list']) ? $settings['services_list'] : array();
        $services = array();

        if (is_array($services_repeater)) {
            foreach ($services_repeater as $item) {
                $book_url = '';
                $target_attr = '';
                $rel_attr = '';
                if (!empty($item['service_link'])) {
                    if (is_array($item['service_link'])) {
                        $book_url = !empty($item['service_link']['url']) ? $item['service_link']['url'] : '';
                        $target_attr = !empty($item['service_link']['is_external']) ? ' target="_blank"' : '';
                        $rel_attr = !empty($item['service_link']['nofollow']) ? ' rel="nofollow"' : '';
                    } else {
                        $book_url = $item['service_link'];
                    }
                }

                $services[] = (object) array(
                    'id' => '',
                    'name' => isset($item['service_title']) ? $item['service_title'] : '',
                    'speciality' => isset($item['service_category']) ? $item['service_category'] : '',
                    'price' => isset($item['service_price']) ? $item['service_price'] : '',
                    'description' => isset($item['service_desc']) ? $item['service_desc'] : '',
                    'badge' => isset($item['service_badge']) ? $item['service_badge'] : '',
                    'book_url' => $book_url,
                    'book_link_target' => $target_attr,
                    'book_link_rel' => $rel_attr,
                    'custom_image' => isset($item['service_image']) ? $item['service_image'] : null,
                    'custom_bg' => isset($item['service_bg_color']) ? $item['service_bg_color'] : '',
                    'custom_accent' => isset($item['service_accent_color']) ? $item['service_accent_color'] : '',
                    'telemedicine' => '',
                );
            }
        }

        if (empty($services)) {
            echo '<div style="padding: 2.5rem; text-align: center; color: #64748b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">No services found. Add service cards inside the Elementor editor panel.</div>';
            return;
        }

        // Get unique active specialties
        $specialties = array();
        foreach ($services as $s) {
            if (!empty($s->speciality)) {
                $specialties[] = trim($s->speciality);
            }
        }
        $specialties = array_unique($specialties);
        sort($specialties);

        // Fetch theme configurations
        $theme_primary = get_option('ecare_primary_color', '#1b3b2b');
        $currency_symbol = $this->get_currency_symbol();

        // Layout values
        $cols_desktop = !empty($settings['columns']) ? $settings['columns'] : '3';
        $cols_tablet  = !empty($settings['columns_tablet']) ? $settings['columns_tablet'] : '2';
        $cols_mobile  = !empty($settings['columns_mobile']) ? $settings['columns_mobile'] : '1';
        $gap = isset($settings['grid_gap']['size']) ? $settings['grid_gap']['size'] : 24;
        $radius = isset($settings['border_radius']['size']) ? $settings['border_radius']['size'] : 12;

        $doctors_page_url = '';
        if (!empty($settings['doctors_page_url'])) {
            if (is_array($settings['doctors_page_url'])) {
                $doctors_page_url = !empty($settings['doctors_page_url']['url']) ? $settings['doctors_page_url']['url'] : '';
            } else {
                $doctors_page_url = $settings['doctors_page_url'];
            }
        }
        if (empty($doctors_page_url)) {
            $doctors_page_url = home_url('/ecare-doctors');
        }

        // Colors resolution with defensive defaults
        $title_color        = !empty($settings['title_color']) ? $settings['title_color'] : '#1e293b';
        $subtitle_color     = !empty($settings['subtitle_color']) ? $settings['subtitle_color'] : '#64748b';
        $tab_bg_color       = !empty($settings['tab_bg_color']) ? $settings['tab_bg_color'] : '#f1f5f9';
        $tab_text_color     = !empty($settings['tab_text_color']) ? $settings['tab_text_color'] : '#475569';
        $tab_active_bg      = !empty($settings['tab_active_bg']) ? $settings['tab_active_bg'] : '#1b3b2b';
        $tab_active_text    = !empty($settings['tab_active_text']) ? $settings['tab_active_text'] : '#ffffff';
        $card_bg_color      = !empty($settings['card_bg_color']) ? $settings['card_bg_color'] : '#ffffff';
        $card_border_color  = !empty($settings['card_border_color']) ? $settings['card_border_color'] : '#e2e8f0';
        $card_title_color   = !empty($settings['card_title_color']) ? $settings['card_title_color'] : '#0f172a';
        $card_desc_color    = !empty($settings['card_desc_color']) ? $settings['card_desc_color'] : '#475569';
        $card_price_color   = !empty($settings['card_price_color']) ? $settings['card_price_color'] : '#0f172a';
        $card_btn_bg        = !empty($settings['card_btn_bg']) ? $settings['card_btn_bg'] : '#f8fafc';
        $card_btn_text      = !empty($settings['card_btn_text']) ? $settings['card_btn_text'] : '#1e293b';
        $card_btn_hover_bg  = !empty($settings['card_btn_hover_bg']) ? $settings['card_btn_hover_bg'] : '#1b3b2b';
        $card_btn_hover_text = !empty($settings['card_btn_hover_text']) ? $settings['card_btn_hover_text'] : '#ffffff';

        // Dynamic widget UID
        $widget_id = 'ecare-serv-tab-' . $this->get_id();
        $el_class = 'elementor-element-' . $this->get_id();

        // Convert hex to rgb for theme primary
        $hex = str_replace('#', '', $theme_primary);
        if (strlen($hex) == 3) {
            $r = hexdec(substr($hex, 0, 1) . substr($hex, 0, 1));
            $g = hexdec(substr($hex, 1, 1) . substr($hex, 1, 1));
            $b = hexdec(substr($hex, 2, 1) . substr($hex, 2, 1));
        } else {
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));
        }
        $primary_rgb = "$r, $g, $b";

        // Convert hex to rgb for active tab background
        $hex_tab = str_replace('#', '', $tab_active_bg);
        if (strlen($hex_tab) == 3) {
            $rt = hexdec(substr($hex_tab, 0, 1) . substr($hex_tab, 0, 1));
            $gt = hexdec(substr($hex_tab, 1, 1) . substr($hex_tab, 1, 1));
            $bt = hexdec(substr($hex_tab, 2, 1) . substr($hex_tab, 2, 1));
        } else {
            $rt = hexdec(substr($hex_tab, 0, 2));
            $gt = hexdec(substr($hex_tab, 2, 2));
            $bt = hexdec(substr($hex_tab, 4, 2));
        }
        $tab_active_rgb = "$rt, $gt, $bt";

        // Convert hex to rgb for button hover background
        $hex_btn = str_replace('#', '', $card_btn_hover_bg);
        if (strlen($hex_btn) == 3) {
            $rb = hexdec(substr($hex_btn, 0, 1) . substr($hex_btn, 0, 1));
            $gb = hexdec(substr($hex_btn, 1, 1) . substr($hex_btn, 1, 1));
            $bb = hexdec(substr($hex_btn, 2, 1) . substr($hex_btn, 2, 1));
        } else {
            $rb = hexdec(substr($hex_btn, 0, 2));
            $gb = hexdec(substr($hex_btn, 2, 2));
            $bb = hexdec(substr($hex_btn, 4, 2));
        }
        $btn_hover_rgb = "$rb, $gb, $bb";
        ?>
        <style>
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-widget-wrapper {
                width: 100%;
                font-family: inherit;
                margin-bottom: 2rem;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-header {
                text-align: center;
                margin-bottom: 2.5rem;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-title {
                font-size: 2.1rem;
                font-weight: 800;
                color: <?php echo esc_attr($title_color); ?>;
                margin: 0 0 0.5rem 0 !important;
                line-height: 1.25;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-subtitle {
                font-size: 0.95rem;
                color: <?php echo esc_attr($subtitle_color); ?>;
                max-width: 600px;
                margin: 0 auto !important;
                line-height: 1.6;
            }

            /* Tabs Header */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-tabs-header {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.65rem;
                margin-bottom: 2.5rem;
                padding-bottom: 0.25rem;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-tab-btn {
                border: none;
                outline: none;
                padding: 0.55rem 1.35rem;
                border-radius: 9999px;
                font-size: 0.82rem;
                font-weight: 700;
                background: <?php echo esc_attr($tab_bg_color); ?>;
                color: <?php echo esc_attr($tab_text_color); ?>;
                cursor: pointer;
                transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-tab-btn:hover {
                transform: translateY(-2px);
                background: #e2e8f0;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-tab-btn.active {
                background: <?php echo esc_attr($tab_active_bg); ?> !important;
                color: <?php echo esc_attr($tab_active_text); ?> !important;
                box-shadow: 0 6px 18px 0 rgba(<?php echo $tab_active_rgb; ?>, 0.3);
            }

            /* Responsive Grid */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid {
                display: grid;
                grid-template-columns: repeat(<?php echo esc_attr($cols_desktop); ?>, 1fr);
                gap: <?php echo esc_attr($gap); ?>px;
                transition: all 0.3s;
            }

            @media(max-width: 1024px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid {
                    grid-template-columns: repeat(<?php echo esc_attr($cols_tablet); ?>, 1fr);
                }
            }
            @media(max-width: 640px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid {
                    grid-template-columns: repeat(<?php echo esc_attr($cols_mobile); ?>, 1fr);
                }
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-title {
                    font-size: 1.75rem;
                }
            }

            /* Clean Minimalist Card Design */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card {
                border: 1px solid rgba(0, 0, 0, 0.04);
                border-radius: 16px;
                padding: 1.75rem;
                display: flex;
                flex-direction: column;
                min-height: 100%;
                text-decoration: none !important;
                box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.015);
                transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease, opacity 0.25s ease;
                position: relative;
                overflow: hidden;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card:hover {
                transform: translateY(-4px);
                border-color: rgba(0, 0, 0, 0.08);
                box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.05);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-watermark {
                position: absolute;
                bottom: -8px;
                left: -8px;
                width: 76px;
                height: 76px;
                opacity: 0.08;
                pointer-events: none;
                z-index: 1;
                transition: opacity 0.25s ease, transform 0.25s ease;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card:hover .ecare-service-card-watermark {
                opacity: 0.15;
                transform: scale(1.08) rotate(-5deg);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-top-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 0.5rem;
                position: relative;
                z-index: 2;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-title {
                margin: 0 !important;
                font-size: 1.15rem;
                font-weight: 700;
                line-height: 1.35;
                color: <?php echo esc_attr($card_title_color); ?>;
                letter-spacing: -0.015em;
                transition: color 0.22s ease;
                z-index: 2;
                position: relative;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card:hover .ecare-service-card-title {
                color: var(--card-accent) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-desc {
                margin: 0.25rem 0 0 0 !important;
                font-size: 0.82rem;
                line-height: 1.45;
                color: <?php echo esc_attr($card_desc_color); ?>;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                z-index: 2;
                position: relative;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-bottom-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                gap: 1rem;
                margin-top: auto;
                padding-top: 1.5rem;
                position: relative;
                z-index: 2;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-pills {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 0.45rem;
                z-index: 2;
                position: relative;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-pill {
                display: inline-flex;
                align-items: center;
                padding: 0.35rem 0.8rem;
                border-radius: 9999px;
                font-size: 0.72rem;
                font-weight: 600;
                line-height: 1;
                text-transform: none;
                letter-spacing: 0;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-pill.speciality-pill {
                background: #e2f9e1;
                color: #1b5e20;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-pill.price-pill {
                background: #f1f5f9;
                color: #475569;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-pill.online-pill {
                background: #e0f2fe;
                color: #0369a1;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-circle-button {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                margin-left: auto;
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.22s ease;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card:hover .ecare-circle-button {
                transform: scale(1.1);
                filter: brightness(0.95);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-badge {
                background: #0f172a !important;
                color: #ffffff !important;
                font-size: 0.65rem !important;
                font-weight: 700 !important;
                padding: 0.25rem 0.6rem !important;
                border-radius: 9999px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                line-height: 1 !important;
                flex-shrink: 0 !important;
                margin-left: auto !important;
                z-index: 10 !important;
                position: relative !important;
            }

            /* Bottom-right cutout image layout */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-card-image-wrap {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 50%;
                height: 80%;
                display: flex;
                align-items: flex-end;
                justify-content: flex-end;
                overflow: hidden;
                pointer-events: none;
                z-index: 3;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-card-image-wrap img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                object-position: bottom right;
                transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card:hover .ecare-card-image-wrap img {
                transform: scale(1.08) translateY(-2px);
            }

            /* Width constraints to prevent overlap */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.has-image .ecare-service-card-title {
                max-width: calc(100% - 50px);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.has-image .ecare-service-card-desc {
                max-width: 55%;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.has-image .ecare-service-card-pills {
                max-width: 55%;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.has-image .ecare-service-card-watermark {
                display: none;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.has-image .ecare-circle-button {
                position: absolute;
                right: 1.5rem;
                top: 1.5rem;
                z-index: 10;
            }

            /* Slider Carousel specific styles */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-slider-container {
                width: 100%;
                overflow: visible;
                position: relative;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid.layout-slider {
                display: flex !important;
                flex-wrap: nowrap !important;
                gap: var(--card-gap, 24px) !important;
                overflow-x: auto !important;
                scroll-behavior: smooth !important;
                -webkit-overflow-scrolling: touch !important;
                padding: 0.5rem 0.2rem 1.5rem 0.2rem !important;
                margin: -0.5rem -0.2rem -1.5rem -0.2rem !important;
                grid-template-columns: none !important;
                scrollbar-width: none !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid.layout-slider::-webkit-scrollbar {
                display: none !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid.layout-slider .ecare-service-card {
                flex: 0 0 calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 4) - 1))) / var(--card-columns, 4)) !important;
                width: calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 4) - 1))) / var(--card-columns, 4)) !important;
                box-sizing: border-box !important;
                min-height: unset !important;
            }
            @media (max-width: 1024px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid.layout-slider .ecare-service-card {
                    flex: 0 0 calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 2) - 1))) / var(--card-columns, 2)) !important;
                    width: calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 2) - 1))) / var(--card-columns, 2)) !important;
                }
            }
            @media (max-width: 640px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-services-grid.layout-slider .ecare-service-card {
                    flex: 0 0 calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 1) - 1))) / var(--card-columns, 1)) !important;
                    width: calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 1) - 1))) / var(--card-columns, 1)) !important;
                    height: 230px !important;
                    padding: 1.5rem 1.25rem !important;
                }
            }

            /* Slider Navigation Arrows */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn {
                position: absolute !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                width: 44px !important;
                height: 44px !important;
                border-radius: 50% !important;
                border: 1px solid #e2e8f0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                outline: none !important;
                z-index: 10 !important;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn.prev {
                left: -22px !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn.next {
                right: -22px !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn:hover {
                border-color: #94a3b8 !important;
                background: #f8fafc !important;
                transform: translateY(-50%) scale(1.02) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn:active {
                transform: translateY(-50%) scale(0.98) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn svg {
                display: block !important;
                visibility: visible !important;
                width: 18px !important;
                height: 18px !important;
                stroke: #0f172a !important;
                stroke-width: 2.5px !important;
                fill: none !important;
                opacity: 1 !important;
                color: #0f172a !important;
            }

            /* Clean Minimal Card Layout Specifics */
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.layout-minimal {
                padding: 1.75rem !important;
                min-height: 240px;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card.layout-minimal .ecare-service-card-title {
                max-width: 100% !important;
                font-size: 1.35rem !important;
                font-weight: 700 !important;
                line-height: 1.3 !important;
            }
        </style>

        <div class="ecare-services-widget-wrapper" id="<?php echo esc_attr($widget_id); ?>" style="--card-columns: <?php echo esc_attr($cols_desktop); ?>; --card-gap: <?php echo esc_attr($gap); ?>px;">
            
            <?php if ($settings['show_header'] === 'yes') : ?>
                <?php if ((isset($settings['title_text']) && $settings['title_text'] !== '') || (isset($settings['subtitle_text']) && $settings['subtitle_text'] !== '')) : ?>
                    <div class="ecare-services-header">
                        <?php if (isset($settings['title_text']) && $settings['title_text'] !== '') : ?>
                            <h2 class="ecare-services-title"><?php echo esc_html($settings['title_text']); ?></h2>
                        <?php endif; ?>
                        <?php if (isset($settings['subtitle_text']) && $settings['subtitle_text'] !== '') : ?>
                            <p class="ecare-services-subtitle"><?php echo esc_html($settings['subtitle_text']); ?></p>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>

            <!-- Tabs Navigation -->
            <div class="ecare-services-tabs-header">
                <button class="ecare-services-tab-btn active" data-tab="all"><?php esc_html_e('All Services', 'e-care-management'); ?></button>
                <?php foreach ($specialties as $spec) : ?>
                    <button class="ecare-services-tab-btn" data-tab="<?php echo esc_attr(sanitize_title($spec)); ?>">
                        <?php echo esc_html($spec); ?>
                    </button>
                <?php endforeach; ?>
            </div>

            <!-- Cards Grid / Slider -->
            <?php if ($layout_type === 'slider') : ?>
            <div class="ecare-services-slider-container">
                <div class="ecare-services-grid layout-slider">
            <?php else : ?>
                <div class="ecare-services-grid">
            <?php endif; ?>
                <?php 
                $color_mode = !empty($settings['card_color_mode']) ? $settings['card_color_mode'] : 'presets';
                $show_watermark = ($settings['show_watermark'] ?? 'yes') === 'yes';
                $watermark_pos = !empty($settings['watermark_position']) ? $settings['watermark_position'] : 'bottom-left';
                $card_bg = !empty($settings['card_bg_color']) ? $settings['card_bg_color'] : '#ffffff';
                $card_border = !empty($settings['card_border_color']) ? $settings['card_border_color'] : '#e2e8f0';

                $color_palettes = array(
                    array(
                        'bg_color' => '#f4fbf7',
                        'border' => '#e6f6ee',
                        'accent' => '#0d9488',
                        'icon' => '#d1f2e5',
                    ),
                    array(
                        'bg_color' => '#fff5f5',
                        'border' => '#ffebeb',
                        'accent' => '#e11d48',
                        'icon' => '#ffd6d6',
                    ),
                    array(
                        'bg_color' => '#f5f3ff',
                        'border' => '#ebe8ff',
                        'accent' => '#7c3aed',
                        'icon' => '#e0dbff',
                    ),
                    array(
                        'bg_color' => '#fff1f2',
                        'border' => '#ffe4e6',
                        'accent' => '#db2777',
                        'icon' => '#ffd0d6',
                    ),
                    array(
                        'bg_color' => '#fffbeb',
                        'border' => '#fde68a',
                        'accent' => '#b45309',
                        'icon' => '#fef3c7',
                    ),
                    array(
                        'bg_color' => '#eff6ff',
                        'border' => '#e0f2fe',
                        'accent' => '#1d4ed8',
                        'icon' => '#d0e7ff',
                    ),
                );

                $card_index = 0;
                foreach ($services as $service) : 
                    $spec_slug = sanitize_title($service->speciality);
                    $service_speciality = isset($service->speciality) ? (string) $service->speciality : '';
                    $service_name = isset($service->name) ? (string) $service->name : '';
                    
                    $target_base = !empty($service->book_url) ? $service->book_url : $doctors_page_url;
                    $url_args = array();
                    if (!empty($service_speciality) && strtolower($service_speciality) !== 'all') {
                        $url_args['specialty'] = $service_speciality;
                    }
                    if (!empty($service_name)) {
                        $url_args['service'] = $service_name;
                    }
                    $final_url = !empty($url_args) ? add_query_arg($url_args, $target_base) : $target_base;
                    $palette = $color_palettes[$card_index % 6];
                    $card_index++;

                    if ($color_mode === 'custom') {
                        $bg = $card_bg;
                        $border = $card_border;
                        $accent = !empty($settings['card_title_hover_color']) ? $settings['card_title_hover_color'] : $theme_primary;
                        $icon_c = !empty($settings['watermark_custom_color']) ? $settings['watermark_custom_color'] : 'rgba(0, 0, 0, 0.05)';
                    } else {
                        $bg = !empty($service->custom_bg) ? $service->custom_bg : $palette['bg_color'];
                        $border = !empty($service->custom_bg) ? 'rgba(0,0,0,0.02)' : $palette['border'];
                        $accent = !empty($service->custom_accent) ? $service->custom_accent : $palette['accent'];
                        $icon_c = $palette['icon'];
                    }

                    $has_custom_image = !empty($service->custom_image['url']);
                    $custom_image_url = $has_custom_image ? $service->custom_image['url'] : '';
                    $target_attr = isset($service->book_link_target) ? $service->book_link_target : '';
                    $rel_attr = isset($service->book_link_rel) ? $service->book_link_rel : '';
                ?>
                    <a class="ecare-service-card<?php echo $has_custom_image ? ' has-image' : ''; ?><?php echo $card_style === 'minimal' ? ' layout-minimal' : ''; ?>" data-speciality="<?php echo esc_attr($spec_slug); ?>" href="<?php echo esc_url($final_url); ?>"<?php echo $target_attr . $rel_attr; ?> style="background: <?php echo esc_attr($bg); ?>; border-color: <?php echo esc_attr($border); ?>; --card-accent: <?php echo esc_attr($accent); ?>;">
                        <?php if ($show_watermark && !$has_custom_image) : ?>
                            <div class="ecare-service-card-watermark pos-<?php echo esc_attr($watermark_pos); ?>" style="color: <?php echo esc_attr($icon_c); ?>;">
                                <?php echo $this->get_watermark_svg($card_index - 1); ?>
                            </div>
                        <?php endif; ?>

                        <div class="ecare-service-card-top-row">
                            <h3 class="ecare-service-card-title"><?php echo esc_html($service->name); ?></h3>
                            <?php if (!empty($service->badge)) : ?>
                                <span class="ecare-service-badge"><?php echo esc_html($service->badge); ?></span>
                            <?php endif; ?>
                        </div>

                        <?php if ($card_style !== 'minimal') : ?>
                            <?php if (!empty($service->description)) : ?>
                                <p class="ecare-service-card-desc"><?php echo esc_html($service->description); ?></p>
                            <?php endif; ?>

                            <div class="ecare-service-card-bottom-row">
                                <div class="ecare-service-card-pills">
                                    <?php if (!empty($service->speciality)) : ?>
                                        <span class="ecare-service-card-pill speciality-pill"><?php echo esc_html($service->speciality); ?></span>
                                    <?php endif; ?>

                                    <?php if (!empty($service->price)) : ?>
                                        <span class="ecare-service-card-pill price-pill">
                                            <?php 
                                            $price_val = $service->price;
                                            if (is_numeric($price_val)) {
                                                echo esc_html($currency_symbol . number_format((float)$price_val, 0));
                                            } else {
                                                echo esc_html($price_val);
                                            }
                                            ?>
                                        </span>
                                    <?php endif; ?>

                                    <?php if (!empty($service->telemedicine)) : ?>
                                        <span class="ecare-service-card-pill online-pill"><?php esc_html_e('Online Booking Available', 'e-care-management'); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endif; ?>

                        <?php if ($has_custom_image && !empty($custom_image_url)) : ?>
                            <div class="ecare-card-image-wrap">
                                <img src="<?php echo esc_url($custom_image_url); ?>" alt="<?php echo esc_attr($service->name); ?>" />
                            </div>
                        <?php endif; ?>
                    </a>
                <?php endforeach; ?>
            <?php if ($layout_type === 'slider') : ?>
                </div>
                <!-- Slider Navigation -->
                <button class="ecare-slider-btn prev" aria-label="Previous slide">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <button class="ecare-slider-btn next" aria-label="Next slide">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
            <?php else : ?>
            </div>
            <?php endif; ?>

        </div>

        <script type="text/javascript">
            (function() {
                function initServicesWidget() {
                    const wrapper = document.getElementById('<?php echo esc_js($widget_id); ?>');
                    if (!wrapper) return;

                    if (wrapper.getAttribute('data-ecare-bound') === '1') return;
                    wrapper.setAttribute('data-ecare-bound', '1');

                    const tabBtns = wrapper.querySelectorAll('.ecare-services-tab-btn');
                    const cards = wrapper.querySelectorAll('.ecare-service-card');
                    const track = wrapper.querySelector('.ecare-services-grid');
                    const prevBtn = wrapper.querySelector('.ecare-slider-btn.prev');
                    const nextBtn = wrapper.querySelector('.ecare-slider-btn.next');
                    let currentScroll = 0;

                    const updateSliderArrows = () => {
                        if (!track || !prevBtn || !nextBtn) return;
                        const maxScroll = track.scrollWidth - track.clientWidth;
                        if (maxScroll <= 5) {
                            prevBtn.style.display = 'none';
                            nextBtn.style.display = 'none';
                        } else {
                            prevBtn.style.display = 'flex';
                            nextBtn.style.display = 'flex';
                        }
                    };

                    // Tab Filtering Logic
                    tabBtns.forEach(btn => {
                        btn.addEventListener('click', function() {
                            tabBtns.forEach(b => b.classList.remove('active'));
                            this.classList.add('active');

                            const targetTab = this.getAttribute('data-tab');

                            cards.forEach(card => {
                                const cardSpec = card.getAttribute('data-speciality');

                                if (targetTab === 'all' || cardSpec === targetTab) {
                                    card.style.display = 'flex';
                                    card.style.opacity = '0';
                                    card.style.transform = 'translateY(8px)';
                                    setTimeout(() => {
                                        card.style.opacity = '1';
                                        card.style.transform = 'translateY(0)';
                                        updateSliderArrows();
                                    }, 30);
                                } else {
                                    card.style.opacity = '0';
                                    card.style.transform = 'translateY(8px)';
                                    card.style.display = 'none';
                                }
                            });

                            // Reset slider scroll when tab changes
                            if (track && track.classList.contains('layout-slider')) {
                                track.scrollTo({ left: 0, behavior: 'instant' });
                                currentScroll = 0;
                                setTimeout(updateSliderArrows, 100);
                            }
                        });
                    });

                    // Slider Carousel Logic
                    if (track && track.classList.contains('layout-slider') && prevBtn && nextBtn) {
                        nextBtn.addEventListener('click', () => {
                            const firstCard = track.querySelector('.ecare-service-card[style*="display: flex"]') || track.querySelector('.ecare-service-card');
                            const cardWidth = firstCard ? firstCard.offsetWidth : 280;
                            const gap = parseInt(window.getComputedStyle(track).gap) || 24;
                            const columns = parseInt(window.getComputedStyle(wrapper).getPropertyValue('--card-columns')) || 3;
                            const scrollAmount = (cardWidth + gap) * columns;

                            currentScroll = Math.min(track.scrollLeft + scrollAmount, track.scrollWidth - track.clientWidth);
                            track.scrollTo({ left: currentScroll, behavior: 'smooth' });
                        });

                        prevBtn.addEventListener('click', () => {
                            const firstCard = track.querySelector('.ecare-service-card[style*="display: flex"]') || track.querySelector('.ecare-service-card');
                            const cardWidth = firstCard ? firstCard.offsetWidth : 280;
                            const gap = parseInt(window.getComputedStyle(track).gap) || 24;
                            const columns = parseInt(window.getComputedStyle(wrapper).getPropertyValue('--card-columns')) || 3;
                            const scrollAmount = (cardWidth + gap) * columns;

                            currentScroll = Math.max(track.scrollLeft - scrollAmount, 0);
                            track.scrollTo({ left: currentScroll, behavior: 'smooth' });
                        });

                        // Update arrows on resize and load
                        window.addEventListener('resize', updateSliderArrows);
                        setTimeout(updateSliderArrows, 200);
                    }
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initServicesWidget);
                } else {
                    initServicesWidget();
                }

                if (window.elementorFrontend && window.elementorFrontend.hooks) {
                    elementorFrontend.hooks.addAction('frontend/element_ready/ecare_services_widget.default', initServicesWidget);
                }
            })();
        </script>
        <?php
    }
}
