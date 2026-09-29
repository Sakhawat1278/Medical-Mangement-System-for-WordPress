<?php
/**
 * Fired when the plugin is deleted.
 *
 * @package E-CARE Management System
 */

// If uninstall not called from WordPress, then exit.
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Clear any remaining scheduled cron events
wp_clear_scheduled_hook('ecare_appointment_lifecycle_tick');
wp_clear_scheduled_hook('ecare_reminders_hourly');
