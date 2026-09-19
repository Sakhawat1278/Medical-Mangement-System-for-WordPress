<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Elementor {

    public function __construct() {
        add_action('elementor/widgets/register', [$this, 'register_widgets']);
    }

    public function register_widgets($widgets_manager) {
        require_once ECARE_PATH . 'includes/widgets/class-account-widget.php';
        $widgets_manager->register(new \ECARE_Account_Widget());

        require_once ECARE_PATH . 'includes/widgets/class-specialities-widget.php';
        $widgets_manager->register(new \ECARE_Specialities_Widget());

        require_once ECARE_PATH . 'includes/widgets/class-doctor-search-widget.php';
        $widgets_manager->register(new \ECARE_Doctor_Search_Widget());
        require_once ECARE_PATH . 'includes/widgets/class-services-widget.php';
        $widgets_manager->register(new \ECARE_Services_Widget());

        require_once ECARE_PATH . 'includes/widgets/class-featured-services-widget.php';
        $widgets_manager->register(new \ECARE_Featured_Services_Widget());

        require_once ECARE_PATH . 'includes/widgets/class-cart-button-widget.php';
        $widgets_manager->register(new \ECARE_Cart_Button_Widget());

        require_once ECARE_PATH . 'includes/widgets/class-reviews-carousel-widget.php';
        $widgets_manager->register(new \ECARE_Reviews_Carousel_Widget());

        require_once ECARE_PATH . 'includes/widgets/class-blood-bank-widget.php';
        $widgets_manager->register(new \ECARE_Blood_Bank_Widget());
    }
}

new ECARE_Elementor();
