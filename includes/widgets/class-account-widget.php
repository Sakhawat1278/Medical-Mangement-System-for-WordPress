<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Account_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_account_widget';
    }

    public function get_title() {
        return __('E-CARE Account Widget', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-user-circle-o';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {

        // ─────────────────────────────────────────────────────────────────────
        // ─── CONTENT TAB ─────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        // --- Logged Out State Content Section ---
        $this->start_controls_section(
            'section_content_logged_out',
            [
                'label' => __('Content - Logged Out State', 'e-care-management'),
            ]
        );

        $this->add_control(
            'login_text',
            [
                'label'       => __('Login Button Text', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::TEXT,
                'default'     => __('Sign In', 'e-care-management'),
                'placeholder' => __('Enter login text', 'e-care-management'),
            ]
        );

        $this->add_control(
            'login_link',
            [
                'label'       => __('Login Redirect Link', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::URL,
                'placeholder' => __('https://your-link.com', 'e-care-management'),
                'default'     => [
                    'url'         => home_url('/ecare-login'),
                    'is_external' => false,
                    'nofollow'    => false,
                ],
            ]
        );

        $this->add_control(
            'signup_text',
            [
                'label'       => __('Signup Button Text', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::TEXT,
                'default'     => __('Register', 'e-care-management'),
                'placeholder' => __('Enter signup text', 'e-care-management'),
            ]
        );

        $this->add_control(
            'signup_link',
            [
                'label'       => __('Signup Redirect Link', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::URL,
                'placeholder' => __('https://your-link.com', 'e-care-management'),
                'default'     => [
                    'url'         => home_url('/ecare-registration'),
                    'is_external' => false,
                    'nofollow'    => false,
                ],
            ]
        );

        $this->add_control(
            'show_signup',
            [
                'label'        => __('Show Signup Button', 'e-care-management'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'label_on'     => __('Show', 'e-care-management'),
                'label_off'    => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );

        $this->end_controls_section();

        // --- Logged In State Content Section ---
        $this->start_controls_section(
            'section_content_logged_in',
            [
                'label' => __('Content - Logged In State', 'e-care-management'),
            ]
        );

        $this->add_control(
            'show_avatar',
            [
                'label'        => __('Show User Avatar', 'e-care-management'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'label_on'     => __('Show', 'e-care-management'),
                'label_off'    => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );

        $this->add_control(
            'show_name',
            [
                'label'        => __('Show Display Name', 'e-care-management'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'label_on'     => __('Show', 'e-care-management'),
                'label_off'    => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );

        $this->add_control(
            'show_arrow',
            [
                'label'        => __('Show Dropdown Arrow', 'e-care-management'),
                'type'         => \Elementor\Controls_Manager::SWITCHER,
                'label_on'     => __('Show', 'e-care-management'),
                'label_off'    => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );

        $this->add_control(
            'portal_label',
            [
                'label'   => __('Portal Dashboard Label', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::TEXT,
                'default' => __('Portal Dashboard', 'e-care-management'),
            ]
        );

        $this->add_control(
            'portal_link',
            [
                'label'       => __('Portal Dashboard Link', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::URL,
                'placeholder' => __('https://your-link.com', 'e-care-management'),
                'default'     => [
                    'url'         => admin_url('admin.php?page=e-care-management'),
                    'is_external' => false,
                    'nofollow'    => false,
                ],
            ]
        );

        $this->add_control(
            'profile_label',
            [
                'label'   => __('My Profile Label', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::TEXT,
                'default' => __('My Profile', 'e-care-management'),
            ]
        );

        $this->add_control(
            'logout_label',
            [
                'label'   => __('Logout Label', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::TEXT,
                'default' => __('Sign Out', 'e-care-management'),
            ]
        );

        $this->add_control(
            'logout_link',
            [
                'label'       => __('Logout Redirect Link', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::URL,
                'placeholder' => __('https://your-link.com', 'e-care-management'),
                'default'     => [
                    'url'         => home_url('/ecare-logout'),
                    'is_external' => false,
                    'nofollow'    => false,
                ],
            ]
        );

        $this->end_controls_section();

        // --- Editor Preview Helper ---
        $this->start_controls_section(
            'section_editor_preview',
            [
                'label' => __('Editor Preview Helper', 'e-care-management'),
            ]
        );

        $this->add_control(
            'preview_state',
            [
                'label'       => __('Preview State', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::SELECT,
                'default'     => 'default',
                'options'     => [
                    'default'    => __('Default (Based on User Status)', 'e-care-management'),
                    'logged_in'  => __('Force Logged In State', 'e-care-management'),
                    'logged_out' => __('Force Logged Out State', 'e-care-management'),
                ],
                'description' => __('Toggle between logged-in and logged-out views in the editor to style and preview both states.', 'e-care-management'),
            ]
        );

        $this->end_controls_section();

        // --- Layout Section ---
        $this->start_controls_section(
            'section_layout',
            [
                'label' => __('Layout Settings', 'e-care-management'),
            ]
        );

        $this->add_responsive_control(
            'alignment',
            [
                'label'     => __('Alignment', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::CHOOSE,
                'options'   => [
                    'flex-start' => [
                        'title' => __('Left', 'e-care-management'),
                        'icon'  => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __('Center', 'e-care-management'),
                        'icon'  => 'eicon-text-align-center',
                    ],
                    'flex-end' => [
                        'title' => __('Right', 'e-care-management'),
                        'icon'  => 'eicon-text-align-right',
                    ],
                ],
                'default'   => 'flex-end',
                'selectors' => [
                    '{{WRAPPER}} .ecare-widget-container' => 'justify-content: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'element_spacing',
            [
                'label'   => __('Element Spacing', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::SLIDER,
                'range'   => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'default' => [
                    'size' => 12,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-widget-container' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();


        // ─────────────────────────────────────────────────────────────────────
        // ─── STYLE TAB ───────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        // ==========================================
        // === 1. LOGIN BUTTON STYLE =================
        // ==========================================
        $this->start_controls_section(
            'section_style_login',
            [
                'label' => __('Style - Login Button', 'e-care-management'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'     => 'login_typography',
                'selector' => '{{WRAPPER}} .ecare-btn-login',
            ]
        );

        $this->add_responsive_control(
            'login_padding',
            [
                'label'      => __('Padding', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-btn-login' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // --- Login Normal & Hover Tabs ---
        $this->start_controls_tabs('tabs_login_button');

        $this->start_controls_tab(
            'tab_login_normal',
            [
                'label' => __('Normal', 'e-care-management'),
            ]
        );

        $this->add_control(
            'login_text_color',
            [
                'label'       => __('Text Color', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::COLOR,
                'selectors'   => [
                    '{{WRAPPER}} .ecare-btn-login' => 'color: {{VALUE}};',
                ],
                'description' => __('Defaults to system primary color', 'e-care-management'),
            ]
        );

        $this->add_control(
            'login_bg_color',
            [
                'label'       => __('Background Color', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::COLOR,
                'selectors'   => [
                    '{{WRAPPER}} .ecare-btn-login' => 'background-color: {{VALUE}};',
                ],
                'description' => __('Defaults to translucent primary background', 'e-care-management'),
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'     => 'login_border',
                'selector' => '{{WRAPPER}} .ecare-btn-login',
            ]
        );

        $this->add_responsive_control(
            'login_border_radius',
            [
                'label'      => __('Border Radius', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'default'    => [
                    'top'      => '30',
                    'right'    => '30',
                    'bottom'   => '30',
                    'left'     => '30',
                    'unit'     => 'px',
                    'isLinked' => true,
                ],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-btn-login' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'login_box_shadow',
                'selector' => '{{WRAPPER}} .ecare-btn-login',
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_login_hover',
            [
                'label' => __('Hover', 'e-care-management'),
            ]
        );

        $this->add_control(
            'login_text_color_hover',
            [
                'label'     => __('Hover Text Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-btn-login:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'login_bg_color_hover',
            [
                'label'     => __('Hover Background Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-btn-login:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'login_border_color_hover',
            [
                'label'     => __('Hover Border Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-btn-login:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->end_controls_section();


        // ==========================================
        // === 2. SIGNUP BUTTON STYLE ================
        // ==========================================
        $this->start_controls_section(
            'section_style_signup',
            [
                'label'     => __('Style - Signup Button', 'e-care-management'),
                'tab'       => \Elementor\Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_signup' => 'yes',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'     => 'signup_typography',
                'selector' => '{{WRAPPER}} .ecare-btn-signup',
            ]
        );

        $this->add_responsive_control(
            'signup_padding',
            [
                'label'      => __('Padding', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-btn-signup' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // --- Signup Normal & Hover Tabs ---
        $this->start_controls_tabs('tabs_signup_button');

        $this->start_controls_tab(
            'tab_signup_normal',
            [
                'label' => __('Normal', 'e-care-management'),
            ]
        );

        $this->add_control(
            'signup_text_color',
            [
                'label'       => __('Text Color', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::COLOR,
                'selectors'   => [
                    '{{WRAPPER}} .ecare-btn-signup' => 'color: {{VALUE}};',
                ],
                'description' => __('Defaults to white', 'e-care-management'),
            ]
        );

        $this->add_control(
            'signup_bg_color',
            [
                'label'       => __('Background Color', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::COLOR,
                'selectors'   => [
                    '{{WRAPPER}} .ecare-btn-signup' => 'background-color: {{VALUE}};',
                ],
                'description' => __('Defaults to system primary color', 'e-care-management'),
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'     => 'signup_border',
                'selector' => '{{WRAPPER}} .ecare-btn-signup',
            ]
        );

        $this->add_responsive_control(
            'signup_border_radius',
            [
                'label'      => __('Border Radius', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'default'    => [
                    'top'      => '30',
                    'right'    => '30',
                    'bottom'   => '30',
                    'left'     => '30',
                    'unit'     => 'px',
                    'isLinked' => true,
                ],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-btn-signup' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'signup_box_shadow',
                'selector' => '{{WRAPPER}} .ecare-btn-signup',
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_signup_hover',
            [
                'label' => __('Hover', 'e-care-management'),
            ]
        );

        $this->add_control(
            'signup_text_color_hover',
            [
                'label'     => __('Hover Text Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-btn-signup:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'signup_bg_color_hover',
            [
                'label'     => __('Hover Background Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-btn-signup:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'signup_border_color_hover',
            [
                'label'     => __('Hover Border Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-btn-signup:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->end_controls_section();


        // ==========================================
        // === 3. USER PROFILE TRIGGER STATE STYLE ===
        // ==========================================
        $this->start_controls_section(
            'section_style_user_trigger',
            [
                'label' => __('Style - Logged In User Card', 'e-care-management'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'trigger_padding',
            [
                'label'      => __('Card Padding', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-user-trigger' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'trigger_border_radius',
            [
                'label'      => __('Card Border Radius', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-user-trigger' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // --- Trigger Normal & Hover tabs ---
        $this->start_controls_tabs('tabs_trigger_card');

        $this->start_controls_tab(
            'tab_trigger_normal',
            [
                'label' => __('Normal', 'e-care-management'),
            ]
        );

        $this->add_control(
            'trigger_bg_color',
            [
                'label'     => __('Background Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .ecare-user-trigger' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'     => 'trigger_border',
                'selector' => '{{WRAPPER}} .ecare-user-trigger',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'trigger_box_shadow',
                'selector' => '{{WRAPPER}} .ecare-user-trigger',
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_trigger_hover',
            [
                'label' => __('Hover', 'e-care-management'),
            ]
        );

        $this->add_control(
            'trigger_bg_color_hover',
            [
                'label'     => __('Hover Background Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#f8fafc',
                'selectors' => [
                    '{{WRAPPER}} .ecare-user-trigger:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'trigger_border_color_hover',
            [
                'label'     => __('Hover Border Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-user-trigger:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        // --- User Name Typography/Color ---
        $this->add_control(
            'heading_name_style',
            [
                'label'     => __('User Name Text Styling', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'show_name' => 'yes',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'      => 'name_typography',
                'selector'  => '{{WRAPPER}} .ecare-user-name',
                'condition' => [
                    'show_name' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'name_color',
            [
                'label'     => __('Text Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#1e293b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-user-name' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'show_name' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'name_color_hover',
            [
                'label'     => __('Hover Text Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .ecare-user-trigger:hover .ecare-user-name' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'show_name' => 'yes',
                ],
            ]
        );

        // --- Avatar Size/Style ---
        $this->add_control(
            'heading_avatar_style',
            [
                'label'     => __('Avatar Styling', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'show_avatar' => 'yes',
                ],
            ]
        );

        $this->add_responsive_control(
            'avatar_size',
            [
                'label'   => __('Size', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::SLIDER,
                'range'   => [
                    'px' => [
                        'min' => 16,
                        'max' => 120,
                    ],
                ],
                'default' => [
                    'size' => 32,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-user-avatar' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'show_avatar' => 'yes',
                ],
            ]
        );

        $this->add_responsive_control(
            'avatar_radius',
            [
                'label'      => __('Avatar Border Radius', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-user-avatar' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition'  => [
                    'show_avatar' => 'yes',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'      => 'avatar_border',
                'selector'  => '{{WRAPPER}} .ecare-user-avatar',
                'condition' => [
                    'show_avatar' => 'yes',
                ],
            ]
        );

        // --- Arrow color/size ---
        $this->add_control(
            'heading_arrow_style',
            [
                'label'     => __('Dropdown Arrow Styling', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'show_arrow' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'arrow_color',
            [
                'label'     => __('Arrow Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#64748b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-arrow-icon' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'show_arrow' => 'yes',
                ],
            ]
        );

        $this->add_responsive_control(
            'arrow_size',
            [
                'label'   => __('Arrow Size', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::SLIDER,
                'range'   => [
                    'px' => [
                        'min' => 6,
                        'max' => 30,
                    ],
                ],
                'default' => [
                    'size' => 12,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-arrow-icon' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'show_arrow' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();


        // ==========================================
        // === 4. DROPDOWN MENU STYLE ===============
        // ==========================================
        $this->start_controls_section(
            'section_style_dropdown',
            [
                'label' => __('Style - Dropdown Menu', 'e-care-management'),
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'dropdown_bg',
            [
                'label'     => __('Dropdown Background', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .ecare-dropdown-menu' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'dropdown_padding',
            [
                'label'      => __('Dropdown Padding', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-dropdown-menu' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'dropdown_border_radius',
            [
                'label'      => __('Border Radius', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-dropdown-menu' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name'     => 'dropdown_border',
                'selector' => '{{WRAPPER}} .ecare-dropdown-menu',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name'     => 'dropdown_shadow',
                'selector' => '{{WRAPPER}} .ecare-dropdown-menu',
            ]
        );

        // --- Dropdown Items ---
        $this->add_control(
            'heading_dropdown_item_style',
            [
                'label'     => __('Dropdown Item Styling', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name'     => 'item_typography',
                'selector' => '{{WRAPPER}} .ecare-dropdown-item',
            ]
        );

        $this->add_responsive_control(
            'item_padding',
            [
                'label'      => __('Item Padding', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-dropdown-item' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'item_border_radius',
            [
                'label'      => __('Item Border Radius', 'e-care-management'),
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors'  => [
                    '{{WRAPPER}} .ecare-dropdown-item' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // --- Item Normal vs Hover Tabs ---
        $this->start_controls_tabs('tabs_dropdown_item');

        $this->start_controls_tab(
            'tab_item_normal',
            [
                'label' => __('Normal', 'e-care-management'),
            ]
        );

        $this->add_control(
            'item_text_color',
            [
                'label'     => __('Text Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#475569',
                'selectors' => [
                    '{{WRAPPER}} .ecare-dropdown-item' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'item_icon_color',
            [
                'label'     => __('Icon Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#64748b',
                'selectors' => [
                    '{{WRAPPER}} .ecare-dropdown-item svg' => 'color: {{VALUE}}; stroke: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_item_hover',
            [
                'label' => __('Hover', 'e-care-management'),
            ]
        );

        $this->add_control(
            'item_text_color_hover',
            [
                'label'       => __('Hover Text Color', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::COLOR,
                'selectors'   => [
                    '{{WRAPPER}} .ecare-dropdown-item:hover' => 'color: {{VALUE}};',
                ],
                'description' => __('Defaults to system primary color', 'e-care-management'),
            ]
        );

        $this->add_control(
            'item_icon_color_hover',
            [
                'label'       => __('Hover Icon Color', 'e-care-management'),
                'type'        => \Elementor\Controls_Manager::COLOR,
                'selectors'   => [
                    '{{WRAPPER}} .ecare-dropdown-item:hover svg' => 'color: {{VALUE}}; stroke: {{VALUE}};',
                ],
                'description' => __('Defaults to system primary color', 'e-care-management'),
            ]
        );

        $this->add_control(
            'item_bg_color_hover',
            [
                'label'     => __('Hover Background Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#f8fafc',
                'selectors' => [
                    '{{WRAPPER}} .ecare-dropdown-item:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        // --- Divider Style ---
        $this->add_control(
            'divider_color',
            [
                'label'     => __('Menu Divider Color', 'e-care-management'),
                'type'      => \Elementor\Controls_Manager::COLOR,
                'default'   => '#f1f5f9',
                'selectors' => [
                    '{{WRAPPER}} .ecare-dropdown-divider' => 'background-color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();

        // ── Custom link controls ───────────────────────────────────────────
        $login_url  = !empty($settings['login_link']['url'])
            ? esc_url($settings['login_link']['url'])
            : ecare_adjust_url(home_url('/ecare-login'));

        $signup_url = !empty($settings['signup_link']['url'])
            ? esc_url($settings['signup_link']['url'])
            : ecare_adjust_url(home_url('/ecare-registration'));

        $portal_url = !empty($settings['portal_link']['url'])
            ? esc_url($settings['portal_link']['url'])
            : ecare_adjust_url(admin_url('admin.php?page=e-care-management'));

        $logout_url = !empty($settings['logout_link']['url'])
            ? esc_url($settings['logout_link']['url'])
            : ecare_adjust_url(home_url('/ecare-logout'));

        // ── Link attributes (external / nofollow) ─────────────────────────
        $login_target  = !empty($settings['login_link']['is_external'])  ? ' target="_blank"' : '';
        $login_rel     = !empty($settings['login_link']['nofollow'])      ? ' rel="nofollow"'  : '';
        $signup_target = !empty($settings['signup_link']['is_external']) ? ' target="_blank"' : '';
        $signup_rel    = !empty($settings['signup_link']['nofollow'])     ? ' rel="nofollow"'  : '';
        $portal_target = !empty($settings['portal_link']['is_external']) ? ' target="_blank"' : '';
        $portal_rel    = !empty($settings['portal_link']['nofollow'])     ? ' rel="nofollow"'  : '';
        $logout_target = !empty($settings['logout_link']['is_external']) ? ' target="_blank"' : '';
        $logout_rel    = !empty($settings['logout_link']['nofollow'])     ? ' rel="nofollow"'  : '';

        // ── Preview state override (Elementor editor helper) ──────────────
        $preview_state = !empty($settings['preview_state']) ? $settings['preview_state'] : 'default';
        $is_logged_in  = is_user_logged_in();
        if ($preview_state === 'logged_in')  { $is_logged_in = true;  }
        if ($preview_state === 'logged_out') { $is_logged_in = false; }

        $current_user = wp_get_current_user();

        // ── Fallback display data (preview mode when no real user) ─────────
        $preview_name   = ($is_logged_in && $current_user->ID)
            ? esc_html($current_user->display_name) : 'John Doe';
        $preview_avatar = ($is_logged_in && $current_user->ID)
            ? esc_url(get_avatar_url($current_user->ID))
            : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=64';

        $system_settings      = get_option('ecare_settings', array());
        $system_primary_color = isset($system_settings['primaryColor']) ? $system_settings['primaryColor'] : '#1b3b2b';
        $widget_id            = 'ecare-acc-' . $this->get_id();
        ?>
        <div class="ecare-widget-wrapper" id="<?php echo esc_attr($widget_id); ?>" style="font-family: inherit; --ecare-brand-color: <?php echo esc_attr($system_primary_color); ?>; --ecare-brand-color-alpha: <?php echo esc_attr($system_primary_color); ?>10; --ecare-brand-color-alpha-hover: <?php echo esc_attr($system_primary_color); ?>20;">

            <style>
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-widget-container {
                    display: flex;
                    align-items: center;
                    position: relative;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-widget {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none !important;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    box-shadow: none !important;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 10px 24px;
                    border: 0 solid transparent;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-login {
                    /* Base defaults – dynamically linked to brand color, overridden by Elementor if set */
                    border-style: solid;
                    color: var(--ecare-brand-color);
                    background-color: var(--ecare-brand-color-alpha);
                    border-color: var(--ecare-brand-color);
                    border-width: 1.5px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-login:hover {
                    color: #ffffff;
                    background-color: var(--ecare-brand-color);
                    border-color: var(--ecare-brand-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-signup {
                    border-style: solid;
                    color: #ffffff;
                    background-color: var(--ecare-brand-color);
                    border-color: var(--ecare-brand-color);
                    border-width: 1.5px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-signup:hover {
                    color: var(--ecare-brand-color);
                    background-color: var(--ecare-brand-color-alpha-hover);
                    border-color: var(--ecare-brand-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-widget:hover {
                    transform: translateY(-1px);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-btn-widget:active {
                    transform: translateY(0);
                }

                /* Logged In State Card styles */
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-trigger {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 9999px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    position: relative;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-trigger:hover {
                    border-color: var(--ecare-brand-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-trigger:hover .ecare-user-name {
                    color: var(--ecare-brand-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e293b;
                    transition: color 0.2s ease;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-arrow-icon {
                    color: #64748b;
                    flex-shrink: 0;
                    transition: transform 0.25s ease, color 0.2s ease;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-trigger.active .ecare-arrow-icon {
                    transform: rotate(180deg);
                    color: var(--ecare-brand-color);
                }

                /* Dropdown Menu Container */
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 200px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.15);
                    padding: 8px;
                    display: none;
                    z-index: 99999;
                    animation: ecareFadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes ecareFadeInUp {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    text-decoration: none !important;
                    color: #475569;
                    font-size: 13.5px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    border-bottom: none !important;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-dropdown-item svg {
                    stroke-width: 2.2;
                    flex-shrink: 0;
                    transition: stroke 0.2s ease, color 0.2s ease;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-dropdown-item:hover {
                    color: var(--ecare-brand-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-dropdown-item:hover svg {
                    color: var(--ecare-brand-color);
                    stroke: var(--ecare-brand-color);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-dropdown-divider {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 6px 8px;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-user-trigger.active .ecare-dropdown-menu {
                    display: block;
                }
            </style>

            <div class="ecare-widget-container">
                <?php if ($is_logged_in) : ?>
                    <div class="ecare-user-trigger" id="<?php echo esc_attr($widget_id); ?>-trigger">
                        <?php if ('yes' === ($settings['show_avatar'] ?? 'yes')) : ?>
                            <img src="<?php echo $preview_avatar; ?>" class="ecare-user-avatar" alt="<?php echo esc_attr($preview_name); ?>" />
                        <?php endif; ?>

                        <?php if ('yes' === ($settings['show_name'] ?? 'yes')) : ?>
                            <span class="ecare-user-name"><?php echo $preview_name; ?></span>
                        <?php endif; ?>

                        <?php if ('yes' === ($settings['show_arrow'] ?? 'yes')) : ?>
                            <svg class="ecare-arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        <?php endif; ?>

                        <div class="ecare-dropdown-menu">
                            <a href="<?php echo $portal_url; ?>"<?php echo $portal_target . $portal_rel; ?> class="ecare-dropdown-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                                <?php echo esc_html($settings['portal_label'] ?? 'Portal Dashboard'); ?>
                            </a>
                            <a href="<?php echo esc_url(admin_url('profile.php')); ?>" class="ecare-dropdown-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                <?php echo esc_html($settings['profile_label'] ?? 'My Profile'); ?>
                            </a>
                            <div class="ecare-dropdown-divider"></div>
                            <a href="<?php echo $logout_url; ?>"<?php echo $logout_target . $logout_rel; ?> class="ecare-dropdown-item ecare-logout" style="color: #ef4444;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                <?php echo esc_html($settings['logout_label'] ?? 'Sign Out'); ?>
                            </a>
                        </div>
                    </div>
                    <script>
                        (function() {
                            function initAccountWidget() {
                                var trigger = document.getElementById('<?php echo esc_js($widget_id); ?>-trigger');
                                if (!trigger) return;

                                // Prevent duplicate listener binding
                                if (trigger.getAttribute('data-ecare-bound') === '1') return;
                                trigger.setAttribute('data-ecare-bound', '1');

                                trigger.addEventListener('click', function(e) {
                                    if (e.target.closest('a')) return;
                                    e.stopPropagation();
                                    this.classList.toggle('active');
                                });

                                document.addEventListener('click', function() {
                                    trigger.classList.remove('active');
                                });
                            }

                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', initAccountWidget);
                            } else {
                                initAccountWidget();
                            }

                            if (window.elementorFrontend && window.elementorFrontend.hooks) {
                                elementorFrontend.hooks.addAction('frontend/element_ready/ecare_account_widget.default', initAccountWidget);
                            }
                        })();
                    </script>
                <?php else : ?>
                    <a href="<?php echo $login_url; ?>"<?php echo $login_target . $login_rel; ?> class="ecare-btn-widget ecare-btn-login">
                        <?php echo esc_html($settings['login_text'] ?? 'Sign In'); ?>
                    </a>
                    <?php if ('yes' === ($settings['show_signup'] ?? 'yes')) : ?>
                        <a href="<?php echo $signup_url; ?>"<?php echo $signup_target . $signup_rel; ?> class="ecare-btn-widget ecare-btn-signup">
                            <?php echo esc_html($settings['signup_text'] ?? 'Register'); ?>
                        </a>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
}
