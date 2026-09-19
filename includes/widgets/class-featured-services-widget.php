<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Featured_Services_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_featured_services_widget';
    }

    public function get_title() {
        return esc_html__('E-CARE Featured Services', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-star';
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

    private function get_speciality_options() {
        $options = array(
            'all' => esc_html__('All Specialities', 'e-care-management'),
            sanitize_title('Virtual Consultation') => esc_html__('Virtual Consultation', 'e-care-management'),
            sanitize_title('Home Care Support') => esc_html__('Home Care Support', 'e-care-management'),
            sanitize_title('Emergency Dispatch') => esc_html__('Emergency Dispatch', 'e-care-management'),
            sanitize_title('Clinical Lab Booking') => esc_html__('Clinical Lab Booking', 'e-care-management'),
        );

        if (!class_exists('ECARE_DB_Client')) {
            return $options;
        }

        $services = ECARE_DB_Client::select_all('ecare_services');
        $specialities = array();

        if (is_array($services)) {
            foreach ($services as $service) {
                if (($service->status ?? '') !== 'Active') {
                    continue;
                }

                $speciality = trim((string) ($service->speciality ?? ''));
                if ($speciality !== '') {
                    $specialities[sanitize_title($speciality)] = $speciality;
                }
            }
        }

        asort($specialities, SORT_NATURAL | SORT_FLAG_CASE);

        foreach ($specialities as $slug => $label) {
            $options[$slug] = $label;
        }

        return $options;
    }

    private function get_service_options() {
        $options = array(
            'telemedicine' => esc_html__('Core: Telemedicine / Video Consult', 'e-care-management'),
            'home_care' => esc_html__('Core: In-Home Nursing & Care', 'e-care-management'),
            'ambulance' => esc_html__('Core: Emergency Ambulance Service', 'e-care-management'),
            'lab_tests' => esc_html__('Core: Diagnostic Lab Tests', 'e-care-management'),
        );

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
        $this->start_controls_section(
            'section_content_header',
            array(
                'label' => esc_html__('Header Section', 'e-care-management'),
            )
        );

        $this->add_control(
            'title_text',
            array(
                'label' => esc_html__('Widget Title', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => esc_html__('Featured Services', 'e-care-management'),
            )
        );

        $this->add_control(
            'subtitle_text',
            array(
                'label' => esc_html__('Widget Subtitle', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => esc_html__('A curated selection of the most important clinical services for patients to explore and book quickly.', 'e-care-management'),
            )
        );

        $this->add_control(
            'show_header',
            array(
                'label' => esc_html__('Show Header', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Show', 'e-care-management'),
                'label_off' => esc_html__('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            )
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_content_services',
            array(
                'label' => esc_html__('Featured Services List', 'e-care-management'),
            )
        );

        $repeater = new \Elementor\Repeater();

        $repeater->add_control(
            'service_category',
            array(
                'label' => esc_html__('Category Tag', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => esc_html__('Instant', 'e-care-management'),
            )
        );

        $repeater->add_control(
            'service_title',
            array(
                'label' => esc_html__('Title', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => esc_html__('MBBS Doctor', 'e-care-management'),
                'label_block' => true,
            )
        );

        $repeater->add_control(
            'service_desc',
            array(
                'label' => esc_html__('Description', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => esc_html__('Consult with a registered MBBS doctor immediately for urgent care.', 'e-care-management'),
            )
        );

        $repeater->add_control(
            'service_price',
            array(
                'label' => esc_html__('Price (e.g. 50 or Varies)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '50',
            )
        );

        $repeater->add_control(
            'service_original_price',
            array(
                'label' => esc_html__('Original Price (optional)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '200',
            )
        );

        $repeater->add_control(
            'service_badge',
            array(
                'label' => esc_html__('Badge (e.g. New)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
            )
        );

        $repeater->add_control(
            'service_btn_text',
            array(
                'label' => esc_html__('Button Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => esc_html__('Book Now ↗', 'e-care-management'),
            )
        );

        $repeater->add_control(
            'service_link',
            array(
                'label' => esc_html__('Link URL', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::URL,
                'dynamic' => array(
                    'active' => true,
                ),
                'default' => array(
                    'url' => home_url('/ecare-instant-booking'),
                    'is_external' => false,
                    'nofollow' => false,
                ),
                'placeholder' => esc_html__('https://your-link.com', 'e-care-management'),
                'label_block' => true,
            )
        );

        $repeater->add_control(
            'service_image',
            array(
                'label' => esc_html__('Cutout Image', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::MEDIA,
            )
        );

        $repeater->add_control(
            'service_bg_color',
            array(
                'label' => esc_html__('Custom Background Color (leaves blank for theme palettes)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
            )
        );

        $repeater->add_control(
            'service_accent_color',
            array(
                'label' => esc_html__('Custom Accent Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
            )
        );

        $this->add_control(
            'services_list',
            array(
                'label' => esc_html__('Services', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::REPEATER,
                'fields' => $repeater->get_controls(),
                'title_field' => '{{{ service_title }}} ({{{ service_category }}})',
                'default' => array(
                    array(
                        'service_category' => esc_html__('Instant', 'e-care-management'),
                        'service_title' => esc_html__('MBBS Doctor', 'e-care-management'),
                        'service_desc' => esc_html__('Consult with a registered MBBS doctor immediately for urgent care.', 'e-care-management'),
                        'service_price' => '50',
                        'service_original_price' => '200',
                        'service_badge' => '',
                        'service_btn_text' => esc_html__('Book now ↗', 'e-care-management'),
                        'service_link' => home_url('/ecare-instant-booking'),
                        'service_bg_color' => '#e5f6ed',
                        'service_accent_color' => '#0d9488',
                    ),
                    array(
                        'service_category' => esc_html__('Specialist', 'e-care-management'),
                        'service_title' => esc_html__('Doctor', 'e-care-management'),
                        'service_desc' => esc_html__('Book a consultation with specialist doctors in various departments.', 'e-care-management'),
                        'service_price' => 'Varies',
                        'service_original_price' => '',
                        'service_badge' => '',
                        'service_btn_text' => esc_html__('Book now ↗', 'e-care-management'),
                        'service_link' => home_url('/ecare-doctors'),
                        'service_bg_color' => '#e8f3fd',
                        'service_accent_color' => '#1d4ed8',
                    ),
                    array(
                        'service_category' => esc_html__('Shukhee', 'e-care-management'),
                        'service_title' => esc_html__('HealthStore', 'e-care-management'),
                        'service_desc' => esc_html__('Buy prescription drugs, health supplements, and medical devices online.', 'e-care-management'),
                        'service_price' => 'Varies',
                        'service_original_price' => '',
                        'service_badge' => esc_html__('NEW', 'e-care-management'),
                        'service_btn_text' => esc_html__('Flash discount ↗', 'e-care-management'),
                        'service_link' => home_url('/ecare-cart'),
                        'service_bg_color' => '#f2f7ec',
                        'service_accent_color' => '#b45309',
                    ),
                    array(
                        'service_category' => esc_html__('Mental', 'e-care-management'),
                        'service_title' => esc_html__('Wellness', 'e-care-management'),
                        'service_desc' => esc_html__('Talk to certified counselors and therapists for mental well-being.', 'e-care-management'),
                        'service_price' => 'Varies',
                        'service_original_price' => '',
                        'service_badge' => '',
                        'service_btn_text' => esc_html__('Book now ↗', 'e-care-management'),
                        'service_link' => home_url('/ecare-doctors?specialty=mental-wellness'),
                        'service_bg_color' => '#f3eafb',
                        'service_accent_color' => '#7c3aed',
                    ),
                    array(
                        'service_category' => esc_html__('Home Care', 'e-care-management'),
                        'service_title' => esc_html__('Lab Tests', 'e-care-management'),
                        'service_desc' => esc_html__('Get diagnostic samples collected from the comfort of your home.', 'e-care-management'),
                        'service_price' => 'Varies',
                        'service_original_price' => '',
                        'service_badge' => '',
                        'service_btn_text' => esc_html__('Book now ↗', 'e-care-management'),
                        'service_link' => home_url('/ecare-lab-booking'),
                        'service_bg_color' => '#e4f6f8',
                        'service_accent_color' => '#0d9488',
                    ),
                )
            )
        );

        $this->add_control(
            'show_speciality',
            array(
                'label' => esc_html__('Show Category Tag', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Show', 'e-care-management'),
                'label_off' => esc_html__('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            )
        );

        $this->add_control(
            'show_description',
            array(
                'label' => esc_html__('Show Description', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Show', 'e-care-management'),
                'label_off' => esc_html__('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            )
        );

        $this->add_control(
            'show_price',
            array(
                'label' => esc_html__('Show Price', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Show', 'e-care-management'),
                'label_off' => esc_html__('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            )
        );

        $this->add_control(
            'show_button',
            array(
                'label' => esc_html__('Show Book Button', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Show', 'e-care-management'),
                'label_off' => esc_html__('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            )
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_content_layout',
            array(
                'label' => esc_html__('Layout', 'e-care-management'),
            )
        );

        $this->add_responsive_control(
            'columns',
            array(
                'label' => esc_html__('Columns', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => '4',
                'tablet_default' => '2',
                'mobile_default' => '1',
                'options' => array(
                    '1' => '1',
                    '2' => '2',
                    '3' => '3',
                    '4' => '4',
                    '5' => '5',
                ),
                'selectors' => array(
                    '{{WRAPPER}}' => '--card-columns: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'grid_gap',
            array(
                'label' => esc_html__('Grid Gap (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 10,
                        'max' => 60,
                        'step' => 2,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 24,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-services-grid' => 'gap: {{SIZE}}{{UNIT}};',
                ),
            )
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_header',
            array(
                'label' => esc_html__('Header Styles', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_control(
            'title_color',
            array(
                'label' => esc_html__('Title Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-services-title' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .ecare-featured-services-title',
            )
        );

        $this->add_control(
            'subtitle_color',
            array(
                'label' => esc_html__('Subtitle Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#64748b',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-header-tag' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name' => 'subtitle_typography',
                'selector' => '{{WRAPPER}} .ecare-header-tag',
            )
        );

        $this->add_responsive_control(
            'nav_btn_size',
            array(
                'label' => esc_html__('Nav Button Circle Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 20,
                        'max' => 100,
                        'step' => 1,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 44,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-slider-btn' => 'width: {{SIZE}}{{UNIT}} !important; height: {{SIZE}}{{UNIT}} !important;',
                ),
            )
        );

        $this->add_responsive_control(
            'nav_arrow_size',
            array(
                'label' => esc_html__('Nav Arrow Icon Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 10,
                        'max' => 50,
                        'step' => 1,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 18,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-slider-btn svg' => 'width: {{SIZE}}{{UNIT}} !important; height: {{SIZE}}{{UNIT}} !important;',
                ),
            )
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_cards',
            array(
                'label' => esc_html__('Card Styles', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_control(
            'card_color_mode',
            array(
                'label' => esc_html__('Color Palette Mode', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'presets',
                'options' => array(
                    'presets' => esc_html__('Themed Presets (Green, Red, Violet, etc.)', 'e-care-management'),
                    'custom' => esc_html__('Custom Unified Colors', 'e-care-management'),
                ),
            )
        );

        $this->add_control(
            'card_radius',
            array(
                'label' => esc_html__('Card Border Radius (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 0,
                        'max' => 60,
                        'step' => 1,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 24,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card' => 'border-radius: {{SIZE}}{{UNIT}};',
                ),
            )
        );

        $this->add_control(
            'card_height',
            array(
                'label' => esc_html__('Card Height (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 150,
                        'max' => 400,
                        'step' => 5,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 240,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card' => 'height: {{SIZE}}{{UNIT}} !important;',
                ),
            )
        );

        $this->add_control(
            'card_gap',
            array(
                'label' => esc_html__('Gap Between Cards (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 0,
                        'max' => 50,
                        'step' => 1,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 24,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-services-slider-track' => 'gap: {{SIZE}}{{UNIT}} !important;',
                    '{{WRAPPER}}' => '--card-gap: {{SIZE}}{{UNIT}};',
                ),
            )
        );

        $this->add_control(
            'card_image_width',
            array(
                'label' => esc_html__('Cutout Image Width (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 50,
                        'max' => 250,
                        'step' => 5,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 140,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-card-image-wrap' => 'width: {{SIZE}}{{UNIT}} !important;',
                ),
            )
        );

        $this->add_control(
            'card_image_height',
            array(
                'label' => esc_html__('Cutout Image Height (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 50,
                        'max' => 250,
                        'step' => 5,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 120,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-card-image-wrap' => 'height: {{SIZE}}{{UNIT}} !important;',
                ),
            )
        );

        $this->add_control(
            'card_bg_color',
            array(
                'label' => esc_html__('Card Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'condition' => array(
                    'card_color_mode' => 'custom',
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card' => 'background: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'card_border_color',
            array(
                'label' => esc_html__('Card Border', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#e2e8f0',
                'condition' => array(
                    'card_color_mode' => 'custom',
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card' => 'border-color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'card_title_hover_color',
            array(
                'label' => esc_html__('Title Hover Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0d9488',
                'condition' => array(
                    'card_color_mode' => 'custom',
                ),
            )
        );

        $this->add_control(
            'watermark_custom_color',
            array(
                'label' => esc_html__('Watermark Icon Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => 'rgba(0, 0, 0, 0.05)',
                'condition' => array(
                    'card_color_mode' => 'custom',
                ),
            )
        );

        $this->add_control(
            'card_title_color',
            array(
                'label' => esc_html__('Card Title Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-title' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name' => 'card_title_typography',
                'selector' => '{{WRAPPER}} .ecare-featured-service-title',
            )
        );

        $this->add_control(
            'card_desc_color',
            array(
                'label' => esc_html__('Card Description', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#64748b',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-desc' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name' => 'card_desc_typography',
                'selector' => '{{WRAPPER}} .ecare-featured-service-desc',
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            array(
                'name' => 'card_box_shadow',
                'selector' => '{{WRAPPER}} .ecare-featured-service-card',
            )
        );

        $this->add_control(
            'card_price_color',
            array(
                'label' => esc_html__('Price Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-price-wrap' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .ecare-featured-service-price-wrap .price-actual' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .ecare-featured-service-price-wrap .price-varies' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'badge_bg_color',
            array(
                'label' => esc_html__('Badge Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#eef6f2',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-badge' => 'background: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'badge_text_color',
            array(
                'label' => esc_html__('Badge Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1b3b2b',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-badge' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'button_bg_color',
            array(
                'label' => esc_html__('Button Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => 'transparent',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-link' => 'background-color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'button_text_color',
            array(
                'label' => esc_html__('Button Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-link' => 'color: {{VALUE}}; border-bottom-color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'button_hover_bg_color',
            array(
                'label' => esc_html__('Button Hover Background', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => 'transparent',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card:hover .ecare-featured-service-link' => 'background-color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'button_hover_text_color',
            array(
                'label' => esc_html__('Button Hover Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0f172a',
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card:hover .ecare-featured-service-link' => 'color: {{VALUE}}; border-bottom-color: {{VALUE}};',
                ),
            )
        );

        $this->end_controls_section();

        // ─────────────────────────────────────────────────────────────────────
        // ─── WATERMARK STYLES SECTION ────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────
        $this->start_controls_section(
            'section_style_watermark',
            array(
                'label' => esc_html__('Watermark Icons', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_control(
            'show_watermark',
            array(
                'label' => esc_html__('Show Watermarks', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Show', 'e-care-management'),
                'label_off' => esc_html__('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            )
        );

        $this->add_control(
            'watermark_size',
            array(
                'label' => esc_html__('Watermark Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array('px'),
                'range' => array(
                    'px' => array(
                        'min' => 30,
                        'max' => 180,
                        'step' => 1,
                    ),
                ),
                'default' => array(
                    'unit' => 'px',
                    'size' => 76,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-service-card-watermark' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ),
                'condition' => array(
                    'show_watermark' => 'yes',
                ),
            )
        );

        $this->add_control(
            'watermark_opacity',
            array(
                'label' => esc_html__('Normal Opacity', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'range' => array(
                    'px' => array(
                        'min' => 0,
                        'max' => 0.5,
                        'step' => 0.01,
                    ),
                ),
                'default' => array(
                    'size' => 0.08,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-service-card-watermark' => 'opacity: {{SIZE}};',
                ),
                'condition' => array(
                    'show_watermark' => 'yes',
                ),
            )
        );

        $this->add_control(
            'watermark_opacity_hover',
            array(
                'label' => esc_html__('Hover Opacity', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'range' => array(
                    'px' => array(
                        'min' => 0,
                        'max' => 0.8,
                        'step' => 0.01,
                    ),
                ),
                'default' => array(
                    'size' => 0.15,
                ),
                'selectors' => array(
                    '{{WRAPPER}} .ecare-featured-service-card:hover .ecare-service-card-watermark' => 'opacity: {{SIZE}};',
                ),
                'condition' => array(
                    'show_watermark' => 'yes',
                ),
            )
        );

        $this->add_control(
            'watermark_position',
            array(
                'label' => esc_html__('Watermark Position', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'bottom-left',
                'options' => array(
                    'bottom-left' => esc_html__('Bottom Left', 'e-care-management'),
                    'bottom-right' => esc_html__('Bottom Right', 'e-care-management'),
                    'top-left' => esc_html__('Top Left', 'e-care-management'),
                    'top-right' => esc_html__('Top Right', 'e-care-management'),
                ),
                'condition' => array(
                    'show_watermark' => 'yes',
                ),
            )
        );

        $this->end_controls_section();

    }

    protected function render() {
        $settings = $this->get_settings_for_display();

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
                    'original_price' => isset($item['service_original_price']) ? $item['service_original_price'] : '',
                    'description' => isset($item['service_desc']) ? $item['service_desc'] : '',
                    'badge' => isset($item['service_badge']) ? $item['service_badge'] : '',
                    'button_text' => isset($item['service_btn_text']) ? $item['service_btn_text'] : '',
                    'book_url' => $book_url,
                    'book_link_target' => $target_attr,
                    'book_link_rel' => $rel_attr,
                    'custom_image' => isset($item['service_image']) ? $item['service_image'] : null,
                    'custom_bg' => isset($item['service_bg_color']) ? $item['service_bg_color'] : '',
                    'custom_accent' => isset($item['service_accent_color']) ? $item['service_accent_color'] : '',
                    'is_core' => true,
                );
            }
        }

        $currency_symbol = $this->get_currency_symbol();
        $theme_primary = get_option('ecare_primary_color', '#1b3b2b');

        $widget_id = 'ecare-featured-services-' . $this->get_id();
        $el_class = 'elementor-element-' . $this->get_id();
        ?>
        <style>
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-wrapper {
                width: 100%;
                font-family: inherit;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-title {
                margin: 0 0 0.45rem 0 !important;
                font-size: 1.85rem;
                font-weight: 800;
                line-height: 1.25;
                letter-spacing: -0.02em;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-subtitle {
                margin: 0 !important;
                max-width: 720px;
                font-size: 0.95rem;
                line-height: 1.6;
                color: #64748b;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                align-items: stretch;
            }
            @media (max-width: 1024px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }
            @media (max-width: 640px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-grid {
                    grid-template-columns: repeat(1, minmax(0, 1fr));
                }
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-title {
                    font-size: 1.7rem;
                }
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-header {
                    margin-bottom: 0.75rem !important;
                }
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: flex-end !important;
                margin-bottom: 1.25rem !important;
                width: 100% !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-header-left {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-header-tag {
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #94a3b8;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-title {
                margin: 0 !important;
                font-size: 2.2rem;
                font-weight: 700;
                line-height: 1.15;
                color: #0f172a;
                letter-spacing: -0.01em;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-navigation {
                display: flex;
                gap: 0.6rem;
                align-items: center;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn {
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
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn:hover {
                border-color: #94a3b8 !important;
                background: #f8fafc !important;
                transform: scale(1.02) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-slider-btn:active {
                transform: scale(0.98) !important;
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
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-slider-container {
                width: 100%;
                overflow: visible;
                position: relative;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-wrapper {
                width: 100%;
                font-family: inherit;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-slider-track {
                display: flex;
                gap: var(--card-gap, 24px);
                overflow-x: auto;
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
                padding: 0.5rem 0.2rem 1.5rem 0.2rem !important;
                margin: -0.5rem -0.2rem -1.5rem -0.2rem;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-slider-track::-webkit-scrollbar {
                display: none;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-services-slider-track {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-card {
                flex: 0 0 calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 4) - 1))) / var(--card-columns, 4)) !important;
                width: calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 4) - 1))) / var(--card-columns, 4)) !important;
                height: 240px;
                border: 1px solid rgba(0, 0, 0, 0.02) !important;
                border-radius: 24px;
                padding: 1.75rem 1.5rem !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                text-decoration: none !important;
                position: relative !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important, box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            @media (max-width: 1024px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-card {
                    flex: 0 0 calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 2) - 1))) / var(--card-columns, 2)) !important;
                    width: calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 2) - 1))) / var(--card-columns, 2)) !important;
                }
            }
            @media (max-width: 640px) {
                :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-card {
                    flex: 0 0 calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 1) - 1))) / var(--card-columns, 1)) !important;
                    width: calc((100% - (var(--card-gap, 24px) * (var(--card-columns, 1) - 1))) / var(--card-columns, 1)) !important;
                    height: 230px !important;
                    padding: 1.5rem 1.25rem !important;
                }
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-card:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.08) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-content {
                display: flex !important;
                flex-direction: column !important;
                gap: 0.3rem !important;
                z-index: 2 !important;
                position: relative !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-category {
                font-size: 0.68rem !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.07em !important;
                color: #64748b !important;
                opacity: 0.8 !important;
                display: block !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-title {
                margin: 0 !important;
                font-size: 1.35rem !important;
                font-weight: 700 !important;
                line-height: 1.25 !important;
                color: #0f172a;
                letter-spacing: -0.015em !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-price-wrap {
                margin-top: 0.4rem !important;
                font-size: 0.95rem !important;
                font-weight: 600 !important;
                color: #334155;
                display: flex !important;
                align-items: center !important;
                gap: 0.45rem !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-price-wrap .price-actual {
                font-weight: 700 !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-price-wrap .price-original {
                font-size: 0.85rem !important;
                color: #94a3b8 !important;
                text-decoration: line-through !important;
                font-weight: 400 !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-price-wrap .price-varies {
                font-size: 0.85rem !important;
                color: #64748b !important;
                font-weight: 500 !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-action {
                margin-top: auto !important;
                z-index: 2 !important;
                position: relative !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-link {
                display: inline-block !important;
                color: #0f172a;
                background: transparent;
                border: none;
                border-bottom: 1px solid;
                padding: 0 0 2px 0 !important;
                margin: 0 !important;
                font-size: 0.85rem !important;
                font-weight: 600 !important;
                text-decoration: none !important;
                transition: opacity 0.25s ease !important;
                box-shadow: none !important;
                outline: none !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-card:hover .ecare-featured-service-link {
                opacity: 0.7 !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-top-right {
                position: absolute;
                top: 1.5rem;
                right: 1.5rem;
                z-index: 10;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-badge {
                font-size: 0.62rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: #ffffff;
                background: #000000;
                padding: 0.25rem 0.55rem;
                border-radius: 99px;
                display: inline-block;
                line-height: 1;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-card-image-wrap {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 140px;
                height: 120px;
                display: flex;
                align-items: flex-end;
                justify-content: flex-end;
                pointer-events: none;
                z-index: 1;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-featured-service-card:hover .ecare-card-image-wrap {
                transform: scale(1.05) translate(-2px, -2px) !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-card-image-wrap img {
                max-width: 100% !important;
                max-height: 100% !important;
                object-fit: contain !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-watermark {
                position: absolute !important;
                pointer-events: none !important;
                z-index: 1 !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-watermark.pos-bottom-left {
                bottom: 1rem !important;
                left: 1rem !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-watermark.pos-bottom-right {
                bottom: 1rem !important;
                right: 1rem !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-watermark.pos-top-left {
                top: 1rem !important;
                left: 1rem !important;
            }
            :where(.<?php echo esc_attr($el_class); ?>) .ecare-service-card-watermark.pos-top-right {
                top: 1rem !important;
                right: 1rem !important;
            }
        </style>

        <div class="ecare-featured-services-wrapper" id="<?php echo esc_attr($widget_id); ?>">
            <div class="ecare-featured-services-header">
                <?php if (($settings['show_header'] ?? 'yes') === 'yes') : ?>
                    <div class="ecare-header-left">
                        <?php if (isset($settings['subtitle_text']) && $settings['subtitle_text'] !== '') : ?>
                            <span class="ecare-header-tag"><?php echo esc_html($settings['subtitle_text']); ?></span>
                        <?php endif; ?>
                        <?php if (isset($settings['title_text']) && $settings['title_text'] !== '') : ?>
                            <h2 class="ecare-featured-services-title"><?php echo esc_html($settings['title_text']); ?></h2>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                <div class="ecare-featured-services-navigation">
                    <button class="ecare-slider-btn ecare-slider-prev-btn" aria-label="Previous">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <button class="ecare-slider-btn ecare-slider-next-btn" aria-label="Next">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>

            <div class="ecare-featured-services-slider-container">
                <div class="ecare-featured-services-slider-track">
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
                        $service_name = (string) ($service->name ?? '');
                        $service_speciality = (string) ($service->speciality ?? '');
                        $book_url = (string) ($service->book_url ?? '#');

                        // Price formatting
                        $price_val = (string) ($service->price ?? '');
                        $orig_price_val = (string) ($service->original_price ?? '');

                        if (empty($price_val)) {
                            $price_string = '';
                        } elseif (is_numeric($price_val)) {
                            $price_string = '<span class="price-actual">' . $currency_symbol . number_format((float) $price_val, 0) . '</span>';
                            if (is_numeric($orig_price_val)) {
                                $price_string .= ' <span class="price-original">' . $currency_symbol . number_format((float) $orig_price_val, 0) . '</span>';
                            }
                        } else {
                            $price_string = '<span class="price-varies">' . esc_html($price_val) . '</span>';
                        }

                        // Resolve card palette colors
                        $bg = !empty($service->custom_bg) ? $service->custom_bg : '';
                        $accent = !empty($service->custom_accent) ? $service->custom_accent : '';

                        $palette = $color_palettes[$card_index % 6];
                        $card_index++;

                        if (empty($bg)) {
                            $bg = ($color_mode === 'custom') ? $card_bg : $palette['bg_color'];
                        }
                        if (empty($accent)) {
                            $accent = ($color_mode === 'custom') ? (!empty($settings['card_title_hover_color']) ? $settings['card_title_hover_color'] : $theme_primary) : $palette['accent'];
                        }

                        if ($color_mode === 'custom') {
                            $border = $card_border;
                        } else {
                            $border = !empty($service->custom_bg) ? 'rgba(0, 0, 0, 0.04)' : $palette['border'];
                        }

                        $icon_c = ($color_mode === 'custom') ? (!empty($settings['watermark_custom_color']) ? $settings['watermark_custom_color'] : 'rgba(0, 0, 0, 0.05)') : $palette['icon'];

                        // Resolve custom cutout image URL
                        $has_custom_image = !empty($service->custom_image['url']);
                        $custom_image_url = $has_custom_image ? $service->custom_image['url'] : '';
                        $target_attr = isset($service->book_link_target) ? $service->book_link_target : '';
                        $rel_attr = isset($service->book_link_rel) ? $service->book_link_rel : '';
                    ?>
                        <a class="ecare-featured-service-card" href="<?php echo esc_url($book_url); ?>"<?php echo $target_attr . $rel_attr; ?> style="background: <?php echo esc_attr($bg); ?>; border-color: <?php echo esc_attr($border); ?>; --card-accent: <?php echo esc_attr($accent); ?>;">
                            <?php if ($show_watermark && !$has_custom_image) : ?>
                                <div class="ecare-service-card-watermark pos-<?php echo esc_attr($watermark_pos); ?>" style="color: <?php echo esc_attr($icon_c); ?>;">
                                    <?php echo $this->get_watermark_svg($card_index - 1); ?>
                                </div>
                            <?php endif; ?>

                            <!-- Top-Right Badge Overlay -->
                            <?php if (!empty($service->badge)) : ?>
                                <div class="ecare-featured-service-top-right">
                                    <span class="ecare-featured-service-badge"><?php echo esc_html($service->badge); ?></span>
                                </div>
                            <?php endif; ?>

                            <!-- Left-Side Content Area (Title, category, price) -->
                            <div class="ecare-featured-service-content">
                                <?php if (($settings['show_speciality'] ?? 'yes') === 'yes' && $service_speciality !== '') : ?>
                                    <span class="ecare-featured-service-category"><?php echo esc_html($service_speciality); ?></span>
                                <?php endif; ?>

                                <h3 class="ecare-featured-service-title"><?php echo esc_html($service_name); ?></h3>

                                <?php if (($settings['show_price'] ?? 'yes') === 'yes' && !empty($price_string)) : ?>
                                    <div class="ecare-featured-service-price-wrap">
                                        <?php echo $price_string; ?>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <!-- Bottom Action Link/Button -->
                            <div class="ecare-featured-service-action">
                                <span class="ecare-featured-service-link">
                                    <?php echo esc_html(!empty($service->button_text) ? $service->button_text : esc_html__('Book now ↗', 'e-care-management')); ?>
                                </span>
                            </div>

                            <?php if ($has_custom_image && !empty($custom_image_url)) : ?>
                                <div class="ecare-card-image-wrap">
                                    <img src="<?php echo esc_url($custom_image_url); ?>" alt="<?php echo esc_attr($service_name); ?>" />
                                </div>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <script>
        (function() {
            const initSlider = () => {
                const wrapper = document.getElementById('<?php echo esc_attr($widget_id); ?>');
                if (!wrapper) return;
                const track = wrapper.querySelector('.ecare-featured-services-slider-track');
                const prevBtn = wrapper.querySelector('.ecare-slider-prev-btn');
                const nextBtn = wrapper.querySelector('.ecare-slider-next-btn');
                if (!track || !prevBtn || !nextBtn) return;
                
                prevBtn.onclick = (e) => {
                    e.preventDefault();
                    const firstCard = track.querySelector('.ecare-featured-service-card');
                    const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : 304;
                    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                };
                nextBtn.onclick = (e) => {
                    e.preventDefault();
                    const firstCard = track.querySelector('.ecare-featured-service-card');
                    const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : 304;
                    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                };
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initSlider);
            } else {
                initSlider();
            }
            if (window.elementorFrontend && window.elementorFrontend.hooks) {
                elementorFrontend.hooks.addAction('frontend/element_ready/ecare_featured_services_widget.default', initSlider);
                elementorFrontend.hooks.addAction('frontend/element_ready/ecare_featured_services.default', initSlider);
            }
        })();
        </script>
        <?php
    }
}
