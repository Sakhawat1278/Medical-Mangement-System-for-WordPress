import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Trash, ArrowRight, CheckCircle, Clock, Spinner, 
  Info, Tag, Calendar, User, Phone, ClipboardText, X, Plus,
  CreditCard, DeviceMobile, Bank, Money, Wallet, ShieldCheck,
  Heartbeat, Shield, MapPin, Package, House
} from 'phosphor-react'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import useAuth from '../hooks/useAuth'
import api from '../utils/api'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomTimePicker from '../components/CustomTimePicker'
import CustomSelect from '../components/CustomSelect'
import AuthApp from '../AuthApp'
import { formatPaymentMethod } from '../utils/formatters'

// Shared theme constraints matching the rest of the application
const C = {
  dark:   '#1a1a2e',
  border: '#e5e7eb',
  muted:  '#6b7280',
  faint:  '#9ca3af',
  bg:     '#f9fafb',
  cta:    '#1a3333',
  blue:   '#4f6ef7',
  green:  '#16a34a',
  red:    '#e11d48',
}

const inputSt = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.8rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  background: '#ffffff'
}

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

export default function Cart() {
  const vw = useWindowWidth()
  const isMobile  = vw < 640
  const isTablet  = vw >= 640 && vw < 1024
  const isDesktop = vw >= 1024

  const { 
    cart = [], removeFromCart, clearCart, 
    addLabOrder, addAppointment, addCareProviderBooking, addTransaction, validatePromoCode, 
    paymentGateways = {}, currencySymbol = '৳', setActivePage,
    providerTypes = [], servicePricing = [], careProviders = [], doctorAvailability = [], specialities = [], doctorList = [],
    appointments = [], woocommerceEnabled, partialPayment
  } = useStore()

  const { user: currentUser } = useAuth()
  const termsLink = window.ecareConfig?.settings?.termsUrl || window.ecareConfig?.termsUrl || '#'
  const privacyLink = window.ecareConfig?.settings?.privacyUrl || window.ecareConfig?.privacyUrl || '#'

  // Dynamic specialties strictly for online instant call doctors
  const instantActiveDoctors = useMemo(() => {
    return (doctorList || []).filter(doc => {
      const isInstant = doc.instantCallStatus === 'Active' || doc.instant_call_status === 'Active' || doc.instantCall === true
      const isDocActive = doc.status !== 'Inactive' && doc.status !== 'Pending'
      return isInstant && isDocActive
    })
  }, [doctorList])

  const instantSpecialtyOptions = useMemo(() => {
    if (!instantActiveDoctors || instantActiveDoctors.length === 0) return []
    const rawSpecsSet = new Set()
    let hasGeneral = false

    const extractDoctorSpecialties = (doctor) => {
      if (!doctor) return []
      const raw = doctor.specialization || doctor.specialty || doctor.speciality || doctor.specialities || []
      if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean)
      if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean)
          } catch (e) {}
        }
        return trimmed.split(/,\s*/).map(s => s.trim()).filter(Boolean)
      }
      return []
    }

    instantActiveDoctors.forEach(doc => {
      const docSpecs = extractDoctorSpecialties(doc)
      if (docSpecs.length === 0) {
        hasGeneral = true
      } else {
        docSpecs.forEach(spec => {
          const lower = spec.toLowerCase()
          if (lower === 'general' || lower === 'general physician' || lower === 'general practice' || lower === 'general medicine') {
            hasGeneral = true
          } else {
            rawSpecsSet.add(spec)
          }
        })
      }
    })

    const list = []
    if (hasGeneral) {
      list.push({ value: 'General', label: 'General Physician' })
    }

    Array.from(rawSpecsSet).forEach(specName => {
      const matched = (specialities || []).find(s => s.name?.toLowerCase() === specName.toLowerCase())
      const displayName = matched ? matched.name : specName
      if (!list.some(item => item.value.toLowerCase() === displayName.toLowerCase())) {
        list.push({ value: displayName, label: displayName })
      }
    })

    return list
  }, [instantActiveDoctors, specialities])

  // Form checkout state
  const [step, setStep] = useState(1)
  const [contactNumber, setContactNumber] = useState('')
  const [agreed, setAgreed] = useState(false)

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentNumber, setPaymentNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [paymentType, setPaymentType] = useState('full') // 'full' or 'partial'

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [validatingPromo, setValidatingPromo] = useState(false)

  // Restore promo code that was already applied on a previous booking step (e.g. InstantBooking)
  useEffect(() => {
    if (appliedPromo) return // don't overwrite if user already entered one here
    const itemWithPromo = (cart || []).find(item => item.appliedPromo)
    if (itemWithPromo) {
      setAppliedPromo(itemWithPromo.appliedPromo)
      setPromoCodeInput(itemWithPromo.promo_code || '')
    }
  }, [cart]) // eslint-disable-line react-hooks/exhaustive-deps

  // System states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [createdInvoiceNo, setCreatedInvoiceNo] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Dynamic form state per item in the cart
  const [itemForms, setItemForms] = useState({})

  // Initialize form state for each cart item
  useEffect(() => {
    const nextForms = { ...itemForms }
    let changed = false

    cart.forEach(item => {
      if (!nextForms[item.id]) {
        changed = true
        if (item.type === 'lab_test') {
          nextForms[item.id] = { scheduledDate: item.scheduledDate || '', clinicalNotes: item.clinicalNotes || '' }
        } else if (item.type === 'doctor_appointment') {
          nextForms[item.id] = {
            bookingDate: item.bookingDate || '',
            bookingTime: item.bookingTime || '',
            bookingMode: item.bookingMode || 'Video Consult',
            bookingReason: item.bookingReason || '',
            attachedFiles: item.attachedFiles || [],
            contactNumber: item.contactNumber || ''
          }
        } else if (item.type === 'instant_doctor_call') {
          nextForms[item.id] = { 
            reason: item.reason || '', 
            specialty: item.specialty || 'General',
            attachedFiles: item.attachedFiles || []
          }
        } else if (item.type === 'care_provider') {
          nextForms[item.id] = {
            providerType: item.providerType || '',
            packageId: item.packageId || '',
            providerName: item.providerName || '',
            bookingDate: item.bookingDate || '',
            bookingTime: item.bookingTime || '09:00 AM',
            location: item.location || '',
            notes: item.notes || ''
          }
        }
      }
    })

    if (changed) {
      setItemForms(nextForms)
    }
  }, [cart])

  // Helper to update dynamic fields for a cart item
  const updateItemForm = (itemId, field, value) => {
    setItemForms(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }))
  }

  // Autofill user's contact if logged in or carried from cart items
  useEffect(() => {
    if (currentUser?.email && !contactNumber) {
      const { patients = [] } = useStore.getState()
      const patient = patients.find(p => String(p.user_id) === String(currentUser.id))
      if (patient?.phone) {
        setContactNumber(patient.phone)
        return
      }
    }
    if (!contactNumber && cart.length > 0) {
      const itemWithPhone = cart.find(item => item.contactNumber || item.phone)
      if (itemWithPhone) {
        setContactNumber(itemWithPhone.contactNumber || itemWithPhone.phone || '')
      }
    }
  }, [currentUser, contactNumber, cart])

  const fillHiddenBillingFields = () => {
    const setVal = (id, val) => {
      const el = document.getElementById(id)
      if (el) {
        el.value = val
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
    setVal('billing_first_name', currentUser?.name || 'Patient')
    setVal('billing_last_name', ' ')
    setVal('billing_phone', contactNumber)
    setVal('billing_email', currentUser?.email || 'patient@e-care.com')
    setVal('billing_address_1', 'E-CARE Clinical Patient')
    setVal('billing_city', 'Dhaka')
    setVal('billing_postcode', '1212')
    setVal('billing_country', 'BD')
  }

  const handleNativeCheckoutSubmit = () => {
    setIsSubmitting(true)
    fillHiddenBillingFields()

    const placeOrderBtn = document.getElementById('place_order')
    if (placeOrderBtn) {
      placeOrderBtn.click()
    } else {
      toast.error('WooCommerce place order action not found. Please reload.')
      setIsSubmitting(false)
    }
  }

  // Helper to compute care provider dynamic price based on selected package
  const getItemPrice = (item) => {
    if (item.type === 'care_provider') {
      const form = itemForms[item.id] || {}
      if (form.packageId) {
        const pkg = servicePricing.find(p => String(p.id) === String(form.packageId))
        return pkg ? Number(pkg.price || 0) : 0
      }
      return 0
    }
    return Number(item.price || 0)
  }

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + getItemPrice(item), 0)
  }, [cart, itemForms, servicePricing])

  // Discount calculation based on promo
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0
    if (appliedPromo.discount_type === 'percentage') {
      return (subtotal * parseFloat(appliedPromo.discount_amount)) / 100
    }
    return parseFloat(appliedPromo.discount_amount)
  }, [appliedPromo, subtotal])

  const totalPayable = Math.max(0, subtotal - discountAmount)

  const hasInstantCall = cart.some(item => item.type === 'instant_doctor_call')
  const isPartialEligible = partialPayment?.enabled && !hasInstantCall
  const minDepositPercent = partialPayment?.minDepositPercent || 30
  const depositAmount = isPartialEligible ? Math.round(totalPayable * (minDepositPercent / 100)) : totalPayable

  // Reset payment type to 'full' if partial payments are not eligible (e.g. disabled by admin)
  useEffect(() => {
    if (!isPartialEligible) {
      setPaymentType('full')
    }
  }, [isPartialEligible])

  // Helper for payment branding
  const gatewayBrands = {
    stripe:       { color: '#6366f1', name: 'Stripe / Card',    icon: CreditCard   },
    paypal:       { color: '#0070ba', name: 'PayPal',           icon: Wallet       },
    bkash:        { color: '#e2136e', name: 'bKash',            icon: DeviceMobile },
    rocket:       { color: '#8c3494', name: 'Rocket',           icon: DeviceMobile },
    nagad:        { color: '#f6921e', name: 'Nagad',            icon: DeviceMobile },
    upay:         { color: '#6c3ad5', name: 'Upay',             icon: DeviceMobile },
    sslcommerz:   { color: '#00509d', name: 'SSLCommerz',       icon: ShieldCheck  },
    cash:         { color: '#10b981', name: 'Cash',             icon: Money        },
    cod:          { color: '#10b981', name: 'Cash on Delivery', icon: Money        },
    bankTransfer: { color: '#475569', name: 'Bank Transfer',     icon: Bank         },
    bacs:         { color: '#475569', name: 'Bank Transfer',     icon: Bank         },
  }

  const getBrand = (key) => {
    const cleanName = formatPaymentMethod(key)
    const normalizedKey = key.toLowerCase().replace(/^(woocommerce|woo|wc)\s*[-_:]?\s*/i, '')
    const localBrand = gatewayBrands[normalizedKey] || gatewayBrands[key] || (key === 'cod' ? gatewayBrands['cash'] : null) || (key === 'bacs' ? gatewayBrands['bankTransfer'] : null)

    if (woocommerceEnabled) {
      const wcGateways = window.ecareConfig?.wcGateways || {}
      const wcGateway = wcGateways[key]
      if (wcGateway) {
        return {
          color: localBrand?.color || C.blue,
          name: formatPaymentMethod(wcGateway.title) || localBrand?.name || cleanName,
          icon: localBrand?.icon || CreditCard,
          iconHtml: wcGateway.icon || null
        }
      }
    }
    return localBrand || { color: C.blue, name: cleanName, icon: CreditCard }
  }

  const enabledGateways = useMemo(() => {
    const wcGateways = window.ecareConfig?.wcGateways || {}
    return Object.entries(wcGateways).map(([id, g]) => [
      id,
      { enabled: true, name: formatPaymentMethod(g.title || id), description: g.description, iconHtml: g.icon, isWooCommerce: true }
    ])
  }, [])

  const selectedGateway = (window.ecareConfig?.wcGateways || {})[paymentMethod]
  const isManualGateway = paymentMethod && ['woo_bkash', 'woo_rocket', 'woo_nagad', 'woo_upay'].includes(paymentMethod)

  // Apply promo handler
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return
    setValidatingPromo(true)
    const promo = await validatePromoCode(promoCodeInput.toUpperCase())
    if (promo) {
      setAppliedPromo(promo)
    } else {
      setAppliedPromo(null)
    }
    setValidatingPromo(false)
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCodeInput('')
    toast.success('Promo code removed')
  }

  const formatTimeSlot = (time) => {
    if (!time) return ''
    const [h, min] = time.split(':').map(Number)
    if (isNaN(h)) return time
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hours = h % 12 || 12
    return `${hours}:${String(min || 0).padStart(2, '0')} ${ampm}`
  }

  // Doctor date availability helper
  const isDoctorDateAvailable = (doctor, dateStr) => {
    if (!doctor || !dateStr) return false
    
    // Past check
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (dateStr < todayStr) return false

    const [y, m, d] = dateStr.split('-').map(Number)
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false
    const dateObj = new Date(y, m - 1, d)
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

    const docId = String(doctor.user_id || doctor.id || '')
    const docScheds = (doctorAvailability || []).filter(
      a => (String(a.doctor_id) === docId || 
            (doctor.id && String(a.doctor_id) === String(doctor.id)) || 
            (doctor.user_id && String(a.doctor_id) === String(doctor.user_id)))
    )

    if (docScheds.length > 0) {
      const daySched = docScheds.find(
        s => String(s.day || '').toLowerCase() === dayName.toLowerCase() && s.status === 'Active'
      )
      if (!daySched) return false

      let slots = []
      try {
        slots = typeof daySched.slots === 'string' ? JSON.parse(daySched.slots) : (daySched.slots || [])
      } catch (e) {
        slots = []
      }
      if (!Array.isArray(slots) || slots.length === 0) return false
      const activeSlots = slots.filter(s => typeof s === 'string' || s.status !== 'Inactive')
      return activeSlots.length > 0
    }

    if (doctor.status === 'Offline' || doctor.status === 'Inactive') return false
    return true
  }

  // Timing slot helper for specific doctor
  const getDoctorSlotsForDate = (doctor, date) => {
    if (!doctor || !date) return []
    const [y, m, d] = String(date).split('-').map(Number)
    const dateObj = !isNaN(y) && !isNaN(m) && !isNaN(d) ? new Date(y, m - 1, d) : new Date(date)
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    const docId = String(doctor.user_id || doctor.id || '')
    const avail = doctorAvailability?.find(
      a => (String(a.doctor_id) === docId || String(a.doctor_id) === String(doctor.id) || String(a.doctor_id) === String(doctor.user_id)) &&
           String(a.day || '').toLowerCase() === dayName.toLowerCase() &&
           a.status !== 'Inactive'
    )
    let rawSlots = []
    if (avail && avail.slots) {
      try {
        const slots = typeof avail.slots === 'string' ? JSON.parse(avail.slots) : avail.slots
        if (Array.isArray(slots)) {
          rawSlots = slots
            .filter(s => s && (typeof s === 'string' || (s.status !== 'Inactive' && s.available !== false)))
            .map(s => {
              if (typeof s === 'string') return s
              if (s && s.start && s.end) {
                return `${formatTimeSlot(s.start)} - ${formatTimeSlot(s.end)}`
              }
              if (s && (s.time || s.label)) return String(s.time || s.label)
              return null
            })
            .filter(Boolean)
        }
      } catch (e) {
        rawSlots = []
      }
    } else {
      rawSlots = ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM']
    }

    const yyyy = dateObj.getFullYear()
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    return rawSlots.map(slot => {
      let isBooked = false
      let isOwnBooking = false

      const cleanSlot = slot ? slot.trim().replace(/\s+/g, ' ') : ''
      const slotStart = cleanSlot.split('-')[0]?.trim().toLowerCase()

      const matchingAppt = (appointments || []).find(appt => {
        const docMatch = (doctor.id && parseInt(appt.doctor_id) === parseInt(doctor.id)) ||
                         (doctor.user_id && parseInt(appt.doctor_id) === parseInt(doctor.user_id)) ||
                         (doctor.user_id && parseInt(appt.doctor_user_id || appt.doctorUserId) === parseInt(doctor.user_id)) ||
                         (doctor.name && appt.doctorName && appt.doctorName.trim().toLowerCase() === doctor.name.trim().toLowerCase())
        if (!docMatch) return false
        if (appt.date !== dateStr) return false
        const st = String(appt.status || '').toLowerCase()
        if (['cancelled', 'rejected', 'refunded', 'closed', 'expired'].includes(st)) return false
        
        const cleanApptTime = appt.time ? appt.time.trim().replace(/\s+/g, ' ') : ''
        if (cleanApptTime.toLowerCase() === cleanSlot.toLowerCase()) return true
        const apptStart = cleanApptTime.split('-')[0]?.trim().toLowerCase()
        return apptStart && slotStart && apptStart === slotStart
      })

      if (matchingAppt) {
        isBooked = true
        if (currentUser && (currentUser.id || currentUser.email)) {
          const curId = currentUser.id ? parseInt(currentUser.id) : null
          const curEmail = currentUser.email ? String(currentUser.email).toLowerCase().trim() : null
          const curName = currentUser.name ? String(currentUser.name).toLowerCase().trim() : null

          const apptPatientId = parseInt(matchingAppt.patient_id || matchingAppt.patient_user_id || matchingAppt.patientUserId || matchingAppt.user_id || 0)
          const apptEmail = String(matchingAppt.patient_email || matchingAppt.patientEmail || matchingAppt.email || '').toLowerCase().trim()
          const apptName = String(matchingAppt.patient_name || matchingAppt.patientName || '').toLowerCase().trim()

          if (curId && apptPatientId && curId === apptPatientId) {
            isOwnBooking = true
          } else if (curEmail && apptEmail && curEmail === apptEmail) {
            isOwnBooking = true
          } else if (curName && apptName && curName === apptName) {
            isOwnBooking = true
          }
        }
      }

      let label = slot
      if (isOwnBooking) {
        label = `${slot} (Your Booking)`
      } else if (isBooked) {
        label = `${slot} (Booked)`
      }

      return {
        value: slot,
        label,
        disabled: isBooked,
        isBooked,
        isOwnBooking
      }
    })
  }

  // Continue validation & checkout
  const handleContinue = () => {
    if (!contactNumber.trim()) {
      toast.error('Contact Number is required')
      return
    }
    if (!agreed) {
      toast.error('Please agree to the Terms and Privacy Policy')
      return
    }
    if (!currentUser?.id) {
      setIsAuthModalOpen(true)
      return
    }

    // Dynamic Validation per item
    for (const item of cart) {
      const form = itemForms[item.id] || {}
      if (item.type === 'lab_test') {
        if (!form.scheduledDate) {
          toast.error(`Please select a scheduled date for lab test: ${item.name}`)
          return
        }
      } else if (item.type === 'doctor_appointment') {
        if (!form.bookingDate) {
          toast.error(`Please select a booking date for appointment: ${item.name}`)
          return
        }
        if (!isDoctorDateAvailable(item.doctor, form.bookingDate)) {
          toast.error(`Dr. ${item.doctor?.name || ''} is not available on ${form.bookingDate}. Please select an available date.`)
          return
        }
        if (!form.bookingTime) {
          toast.error(`Please select a timing slot for appointment: ${item.name}`)
          return
        }
        const slotsForDate = getDoctorSlotsForDate(item.doctor, form.bookingDate)
        const chosenSlotObj = slotsForDate.find(s => s.value === form.bookingTime)
        if (chosenSlotObj && chosenSlotObj.disabled) {
          toast.error(`The selected time slot (${form.bookingTime}) for ${item.name} is already booked. Please choose another slot.`)
          return
        }
        if (!form.bookingReason?.trim()) {
          toast.error(`Please specify a reason/symptom for appointment: ${item.name}`)
          return
        }
      } else if (item.type === 'instant_doctor_call') {
        if (instantSpecialtyOptions.length === 0) {
          toast.error(`No doctors are currently available for instant calls. Please remove ${item.name} from your cart.`)
          return
        }
        if (!form.reason?.trim()) {
          toast.error(`Please specify a reason/symptom for: ${item.name}`)
          return
        }
      } else if (item.type === 'care_provider') {
        if (!form.providerType) {
          toast.error(`Please select a care provider type for: ${item.name}`)
          return
        }
        if (!form.packageId) {
          toast.error(`Please select a service package for: ${item.name}`)
          return
        }
        if (!form.bookingDate) {
          toast.error(`Please select a visit date for: ${item.name}`)
          return
        }
        if (!form.bookingTime) {
          toast.error(`Please select a start time for: ${item.name}`)
          return
        }
        if (!form.location?.trim()) {
          toast.error(`Please specify a service visit address for: ${item.name}`)
          return
        }
      }
    }

    setStep(2)
  }

  const handleAuthSuccess = (data) => {
    setIsAuthModalOpen(false)
    const authUser = data?.user || (data?.user_id ? { id: data.user_id, name: data.name || data.display_name || 'User' } : null)
    if (authUser) {
      useStore.setState({ user: authUser })
      if (window.ecareConfig) window.ecareConfig.user = authUser
      if (window.ecareAuthConfig) window.ecareAuthConfig.user = authUser
      toast.success(`Welcome back, ${authUser.name || 'User'}!`)
      setTimeout(() => {
        setStep(2)
      }, 300)
    }
  }

  // Checkout submission to WooCommerce
  const getSiteUrl = () => {
    if (window.ecareConfig?.siteUrl) return window.ecareConfig.siteUrl.replace(/\/$/, '')
    return window.location.origin
  }

  // Navigate to a page: works both inside App.jsx and standalone cart page
  const navigateTo = (page, publicUrlSlug) => {
    const isPortal = window.location.href.includes('admin.php') || window.location.href.includes('wp-admin') || window.location.href.includes('ecare-portal')
    
    if (isPortal && typeof setActivePage === 'function') {
      setActivePage(page)
      return
    }

    const baseSiteUrl = getSiteUrl()
    if (publicUrlSlug) {
      window.location.href = `${baseSiteUrl}/${publicUrlSlug.replace(/^\//, '')}`
    } else {
      const targetUrl = window.ecareConfig?.portalUrl || `${baseSiteUrl}/ecare-portal`
      const sep = targetUrl.includes('?') ? '&' : '?'
      window.location.href = `${targetUrl}${sep}ecare_page=${page}`
    }
  }

  const processCheckout = async () => {
    if (isManualGateway) {
      if (!paymentNumber.trim()) {
        toast.error('Please enter your sender mobile number')
        return
      }
      if (!transactionId.trim()) {
        toast.error('Please enter the transaction ID (TrxID)')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0
      const cartWithPrices = cart.map(item => {
        const originalPrice = getItemPrice(item)
        const itemDiscount = originalPrice * discountRatio
        const finalPrice = Math.max(0, originalPrice - itemDiscount)
        return {
          ...item,
          price: finalPrice,
          originalPrice: originalPrice
        }
      })

      const response = await api.post('checkout/woocommerce', {
        cart: cartWithPrices,
        itemForms,
        contactNumber,
        totalPayable,
        subtotal,
        discountAmount,
        appliedPromo,
        paymentMethod,
        paymentType,
        partialAmount: paymentType === 'partial' ? depositAmount : totalPayable,
        paymentNumber: paymentNumber ? paymentNumber.trim() : '',
        transactionId: transactionId ? transactionId.trim() : ''
      })

      const result = response.data

      if (result.success && result.completed) {
        // Offline gateway (COD, Check) — order fully processed, show success screen
        toast.success('Booking confirmed! Your order has been placed successfully.')
        clearCart()
        setCreatedInvoiceNo(result.invoice_no || '')
        setCheckoutSuccess(true)
      } else if (result.success && result.checkout_url) {
        // Online gateway (Stripe, PayPal etc.) — redirect to payment page
        toast.success('Bookings registered. Redirecting to payment...')
        window.location.href = result.checkout_url
      } else {
        toast.error(result.message || 'An error occurred during checkout. Please try again.')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'An error occurred during checkout. Please try again.')
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auth modal — shown when guest tries to checkout
  const AuthModal = (
    <Portal>
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 99999
              }}
            />
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                pointerEvents: 'none'
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="ecare-card"
                style={{
                  position: 'relative',
                  background: '#fff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '460px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                  pointerEvents: 'auto',
                  border: 'none',
                  padding: 0
                }}
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#f1f5f9',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <X size={16} weight="bold" color="#64748b" />
                </button>

                {/* Auth form — popup mode strips the bg image */}
                <AuthApp onSuccess={handleAuthSuccess} popupMode />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )

  // Empty cart view
  if (cart.length === 0 && !checkoutSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShoppingCart size={40} weight="duotone" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: '0 0 8px 0' }}>Your Shopping Cart is Empty</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--ecare-text-muted)', maxWidth: '360px', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
          Select services, consultations, home care visits, or laboratory diagnostics to continue.
        </p>
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '12px', justifyContent: 'center', flexWrap: 'nowrap', width: '100%' }}>
          <button 
            type="button"
            onClick={() => navigateTo('lab-catalog', 'ecare-lab-booking')} 
            className="ecare-btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? '36px' : '44px', padding: isMobile ? '0 10px' : '0 24px', borderRadius: '10px', fontWeight: 700, fontSize: isMobile ? '0.7rem' : '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            Lab Catalog
          </button>
          <button 
            type="button"
            onClick={() => navigateTo('doctor-list', 'ecare-doctors')} 
            className="ecare-btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? '36px' : '44px', padding: isMobile ? '0 10px' : '0 24px', borderRadius: '10px', fontWeight: 700, fontSize: isMobile ? '0.7rem' : '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            Find Doctors
          </button>
          <button 
            type="button"
            onClick={() => navigateTo('care-provider-booking-create', 'ecare-care-provider-booking')} 
            className="ecare-btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? '36px' : '44px', padding: isMobile ? '0 10px' : '0 24px', borderRadius: '10px', fontWeight: 700, fontSize: isMobile ? '0.7rem' : '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            Book Care Provider
          </button>
        </div>
      </div>
    )
  }

  // Success view
  if (checkoutSuccess) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem' }}>
        <div className="ecare-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--ecare-border)', boxShadow: 'none' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} weight="fill" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: '0 0 6px 0' }}>Bookings Confirmed!</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--ecare-primary)', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              Invoice: {createdInvoiceNo}
            </p>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--ecare-text-muted)', lineHeight: 1.5, margin: 0 }}>
            Your requested bookings have been confirmed. Transactions have been recorded under your profile. You can review and manage all schedules inside your bookings dashboards.
          </p>
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={() => navigateTo('dashboard')}
              className="ecare-btn-secondary"
              style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', fontWeight: 700 }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigateTo('appointments')}
              className="ecare-button"
              style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', fontWeight: 600 }}
            >
              My Appointments
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 'var(--ecare-container-width, 1200px)',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '1.25rem 0',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--ecare-space-section, 1rem)',
      paddingBottom: '3rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>Checkout Cart</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>
            <span style={{ color: step === 1 ? 'var(--ecare-primary)' : 'var(--ecare-text-muted)' }}>1. Cart Details</span>
            <ArrowRight size={12} />
            <span style={{ color: step === 2 ? 'var(--ecare-primary)' : 'var(--ecare-text-muted)' }}>2. Payment & Confirmation</span>
          </div>
        </div>
        {step === 1 && (
          <button 
            onClick={clearCart} 
            className="ecare-btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash size={14} /> Clear Cart
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.5fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* ═══ LEFT COLUMN ════════════════════════════════════════════════ */}
        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Global Contact Info */}
            <div className="ecare-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginBottom: '1rem' }}>Patient Contact Information</h3>
              <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                <label className="ecare-label">Primary Contact Number <span style={{ color: C.red }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="var(--ecare-primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <input 
                    type="text" 
                    className="ecare-input" 
                    style={{ paddingLeft: '2.5rem', borderRadius: '10px' }}
                    placeholder="e.g. 01XXXXXXXXX"
                    value={contactNumber} 
                    onChange={e => setContactNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Items and Forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => {
                const form = itemForms[item.id] || {}
                
                return (
                  <div key={item.id} className="ecare-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${
                    item.type === 'doctor_appointment' ? '#8b5cf6' :
                    item.type === 'instant_doctor_call' ? '#ec4899' :
                    item.type === 'care_provider' ? '#3b82f6' : 'var(--ecare-primary)'
                  }` }}>
                    
                    {/* Header line */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '10px', 
                          background: 'var(--ecare-primary-bg)', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)' 
                        }}>
                          {item.type === 'doctor_appointment' && <Heartbeat size={18} weight="duotone" />}
                          {item.type === 'instant_doctor_call' && <Phone size={18} weight="duotone" />}
                          {item.type === 'care_provider' && <House size={18} weight="duotone" />}
                          {item.type === 'lab_test' && <ClipboardText size={18} weight="duotone" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>{item.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                            {item.type?.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--ecare-primary)' }}>
                          {currencySymbol}{getItemPrice(item).toLocaleString()}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          style={{ border: 'none', background: '#fee2e2', cursor: 'pointer', color: '#ef4444', padding: '6px', display: 'flex', borderRadius: '8px' }}
                          title="Remove"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '1.25rem' }} />

                    {/* DYNAMIC FORM INNER CONTAINER */}
                    {item.type === 'lab_test' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="ecare-form-group">
                          <label className="ecare-label">Preferred Booking Date <span style={{ color: C.red }}>*</span></label>
                          <CustomDatePicker 
                            value={form.scheduledDate} 
                            onChange={v => updateItemForm(item.id, 'scheduledDate', v)} 
                          />
                        </div>
                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                          <label className="ecare-label">Clinical Referral Notes (Optional)</label>
                          <textarea 
                            className="ecare-input" 
                            rows="2" 
                            placeholder="Enter symptoms or doctor notes..."
                            value={form.clinicalNotes} 
                            onChange={e => updateItemForm(item.id, 'clinicalNotes', e.target.value)}
                            style={{ resize: 'none' }}
                          />
                        </div>
                      </div>
                    )}

                    {item.type === 'doctor_appointment' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Booking Date <span style={{ color: C.red }}>*</span></label>
                            <CustomDatePicker 
                              value={form.bookingDate} 
                              onChange={v => {
                                updateItemForm(item.id, 'bookingDate', v)
                                updateItemForm(item.id, 'bookingTime', '') // reset slot
                              }} 
                              isDateAvailable={dateStr => isDoctorDateAvailable(item.doctor, dateStr)}
                              placeholder="Select available date"
                            />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Timing Slot <span style={{ color: C.red }}>*</span></label>
                            <CustomSelect 
                              value={form.bookingTime} 
                              onChange={v => updateItemForm(item.id, 'bookingTime', v)}
                              options={getDoctorSlotsForDate(item.doctor, form.bookingDate)}
                              placeholder={form.bookingDate ? "Choose slot" : "Select date first"}
                              disabled={!form.bookingDate}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: '12px' }}>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Consultation Mode</label>
                            <CustomSelect 
                              value={form.bookingMode} 
                              onChange={v => updateItemForm(item.id, 'bookingMode', v)}
                              options={[
                                { value: 'Video Consult', label: 'Virtual Video Call' },
                                { value: 'In-Person', label: 'Chamber Visit' }
                              ]}
                            />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Booking Reason / Symptoms <span style={{ color: C.red }}>*</span></label>
                            <input 
                              type="text" 
                              className="ecare-input" 
                              placeholder="e.g. Fever, chronic pain" 
                              value={form.bookingReason} 
                              onChange={e => updateItemForm(item.id, 'bookingReason', e.target.value)}
                            />
                          </div>
                        </div>
                        {form.attachedFiles && form.attachedFiles.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            <label className="ecare-label" style={{ fontSize: '0.7rem' }}>Attached Documents</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {form.attachedFiles.map((f, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                                  <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {f.name || (typeof f === 'string' ? f.split('/').pop() : 'Attachment')}
                                  </span>
                                  <span 
                                    style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', marginLeft: '2px' }} 
                                    onClick={() => {
                                      const updatedFiles = form.attachedFiles.filter((_, i) => i !== idx)
                                      updateItemForm(item.id, 'attachedFiles', updatedFiles)
                                    }}
                                  >
                                    ×
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {item.type === 'instant_doctor_call' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {instantSpecialtyOptions.length === 0 ? (
                          <div style={{
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#9a3412',
                            fontSize: '0.8rem',
                            lineHeight: 1.45
                          }}>
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 700, color: '#c2410c' }}>
                              <Phone size={15} color="#ea580c" />
                              Clinicians Currently Offline
                            </strong>
                            No doctors currently have instant consultation mode enabled. Please remove this item from your cart or try again when doctors are live.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: '12px' }}>
                            <div className="ecare-form-group">
                              <label className="ecare-label">Choose Doctor Specialty</label>
                              <CustomSelect 
                                value={form.specialty || instantSpecialtyOptions[0]?.value} 
                                onChange={v => updateItemForm(item.id, 'specialty', v)}
                                options={instantSpecialtyOptions}
                              />
                            </div>
                            <div className="ecare-form-group">
                              <label className="ecare-label">Symptoms / Reason <span style={{ color: C.red }}>*</span></label>
                              <input 
                                type="text" 
                                className="ecare-input" 
                                placeholder="Describe your current symptom..." 
                                value={form.reason} 
                                onChange={e => updateItemForm(item.id, 'reason', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {item.type === 'care_provider' && (() => {
                      const selectedTypeObj = (providerTypes || []).find(t => t.name === form.providerType)
                      const filteredPackages = selectedTypeObj
                        ? (servicePricing || []).filter(p => String(p.typeId) === String(selectedTypeObj.id) || String(p.providerTypeId) === String(selectedTypeObj.id))
                        : (servicePricing || [])
                      /* IIFE-fix: keep consistent structure */
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div className="ecare-form-group">
                              <label className="ecare-label">Care Provider Type <span style={{ color: C.red }}>*</span></label>
                              <CustomSelect 
                                value={form.providerType} 
                                onChange={v => {
                                  updateItemForm(item.id, 'providerType', v)
                                  updateItemForm(item.id, 'providerName', '') // reset chosen provider
                                }}
                                options={(providerTypes || []).map(t => ({ value: t.name, label: t.name }))}
                                placeholder="Select provider type"
                              />
                            </div>
                            <div className="ecare-form-group">
                              <label className="ecare-label">Service Package <span style={{ color: C.red }}>*</span></label>
                              <CustomSelect 
                                value={form.packageId} 
                                onChange={v => updateItemForm(item.id, 'packageId', v)}
                                options={filteredPackages.map(p => ({ 
                                  value: String(p.id), 
                                  label: `${p.name} (${p.duration}) - ৳${Number(p.price).toLocaleString()}` 
                                }))}
                                placeholder="Select pricing plan"
                              />
                            </div>
                          </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: '12px' }}>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Select Specific Provider</label>
                            <CustomSelect 
                              value={form.providerName} 
                              onChange={v => updateItemForm(item.id, 'providerName', v)}
                              options={[
                                { value: '', label: 'Any Available Provider' },
                                ...(careProviders || [])
                                  .filter(cp => !form.providerType || cp.type?.toLowerCase().includes(form.providerType.toLowerCase()))
                                  .map(cp => ({ value: cp.name, label: cp.name }))
                              ]}
                              placeholder="Choose provider"
                            />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Visit Address / Location <span style={{ color: C.red }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                              <MapPin size={16} color="var(--ecare-primary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                              <input 
                                type="text" 
                                className="ecare-input" 
                                style={{ paddingLeft: '2.2rem' }}
                                placeholder="Enter home visit location..." 
                                value={form.location} 
                                onChange={e => updateItemForm(item.id, 'location', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Scheduled Date <span style={{ color: C.red }}>*</span></label>
                            <CustomDatePicker 
                              value={form.bookingDate} 
                              onChange={v => updateItemForm(item.id, 'bookingDate', v)} 
                            />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Start Time <span style={{ color: C.red }}>*</span></label>
                            <CustomTimePicker 
                              value={form.bookingTime} 
                              onChange={v => updateItemForm(item.id, 'bookingTime', v)} 
                            />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Clinical Notes / Instructions</label>
                            <input 
                              type="text" 
                              className="ecare-input" 
                              placeholder="Symptoms, guidelines..."
                              value={form.notes} 
                              onChange={e => updateItemForm(item.id, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )})()}

                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Step 2 Layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="ecare-card" style={{ padding: '1.5rem' }}>
              {!cart.some(item => item.type === 'instant_doctor_call') && (
                <button 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ecare-primary)', fontSize: '0.78rem', fontWeight: 700, padding: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ← Back to Cart Details
                </button>
              )}

              {isPartialEligible && (
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Choose Payment Option</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                    <div 
                      onClick={() => setPaymentType('full')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'full' ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: paymentType === 'full' ? 'var(--ecare-primary-bg)' : 'white',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: paymentType === 'full' ? 'var(--ecare-primary)' : 'var(--ecare-text-main)' }}>Full Payment</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pay full amount of {currencySymbol}{totalPayable.toLocaleString()} now.</div>
                    </div>
                    <div 
                      onClick={() => setPaymentType('partial')}
                      style={{
                        padding: '12px',
                        border: `2px solid ${paymentType === 'partial' ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: paymentType === 'partial' ? 'var(--ecare-primary-bg)' : 'white',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: paymentType === 'partial' ? 'var(--ecare-primary)' : 'var(--ecare-text-main)' }}>Pay Deposit ({minDepositPercent}%)</div>
                        <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--ecare-primary)', color: 'white', fontWeight: 800 }}>Deposit</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pay {currencySymbol}{depositAmount.toLocaleString()} now, rest later.</div>
                    </div>
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginBottom: '1rem' }}>Select Payment Method</h3>
              
              {/* ── Unified Gateway Card Grid (works for both WC and non-WC modes) ── */}
              {enabledGateways.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                  <CreditCard size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>No payment methods are currently configured.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                    {enabledGateways.map(([key]) => {
                      const brand = getBrand(key)
                      const isActive = paymentMethod === key
                      const Icon = brand.icon
                      return (
                        <div
                          key={key}
                          onClick={() => setPaymentMethod(key)}
                          style={{
                            padding: '16px 10px',
                            border: `2px solid ${isActive ? brand.color : '#e2e8f0'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: isActive ? `${brand.color}10` : '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.18s ease',
                            boxShadow: isActive ? `0 0 0 2px ${brand.color}40, 0 4px 12px ${brand.color}20` : '0 1px 3px rgba(0,0,0,0.05)',
                            transform: isActive ? 'translateY(-1px)' : 'none',
                            position: 'relative'
                          }}
                        >
                          {isActive && (
                            <div style={{
                              position: 'absolute', top: '6px', right: '6px',
                              width: '16px', height: '16px', borderRadius: '50%',
                              background: brand.color, display: 'flex',
                              alignItems: 'center', justifyContent: 'center'
                            }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                          {brand.iconHtml ? (
                            <div
                              dangerouslySetInnerHTML={{ __html: brand.iconHtml }}
                              className="ecare-gateway-icon-html"
                              style={{
                                height: '24px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                opacity: isActive ? 1 : 0.65
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '10px',
                              background: isActive ? `${brand.color}20` : '#f1f5f9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Icon size={20} color={isActive ? brand.color : '#64748b'} weight={isActive ? 'fill' : 'regular'} />
                            </div>
                          )}
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700,
                            color: isActive ? brand.color : '#374151',
                            textAlign: 'center', lineHeight: 1.2
                          }}>{brand.name}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Selected gateway description / instruction box */}
                  {paymentMethod && (() => {
                    const gw = (window.ecareConfig?.wcGateways || {})[paymentMethod]
                    const desc = gw?.description || selectedGateway?.description
                    if (!desc) return null
                    return (
                      <div style={{
                        padding: '12px 16px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        color: '#166534',
                        lineHeight: 1.5,
                        marginBottom: '1rem'
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: desc }} />
                      </div>
                    )
                  })()}

                  {/* Manual mobile payment fields (bKash, Nagad etc. — non-WC only) */}
                  {isManualGateway && (() => {
                    const methodDisplayName = formatPaymentMethod(paymentMethod);
                    return (
                      <div style={{ padding: '1.25rem', border: '1px solid #bfdbfe', borderRadius: '12px', background: '#f8fafc', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                          Please send the fee of <strong style={{ color: 'var(--ecare-primary)' }}>৳ {totalPayable.toFixed(2)}</strong> according to the instructions above:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                          <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Sender Number</label>
                            <input
                              type="text"
                              style={inputSt}
                              value={paymentNumber}
                              onChange={e => setPaymentNumber(e.target.value)}
                              placeholder={`Your ${methodDisplayName} wallet number`}
                            />
                          </div>
                          <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Transaction ID (TrxID)</label>
                            <input
                              type="text"
                              style={inputSt}
                              value={transactionId}
                              onChange={e => setTransactionId(e.target.value)}
                              placeholder="e.g. 9B8C7D6E5F"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ RIGHT COLUMN (Order Summary Card) ═════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="ecare-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>Payment Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal ({cart.length} items)</span>
                <span style={{ fontWeight: 600 }}>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.green }}>
                <span>Coupon Discount</span>
                <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
              </div>
              <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                <span>Total Payable</span>
                <span style={{ color: 'var(--ecare-primary)' }}>{currencySymbol}{totalPayable.toFixed(2)}</span>
              </div>
              {paymentType === 'partial' && isPartialEligible && (
                <>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>
                    <span>Deposit Due Now ({minDepositPercent}%)</span>
                    <span style={{ color: 'var(--ecare-primary)' }}>{currencySymbol}{depositAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Remaining Balance</span>
                    <span>{currencySymbol}{(totalPayable - depositAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Promo Code Apply */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="ecare-label" style={{ fontSize: '0.7rem' }}>Have a Promo Code?</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                  <input 
                    type="text" 
                    style={{ ...inputSt, flex: 1, minWidth: 0, padding: '0.5rem 0.75rem', height: '38px' }} 
                    placeholder="Enter code" 
                    value={promoCodeInput} 
                    onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                    disabled={!!appliedPromo} 
                  />
                  {!appliedPromo ? (
                    <button 
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoCodeInput}
                      className="ecare-button"
                      style={{ padding: '0 16px', height: '38px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, width: 'auto', minWidth: '80px', flexShrink: 0 }}
                    >
                      {validatingPromo ? <Spinner className="ecare-spin" size={14} /> : 'Apply'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleRemovePromo}
                      style={{ padding: '0 12px', height: '38px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', width: 'auto', minWidth: '80px', flexShrink: 0 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {appliedPromo && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: C.green, fontWeight: 700 }}>
                    ✓ Promo &quot;{appliedPromo.code}&quot; applied!
                  </p>
                )}
              </div>
            )}

            {/* Terms check in Step 1 */}
            {step === 1 && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={e => setAgreed(e.target.checked)} 
                  style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--ecare-primary)', marginTop: '2px' }} 
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                  I agree to the clinic <a href={termsLink} target={termsLink !== '#' ? "_blank" : undefined} rel={termsLink !== '#' ? "noopener noreferrer" : undefined} style={{ color: 'var(--ecare-primary)', fontWeight: 700 }}>Terms of Service</a> and <a href={privacyLink} target={privacyLink !== '#' ? "_blank" : undefined} rel={privacyLink !== '#' ? "noopener noreferrer" : undefined} style={{ color: 'var(--ecare-primary)', fontWeight: 700 }}>Privacy Policy</a>.
                </span>
              </label>
            )}

            {/* Action buttons */}
            {step === 1 ? (
              <button 
                onClick={handleContinue}
                className="ecare-button"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
              >
                {!currentUser?.id ? 'Login to Checkout' : 'Proceed to Payment'}
                <ArrowRight size={14} weight="bold" />
              </button>
            ) : (
              <button 
                onClick={!currentUser?.id ? () => setIsAuthModalOpen(true) : processCheckout}
                disabled={isSubmitting || (currentUser?.id ? !paymentMethod : false)}
                className="ecare-button"
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', fontWeight: 600,
                  background: (isSubmitting || (currentUser?.id ? !paymentMethod : false)) ? '#cbd5e1' : 'var(--ecare-primary)',
                  cursor: (isSubmitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="ecare-spin" size={14} />
                    Processing...
                  </>
                ) : !currentUser?.id ? (
                  <>
                    Login to Continue
                    <ArrowRight size={14} weight="bold" />
                  </>
                ) : (
                  <>
                    {paymentType === 'partial' ? `Confirm & Pay Deposit (${currencySymbol}${depositAmount.toLocaleString()})` : 'Confirm & Pay'}
                    <ArrowRight size={14} weight="bold" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Secure details card */}
          <div className="ecare-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <ShieldCheck size={28} color={C.green} weight="duotone" />
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Secure Booking Connection</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Data Encrypted & Verified</div>
            </div>
          </div>
        </div>

      </div>

      {AuthModal}
    </div>
  )
}
