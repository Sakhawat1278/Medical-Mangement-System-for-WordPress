<?php
if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Reviews_Carousel_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'ecare_reviews_carousel';
    }

    public function get_title() {
        return __('Doctor Reviews Carousel', 'e-care-management');
    }

    public function get_icon() {
        return 'eicon-testimonial-carousel';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Content', 'e-care-management'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'limit',
            [
                'label' => __('Number of Reviews', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 5,
            ]
        );

        $this->add_control(
            'doctor_id',
            [
                'label' => __('Filter by Doctor ID (optional)', 'e-care-management'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => '',
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        $limit = intval($settings['limit']);
        $doctor_id = $settings['doctor_id'];

        // Fetch Approved Reviews
        $reviews = class_exists('ECARE_DB_Client') ? ECARE_DB_Client::select_where('ecare_reviews', 'status', 'Approved') : [];
        if (!$reviews) $reviews = [];

        if (!empty($doctor_id)) {
            $reviews = array_filter($reviews, function($r) use ($doctor_id) {
                return (string)($r->doctor_id ?? '') === (string)$doctor_id;
            });
        }

        // Sort by newest
        usort($reviews, function($a, $b) {
            return strtotime($b->created_at ?? 0) - strtotime($a->created_at ?? 0);
        });

        $reviews = array_slice($reviews, 0, $limit);

        if (empty($reviews)) {
            echo '<p>No reviews available.</p>';
            return;
        }

        ?>
        <div class="ecare-reviews-carousel swiper-container" style="overflow: hidden; padding: 20px 0;">
            <div class="swiper-wrapper">
                <?php foreach ($reviews as $review): ?>
                    <div class="swiper-slide" style="padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                        <div style="display: flex; gap: 4px; color: #f59e0b; margin-bottom: 12px;">
                            <?php for ($i = 1; $i <= 5; $i++): ?>
                                <svg width="16" height="16" viewBox="0 0 256 256" fill="<?php echo $i <= (int)($review->rating ?? 5) ? '#f59e0b' : '#e2e8f0'; ?>"><path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"></path></svg>
                            <?php endfor; ?>
                        </div>
                        <p style="font-size: 0.95rem; color: #475569; margin-bottom: 16px; font-style: italic; min-height: 60px;">
                            "<?php echo esc_html($review->review_text ?? ''); ?>"
                        </p>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #1e293b;">
                                    <?php echo esc_html($review->patient_name ?? 'Anonymous'); ?>
                                </h4>
                                <span style="font-size: 0.75rem; color: #94a3b8;">Verified Patient</span>
                            </div>
                            <?php if (empty($doctor_id)): ?>
                                <div style="text-align: right;">
                                    <span style="font-size: 0.7rem; color: #94a3b8; display: block;">Consulted with</span>
                                    <span style="font-size: 0.8rem; font-weight: 600; color: #0f172a;">Dr. <?php echo esc_html($review->doctor_name ?? ''); ?></span>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="swiper-pagination"></div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof Swiper !== 'undefined') {
                    new Swiper('.ecare-reviews-carousel', {
                        slidesPerView: 1,
                        spaceBetween: 20,
                        pagination: { el: '.swiper-pagination', clickable: true },
                        breakpoints: {
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 }
                        }
                    });
                }
            });
        </script>
        <?php
    }
}
