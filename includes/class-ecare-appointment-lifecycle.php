<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_AppointmentLifecycle {
    const CRON_HOOK = 'ecare_appointment_lifecycle_tick';
    const CRON_SCHEDULE = 'ecare_every_five_minutes';

    public function __construct() {
        add_filter('cron_schedules', array($this, 'register_schedule'));
        add_action('init', array($this, 'ensure_schedule'));
        add_action(self::CRON_HOOK, array($this, 'process_due_updates'));
    }

    public function register_schedule($schedules) {
        if (!isset($schedules[self::CRON_SCHEDULE])) {
            $schedules[self::CRON_SCHEDULE] = array(
                'interval' => 5 * MINUTE_IN_SECONDS,
                'display' => __('Every 5 Minutes', 'e-care-management'),
            );
        }

        return $schedules;
    }

    public function ensure_schedule() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + 60, self::CRON_SCHEDULE, self::CRON_HOOK);
        }
    }

    public static function activate() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + 60, self::CRON_SCHEDULE, self::CRON_HOOK);
        }
    }

    public static function deactivate() {
        while ($timestamp = wp_next_scheduled(self::CRON_HOOK)) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
        }
    }

    private function parse_time_to_minutes($time_string) {
        $time_string = trim((string) $time_string);
        if ($time_string === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2}):(\d{2})$/', $time_string, $matches)) {
            return (((int) $matches[1]) * 60) + (int) $matches[2];
        }

        if (preg_match('/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i', $time_string, $matches)) {
            $hours = (int) $matches[1] % 12;
            if (strtoupper($matches[3]) === 'PM') {
                $hours += 12;
            }
            return ($hours * 60) + (int) $matches[2];
        }

        return null;
    }

    private function get_appointment_time_range($time_string) {
        $parts = preg_split('/\s*-\s*/', trim((string) $time_string));
        $start = $this->parse_time_to_minutes($parts[0] ?? '');
        if ($start === null) {
            return null;
        }

        $end = null;
        if (count($parts) > 1) {
            $end = $this->parse_time_to_minutes($parts[1]);
        }
        if ($end === null || $end <= $start) {
            $end = $start + 60;
        }

        return array($start, $end);
    }

    private function get_appointment_end_timestamp($appointment) {
        $date = trim((string) ($appointment->date ?? ''));
        $time = trim((string) ($appointment->time ?? ''));
        if ($date === '' || $time === '') {
            return null;
        }

        $range = $this->get_appointment_time_range($time);
        if (!$range) {
            return strtotime($date . ' ' . $time);
        }

        list($start_minutes, $end_minutes) = $range;
        $base_ts = strtotime($date . ' 00:00');
        if (!$base_ts) {
            return null;
        }

        $end_ts = $base_ts + ($end_minutes * MINUTE_IN_SECONDS);
        if ($end_minutes <= $start_minutes) {
            $end_ts += HOUR_IN_SECONDS;
        }

        return $end_ts;
    }

    public function process_due_updates() {
        $appointments = ECARE_DB_Client::select_all('ecare_appointments');
        $now = current_time('timestamp');
        $summary = array(
            'expired' => 0,
            'refund_pending' => 0,
            'closed' => 0,
        );

        foreach ($appointments as $appointment) {
            $status = $appointment->status ?? '';

            if (in_array($status, array('Pending', 'Confirmed'), true) && !empty($appointment->date) && !empty($appointment->time)) {
                $appointment_ts = $this->get_appointment_end_timestamp($appointment);
                if ($appointment_ts && $appointment_ts < $now) {
                    ECARE_DB_Client::update('ecare_appointments', $appointment->id, array('status' => 'Expired'));
                    $summary['expired']++;
                    continue;
                }
            }

            if ($status === 'Query' && ($appointment->mode ?? '') === 'Instant Call' && !empty($appointment->query_started_at)) {
                $query_started = strtotime($appointment->query_started_at);
                if ($query_started && ($now - $query_started > 300)) {
                    ECARE_DB_Client::update('ecare_appointments', $appointment->id, array('status' => 'Refunded', 'paymentStatus' => 'Refunded'));
                    $summary['refund_pending']++;

                    $billings = ECARE_DB_Client::select_where('ecare_billing', 'appointmentId', $appointment->id);
                    if (!empty($billings)) {
                        $billing = $billings[0];
                        if (($billing->paidAmount ?? 0) > 0) {
                            ECARE_DB_Client::insert('ecare_refunds', array(
                                'transactionId' => $billing->id,
                                'appointmentId' => $appointment->id,
                                'patient_user_id' => $billing->patient_user_id ?? $appointment->patient_user_id ?? 0,
                                'invoiceNo' => $billing->invoiceNo ?? '',
                                'patientName' => $billing->patientName ?? '',
                                'originalAmount' => $billing->paidAmount,
                                'refundAmount' => $billing->paidAmount,
                                'type' => 'Full',
                                'reason' => 'Instant Call Auto-Refund: No doctor accepted within 5 minutes.',
                                'status' => 'Processed',
                                'date' => current_time('Y-m-d', 1),
                                'created_at' => current_time('mysql', 1)
                            ));
                            ECARE_DB_Client::update('ecare_billing', $billing->id, array('status' => 'Refunded'));
                        }
                    }
                    continue;
                }
            }

            if ($status === 'Active' && ($appointment->mode ?? '') === 'Instant Call' && !empty($appointment->started_at)) {
                $started = strtotime($appointment->started_at);
                if ($started && ($now - $started > 3600)) {
                    ECARE_DB_Client::update('ecare_appointments', $appointment->id, array('status' => 'Closed'));
                    $summary['closed']++;
                }
            }
        }

        return $summary;
    }
}
