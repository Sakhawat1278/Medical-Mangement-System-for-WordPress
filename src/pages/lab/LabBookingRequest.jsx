import React, { useState, useEffect, useMemo } from 'react'
import { 
  Flask, Check, Plus, ArrowRight
} from 'phosphor-react'
import useStore from '../../store/useStore'
import CustomSelect from '../../components/CustomSelect'

/* ─── Responsive hook ────────────────────────────────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

const LabBookingRequest = () => {
  const {
    cart = [],
    addToCart,
    removeFromCart,
    labTests,
    labLocations,
    setActivePage
  } = useStore()

  const vw = useWindowWidth()
  const isMobile  = vw < 640
  const isTablet  = vw >= 640 && vw < 1024

  /* Location states */
  const [selDiv, setSelDiv] = useState('')
  const [selDist, setSelDist] = useState('')
  const [selArea, setSelArea] = useState('')
  const [selProvider, setSelProvider] = useState('')

  const activeTests = useMemo(() => (labTests || []).filter(t => t.status === 'Active'), [labTests])

  // Filtered tests based on selected provider
  const filteredTests = useMemo(() => {
    return activeTests.filter(t => !selProvider || String(t.location_id) === String(selProvider))
  }, [activeTests, selProvider])

  // Resolve locations lists hierarchically
  const divisions = useMemo(() => (labLocations || []).filter(l => l.type === 'division'), [labLocations])
  const districts = useMemo(() => (labLocations || []).filter(l => String(l.parent_id) === String(selDiv) && l.type === 'district'), [labLocations, selDiv])
  const areas = useMemo(() => (labLocations || []).filter(l => String(l.parent_id) === String(selDist) && l.type === 'area'), [labLocations, selDist])
  const providers = useMemo(() => (labLocations || []).filter(l => String(l.parent_id) === String(selArea) && l.type === 'provider'), [labLocations, selArea])

  // Count active tests selected in cart
  const selectedLabTestsInCart = useMemo(() => {
    return cart.filter(c => c.type === 'lab_test')
  }, [cart])

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: isMobile ? '0 1rem 1rem 1rem' : '0 0 1.25rem 0', fontFamily: 'inherit' }}>
      
      {/* 1. Selector Section: Itinerary Selection Flow */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--ecare-primary, #1b3b2b)',
          marginBottom: '1.25rem',
          fontFamily: 'inherit'
        }}>
          Select Location
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.625rem' : '1rem',
          alignItems: 'center'
        }}>
          {/* Division Selector */}
          <div>
            <CustomSelect
              value={selDiv}
              onChange={v => {
                setSelDiv(v)
                setSelDist('')
                setSelArea('')
                setSelProvider('')
              }}
              options={divisions.map(l => ({ value: l.id, label: l.name }))}
              placeholder="Select Division"
              customTriggerStyle={{ borderRadius: '8px', height: '44px', border: '1.5px solid #e2e8f0' }}
            />
          </div>

          {/* District Selector */}
          <div>
            <CustomSelect
              value={selDist}
              onChange={v => {
                setSelDist(v)
                setSelArea('')
                setSelProvider('')
              }}
              options={districts.map(l => ({ value: l.id, label: l.name }))}
              placeholder="Select District"
              disabled={!selDiv}
              customTriggerStyle={{ borderRadius: '8px', height: '44px', border: '1.5px solid #e2e8f0' }}
            />
          </div>

          {/* Area Selector */}
          <div>
            <CustomSelect
              value={selArea}
              onChange={v => {
                setSelArea(v)
                setSelProvider('')
              }}
              options={areas.map(l => ({ value: l.id, label: l.name }))}
              placeholder="Select Area"
              disabled={!selDist}
              customTriggerStyle={{ borderRadius: '8px', height: '44px', border: '1.5px solid #e2e8f0' }}
            />
          </div>

          {/* Provider Selector */}
          <div>
            <CustomSelect
              value={selProvider}
              onChange={v => {
                setSelProvider(v)
              }}
              options={providers.map(l => ({ value: l.id, label: l.name }))}
              placeholder="Select Lab Test Provider"
              disabled={!selArea}
              customTriggerStyle={{ borderRadius: '8px', height: '44px', border: '1.5px solid #e2e8f0' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Content Area */}
      {!selProvider ? (
        /* Empty State Placeholder (Matches Mockup 1) */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1rem',
          textAlign: 'center'
        }}>
          {/* Building/Ambulance/Pin Illustration */}
          <div style={{ marginBottom: '1.5rem', width: '220px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg viewBox="0 0 240 120" width="100%" height="100%">
              {/* Ground line */}
              <line x1="10" y1="110" x2="230" y2="110" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
              
              {/* Hospital/Lab Building */}
              <rect x="70" y="30" width="80" height="80" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" />
              <rect x="90" y="10" width="40" height="20" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2.5" />
              
              {/* Windows */}
              <rect x="82" y="40" width="16" height="12" rx="1.5" fill="#bae6fd" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="110" y="40" width="16" height="12" rx="1.5" fill="#bae6fd" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="82" y="60" width="16" height="12" rx="1.5" fill="#bae6fd" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="110" y="60" width="16" height="12" rx="1.5" fill="#bae6fd" stroke="#94a3b8" strokeWidth="1.5" />
              
              {/* Door */}
              <rect x="100" y="85" width="20" height="25" fill="#475569" rx="1" />
              
              {/* Red Cross */}
              <rect x="105" y="15" width="10" height="3" fill="#ef4444" />
              <rect x="108.5" y="11.5" width="3" height="10" fill="#ef4444" />
              
              {/* Ambulance */}
              <rect x="155" y="75" width="55" height="35" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
              <path d="M195 75 L210 90 L210 110 L195 110 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2.5" />
              {/* Wheels */}
              <circle cx="170" cy="108" r="8" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="198" cy="108" r="8" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
              {/* Red Cross on Ambulance */}
              <rect x="173" y="90" width="8" height="2.5" fill="#ef4444" />
              <rect x="175.7" y="87.2" width="2.6" height="8" fill="#ef4444" />
              {/* Siren */}
              <polygon points="175,70 180,70 178,75" fill="#3b82f6" />
              
              {/* Location Pin */}
              <g transform="translate(42, 45)">
                <path d="M12,2 C6.48,2 2,6.48 2,12 C2,18.5 12,30 12,30 C12,30 22,18.5 22,12 C22,6.48 17.52,2 12,2 Z" fill="#ef4444" />
                <circle cx="12" cy="12" r="5" fill="#ffffff" />
              </g>
            </svg>
          </div>
          
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#8b1d40',
            margin: 0,
            lineHeight: 1.4
          }}>
            Select a location and provider to view available tests.
          </h4>
        </div>
      ) : (
        /* Lab Tests Grid (Matches Mockup 2) */
        <div>
          {filteredTests.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {filteredTests.map(test => {
                const inCart = cart.some(c => String(c.test_id) === String(test.id))
                
                const handleCartClick = () => {
                  if (inCart) {
                    const cartItem = cart.find(c => String(c.test_id) === String(test.id))
                    if (cartItem) removeFromCart(cartItem.id)
                  } else {
                    addToCart({
                      id: `lab_test_${test.id}`,
                      type: 'lab_test',
                      name: test.name,
                      price: test.price,
                      test_id: test.id,
                      code: test.code,
                      category: test.category
                    })
                  }
                }

                return (
                  <div
                    key={test.id}
                    style={{
                      background: 'white',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.01)',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '12px' }}>
                      <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--ecare-text-main, #1e293b)',
                        margin: 0,
                        textTransform: 'uppercase',
                        lineHeight: 1.35
                      }}>
                        {test.name}
                      </h4>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--ecare-text-muted, #64748b)',
                        fontWeight: 500
                      }}>
                        Starting from: <span style={{ color: 'var(--ecare-primary)', fontWeight: 600 }}>৳{Number(test.price).toFixed(2)}</span>
                      </span>
                    </div>

                    <button
                      onClick={handleCartClick}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: inCart ? '#10b981' : 'var(--ecare-primary, #1b3b2b)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: inCart ? 'none' : '0 2px 6px var(--ecare-primary-shadow)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      title={inCart ? 'Remove from Cart' : 'Add to Cart'}
                    >
                      {inCart ? <Check size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <Flask size={40} style={{ color: '#bae6fd', marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No diagnostic tests found for this provider.</p>
            </div>
          )}
        </div>
      )}

      {/* Floating/Sticky Cart Action Footer */}
      {selectedLabTestsInCart.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: '20px',
          left: '0',
          right: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 999,
          marginTop: '2.5rem',
          backdropFilter: 'blur(8px)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--ecare-primary-bg)',
              color: 'var(--ecare-primary)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              {selectedLabTestsInCart.length}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--ecare-text-main, #1e293b)' }}>
                {selectedLabTestsInCart.length === 1 ? '1 Lab Test Selected' : `${selectedLabTestsInCart.length} Lab Tests Selected`}
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ecare-text-muted, #64748b)' }}>
                Ready to choose schedule dates and complete booking.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.ecareConfig?.portalUrl && window.location.href.includes('wp-admin')) {
                setActivePage('cart')
              } else {
                window.location.href = window.ecareConfig?.siteUrl ? `${window.ecareConfig.siteUrl}/ecare-cart` : '/ecare-cart'
              }
            }}
            style={{
              background: 'var(--ecare-primary, #1b3b2b)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s',
              boxShadow: '0 4px 12px var(--ecare-primary-shadow)'
            }}
          >
            View Cart & Checkout <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}

    </div>
  )
}

export default LabBookingRequest
