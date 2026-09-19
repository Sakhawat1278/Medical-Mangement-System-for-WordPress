<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Reminders {
    const CRON_HOOK = 'ecare_reminders_hourly';
    const LOG_COLLECTION = 'ecare_reminder_logs';

    public function __construct() {
        add_action(self::CRON_HOOK, array($this, 'process_due_reminders'));
        add_action('init', array($this, 'ensure_schedule'));
    }

    public function ensure_schedule() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + 600, 'hourly', self::CRON_HOOK);
        }
    }

    public static function activate() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + 600, 'hourly', self::CRON_HOOK);
        }
    }

    public static function deactivate() {
        while ($timestamp = wp_next_scheduled(self::CRON_HOOK)) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
        }
    }

    public function get_settings() {
        $settings = get_option('ecare_settings', array());
        if (!is_array($settings)) {
            $settings = array();
        }

        $reminders = isset($settings['reminders']) && is_array($settings['reminders']) ? $settings['reminders'] : array();

        return wp_parse_args($reminders, array(
            'enabled' => true,
            'channels' => array(
                'email' => true,
            ),
            'appointment' => array(
                'enabled' => true,
                'hoursBefore' => 24,
            ),
            'invoice' => array(
                'enabled' => true,
                'daysAfter' => 3,
            ),
            'lab' => array(
                'enabled' => true,
            ),
            'followUp' => array(
                'enabled' => true,
                'daysAfter' => 7,
            ),
            'delivery' => array(
                'senderName' => get_bloginfo('name'),
            ),
        ));
    }

    public function process_due_reminders($manual = false) {
        $settings = $this->get_settings();
        $summary = array(
            'success' => true,
            'manual' => (bool) $manual,
            'generated_at' => current_time('mysql'),
            'sent' => array(),
            'skipped' => array(),
            'counts' => array(
                'appointments' => 0,
                'invoices' => 0,
                'lab_results' => 0,
                'follow_ups' => 0,
            ),
        );

        if (empty($settings['enabled'])) {
            $summary['success'] = false;
            $summary['message'] = 'Automated reminders are disabled.';
            return $summary;
        }

        $channels = isset($settings['channels']) && is_array($settings['channels']) ? $settings['channels'] : array();
        $appointments = ECARE_DB_Client::select_all('ecare_appointments');
        $invoices = ECARE_DB_Client::select_all('ecare_billing');
        $labOrders = ECARE_DB_Client::select_all('ecare_lab_orders');

        foreach ($appointments as $appointment) {
            if ($this->should_send_appointment_reminder($appointment, $settings)) {
                $recipient = $this->resolve_patient_contact($appointment->patient_user_id ?? null, $appointment->patient_id ?? null, $appointment->patientName ?? '');
                $message = $this->build_appointment_message($appointment);
                $result = $this->dispatch_reminder('appointment', (string) ($appointment->id ?? ''), $recipient, 'Upcoming appointment reminder', $message, $channels, array(
                    'appointment' => $appointment,
                ));
                $summary = $this->merge_summary($summary, $result, 'appointments');
            }
        }

        foreach ($invoices as $invoice) {
            if ($this->should_send_invoice_reminder($invoice, $settings)) {
                $recipient = $this->resolve_patient_contact($invoice->patient_user_id ?? null, $invoice->patient_id ?? null, $invoice->patientName ?? '');
                $message = $this->build_invoice_message($invoice);
                $result = $this->dispatch_reminder('invoice', (string) ($invoice->id ?? ''), $recipient, 'Payment reminder', $message, $channels, array(
                    'invoice' => $invoice,
                ));
                $summary = $this->merge_summary($summary, $result, 'invoices');
            }
        }

        foreach ($labOrders as $order) {
            if ($this->should_send_lab_result_reminder($order, $settings)) {
                $recipient = $this->resolve_patient_contact($order->patient_user_id ?? null, $order->patient_id ?? null, $order->patientName ?? '');
                $message = $this->build_lab_message($order);
                $result = $this->dispatch_reminder('lab-result', (string) ($order->id ?? ''), $recipient, 'Lab result is ready', $message, $channels, array(
                    'lab_order' => $order,
                ));
                $summary = $this->merge_summary($summary, $result, 'lab_results');
            }
        }

        foreach ($appointments as $appointment) {
            if ($this->should_send_followup_reminder($appointment, $settings)) {
                $recipient = $this->resolve_patient_contact($appointment->patient_user_id ?? null, $appointment->patient_id ?? null, $appointment->patientName ?? '');
                $message = $this->build_followup_message($appointment, $settings);
                $result = $this->dispatch_reminder('follow-up', (string) ($appointment->id ?? ''), $recipient, 'Follow-up reminder', $message, $channels, array(
                    'appointment' => $appointment,
                ));
                $summary = $this->merge_summary($summary, $result, 'follow_ups');
            }
        }

        return $summary;
    }

    private function merge_summary($summary, $result, $bucket) {
        if (!empty($result['sent'])) {
            $summary['counts'][$bucket] = ($summary['counts'][$bucket] ?? 0) + count($result['sent']);
            $summary['sent'] = array_merge($summary['sent'], $result['sent']);
        }
        if (!empty($result['skipped'])) {
            $summary['skipped'] = array_merge($summary['skipped'], $result['skipped']);
        }
        return $summary;
    }

    private function dispatch_reminder($type, $entity_id, $recipient, $subject, $message, $channels, $context = array()) {
        $sent = array();
        $skipped = array();
        $sender_name = $this->get_settings()['delivery']['senderName'] ?? get_bloginfo('name');

        if (empty($channels['email'])) {
            return array('sent' => array(), 'skipped' => array());
        }

        $destination = $recipient['email'] ?? '';
        if (empty($destination)) {
            $skipped[] = array('type' => $type, 'entity_id' => $entity_id, 'channel' => 'email', 'reason' => 'missing_destination');
            return array('sent' => $sent, 'skipped' => $skipped);
        }

        $log_id = implode(':', array($type, $entity_id, 'email', $this->dedupe_window_key($type)));
        if ($this->has_log($log_id)) {
            $skipped[] = array('type' => $type, 'entity_id' => $entity_id, 'channel' => 'email', 'reason' => 'already_sent');
            return array('sent' => $sent, 'skipped' => $skipped);
        }

        $ok = $this->send_email($destination, $subject, $message, $sender_name);

        if ($ok) {
            $this->write_log($log_id, array(
                'type' => $type,
                'entity_id' => $entity_id,
                'channel' => 'email',
                'recipient' => $destination,
                'subject' => $subject,
                'message' => $message,
                'sent_at' => current_time('mysql'),
                'context' => $context,
            ));
            $sent[] = array('type' => $type, 'entity_id' => $entity_id, 'channel' => 'email', 'recipient' => $destination);
        } else {
            $skipped[] = array('type' => $type, 'entity_id' => $entity_id, 'channel' => 'email', 'reason' => 'send_failed');
        }

        return array('sent' => $sent, 'skipped' => $skipped);
    }

    private function send_email($to, $subject, $message, $sender_name = '') {
        if (!is_email($to)) {
            return false;
        }

        $headers = array('Content-Type: text/html; charset=UTF-8');
        $site_name = !empty($sender_name) ? $sender_name : (get_bloginfo('name') ?: 'E-CARE');

        $email_html = "
        <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;'>
            <div style='border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;'>
                <span style='background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;'>CLINICAL REMINDER</span>
                <h2 style='color: #0f172a; margin: 8px 0 0 0; font-size: 18px;'>" . esc_html($subject) . "</h2>
            </div>
            <div style='color: #334155; font-size: 14px; line-height: 1.6;'>" . nl2br(esc_html($message)) . "</div>
            <div style='margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;'>
                Sent by <strong>" . esc_html($site_name) . "</strong> automated reminders system.
            </div>
        </div>";

        return (bool) wp_mail($to, $subject, $email_html, $headers);
    }

    private function resolve_patient_contact($patient_user_id = null, $patient_id = null, $fallback_name = '') {
        $email = '';
        $phone = '';
        $name = $fallback_name ?: 'Patient';

        if (!empty($patient_user_id)) {
            $user = get_user_by('id', $patient_user_id);
            if ($user) {
                $email = $user->user_email;
                if (empty($name)) {
                    $name = $user->display_name ?: $name;
                }
            }
        }

        $patient = null;
        if (!empty($patient_id)) {
            $patient = ECARE_DB_Client::select_one('ecare_patients', $patient_id);
        }
        if (!$patient && !empty($patient_user_id)) {
            $matches = ECARE_DB_Client::select_where('ecare_patients', 'user_id', $patient_user_id);
            $patient = !empty($matches) ? $matches[0] : null;
        }

        if ($patient) {
            $name = $patient->name ?? $name;
            if (empty($email)) {
                $email = $patient->email ?? '';
            }
            $phone = $patient->phone ?? '';
        }

        return array(
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
        );
    }

    private function build_appointment_message($appointment) {
        $date = $appointment->date ?? $appointment->appointment_date ?? '';
        $time = $appointment->time ?? $appointment->appointment_time ?? '';
        $doctor = $appointment->doctorName ?? $appointment->doctor_name ?? 'your clinician';
        return sprintf(
            'Your appointment with %s is scheduled for %s %s. Please arrive a little early and keep your contact details handy.',
            $doctor,
            $date ?: 'the scheduled date',
            $time ? 'at ' . $time : ''
        );
    }

    private function build_invoice_message($invoice) {
        $invoice_no = $invoice->invoiceNo ?? $invoice->invoiceNumber ?? $invoice->id ?? 'Invoice';
        $amount = number_format((float) ($invoice->amount ?? 0), 2);
        $paid = number_format((float) ($invoice->paidAmount ?? 0), 2);
        $due = number_format(max(0, (float) ($invoice->amount ?? 0) - (float) ($invoice->paidAmount ?? 0)), 2);
        return sprintf(
            'Invoice %s has an outstanding balance of %s (paid %s of %s). Please review it in your patient portal.',
            $invoice_no,
            $due,
            $paid,
            $amount
        );
    }

    private function build_lab_message($order) {
        $test = $order->test_name ?? $order->testName ?? $order->name ?? 'Lab report';
        return sprintf(
            'Your lab result for %s is ready in the patient portal. Please log in to review the report or download the file if attached.',
            $test
        );
    }

    private function build_followup_message($appointment, $settings) {
        $days = $this->get_followup_days($appointment, $settings);
        $doctor = $appointment->doctorName ?? $appointment->doctor_name ?? 'your doctor';
        return sprintf(
            'A follow-up check-in for %s is now due or recommended. Please book your next visit within the next %d day%s.',
            $doctor,
            $days,
            $days === 1 ? '' : 's'
        );
    }

    private function should_send_appointment_reminder($appointment, $settings) {
        if (empty($settings['appointment']['enabled'])) {
            return false;
        }

        $status = strtolower(trim((string) ($appointment->status ?? '')));
        if (!in_array($status, array('pending', 'confirmed', 'scheduled'), true)) {
            return false;
        }

        $date = $appointment->date ?? $appointment->appointment_date ?? '';
        if (empty($date)) {
            return false;
        }

        $time = $appointment->time ?? $appointment->appointment_time ?? '09:00';
        $leadHours = max(1, (int) ($settings['appointment']['hoursBefore'] ?? 24));
        $appointmentTs = strtotime(trim($date . ' ' . $time));
        if (!$appointmentTs) {
            return false;
        }

        $windowStart = $appointmentTs - ($leadHours * HOUR_IN_SECONDS);
        $now = current_time('timestamp');

        return $now >= $windowStart && $now <= $appointmentTs;
    }

    private function should_send_invoice_reminder($invoice, $settings) {
        if (empty($settings['invoice']['enabled'])) {
            return false;
        }

        $status = strtolower(trim((string) ($invoice->status ?? '')));
        if (!in_array($status, array('pending', 'due', 'partially paid'), true)) {
            return false;
        }

        $amount = (float) ($invoice->amount ?? 0);
        $paid = (float) ($invoice->paidAmount ?? 0);
        if ($amount <= $paid) {
            return false;
        }

        $source_date = $invoice->date ?? $invoice->created_at ?? '';
        $createdTs = strtotime((string) $source_date);
        if (!$createdTs) {
            return false;
        }

        $daysAfter = max(0, (int) ($settings['invoice']['daysAfter'] ?? 3));
        $ageDays = floor((current_time('timestamp') - $createdTs) / DAY_IN_SECONDS);

        return $ageDays >= $daysAfter;
    }

    private function should_send_lab_result_reminder($order, $settings) {
        if (empty($settings['lab']['enabled'])) {
            return false;
        }

        $status = strtolower(trim((string) ($order->status ?? '')));
        if ($status !== 'completed') {
            return false;
        }

        $has_result = !empty($order->report_file) || !empty($order->report_file_name) || !empty($order->result_value) || !empty($order->result_notes);
        if (!$has_result) {
            return false;
        }

        $key = implode(':', array('lab-result', (string) ($order->id ?? '')));
        return !$this->has_log($key);
    }

    private function should_send_followup_reminder($appointment, $settings) {
        if (empty($settings['followUp']['enabled'])) {
            return false;
        }

        $status = strtolower(trim((string) ($appointment->status ?? '')));
        if ($status !== 'completed') {
            return false;
        }

        $date = $appointment->date ?? $appointment->appointment_date ?? '';
        if (empty($date)) {
            return false;
        }

        $followupDays = $this->get_followup_days($appointment, $settings);
        $baseTs = strtotime((string) $date);
        if (!$baseTs) {
            return false;
        }

        $dueTs = $baseTs + ($followupDays * DAY_IN_SECONDS);
        if (current_time('timestamp') < $dueTs) {
            return false;
        }

        $key = implode(':', array('follow-up', (string) ($appointment->id ?? ''), wp_date('Y-m-d', $dueTs)));
        return !$this->has_log($key);
    }

    private function get_followup_days($appointment, $settings) {
        $fallback = max(1, (int) ($settings['followUp']['daysAfter'] ?? 7));
        $doctor_name = $appointment->doctorName ?? $appointment->doctor_name ?? '';
        $doctor_user_id = $appointment->doctor_id ?? $appointment->doctor_user_id ?? null;

        if (!empty($doctor_user_id)) {
            $matches = ECARE_DB_Client::select_where('ecare_staff', 'user_id', $doctor_user_id);
            if (!empty($matches)) {
                $days = (int) ($matches[0]->followUpDays ?? $matches[0]->follow_up_days ?? 0);
                if ($days > 0) {
                    return $days;
                }
            }
        }

        if (!empty($doctor_name)) {
            $doctors = ECARE_DB_Client::select_all('ecare_staff');
            foreach ($doctors as $doctor) {
                if (($doctor->name ?? '') === $doctor_name) {
                    $days = (int) ($doctor->followUpDays ?? $doctor->follow_up_days ?? 0);
                    if ($days > 0) {
                        return $days;
                    }
                }
            }
        }

        return $fallback;
    }

    private function dedupe_window_key($type) {
        if ($type === 'invoice') {
            return wp_date('Y-m-d', current_time('timestamp'));
        }
        return 'once';
    }

    private function has_log($id) {
        return (bool) ECARE_DB_Client::select_one(self::LOG_COLLECTION, $id);
    }

    private function write_log($id, $payload) {
        if ($this->has_log($id)) {
            return false;
        }

        $payload['id'] = $id;
        ECARE_DB_Client::insert(self::LOG_COLLECTION, $payload, $id);
        return true;
    }

    /**
     * Test a specific reminder feature or channel connectivity with live diagnostics.
     *
     * @param array $params
     * @return array
     */
    public function test_reminder($params = array()) {
        $settings = $this->get_settings();
        
        // Allow delivery overrides from client (for testing unsaved form values)
        $delivery_input = !empty($params['delivery']) && is_array($params['delivery'])
            ? $params['delivery']
            : (!empty($params['delivery_overrides']) && is_array($params['delivery_overrides']) ? $params['delivery_overrides'] : array());
        if (!empty($delivery_input)) {
            $settings['delivery'] = array_merge($settings['delivery'] ?? array(), $delivery_input);
        }

        $feature = sanitize_text_field($params['feature'] ?? 'appointment');
        $recipient_email = sanitize_email($params['recipient_email'] ?? '');

        if (empty($recipient_email)) {
            $current_user = wp_get_current_user();
            $recipient_email = (!empty($current_user->user_email)) ? $current_user->user_email : get_option('admin_email');
        }

        $site_name = get_bloginfo('name') ?: 'E-CARE';
        $sender_name = (!empty($settings['delivery']['senderName'])) ? $settings['delivery']['senderName'] : $site_name;

        // Generate feature-specific preview content
        switch ($feature) {
            case 'appointment':
                $subject = "Upcoming Appointment Reminder - {$site_name}";
                $message = "Hello! This is an automated test reminder from {$site_name}.\n\nYour consultation with Dr. Sarah Jenkins is scheduled for tomorrow at 10:00 AM.\nPlease arrive 10 minutes early and bring any relevant clinical records.";
                break;

            case 'invoice':
                $subject = "Payment Reminder: Invoice #ECR-8421 - {$site_name}";
                $message = "Hello! This is an automated test payment reminder from {$site_name}.\n\nInvoice #ECR-8421 has an outstanding balance of $120.00 (paid $0.00 of $120.00).\nPlease review and complete payment through your patient portal.";
                break;

            case 'lab':
                $subject = "Diagnostic Lab Report Ready - {$site_name}";
                $message = "Hello! This is an automated test alert from {$site_name}.\n\nYour laboratory result for Comprehensive Metabolic Panel (CMP) is now completed and ready.\nPlease log in to your patient portal to review or download your official report.";
                break;

            case 'followup':
                $subject = "Follow-Up Consultation Reminder - {$site_name}";
                $message = "Hello! This is an automated test follow-up check-in from {$site_name}.\n\nA routine clinical follow-up with Dr. Sarah Jenkins is recommended. Please book your next visit within the next 7 days.";
                break;

            case 'channel_test':
            default:
                $subject = "Reminder Email Diagnostic Test - {$site_name}";
                $message = "This is an automated diagnostic test ping from {$site_name}.\n\nIf you are seeing this message, your reminder email delivery engine (WordPress wp_mail) is operational and properly configured.";
                break;
        }

        $start_time = microtime(true);
        $results = array();
        $overall_success = true;

        if (!is_email($recipient_email)) {
            $results['email'] = array(
                'success'     => false,
                'status'      => 'Invalid Email',
                'destination' => $recipient_email,
                'message'     => 'The provided recipient email address is invalid.',
                'elapsed_ms'  => 0,
            );
            $overall_success = false;
        } else {
            $headers = array('Content-Type: text/html; charset=UTF-8');
            $email_html = "
            <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;'>
                <div style='border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;'>
                    <span style='background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;'>TEST REMINDER NOTIFICATION</span>
                    <h2 style='color: #0f172a; margin: 8px 0 0 0; font-size: 18px;'>" . esc_html($subject) . "</h2>
                </div>
                <div style='color: #334155; font-size: 14px; line-height: 1.6;'>" . nl2br(esc_html($message)) . "</div>
                <div style='margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;'>
                    Sent from <strong>" . esc_html($sender_name) . "</strong> automated reminders system at " . esc_html(current_time('mysql')) . ".
                </div>
            </div>";

            $mail_sent = wp_mail($recipient_email, $subject, $email_html, $headers);
            $elapsed = round((microtime(true) - $start_time) * 1000);

            if ($mail_sent) {
                $results['email'] = array(
                    'success'     => true,
                    'status'      => 'Delivered',
                    'destination' => $recipient_email,
                    'message'     => "Email successfully accepted by WordPress wp_mail() engine for {$recipient_email}.",
                    'elapsed_ms'  => $elapsed,
                );
            } else {
                $overall_success = false;
                $results['email'] = array(
                    'success'     => false,
                    'status'      => 'Mail Delivery Failed',
                    'destination' => $recipient_email,
                    'message'     => "wp_mail() returned false. Check your WordPress SMTP plugin configuration or local mail server.",
                    'elapsed_ms'  => $elapsed,
                );
            }
        }

        return array(
            'success'         => $overall_success,
            'feature'         => $feature,
            'channel'         => 'email',
            'channels'        => array('email'),
            'subject'         => $subject,
            'message'         => $message,
            'recipient_email' => $recipient_email,
            'results'         => $results,
            'tested_at'       => current_time('mysql'),
        );
    }
}
