import React, { useEffect } from 'react'
import EcareToaster from './components/EcareToaster'
import useStore from './store/useStore'
import Cart from './pages/Cart'
import { motion } from 'framer-motion'

const CartStandalone = () => {
  const { initStore, setUser, user } = useStore()

  useEffect(() => {
    if (window.ecareConfig && window.ecareConfig.user) {
      const u = window.ecareConfig.user
      if (u && u.id) {
        setUser({
          id:        u.id,
          name:      u.name     || 'User',
          email:     u.email    || '',
          ecareRole: u.ecareRole || 'none',
          wpRoles:   u.wpRoles  || [],
          caps:      u.caps     || [],
          permissions: u.permissions || [],
          avatar:    u.avatar   || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
        })
      } else {
        setUser({
          id:        null,
          name:      'Guest User',
          email:     '',
          ecareRole: 'none',
          wpRoles:   [],
          caps:      [],
          permissions: [],
          avatar:    null,
        })
      }
    }
    initStore()
  }, [])

  if (user === null || user === undefined) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid #f3f4f6', borderTopColor: 'var(--ecare-primary)', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
         <p style={{ color: '#6b7280', fontWeight: 600 }}>Loading...</p>
      </div>
    )
  }

  return (
    <>
       <EcareToaster position="top-right" />
       <Cart />
    </>
  )
}

export default CartStandalone
