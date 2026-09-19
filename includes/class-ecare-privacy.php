<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_Privacy {

    public function __construct() {
        add_filter('wp_privacy_personal_data_exporters', [$this, 'register_exporter'], 10);
        add_filter('wp_privacy_personal_data_erasers', [$this, 'register_eraser'], 10);
        add_action('delete_user', [$this, 'handle_user_deletion'], 10, 1);
    }

    public function register_exporter($exporters) {
        $exporters['e-care-patient-records'] = [
            'exporter_friendly_name' => __('E-CARE Patient Records', 'e-care-management'),
            'callback' => [$this, 'export_patient_data'],
        ];
        return $exporters;
    }

    public function register_eraser($erasers) {
        $erasers['e-care-patient-records'] = [
            'eraser_friendly_name' => __('E-CARE Patient Records', 'e-care-management'),
            'callback' => [$this, 'erase_patient_data'],
        ];
        return $erasers;
    }

    private function get_patient_data_records($email_address) {
        $user = get_user_by('email', $email_address);
        $user_id = $user ? $user->ID : null;
        
        $patient_ids = [];
        $patients = ECARE_DB_Client::select_where('ecare_patients', 'email', $email_address);
        foreach ($patients as $p) {
            if (!empty($p->id)) {
                $patient_ids[] = $p->id;
            }
        }
        
        $records = [];
        
        $matches = function($doc, $collection) use ($user_id, $patient_ids, $email_address) {
            if ($collection === 'ecare_patients') {
                return (isset($doc->email) && strtolower((string)$doc->email) === strtolower($email_address)) || 
                       ($user_id && isset($doc->user_id) && intval($doc->user_id) === $user_id);
            }
            
            if ($user_id) {
                if (isset($doc->patient_user_id) && intval($doc->patient_user_id) === $user_id) return true;
                if (isset($doc->user_id) && intval($doc->user_id) === $user_id) return true;
                if (isset($doc->sender_id) && intval($doc->sender_id) === $user_id) return true;
            }
            
            foreach ($patient_ids as $pid) {
                if (isset($doc->patient_id) && strval($doc->patient_id) === strval($pid)) return true;
                if (isset($doc->id) && strval($doc->id) === strval($pid)) return true;
            }
            
            return false;
        };
        
        $collections = [
            'ecare_patients' => 'Patient Profile',
            'ecare_appointments' => 'Appointments',
            'ecare_care_provider_bookings' => 'Care Provider Bookings',
            'ecare_ambulance_bookings' => 'Ambulance Bookings',
            'ecare_lab_orders' => 'Lab Orders',
            'ecare_billing' => 'Billing & Invoices',
            'ecare_medical_vault' => 'Medical Vault Documents',
            'ecare_patient_vitals' => 'Patient Vitals',
            'ecare_consultation_notes' => 'Clinical Consultation Notes',
            'ecare_support-tickets' => 'Support Tickets'
        ];
        
        foreach ($collections as $col => $label) {
            $all_docs = ECARE_DB_Client::select_all($col);
            foreach ($all_docs as $doc) {
                if ($matches($doc, $col)) {
                    $records[$col][] = $doc;
                }
            }
        }
        
        return $records;
    }

    public function export_patient_data($email_address, $page = 1) {
        $records = $this->get_patient_data_records($email_address);
        $data = [];
        
        foreach ($records as $col => $docs) {
            foreach ($docs as $doc) {
                $item_data = [];
                
                if ($col === 'ecare_patients') {
                    $item_data[] = ['name' => __('Name', 'e-care-management'), 'value' => $doc->name ?? ''];
                    $item_data[] = ['name' => __('Email', 'e-care-management'), 'value' => $doc->email ?? ''];
                    $item_data[] = ['name' => __('Phone', 'e-care-management'), 'value' => $doc->phone ?? ''];
                    $item_data[] = ['name' => __('Address', 'e-care-management'), 'value' => $doc->address ?? ''];
                    $item_data[] = ['name' => __('Date of Birth', 'e-care-management'), 'value' => $doc->dob ?? ''];
                    $item_data[] = ['name' => __('Blood Group', 'e-care-management'), 'value' => $doc->blood_group ?? ''];
                } elseif ($col === 'ecare_appointments') {
                    $item_data[] = ['name' => __('Appointment ID', 'e-care-management'), 'value' => $doc->id ?? ''];
                    $item_data[] = ['name' => __('Doctor Name', 'e-care-management'), 'value' => $doc->doctorName ?? ''];
                    $item_data[] = ['name' => __('Date', 'e-care-management'), 'value' => $doc->date ?? ''];
                    $item_data[] = ['name' => __('Time', 'e-care-management'), 'value' => $doc->time ?? ''];
                    $item_data[] = ['name' => __('Status', 'e-care-management'), 'value' => $doc->status ?? ''];
                    $item_data[] = ['name' => __('Mode', 'e-care-management'), 'value' => $doc->mode ?? ''];
                } elseif ($col === 'ecare_care_provider_bookings') {
                    $item_data[] = ['name' => __('Booking ID', 'e-care-management'), 'value' => $doc->id ?? ''];
                    $item_data[] = ['name' => __('Provider Name', 'e-care-management'), 'value' => $doc->providerName ?? ''];
                    $item_data[] = ['name' => __('Duration', 'e-care-management'), 'value' => $doc->duration ?? ''];
                    $item_data[] = ['name' => __('Date', 'e-care-management'), 'value' => $doc->date ?? ''];
                    $item_data[] = ['name' => __('Status', 'e-care-management'), 'value' => $doc->status ?? ''];
                } elseif ($col === 'ecare_ambulance_bookings') {
                    $item_data[] = ['name' => __('Booking ID', 'e-care-management'), 'value' => $doc->id ?? ''];
                    $item_data[] = ['name' => __('Driver Name', 'e-care-management'), 'value' => $doc->driverName ?? ''];
                    $item_data[] = ['name' => __('Vehicle No', 'e-care-management'), 'value' => $doc->vehicleNo ?? ''];
                    $item_data[] = ['name' => __('Pickup Location', 'e-care-management'), 'value' => $doc->pickupLocation ?? ''];
                    $item_data[] = ['name' => __('Destination', 'e-care-management'), 'value' => $doc->destination ?? ''];
                    $item_data[] = ['name' => __('Status', 'e-care-management'), 'value' => $doc->status ?? ''];
                } elseif ($col === 'ecare_lab_orders') {
                    $item_data[] = ['name' => __('Order ID', 'e-care-management'), 'value' => $doc->id ?? ''];
                    $item_data[] = ['name' => __('Test Name', 'e-care-management'), 'value' => $doc->testName ?? ''];
                    $item_data[] = ['name' => __('Order Date', 'e-care-management'), 'value' => $doc->order_date ?? ''];
                    $item_data[] = ['name' => __('Sample Type', 'e-care-management'), 'value' => $doc->sample_type ?? ''];
                    $item_data[] = ['name' => __('Status', 'e-care-management'), 'value' => $doc->status ?? ''];
                } elseif ($col === 'ecare_billing') {
                    $item_data[] = ['name' => __('Invoice No', 'e-care-management'), 'value' => $doc->invoiceNo ?? ''];
                    $item_data[] = ['name' => __('Amount', 'e-care-management'), 'value' => $doc->amount ?? ''];
                    $item_data[] = ['name' => __('Paid Amount', 'e-care-management'), 'value' => $doc->paidAmount ?? ''];
                    $item_data[] = ['name' => __('Method', 'e-care-management'), 'value' => $doc->method ?? ''];
                    $item_data[] = ['name' => __('Status', 'e-care-management'), 'value' => $doc->status ?? ''];
                    $item_data[] = ['name' => __('Date', 'e-care-management'), 'value' => $doc->date ?? ''];
                } elseif ($col === 'ecare_medical_vault') {
                    $item_data[] = ['name' => __('Document Title', 'e-care-management'), 'value' => $doc->title ?? ''];
                    $item_data[] = ['name' => __('Category', 'e-care-management'), 'value' => $doc->category ?? ''];
                    $item_data[] = ['name' => __('Notes', 'e-care-management'), 'value' => $doc->notes ?? ''];
                    $item_data[] = ['name' => __('Date Uploaded', 'e-care-management'), 'value' => $doc->created_at ?? ''];
                } elseif ($col === 'ecare_patient_vitals') {
                    $item_data[] = ['name' => __('Vitals Data', 'e-care-management'), 'value' => is_array($doc->vitals) || is_object($doc->vitals) ? json_encode($doc->vitals) : ($doc->vitals ?? '')];
                    $item_data[] = ['name' => __('Recorded At', 'e-care-management'), 'value' => $doc->created_at ?? ''];
                } elseif ($col === 'ecare_consultation_notes') {
                    $item_data[] = ['name' => __('Diagnosis', 'e-care-management'), 'value' => $doc->diagnosis ?? ''];
                    $item_data[] = ['name' => __('Prescription', 'e-care-management'), 'value' => $doc->prescription ?? ''];
                    $item_data[] = ['name' => __('Diagnosis Notes', 'e-care-management'), 'value' => $doc->notes ?? ''];
                    $item_data[] = ['name' => __('Recorded At', 'e-care-management'), 'value' => $doc->created_at ?? ''];
                } elseif ($col === 'ecare_support-tickets') {
                    $item_data[] = ['name' => __('Ticket Subject', 'e-care-management'), 'value' => $doc->subject ?? ''];
                    $item_data[] = ['name' => __('Status', 'e-care-management'), 'value' => $doc->status ?? ''];
                    $item_data[] = ['name' => __('Created At', 'e-care-management'), 'value' => $doc->created_at ?? ''];
                }
                
                if (!empty($item_data)) {
                    $data[] = [
                        'group_id' => $col,
                        'group_label' => $this->get_group_label($col),
                        'item_id' => $doc->id ?? uniqid(),
                        'data' => $item_data,
                    ];
                }
            }
        }
        
        return [
            'data' => $data,
            'done' => true,
        ];
    }
    
    private function get_group_label($collection) {
        $labels = [
            'ecare_patients' => __('E-CARE Patient Profile', 'e-care-management'),
            'ecare_appointments' => __('E-CARE Appointments', 'e-care-management'),
            'ecare_care_provider_bookings' => __('E-CARE Care Provider Bookings', 'e-care-management'),
            'ecare_ambulance_bookings' => __('E-CARE Ambulance Bookings', 'e-care-management'),
            'ecare_lab_orders' => __('E-CARE Lab Orders', 'e-care-management'),
            'ecare_billing' => __('E-CARE Billing & Invoices', 'e-care-management'),
            'ecare_medical_vault' => __('E-CARE Medical Vault Documents', 'e-care-management'),
            'ecare_patient_vitals' => __('E-CARE Patient Vitals', 'e-care-management'),
            'ecare_consultation_notes' => __('E-CARE Clinical Consultation Notes', 'e-care-management'),
            'ecare_support-tickets' => __('E-CARE Support Tickets', 'e-care-management')
        ];
        return $labels[$collection] ?? __('E-CARE Data', 'e-care-management');
    }

    public function erase_patient_data($email_address, $page = 1) {
        $records = $this->get_patient_data_records($email_address);
        
        $items_removed = 0;
        $items_retained = 0;
        $messages = [];
        
        foreach ($records as $col => $docs) {
            foreach ($docs as $doc) {
                if (in_array($col, ['ecare_patients', 'ecare_medical_vault', 'ecare_patient_vitals', 'ecare_support-tickets'], true)) {
                    $deleted = ECARE_DB_Client::delete($col, $doc->id);
                    if ($deleted) {
                        $items_removed++;
                    } else {
                        $items_retained++;
                    }
                } else {
                    $update_data = [];
                    if (isset($doc->patientName)) $update_data['patientName'] = __('Anonymized Patient', 'e-care-management');
                    if (isset($doc->reason)) $update_data['reason'] = __('Anonymized', 'e-care-management');
                    if (isset($doc->attachments)) $update_data['attachments'] = '';
                    if (isset($doc->notes)) $update_data['notes'] = '';
                    if (isset($doc->prescription)) $update_data['prescription'] = '';
                    if (isset($doc->diagnosis)) $update_data['diagnosis'] = '';
                    
                    $updated = ECARE_DB_Client::update($col, $doc->id, $update_data);
                    if ($updated) {
                        $items_removed++;
                    } else {
                        $items_retained++;
                    }
                }
            }
        }
        
        return [
            'items_removed' => $items_removed,
            'items_retained' => $items_retained,
            'messages' => $messages,
            'done' => true,
        ];
    }

    public function handle_user_deletion($user_id) {
        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }
        
        $email = $user->user_email;
        $records = $this->get_patient_data_records($email);
        
        foreach ($records as $col => $docs) {
            foreach ($docs as $doc) {
                if (in_array($col, ['ecare_patients', 'ecare_medical_vault', 'ecare_patient_vitals', 'ecare_support-tickets'], true)) {
                    ECARE_DB_Client::delete($col, $doc->id);
                } else {
                    $update_data = [];
                    if (isset($doc->patientName)) $update_data['patientName'] = __('Deleted Patient', 'e-care-management');
                    if (isset($doc->reason)) $update_data['reason'] = __('Deleted', 'e-care-management');
                    if (isset($doc->attachments)) $update_data['attachments'] = '';
                    if (isset($doc->notes)) $update_data['notes'] = '';
                    if (isset($doc->prescription)) $update_data['prescription'] = '';
                    if (isset($doc->diagnosis)) $update_data['diagnosis'] = '';
                    
                    ECARE_DB_Client::update($col, $doc->id, $update_data);
                }
            }
        }
    }
}
