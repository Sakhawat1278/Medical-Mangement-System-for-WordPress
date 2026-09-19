import React from 'react'
import { Toaster, resolveValue, toast } from 'react-hot-toast'
import { CheckCircle2, AlertCircle, Loader2, Info, X } from 'lucide-react'

/**
 * EcareToaster
 * Unified, beautifully styled toast notification component for E-CARE.
 * Designed to work seamlessly in both main DOM and Shadow DOM environments.
 */
export const EcareToaster = ({ position = 'top-right', ...props }) => {
  return (
    <Toaster
      position={position}
      containerStyle={{
        zIndex: 99999999,
        top: 24,
        right: 24,
        bottom: 24,
        left: 24,
        pointerEvents: 'none',
      }}
      toastOptions={{
        duration: 4000,
      }}
      {...props}
    >
      {(t) => {
        const isSuccess = t.type === 'success'
        const isError = t.type === 'error'
        const isLoading = t.type === 'loading'

        let accentColor = '#3b82f6'
        let badgeBg = '#eff6ff'
        let badgeColor = '#2563eb'
        let bgGradient = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        let IconComponent = Info

        if (isSuccess) {
          accentColor = 'var(--ecare-primary, #10b981)'
          badgeBg = '#ecfdf5'
          badgeColor = '#059669'
          bgGradient = 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
          IconComponent = CheckCircle2
        } else if (isError) {
          accentColor = '#ef4444'
          badgeBg = '#fee2e2'
          badgeColor = '#dc2626'
          bgGradient = 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)'
          IconComponent = AlertCircle
        } else if (isLoading) {
          accentColor = 'var(--ecare-primary, #1b3b2b)'
          badgeBg = 'rgba(27, 59, 43, 0.1)'
          badgeColor = 'var(--ecare-primary, #1b3b2b)'
          bgGradient = '#ffffff'
          IconComponent = Loader2
        }

        return (
          <div
            className={`ecare-toast-card ecare-toast-${t.type} ${
              t.visible ? 'ecare-toast-enter' : 'ecare-toast-leave'
            }`}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: bgGradient,
              color: '#0f172a',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              borderLeft: `5px solid ${accentColor}`,
              boxShadow:
                '0 12px 30px -4px rgba(0, 0, 0, 0.14), 0 6px 14px -3px rgba(0, 0, 0, 0.08)',
              minWidth: '280px',
              maxWidth: '440px',
              fontSize: '0.85rem',
              fontWeight: 600,
              lineHeight: 1.45,
              fontFamily: 'inherit',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: t.visible ? 1 : 0,
              transform: t.visible
                ? 'translateY(0) scale(1)'
                : 'translateY(-10px) scale(0.95)',
              ...t.style,
            }}
          >
            {/* Icon Badge */}
            <div
              className="ecare-toast-badge"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: badgeBg,
                color: badgeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {t.icon ? (
                typeof t.icon === 'string' ? (
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{t.icon}</span>
                ) : (
                  t.icon
                )
              ) : (
                <IconComponent
                  size={18}
                  strokeWidth={2.4}
                  style={
                    isLoading ? { animation: 'ecare-spin 1s linear infinite' } : {}
                  }
                />
              )}
            </div>

            {/* Message Body */}
            <div
              className="ecare-toast-message"
              style={{
                flex: 1,
                wordBreak: 'break-word',
                color: '#1e293b',
                fontWeight: 600,
              }}
            >
              {resolveValue(t.message, t)}
            </div>

            {/* Close Button */}
            {t.type !== 'loading' && (
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Dismiss notification"
                className="ecare-toast-close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#334155'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )
      }}
    </Toaster>
  )
}

export default EcareToaster
