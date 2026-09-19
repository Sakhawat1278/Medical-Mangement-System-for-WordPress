<?php
if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Blood_Bank_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_blood_bank_widget';
    }

    public function get_title() {
        return __('Blood Bank Portal', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-heart';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content Settings', 'e-care-management'),
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'title',
            [
                'label'   => __('Title', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::TEXT,
                'default' => __('Blood Donation & Emergency Bank', 'e-care-management'),
            ]
        );

        $this->add_control(
            'subtitle',
            [
                'label'   => __('Subtitle', 'e-care-management'),
                'type'    => \Elementor\Controls_Manager::TEXTAREA,
                'default' => __('Check live blood availability, register as a volunteer donor, or request emergency blood units directly.', 'e-care-management'),
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        echo do_shortcode('[ecare_blood_bank]');
    }
}
