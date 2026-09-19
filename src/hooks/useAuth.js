import useStore from '../store/useStore'

/**
 * useAuth — Role-based access control hook for the E-CARE portal.
 *
 * E-CARE Roles:
 *   'admin'        → WP Administrator — full access
 *   'doctor'       → Doctor portal
 *   'receptionist' → Staff / Receptionist portal
 *   'patient'      → Patient portal
 *   'none'         → Unauthenticated / no role assigned
 *
 * Usage:
 *   const { role, isAdmin, can } = useAuth()
 *   if (can('ecare_manage_appointments')) { ... }
 */
const useAuth = () => {
  const storeUser = useStore((state) => state.user)
  const user = (storeUser && storeUser.id && window.ecareConfig?.user && String(storeUser.id) === String(window.ecareConfig.user.id))
    ? storeUser
    : (window.ecareConfig?.user || storeUser)

  const role = user?.ecareRole || 'none'
  const caps = Array.isArray(user?.caps) ? user.caps : []

  return {
    user,
    role,

    // Convenience boolean flags
    isAdmin:        role === 'admin',
    isDoctor:       role === 'doctor',
    isReceptionist: role === 'receptionist',
    isPatient:      role === 'patient',
    isAuthenticated: role !== 'none',

    /**
     * Check if the user has a specific ecare capability.
     * Admins implicitly pass all checks.
     * @param {string} cap - e.g. 'ecare_manage_appointments'
     */
    can: (cap) => {
      if (role === 'admin') return true
      return caps.includes(cap)
    },

    /**
     * Check if the user has a specific granular ability (from the Permissions Matrix).
     * Admins implicitly pass all checks.
     * @param {string} ability - e.g. 'billing', 'ambulance'
     */
    canAccess: (ability) => {
      if (role === 'admin') return true
      
      // Handle stringified permissions from DB
      let permissions = user?.permissions || []
      if (typeof permissions === 'string' && permissions.trim() !== '') {
        try {
          permissions = JSON.parse(permissions)
        } catch (e) {
          permissions = []
        }
      }
      if (!Array.isArray(permissions)) permissions = []
      
      // Default permissions for Doctors & Patients if not explicitly set
      if (role === 'doctor' && ['patients', 'appointments'].includes(ability)) return true
      if (role === 'patient' && ['appointments', 'care_providers', 'ambulance', 'lab', 'billing', 'bloodbank'].includes(ability)) return true

      // Backward compatibility / convenience check
      // If checking 'doctors', allow if they have 'doctors_view' or any doctor related perm
      const topLevelModules = ['doctors', 'ambulance', 'patients', 'appointments', 'billing', 'staff', 'settings', 'bloodbank'];
      if (topLevelModules.includes(ability)) {
          const prefix = ability + '_';
          if (permissions.includes(ability)) return true; // Legacy support
          return permissions.some(p => p.startsWith(prefix));
      }
      
      // Special case for care_providers
      if (ability === 'care_providers') {
          if (permissions.includes('care_providers')) return true;
          return permissions.some(p => p.startsWith('care_'));
      }

      return permissions.includes(ability)
    },

    /**
     * Check if the user's role is one of the provided roles.
     * @param {...string} roles
     */
    hasRole: (...roles) => roles.includes(role),

    /**
     * Return a value based on current role.
     * @param {object} map - { admin, doctor, receptionist, patient, default }
     */
    roleSwitch: (map) => {
      return map[role] ?? map['default'] ?? null
    },
  }
}

export default useAuth
