<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class ECARE_Cart_Button_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_cart_button_widget';
    }

    public function get_title() {
        return __('E-CARE Cart Button', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-cart';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {

        // ─────────────────────────────────────────────────────────────────────
        // ─── CONTENT TAB ─────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        $this->start_controls_section(
            'section_content',
            [
                'label' => __('Button Configuration', 'e-care-management'),
            ]
        );

        $this->add_control(
            'button_text',
            [
                'label' => __('Button Text', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => __('Cart', 'e-care-management'),
                'placeholder' => __('Enter button text', 'e-care-management'),
            ]
        );

        $this->add_control(
            'cart_url',
            [
                'label' => __('Cart Page URL', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::URL,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => [
                    'url' => home_url('/ecare-cart'),
                    'is_external' => false,
                    'nofollow' => false,
                ],
                'placeholder' => __('https://your-link.com/ecare-cart', 'e-care-management'),
            ]
        );

        $this->add_control(
            'layout',
            [
                'label' => __('Button Layout', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'icon-text',
                'options' => [
                    'icon' => __('Icon Only', 'e-care-management'),
                    'text' => __('Text Only', 'e-care-management'),
                    'icon-text' => __('Icon + Text', 'e-care-management'),
                ],
            ]
        );

        $this->add_control(
            'show_badge',
            [
                'label' => __('Show Items Count Badge', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => __('Show', 'e-care-management'),
                'label_off' => __('Hide', 'e-care-management'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label' => __('Alignment', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => __('Left', 'e-care-management'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __('Center', 'e-care-management'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => __('Right', 'e-care-management'),
                        'icon' => 'eicon-text-align-right',
                    ],
                    'justify' => [
                        'title' => __('Justified', 'e-care-management'),
                        'icon' => 'eicon-text-align-justify',
                    ],
                ],
                'default' => 'center',
                'prefix_class' => 'elementor-align-',
            ]
        );

        $this->end_controls_section();

        // ─────────────────────────────────────────────────────────────────────
        // ─── STYLE TAB ───────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────────

        // 1. BUTTON STYLING
        $this->start_controls_section(
            'section_style_button',
            [
                'label' => __('Button Styling', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'selector' => '{{WRAPPER}} a.ecare-cart-btn',
            ]
        );

        $this->add_responsive_control(
            'button_padding',
            [
                'label' => __('Padding', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'default' => [
                    'top' => 10,
                    'bottom' => 10,
                    'left' => 20,
                    'right' => 20,
                    'unit' => 'px',
                    'isLinked' => false,
                ],
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'button_border_radius',
            [
                'label' => __('Border Radius', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'default' => [
                    'top' => 8,
                    'bottom' => 8,
                    'left' => 8,
                    'right' => 8,
                    'unit' => 'px',
                    'isLinked' => true,
                ],
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        // Tabs normal vs hover
        $this->start_controls_tabs('tabs_button_style');

        $this->start_controls_tab(
            'tab_button_normal',
            [
                'label' => __('Normal', 'e-care-management'),
            ]
        );

        $this->add_control(
            'button_bg_color',
            [
                'label' => __('Background Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#1b3b2b',
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_text_color',
            [
                'label' => __('Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'button_border',
                'selector' => '{{WRAPPER}} a.ecare-cart-btn',
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'button_box_shadow',
                'selector' => '{{WRAPPER}} a.ecare-cart-btn',
            ]
        );

        $this->end_controls_tab();

        $this->start_controls_tab(
            'tab_button_hover',
            [
                'label' => __('Hover', 'e-care-management'),
            ]
        );

        $this->add_control(
            'button_bg_color_hover',
            [
                'label' => __('Hover Background Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#167a5f',
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_text_color_hover',
            [
                'label' => __('Hover Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_border_color_hover',
            [
                'label' => __('Hover Border Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} a.ecare-cart-btn:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->end_controls_section();

        // 2. BADGE STYLING
        $this->start_controls_section(
            'section_style_badge',
            [
                'label' => __('Cart Badge', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
                'condition' => [
                    'show_badge' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'badge_bg_color',
            [
                'label' => __('Background Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ef4444',
                'selectors' => [
                    '{{WRAPPER}} .ecare-cart-badge' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'badge_text_color',
            [
                'label' => __('Text Color', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .ecare-cart-badge' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'badge_size',
            [
                'label' => __('Badge Size (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 12,
                        'max' => 24,
                    ],
                ],
                'default' => [
                    'size' => 18,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-cart-badge' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}}; font-size: calc({{SIZE}}{{UNIT}} * 0.6);',
                ],
            ]
        );

        $this->add_responsive_control(
            'badge_offset_h',
            [
                'label' => __('Horizontal Offset (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => -25,
                        'max' => 25,
                    ],
                ],
                'default' => [
                    'size' => -6,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-cart-badge' => 'right: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'badge_offset_v',
            [
                'label' => __('Vertical Offset (px)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => -25,
                        'max' => 25,
                    ],
                ],
                'default' => [
                    'size' => -6,
                ],
                'selectors' => [
                    '{{WRAPPER}} .ecare-cart-badge' => 'top: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();

        $button_text = !empty($settings['button_text']) ? $settings['button_text'] : __('Cart', 'e-care-management');
        $cart_url = '';
        if (!empty($settings['cart_url'])) {
            if (is_array($settings['cart_url'])) {
                $cart_url = !empty($settings['cart_url']['url']) ? $settings['cart_url']['url'] : '';
            } else {
                $cart_url = $settings['cart_url'];
            }
        }
        if (empty($cart_url)) {
            $cart_url = home_url('/ecare-cart');
        }
        $target_attr = '';
        $rel_attr = '';
        if (!empty($settings['cart_url']) && is_array($settings['cart_url'])) {
            $target_attr = !empty($settings['cart_url']['is_external']) ? ' target="_blank"' : '';
            $rel_attr = !empty($settings['cart_url']['nofollow']) ? ' rel="nofollow"' : '';
        }
        $layout      = !empty($settings['layout']) ? $settings['layout'] : 'icon-text';

        // Defaults for CSS resolver
        $btn_bg           = !empty($settings['button_bg_color']) ? $settings['button_bg_color'] : '#1b3b2b';
        $btn_text         = !empty($settings['button_text_color']) ? $settings['button_text_color'] : '#ffffff';
        $btn_bg_hover     = !empty($settings['button_bg_color_hover']) ? $settings['button_bg_color_hover'] : '#167a5f';
        $btn_text_hover   = !empty($settings['button_text_color_hover']) ? $settings['button_text_color_hover'] : '#ffffff';
        $badge_bg         = !empty($settings['badge_bg_color']) ? $settings['badge_bg_color'] : '#ef4444';
        $badge_text       = !empty($settings['badge_text_color']) ? $settings['badge_text_color'] : '#ffffff';

        $widget_id = 'ecare-cart-btn-' . $this->get_id();
        ?>
        <div class="ecare-cart-btn-wrapper" id="<?php echo esc_attr($widget_id); ?>">
            <style>
                :where(#<?php echo esc_attr($widget_id); ?>) {
                    width: 100%;
                    box-sizing: border-box;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-btn-wrapper {
                    display: flex;
                    width: 100%;
                    box-sizing: border-box;
                }
                
                /* Alignment modifiers */
                .elementor-widget-ecare_cart_button_widget.elementor-align-left :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-btn-wrapper {
                    justify-content: flex-start;
                }
                .elementor-widget-ecare_cart_button_widget.elementor-align-center :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-btn-wrapper {
                    justify-content: center;
                }
                .elementor-widget-ecare_cart_button_widget.elementor-align-right :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-btn-wrapper {
                    justify-content: flex-end;
                }
                .elementor-widget-ecare_cart_button_widget.elementor-align-justify :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-btn-wrapper {
                    justify-content: stretch;
                }
                .elementor-widget-ecare_cart_button_widget.elementor-align-justify :where(#<?php echo esc_attr($widget_id); ?>) a.ecare-cart-btn {
                    width: 100%;
                }

                :where(#<?php echo esc_attr($widget_id); ?>) a.ecare-cart-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    position: relative;
                    text-decoration: none !important;
                    font-family: inherit;
                    font-weight: 700;
                    font-size: 0.88rem;
                    background-color: <?php echo esc_attr($btn_bg); ?>;
                    color: <?php echo esc_attr($btn_text); ?>;
                    padding: 10px 20px;
                    border-radius: 8px;
                    border: 0 solid transparent;
                    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.04);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) a.ecare-cart-btn:hover {
                    background-color: <?php echo esc_attr($btn_bg_hover); ?>;
                    color: <?php echo esc_attr($btn_text_hover); ?>;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.03);
                }
                :where(#<?php echo esc_attr($widget_id); ?>) a.ecare-cart-btn:active {
                    transform: translateY(0);
                }

                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-icon {
                    width: 18px;
                    height: 18px;
                    flex-shrink: 0;
                }

                /* Badge */
                :where(#<?php echo esc_attr($widget_id); ?>) .ecare-cart-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background-color: <?php echo esc_attr($badge_bg); ?>;
                    color: <?php echo esc_attr($badge_text); ?>;
                    font-size: 10px;
                    font-weight: 800;
                    display: none; /* Managed by JS */
                    align-items: center;
                    justify-content: center;
                    border: 2px solid <?php echo esc_attr($btn_bg); ?>; /* blending edge */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
                    transition: border-color 0.22s ease;
                }
                :where(#<?php echo esc_attr($widget_id); ?>) a.ecare-cart-btn:hover .ecare-cart-badge {
                    border-color: <?php echo esc_attr($btn_bg_hover); ?>;
                }

                /* Bounce Animation */
                .ecare-cart-badge.bounce-anim {
                    animation: ecare-badge-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes ecare-badge-bounce {
                    0% { transform: scale(0.6); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
            </style>

            <a href="<?php echo esc_url($cart_url); ?>"<?php echo $target_attr . $rel_attr; ?> class="ecare-cart-btn">
                <?php if ($layout !== 'text') : ?>
                    <svg class="ecare-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="8" cy="21" r="1"></circle>
                        <circle cx="19" cy="21" r="1"></circle>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                    </svg>
                <?php endif; ?>

                <?php if ($layout !== 'icon') : ?>
                    <span class="ecare-cart-text"><?php echo esc_html($button_text); ?></span>
                <?php endif; ?>

                <?php if ($settings['show_badge'] === 'yes') : ?>
                    <span class="ecare-cart-badge">0</span>
                <?php endif; ?>
            </a>
        </div>

        <script>
        (function() {
            function init() {
                var widget = document.getElementById("<?php echo esc_js($widget_id); ?>");
                if (!widget) return;
                var badge = widget.querySelector(".ecare-cart-badge");

                function updateCartBadge() {
                    var cartCount = 0;
                    try {
                        // 1. Primary: read from dedicated isolated shopping cart
                        var isolatedCartStr = localStorage.getItem("ecare_shopping_cart");
                        if (isolatedCartStr) {
                            var isolatedArr = JSON.parse(isolatedCartStr);
                            if (Array.isArray(isolatedArr)) {
                                cartCount = isolatedArr.length;
                            }
                        } else {
                            // 2. Fallback: check legacy Zustand storage
                            var storageStr = localStorage.getItem("ecare-storage-v5");
                            if (storageStr) {
                                var storageObj = JSON.parse(storageStr);
                                if (storageObj && storageObj.state && Array.isArray(storageObj.state.cart)) {
                                    cartCount = storageObj.state.cart.length;
                                }
                            }
                        }
                    } catch(e) {
                        console.error("Failed to parse cart storage:", e);
                    }

                    if (badge) {
                        badge.textContent = cartCount;
                        <?php if ($settings['show_badge'] === 'yes') : ?>
                            if (cartCount > 0) {
                                badge.style.display = "flex";
                            } else {
                                badge.style.display = "none";
                            }
                        <?php else : ?>
                            badge.style.display = "none";
                        <?php endif; ?>

                        badge.classList.remove("bounce-anim");
                        void badge.offsetWidth; // Trigger reflow
                        badge.classList.add("bounce-anim");
                    }
                }

                // Initial run
                updateCartBadge();

                // Listeners
                window.addEventListener("ecare_cart_updated", updateCartBadge);
                window.addEventListener("storage", function(e) {
                    if (e.key === "ecare_shopping_cart" || e.key === "ecare-storage-v5") {
                        updateCartBadge();
                    }
                });
            }

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", init);
            } else {
                init();
            }

            if (window.elementorFrontend && window.elementorFrontend.hooks) {
                elementorFrontend.hooks.addAction("frontend/element_ready/ecare_cart_button_widget.default", init);
            }
        })();
        </script>
        <?php
    }
}
