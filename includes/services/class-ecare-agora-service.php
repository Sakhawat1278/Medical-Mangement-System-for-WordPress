<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/agora/AccessToken2.php';
require_once __DIR__ . '/agora/RtcTokenBuilder2.php';
require_once __DIR__ . '/agora/RtmTokenBuilder2.php';

/**
 * ECARE_Agora_Service
 *
 * Dedicated service for Agora real-time audio/video and signaling tokens.
 * Authoritative server-side channel derivation, role-based UIDs,
 * access control validation, and session lifecycle tracking.
 */
class ECARE_Agora_Service
{
    /**
     * Retrieve Agora settings from WordPress options & ecare_settings.
     *
     * @return array
     */
    public static function get_config()
    {
        $settings = get_option('ecare_settings', array());
        if (!is_array($settings)) {
            $settings = array();
        }

        $app_id = trim(get_option('ecare_agora_app_id', $settings['agoraAppId'] ?? ''));
        $app_certificate = trim(get_option('ecare_agora_app_certificate', $settings['agoraAppCertificate'] ?? ''));
        $token_expiry = intval(get_option('ecare_agora_token_expiry', $settings['agoraTokenExpiry'] ?? 3600));
        if ($token_expiry < 300 || $token_expiry > 86400) {
            $token_expiry = 3600;
        }

        $enabled = get_option('ecare_agora_enabled', $settings['agoraEnabled'] ?? true);
        $enabled = filter_var($enabled, FILTER_VALIDATE_BOOLEAN);

        $video_enabled = get_option('ecare_agora_video_enabled', $settings['agoraVideoEnabled'] ?? true);
        $video_enabled = filter_var($video_enabled, FILTER_VALIDATE_BOOLEAN);

        $audio_enabled = get_option('ecare_agora_audio_enabled', $settings['agoraAudioEnabled'] ?? true);
        $audio_enabled = filter_var($audio_enabled, FILTER_VALIDATE_BOOLEAN);

        $screen_share_enabled = get_option('ecare_agora_screen_share_enabled', $settings['agoraScreenShareEnabled'] ?? true);
        $screen_share_enabled = filter_var($screen_share_enabled, FILTER_VALIDATE_BOOLEAN);

        $signaling_enabled = get_option('ecare_agora_signaling_enabled', $settings['agoraSignalingEnabled'] ?? true);
        $signaling_enabled = filter_var($signaling_enabled, FILTER_VALIDATE_BOOLEAN);

        $provider = get_option('ecare_telemed_provider', $settings['telemedProvider'] ?? 'agora');

        return array(
            'enabled'              => $enabled,
            'app_id'               => $app_id,
            'app_certificate'      => $app_certificate,
            'token_expiry'         => $token_expiry,
            'video_enabled'        => $video_enabled,
            'audio_enabled'        => $audio_enabled,
            'screen_share_enabled' => $screen_share_enabled,
            'signaling_enabled'    => $signaling_enabled,
            'provider'             => $provider,
        );
    }

    /**
     * Check if Agora is active as the primary telemedicine provider.
     *
     * @return bool
     */
    public static function is_enabled()
    {
        $config = self::get_config();
        return $config['enabled'] && ($config['provider'] === 'agora' || empty($config['provider']));
    }

    /**
     * Validate whether Agora credentials are configured.
     *
     * @return bool
     */
    public static function is_configured()
    {
        $config = self::get_config();
        return !empty($config['app_id']) && !empty($config['app_certificate']);
    }

    /**
     * Derive authoritative Agora channel name from room ID.
     * Never allow clients to pass arbitrary channel names.
     *
     * @param int|string $room_id
     * @return string
     */
    public static function get_channel_name($room_id)
    {
        $clean_id = intval($room_id);
        if ($clean_id <= 0) {
            $clean_id = 1;
        }
        return 'ecare_telemed_' . $clean_id;
    }

    /**
     * Generate a deterministic 32-bit integer UID based on role and user ID.
     * Doctor: 10000000 + WP User ID
     * Patient: 20000000 + WP User ID
     * Staff/Admin: 30000000 + WP User ID
     *
     * @param int $user_id
     * @param string $role
     * @return int
     */
    public static function get_user_uid($user_id, $role = 'patient')
    {
        $clean_id = abs(intval($user_id));
        if ($clean_id <= 0) {
            $clean_id = mt_rand(1000, 9999);
        }

        switch ($role) {
            case 'doctor':
                return 10000000 + $clean_id;
            case 'patient':
                return 20000000 + $clean_id;
            case 'admin':
            case 'staff':
            default:
                return 30000000 + $clean_id;
        }
    }

    /**
     * Validate telemedicine room and session access for the current user.
     *
     * @param int $room_id
     * @param int $appointment_id
     * @param int $current_user_id
     * @return array|WP_Error Array with room, appointment, role, user_name on success.
     */
    public static function validate_session_access($room_id, $appointment_id, $current_user_id)
    {
        if ($current_user_id <= 0) {
            return new WP_Error(
                'ecare_unauthenticated',
                __('You must be logged in to access this telemedicine consultation.', 'e-care-management'),
                array('status' => 401)
            );
        }

        $user_obj = get_userdata($current_user_id);
        if (!$user_obj) {
            return new WP_Error('ecare_user_not_found', __('User account not found.', 'e-care-management'), array('status' => 401));
        }

        $user_name = trim($user_obj->first_name . ' ' . $user_obj->last_name);
        if (empty($user_name)) {
            $user_name = $user_obj->display_name ?: $user_obj->user_login;
        }

        // Determine user capabilities & role
        $ecare_role = get_user_meta($current_user_id, 'ecare_role', true);
        $wp_roles = (array) $user_obj->roles;
        $is_admin = current_user_can('manage_options') || in_array('ecare_admin', $wp_roles, true) || $ecare_role === 'admin';
        $is_doctor = in_array('ecare_doctor', $wp_roles, true) || $ecare_role === 'doctor';
        $is_patient = in_array('ecare_patient', $wp_roles, true) || $ecare_role === 'patient';

        // Load room record
        $room = null;
        if ($room_id > 0) {
            $room = ECARE_DB_Client::select_one('ecare_telemed_rooms', $room_id);
        }

        if (!$room && $appointment_id > 0) {
            $rooms = ECARE_DB_Client::select_where('ecare_telemed_rooms', 'appointment_id', $appointment_id);
            if (!empty($rooms)) {
                $room = $rooms[0];
            }
        }

        // Load appointment record
        $appointment = null;
        $target_appt_id = $appointment_id ?: (is_object($room) ? ($room->appointment_id ?? 0) : ($room['appointment_id'] ?? 0));
        if ($target_appt_id > 0) {
            $appointment = ECARE_DB_Client::select_one('ecare_appointments', $target_appt_id);
        }

        // If room does not exist yet but appointment exists, initialize room record
        if (!$room && $appointment) {
            $patient_uid = $appointment->patient_user_id ?? $appointment->patient_id ?? $current_user_id;
            $doctor_uid  = $appointment->doctor_user_id ?? $appointment->doctor_id ?? null;
            $insert_id   = ECARE_DB_Client::insert('ecare_telemed_rooms', array(
                'appointment_id' => $appointment->id,
                'patient_id'     => $patient_uid,
                'doctor_id'      => $doctor_uid,
                'status'         => 'Active',
                'type'           => ($appointment->mode ?? '') === 'Instant Call' ? 'Instant' : 'Scheduled',
                'call_status'    => 'connected',
                'provider'       => 'agora',
                'channel_name'   => self::get_channel_name($appointment->id),
                'created_at'     => current_time('mysql'),
                'updated_at'     => current_time('mysql'),
            ));
            $room = ECARE_DB_Client::select_one('ecare_telemed_rooms', $insert_id ?: $appointment->id);
        }

        // Fallback auto-create for instant consultation rooms
        if (!$room) {
            $effective_id = $room_id > 0 ? $room_id : ($appointment_id > 0 ? $appointment_id : 1);
            $insert_id = ECARE_DB_Client::insert('ecare_telemed_rooms', array(
                'appointment_id' => $effective_id,
                'patient_id'     => $is_doctor ? 0 : $current_user_id,
                'doctor_id'      => $is_doctor ? $current_user_id : null,
                'status'         => 'Active',
                'type'           => 'Instant',
                'call_status'    => 'connected',
                'provider'       => 'agora',
                'channel_name'   => self::get_channel_name($effective_id),
                'created_at'     => current_time('mysql'),
                'updated_at'     => current_time('mysql'),
            ));
            $room = ECARE_DB_Client::select_one('ecare_telemed_rooms', $insert_id ?: $effective_id);
        }

        $effective_room_id = is_object($room) ? ($room->id ?? $room_id) : ($room['id'] ?? $room_id);
        $room_doctor_id    = is_object($room) ? ($room->doctor_id ?? 0) : ($room['doctor_id'] ?? 0);
        $room_patient_id   = is_object($room) ? ($room->patient_id ?? 0) : ($room['patient_id'] ?? 0);

        // Check appointment lifecycle state
        if ($appointment) {
            $appt_status = strtolower(trim((string) ($appointment->status ?? '')));
            if (in_array($appt_status, array('cancelled', 'expired', 'refunded'), true)) {
                return new WP_Error(
                    'ecare_appointment_closed',
                    sprintf(__('This appointment has been %s and cannot be accessed.', 'e-care-management'), $appt_status),
                    array('status' => 403)
                );
            }
        }

        // Authorization check: Verify user is a legitimate participant
        $user_role_in_call = 'guest';
        $is_authorized = false;

        if ($is_admin) {
            $is_authorized = true;
            $user_role_in_call = 'admin';
        }

        // Check Doctor authorization
        if (intval($room_doctor_id) === $current_user_id) {
            $is_authorized = true;
            $user_role_in_call = 'doctor';
        } elseif ($appointment && (intval($appointment->doctor_user_id ?? 0) === $current_user_id || intval($appointment->doctor_id ?? 0) === $current_user_id)) {
            $is_authorized = true;
            $user_role_in_call = 'doctor';
        } elseif ($is_doctor && (empty($room_doctor_id) || intval($room_doctor_id) === 0)) {
            // Unassigned instant call room being accepted by doctor
            $is_authorized = true;
            $user_role_in_call = 'doctor';
            ECARE_DB_Client::update('ecare_telemed_rooms', $effective_room_id, array('doctor_id' => $current_user_id));
        }

        // Check Patient authorization
        if (intval($room_patient_id) === $current_user_id) {
            $is_authorized = true;
            $user_role_in_call = 'patient';
        } elseif ($appointment && (intval($appointment->patient_user_id ?? 0) === $current_user_id || intval($appointment->patient_id ?? 0) === $current_user_id)) {
            $is_authorized = true;
            $user_role_in_call = 'patient';
        }

        if (!$is_authorized) {
            return new WP_Error(
                'ecare_unauthorized_room',
                __('Security restriction: You are not authorized to join this consultation room.', 'e-care-management'),
                array('status' => 403)
            );
        }

        if ($user_role_in_call === 'doctor' && stripos($user_name, 'dr.') === false && stripos($user_name, 'doctor') === false) {
            $user_name = 'Dr. ' . $user_name;
        }

        return array(
            'room'               => $room,
            'effective_room_id'  => $effective_room_id,
            'appointment'        => $appointment,
            'role'               => $user_role_in_call,
            'user_name'          => $user_name,
            'channel'            => self::get_channel_name($effective_room_id),
            'uid'                => self::get_user_uid($current_user_id, $user_role_in_call),
        );
    }

    /**
     * Generate short-lived Agora RTC token using official AccessToken2 builder.
     *
     * @param string $channel_name
     * @param int $uid
     * @param string $role 'publisher' or 'subscriber'
     * @return array|WP_Error Array with rtc_token and expires_at timestamp
     */
    public static function generate_rtc_token($channel_name, $uid, $role = 'publisher')
    {
        $config = self::get_config();

        if (empty($config['app_id']) || empty($config['app_certificate'])) {
            return new WP_Error(
                'agora_not_configured',
                __('Agora App ID or App Certificate is missing. Please configure Agora in E-CARE Settings.', 'e-care-management'),
                array('status' => 500)
            );
        }

        $agora_role = ($role === 'subscriber')
            ? RtcTokenBuilder2::ROLE_SUBSCRIBER
            : RtcTokenBuilder2::ROLE_PUBLISHER;

        $expiry_seconds = $config['token_expiry'];
        $expires_at = time() + $expiry_seconds;

        try {
            $token = RtcTokenBuilder2::buildTokenWithUid(
                $config['app_id'],
                $config['app_certificate'],
                $channel_name,
                intval($uid),
                $agora_role,
                $expiry_seconds,
                $expiry_seconds
            );

            return array(
                'rtc_token'  => $token,
                'expires_at' => $expires_at,
                'uid'        => intval($uid),
                'channel'    => $channel_name,
                'app_id'     => $config['app_id'],
            );
        } catch (Exception $e) {
            return new WP_Error(
                'agora_token_error',
                sprintf(__('Failed to generate Agora RTC token: %s', 'e-care-management'), $e->getMessage()),
                array('status' => 500)
            );
        }
    }

    /**
     * Generate an Agora Signaling (RTM) token if signaling is enabled.
     *
     * @param int|string $user_id
     * @return string|null
     */
    public static function generate_rtm_token($user_id)
    {
        $config = self::get_config();
        if (!$config['signaling_enabled'] || empty($config['app_id']) || empty($config['app_certificate'])) {
            return null;
        }

        try {
            return RtmTokenBuilder2::buildToken(
                $config['app_id'],
                $config['app_certificate'],
                (string) $user_id,
                $config['token_expiry']
            );
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Track consultation presence and lifecycle metrics in ecare_telemed_rooms.
     *
     * @param int $room_id
     * @param int $user_id
     * @param string $role
     * @param string $event 'joined' | 'left' | 'ended'
     * @return bool
     */
    public static function update_room_presence($room_id, $user_id, $role, $event)
    {
        $room = ECARE_DB_Client::select_one('ecare_telemed_rooms', $room_id);
        if (!$room) {
            return false;
        }

        $now = current_time('mysql');
        $updates = array(
            'provider'     => 'agora',
            'channel_name' => self::get_channel_name($room_id),
            'updated_at'   => $now,
        );

        if ($event === 'joined') {
            if ($role === 'doctor') {
                $updates['doctor_joined_at'] = $now;
            } elseif ($role === 'patient') {
                $updates['patient_joined_at'] = $now;
            }
            if (empty($room->started_at)) {
                $updates['started_at'] = $now;
            }
            $updates['status'] = 'Active';
            $updates['call_status'] = 'connected';
        } elseif ($event === 'left') {
            if ($role === 'doctor') {
                $updates['doctor_left_at'] = $now;
            } elseif ($role === 'patient') {
                $updates['patient_left_at'] = $now;
            }
        } elseif ($event === 'ended') {
            $updates['ended_at'] = $now;
            $updates['ended_by'] = $user_id;
            $updates['call_status'] = 'ended';
            $updates['status'] = 'Completed';
        }

        return (bool) ECARE_DB_Client::update('ecare_telemed_rooms', $room_id, $updates);
    }

    /**
     * Test Agora credentials and token generation without exposing secrets.
     *
     * @param string|null $test_app_id
     * @param string|null $test_cert
     * @return array
     */
    public static function test_connection($test_app_id = null, $test_cert = null)
    {
        $config = self::get_config();

        $clean_test_id = $test_app_id !== null ? trim((string) $test_app_id) : '';
        $app_id = !empty($clean_test_id) ? $clean_test_id : $config['app_id'];

        $clean_test_cert = $test_cert !== null ? trim((string) $test_cert) : '';
        $is_masked = strpos($clean_test_cert, '•') !== false || strpos($clean_test_cert, '*') !== false;
        $app_cert = (!empty($clean_test_cert) && !$is_masked) ? $clean_test_cert : $config['app_certificate'];

        $diagnostics = array(
            'configured'       => false,
            'app_id_valid'     => false,
            'cert_valid'       => false,
            'rtc_token_service'=> 'Failed',
            'signaling_service'=> 'Failed',
            'sdk_status'       => 'Installed',
            'message'          => '',
        );

        if (empty($app_id)) {
            $diagnostics['message'] = __('Agora App ID is missing.', 'e-care-management');
            return $diagnostics;
        }
        if (strlen($app_id) < 20 || strlen($app_id) > 64) {
            $diagnostics['message'] = __('Agora App ID format appears invalid (expected 32 alphanumeric characters).', 'e-care-management');
            return $diagnostics;
        }
        $diagnostics['app_id_valid'] = true;

        if (empty($app_cert)) {
            $diagnostics['message'] = __('Agora App Certificate is missing.', 'e-care-management');
            return $diagnostics;
        }
        if (strlen($app_cert) < 20 || strlen($app_cert) > 64) {
            $diagnostics['message'] = __('Agora App Certificate format appears invalid (expected 32 alphanumeric characters).', 'e-care-management');
            return $diagnostics;
        }
        $diagnostics['cert_valid'] = true;

        // Test RTC token generation
        try {
            $test_token = RtcTokenBuilder2::buildTokenWithUid(
                $app_id,
                $app_cert,
                'ecare_diagnostic_channel',
                99999,
                RtcTokenBuilder2::ROLE_PUBLISHER,
                600,
                600
            );

            if (!empty($test_token) && strpos($test_token, '007') === 0) {
                $diagnostics['rtc_token_service'] = 'Working';
            }
        } catch (Exception $e) {
            $diagnostics['rtc_token_service'] = 'Failed: ' . $e->getMessage();
        }

        // Test RTM token generation
        try {
            $test_rtm = RtmTokenBuilder2::buildToken($app_id, $app_cert, '99999', 600);
            if (!empty($test_rtm) && strpos($test_rtm, '007') === 0) {
                $diagnostics['signaling_service'] = 'Working';
            }
        } catch (Exception $e) {
            $diagnostics['signaling_service'] = 'Failed: ' . $e->getMessage();
        }

        $all_working = $diagnostics['app_id_valid'] && $diagnostics['cert_valid'] && $diagnostics['rtc_token_service'] === 'Working';
        $diagnostics['configured'] = $all_working;
        $diagnostics['message'] = $all_working
            ? __('Agora RTC & Signaling token engine verified successfully!', 'e-care-management')
            : __('Agora connection test failed. Please check your credentials.', 'e-care-management');

        return $diagnostics;
    }
}
