import React, { useEffect } from 'react'
import EcareToaster from './components/EcareToaster'
import useStore from './store/useStore'
import WardCabinBookingPage from './pages/ipd/WardCabinBookingPage'
import { motion } from 'framer-motion'

const WardCabinBookingStandalone = () => {
  const { initStore, setUser, user } = useStore()

  useEffect(() => {
    if (window.ecareConfig && window.ecareConfig.user) {
      const u = window.ecareConfig.user
      setUser({
        id:          u.id         || null,
        name:        u.name       || 'User',
        email:       u.email      || '',
        phone:       u.phone      || '',
        ecareRole:   u.ecareRole  || 'none',
        wpRoles:     u.wpRoles    || [],
        caps:        u.caps       || [],
        permissions: u.permissions || [],
        avatar:      u.avatar     || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
      })
    }
    initStore()
  }, [])

  if (user === undefined) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} 
          style={{ width: '40px', height: '40px', border: '3px solid #f3f4f6', borderTopColor: 'var(--ecare-primary, #0284c7)', borderRadius: '50%', margin: '0 auto 1rem auto' }} 
        />
        <p style={{ color: '#6b7280', fontWeight: 600 }}>Loading Ward Floor Plan...</p>
      </div>
    )
  }

  return (
    <>
      <EcareToaster position="top-right" />
      <WardCabinBookingPage />
    </>
  )
}

export default WardCabinBookingStandalone
