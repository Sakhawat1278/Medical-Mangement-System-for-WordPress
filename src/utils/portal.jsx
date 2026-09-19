import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export const getShadowContainer = () => {
  if (typeof document === 'undefined') return null;
  const commonIds = [
    'ecare-admin-root',
    'ecare-cart-root',
    'ecare-registration-root',
    'ecare-lab-booking-root',
    'ecare-instant-booking-root',
    'ecare-doctors-root',
    'ecare-care-provider-booking-root',
    'ecare-ambulance-booking-root',
    'ecare-blood-bank-root',
    'ecare-auth-root'
  ];
  for (const id of commonIds) {
    const host = document.getElementById(id);
    if (host?.shadowRoot) {
      const inner = host.shadowRoot.getElementById('ecare-shadow-inner');
      if (inner) return inner;
    }
  }
  const root = document.querySelector('[id^="ecare-"]');
  if (root?.shadowRoot) {
    const inner = root.shadowRoot.getElementById('ecare-shadow-inner');
    if (inner) return inner;
  }
  return null;
};

export function usePortalTarget() {
  const [target, setTarget] = useState(() => getShadowContainer());

  useEffect(() => {
    if (!target) {
      setTarget(getShadowContainer());
    }
  }, [target]);

  return target;
}

export function Portal({ children }) {
  const target = usePortalTarget();
  if (!target) {
    return null;
  }
  return createPortal(children, target);
}
