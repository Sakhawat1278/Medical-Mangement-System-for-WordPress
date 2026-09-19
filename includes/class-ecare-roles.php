<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * E-CARE Roles Manager
 * Registers and manages the 4 custom WordPress roles for the E-CARE system.
 *
 *  - ecare_admin                          → Full Dashboard Admin
 *  - ecare_doctor                         → Doctor portal
 *  - ecare_patient                        → Patient portal
 *  - ecare_receptionist                   → Staff / Receptionist portal
 */
class ECARE_Roles {

    /**
     * All E-CARE capabilities, keyed by role slug.
     */
    public static function get_role_caps() {
        return [
            'ecare_doctor' => [
                'read'                       => true,
                'ecare_access'               => true,
                'ecare_view_own_appointments' => true,
                'ecare_manage_prescriptions' => true,
                'ecare_view_patients'        => true,
                'ecare_write_records'        => true,
            ],
            'ecare_patient' => [
                'read'                        => true,
                'ecare_access'                => true,
                'ecare_book_appointments'     => true,
                'ecare_view_own_records'      => true,
                'ecare_view_own_billing'      => true,
            ],
            'ecare_receptionist' => [
                'read'                        => true,
                'ecare_access'                => true,
                'ecare_manage_appointments'   => true,
                'ecare_view_patients'         => true,
                'ecare_manage_billing'        => true,
                'ecare_register_patients'     => true,
                'ecare_manage_lab'            => true,
            ],
            'ecare_admin' => [
                'read'                        => true,
                'ecare_access'                => true,
                'ecare_manage_system'         => true,
                'ecare_view_patients'         => true,
                'ecare_manage_appointments'   => true,
                'ecare_manage_billing'        => true,
                'ecare_register_patients'     => true,
                'ecare_manage_doctors'        => true,
                'ecare_manage_staff'          => true,
                'ecare_view_reports'          => true,
                'ecare_manage_settings'       => true,
                'ecare_manage_specialities'   => true,
                'ecare_manage_services'       => true,
                'ecare_manage_lab'            => true,
                'ecare_view_own_appointments' => true,
                'ecare_manage_prescriptions'  => true,
                'ecare_write_records'         => true,
                'ecare_book_appointments'     => true,
                'ecare_view_own_records'      => true,
                'ecare_view_own_billing'      => true,
            ],
        ];
    }

    /**
     * Register all custom roles. Called on plugin activation.
     */
    public static function register_roles() {
        $roles = self::get_role_caps();

        add_role(
            'ecare_doctor',
            __('E-CARE Doctor', 'e-care-management'),
            $roles['ecare_doctor']
        );

        add_role(
            'ecare_patient',
            __('E-CARE Patient', 'e-care-management'),
            $roles['ecare_patient']
        );

        add_role(
            'ecare_receptionist',
            __('E-CARE Receptionist', 'e-care-management'),
            $roles['ecare_receptionist']
        );

        add_role(
            'ecare_staff',
            __('E-CARE Staff', 'e-care-management'),
            array_merge($roles['ecare_receptionist'], ['ecare_access' => true])
        );

        add_role(
            'ecare_admin',
            __('E-CARE Dashboard Admin', 'e-care-management'),
            $roles['ecare_admin']
        );

        // Also patch already-registered roles with correct caps (idempotent)
        self::sync_existing_role_caps();

        // Grant all ecare capabilities to the WP administrator role
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_caps = [
                'ecare_access'                => true,
                'ecare_manage_system'         => true,
                'ecare_view_patients'         => true,
                'ecare_manage_appointments'   => true,
                'ecare_manage_billing'        => true,
                'ecare_register_patients'     => true,
                'ecare_manage_doctors'        => true,
                'ecare_manage_staff'          => true,
                'ecare_view_reports'          => true,
                'ecare_manage_settings'       => true,
                'ecare_manage_specialities'   => true,
                'ecare_manage_services'       => true,
                'ecare_view_own_appointments' => true,
                'ecare_manage_prescriptions'  => true,
                'ecare_write_records'         => true,
                'ecare_book_appointments'     => true,
                'ecare_view_own_records'      => true,
                'ecare_view_own_billing'      => true,
            ];
            foreach ($admin_caps as $cap => $grant) {
                $admin_role->add_cap($cap, $grant);
            }
        }
    }

    /**
     * Ensure all registered ecare roles + existing users have the correct capabilities.
     * Safe to run on every admin_init — only adds missing caps, never removes.
     */
    public static function sync_existing_role_caps() {
        $role_cap_map = [
            'ecare_doctor'       => ['read' => true, 'ecare_access' => true,
                                     'ecare_view_own_appointments' => true,
                                     'ecare_manage_prescriptions'  => true,
                                     'ecare_view_patients'         => true,
                                     'ecare_write_records'         => true],
            'ecare_patient'      => ['read' => true, 'ecare_access' => true,
                                     'ecare_book_appointments'  => true,
                                     'ecare_view_own_records'   => true,
                                     'ecare_view_own_billing'   => true],
            'ecare_receptionist' => ['read' => true, 'ecare_access' => true,
                                     'ecare_manage_appointments' => true,
                                     'ecare_view_patients'       => true,
                                     'ecare_manage_billing'      => true,
                                     'ecare_register_patients'   => true],
            'ecare_staff'        => ['read' => true, 'ecare_access' => true,
                                     'ecare_manage_appointments' => true,
                                     'ecare_view_patients'       => true,
                                     'ecare_manage_billing'      => true,
                                     'ecare_register_patients'   => true],
        ];

        // 1. Patch the WP role objects stored in the DB (wp_options.wp_user_roles)
        foreach ($role_cap_map as $role_slug => $caps) {
            $role_obj = get_role($role_slug);
            if ($role_obj) {
                foreach ($caps as $cap => $grant) {
                    if (!isset($role_obj->capabilities[$cap]) || $role_obj->capabilities[$cap] !== $grant) {
                        $role_obj->add_cap($cap, $grant);
                    }
                }
            }
        }

    }

    /**
     * Remove all custom roles. Called on plugin deactivation/uninstall.
     */
    public static function remove_roles() {
        remove_role('ecare_doctor');
        remove_role('ecare_patient');
        remove_role('ecare_receptionist');
        remove_role('ecare_admin');

        // Remove capabilities from administrator
        $admin_role = get_role('administrator');
        if ($admin_role) {
            // Collect all caps from custom roles first
            $role_caps = array_merge( ...array_values( self::get_role_caps() ) );

            // Then merge in admin-only caps (two separate calls — PHP 7 compatible)
            $admin_only_caps = [
                'ecare_manage_system'       => true,
                'ecare_manage_doctors'      => true,
                'ecare_manage_staff'        => true,
                'ecare_view_reports'        => true,
                'ecare_manage_settings'     => true,
                'ecare_manage_specialities' => true,
                'ecare_manage_services'     => true,
            ];

            $all_caps = array_merge( $role_caps, $admin_only_caps );
            $caps     = array_keys( $all_caps );

            foreach ($caps as $cap) {
                $admin_role->remove_cap($cap);
            }
        }
    }

    /**
     * Resolve the E-CARE role slug for the current (or given) WP user.
     *
     * Returns one of: 'admin' | 'doctor' | 'patient' | 'receptionist' | 'none'
     */
    public static function get_ecare_role( $user = null ) {
        if ( ! $user ) {
            $user = wp_get_current_user();
        }

        if ( ! $user || ! $user->ID ) {
            return 'none';
        }

        $roles = (array) $user->roles;

        // Clinical roles prioritized first
        if ( in_array('ecare_doctor', $roles, true) ) {
            return 'doctor';
        }
        if ( in_array('ecare_patient', $roles, true) ) {
            return 'patient';
        }

        // Administrative and staff roles
        if ( in_array('ecare_admin', $roles, true) || in_array('administrator', $roles, true) ) {
            return 'admin';
        }
        if ( in_array('ecare_receptionist', $roles, true) ) {
            return 'receptionist';
        }
        if ( in_array('ecare_staff', $roles, true) ) {
            return 'staff';
        }

        return 'none';
    }

    /**
     * Check if the current user has access to the E-CARE system at all.
     */
    public static function current_user_can_access() {
        return current_user_can('ecare_access') || current_user_can('manage_options');
    }
}
