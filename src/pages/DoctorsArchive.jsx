import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, SlidersHorizontal, Calendar, Clock, User, 
  ShieldCheck, CheckCircle, X, Sparkles, ArrowRight, Lock, 
  Phone, Mail, BookOpen, Star, Plus, ChevronLeft, ChevronRight, Loader2, Shield,
  Banknote, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import useAuth from '../hooks/useAuth'
import api from '../utils/api'
import AuthApp from '../AuthApp'
import CustomSelect from '../components/CustomSelect'
import { Portal } from '../utils/portal'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

const statusOptions = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'In Session', label: 'In Session' },
  { value: 'Offline', label: 'Offline' }
]

const sortOptions = [
  { value: 'experience-desc', label: 'Highly Experienced' },
  { value: 'fee-asc', label: 'Fee: Low to High' },
  { value: 'fee-desc', label: 'Fee: High to Low' },
  { value: 'name-asc', label: 'Alphabetical (A-Z)' }
]

const modeOptions = [
  { value: 'Video Consult', label: '🎥 Video Consult (Online)' },
  { value: 'In-Person', label: '🏥 In-Person (Clinic Visit)' }
]

// Design system constants
const C = {
  dark:   '#1a1a2e',
  border: '#e5e7eb',
  muted:  '#6b7280',
  faint:  '#9ca3af',
  bg:     '#f8fafc',
  blue:   '#3b82f6',
  green:  '#10b981',
  yellow: '#f59e0b',
  red:    '#ef4444',
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

const getDoctorInitials = (name) => {
  if (!name) return 'DR'
  return name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const formatDoctorName = (name) => {
  if (!name) return 'Doctor'
  return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`
}

const parseDoctorSlots = (slots) => {
  if (!slots) return []
  if (Array.isArray(slots)) return slots
  try {
    const parsed = JSON.parse(slots)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

const formatTimeSlot = (time) => {
  if (!time) return ''
  const [h, min] = time.split(':').map(Number)
  if (isNaN(h)) return time
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hours = h % 12 || 12
  return `${hours}:${String(min || 0).padStart(2, '0')} ${ampm}`
}

const getSlotLabel = (slot) => {
  if (!slot) return null
  if (typeof slot === 'string') return slot
  if (slot.status === 'Inactive') return null
  if (slot.start && slot.end) {
    return `${formatTimeSlot(slot.start)} - ${formatTimeSlot(slot.end)}`
  }
  return null
}

const getDoctorSchedules = (doc, doctorAvailability) => {
  if (!doc || !doctorAvailability) return []
  return doctorAvailability.filter(a => 
    (doc.user_id && parseInt(a.doctor_id) === parseInt(doc.user_id)) ||
    (doc.id && parseInt(a.doctor_id) === parseInt(doc.id))
  )
}

const isSlotInPast = (dateStr, slotLabel) => {
  if (!dateStr || !slotLabel) return false
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const slotStartStr = slotLabel.split('-')[0]?.trim()
    if (!slotStartStr) return false

    const match = slotStartStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return false

    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const ampm = match[3].toUpperCase()

    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0

    const slotDateTime = new Date(y, m - 1, d, hours, minutes, 0)
    return slotDateTime < new Date()
  } catch (e) {
    return false
  }
}

const getSlotBookingInfo = (doc, dateStr, slotLabel, appointments, currentUser) => {
  if (!appointments || !Array.isArray(appointments) || !doc || !dateStr || !slotLabel) {
    return { isBooked: false, isOwnBooking: false, bookingDetails: null }
  }

  const cleanSlotLabel = slotLabel.trim().replace(/\s+/g, ' ')
  const slotStart = cleanSlotLabel.split('-')[0]?.trim().toLowerCase()

  const matchingAppt = appointments.find(appt => {
    const docIdMatch = (doc.id && parseInt(appt.doctor_id) === parseInt(doc.id)) ||
                       (doc.id && parseInt(appt.doctor_user_id || appt.doctorUserId) === parseInt(doc.id)) ||
                       (doc.user_id && parseInt(appt.doctor_id) === parseInt(doc.user_id)) ||
                       (doc.user_id && parseInt(appt.doctor_user_id || appt.doctorUserId) === parseInt(doc.user_id)) ||
                       (doc.name && appt.doctorName && appt.doctorName.trim().toLowerCase() === doc.name.trim().toLowerCase())
    if (!docIdMatch) return false

    if (appt.date !== dateStr) return false

    const cleanApptTime = appt.time ? appt.time.trim().replace(/\s+/g, ' ') : ''
    
    let timeMatch = false
    if (cleanApptTime && cleanSlotLabel) {
      if (cleanApptTime.toLowerCase() === cleanSlotLabel.toLowerCase()) {
        timeMatch = true
      } else {
        const apptStart = cleanApptTime.split('-')[0]?.trim().toLowerCase()
        if (apptStart && slotStart && apptStart === slotStart) {
          timeMatch = true
        }
      }
    }
    if (!timeMatch) return false

    const activeStatus = !['cancelled', 'rejected', 'refunded', 'closed', 'expired'].includes(String(appt.status || '').trim().toLowerCase())
    return activeStatus
  })

  if (!matchingAppt) {
    return { isBooked: false, isOwnBooking: false, bookingDetails: null }
  }

  let isOwnBooking = false
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

  return {
    isBooked: true,
    isOwnBooking,
    bookingDetails: matchingAppt
  }
}

const isSlotBooked = (doc, dateStr, slotLabel, appointments) => {
  return getSlotBookingInfo(doc, dateStr, slotLabel, appointments).isBooked
}

const getNextAvailabilityLabel = (doc, doctorAvailability, appointments) => {
  const scheds = getDoctorSchedules(doc, doctorAvailability)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
    const sched = scheds.find(s => s.day === dayName && s.status === 'Active')

    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    if (sched) {
      const slots = parseDoctorSlots(sched.slots)
      let firstAvailableSlotLabel = null
      
      for (const slot of slots) {
        const slotLabel = getSlotLabel(slot)
        if (!slotLabel) continue
        if (isSlotInPast(dateStr, slotLabel)) continue
        if (isSlotBooked(doc, dateStr, slotLabel, appointments)) continue
        
        firstAvailableSlotLabel = slotLabel
        break
      }

      if (firstAvailableSlotLabel) {
        const timeLabel = firstAvailableSlotLabel.split('-')[0]?.trim() || firstAvailableSlotLabel
        if (i === 0) return `Today, ${timeLabel}`
        if (i === 1) return `Tomorrow, ${timeLabel}`
        return `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${timeLabel}`
      }
    }

    if (scheds.length === 0 && i === 0 && doc.status === 'Available') {
      const defaultSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
      let firstAvailableSlotLabel = null
      for (const slotLabel of defaultSlots) {
        if (isSlotInPast(dateStr, slotLabel)) continue
        if (isSlotBooked(doc, dateStr, slotLabel, appointments)) continue
        
        firstAvailableSlotLabel = slotLabel
        break
      }
      if (firstAvailableSlotLabel) {
        return `Today, ${firstAvailableSlotLabel}`
      }
    }
  }

  if (doc.status === 'In Session') return 'Later today'
  if (doc.status === 'Available') return 'Today, 9:00 AM'
  return 'Check schedule'
}

const normalizeString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const matchSpecialty = (doctor, targetSpec) => {
  if (!targetSpec || targetSpec === 'All' || targetSpec.toLowerCase() === 'all') return true
  if (!doctor) return false

  // Extract all possible doctor specialty strings
  const docSpecs = []
  if (doctor.specialization) docSpecs.push(doctor.specialization)
  if (doctor.specialty) docSpecs.push(doctor.specialty)
  if (doctor.speciality) docSpecs.push(doctor.speciality)
  if (doctor.department) docSpecs.push(doctor.department)

  const allDocTerms = []
  docSpecs.forEach(spec => {
    if (Array.isArray(spec)) {
      allDocTerms.push(...spec)
    } else if (typeof spec === 'string') {
      try {
        const parsed = JSON.parse(spec)
        if (Array.isArray(parsed)) allDocTerms.push(...parsed)
        else allDocTerms.push(spec)
      } catch (e) {
        allDocTerms.push(...spec.split(',').map(s => s.trim()))
      }
    }
  })

  const targetNorm = normalizeString(targetSpec)
  if (!targetNorm) return true

  // Check if any doctor term matches
  return allDocTerms.some(term => {
    const termNorm = normalizeString(term)
    if (!termNorm) return false
    
    // Exact or normalized match
    if (termNorm === targetNorm) return true
    
    // Substring containment
    if (termNorm.includes(targetNorm) || targetNorm.includes(termNorm)) return true

    // Common medical alias matching
    if ((targetNorm === 'general' || targetNorm.includes('generalmed')) && (termNorm.includes('general') || termNorm.includes('medicine') || termNorm.includes('practitioner') || termNorm.includes('physician') || termNorm.includes('mbbs'))) {
      return true
    }
    if (targetNorm.includes('cardio') && termNorm.includes('cardio')) return true
    if (targetNorm.includes('pediatric') && termNorm.includes('pediatric')) return true
    if (targetNorm.includes('ent') && (termNorm.includes('ent') || termNorm.includes('otolaryng'))) return true
    if (targetNorm.includes('ortho') && termNorm.includes('ortho')) return true
    if (targetNorm.includes('derma') && termNorm.includes('derma')) return true
    if (targetNorm.includes('gastro') && termNorm.includes('gastro')) return true
    if (targetNorm.includes('neuro') && termNorm.includes('neuro')) return true
    if (targetNorm.includes('gyne') && termNorm.includes('gyne')) return true
    if (targetNorm.includes('endo') && termNorm.includes('endo')) return true
    if (targetNorm.includes('uro') && termNorm.includes('uro')) return true
    if (targetNorm.includes('nephro') && termNorm.includes('nephro')) return true
    if (targetNorm.includes('pulmo') && termNorm.includes('pulmo')) return true
    if (targetNorm.includes('dent') && termNorm.includes('dent')) return true
    if (targetNorm.includes('mental') || targetNorm.includes('psych')) {
      if (termNorm.includes('mental') || termNorm.includes('psych')) return true
    }

    if (targetNorm === 'specialist' || targetNorm === 'specialists') {
      return true
    }

    return false
  })
}

const getDoctorLocation = (doc) => {
  if (doc.clinic || doc.hospital) return doc.clinic || doc.hospital
  if (doc.address) {
    const part = doc.address.split(',')[0].trim()
    return part.length > 36 ? `${part.slice(0, 36)}…` : part
  }
  return window.ecareConfig?.siteName || 'E-CARE Clinic'
}

function DoctorRegistryCard({ doc, currencySymbol, doctorAvailability, appointments, reviews, onConsult, index }) {
  const displayName = formatDoctorName(doc.name)
  const isAvailable = doc.status === 'Available'
  const isInSession = doc.status === 'In Session'
  const nextSlot = getNextAvailabilityLabel(doc, doctorAvailability, appointments)
  const location = getDoctorLocation(doc)
  const experience = parseInt(doc.experience || '3', 10) || 3

  // Compute rating for this doctor from approved reviews
  const docReviews = (reviews || []).filter(r => r.status === 'Approved' && String(r.doctor_id) === String(doc.user_id))
  const avgRating = docReviews.length > 0
    ? (docReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / docReviews.length).toFixed(1)
    : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.24), ease: 'easeOut' }}
      className="ecare-doctors-card"
    >
      <div className="ecare-doctors-card-photo">
        <div className="ecare-doctors-card-avatar">
          {doc.avatar ? (
            <img src={doc.avatar} alt={displayName} />
          ) : (
            getDoctorInitials(doc.name)
          )}
        </div>
        {isAvailable && <span className="ecare-doctors-card-online-dot" aria-hidden="true" />}
      </div>

      <div className="ecare-doctors-card-info">
        <h3 className="ecare-doctors-card-name">{displayName}</h3>
        <p className="ecare-doctors-card-specialty">
          {doc.specialization || 'General Practitioner'}
        </p>
        <p className="ecare-doctors-card-details">
          {experience} yrs <span className="ecare-doctors-card-sep">•</span> {location}
        </p>
        {avgRating !== null && (
          <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
            ★ {avgRating}
            <span style={{ color: '#94a3b8', fontWeight: 400 }}>({docReviews.length} {docReviews.length === 1 ? 'review' : 'reviews'})</span>
          </p>
        )}
        <p className="ecare-doctors-card-price">
          <strong>{currencySymbol}{Number(doc.fee || 0).toLocaleString()}</strong>
          <span>visit</span>
        </p>
      </div>

      <div className="ecare-doctors-card-action">
        <span className="ecare-doctors-card-availability">{nextSlot}</span>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onConsult(doc)}
          className={`ecare-doctors-card-book${!isAvailable ? ' is-muted' : ''}${isInSession ? ' is-session' : ''}`}
        >
          Book
        </motion.button>
      </div>
    </motion.article>
  )
}

export default function DoctorsArchive() {
  const { 
    doctorList = [], specialities = [], services = [], doctorAvailability = [],
    appointments = [],
    addAppointment, addTransaction, validatePromoCode, uploadFile,
    currencySymbol = '৳', addToCart, setActivePage
  } = useStore()

  const { user: currentUser } = useAuth()

  // State filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortBy, setSortBy] = useState('experience-desc')
  const [serviceFilter, setServiceFilter] = useState(null)

  // Booking modal state
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingMode, setBookingMode] = useState('Video Consult')

  // Additional booking details states
  const [contactNumber, setContactNumber] = useState(currentUser?.phone || '')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    if (currentUser?.phone) {
      setContactNumber(currentUser.phone)
    }
  }, [currentUser])
  const [bookingReason, setBookingReason] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  // Auth modal inside booking
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const dateScrollRef = useRef(null)
  const containerRef = useRef(null)
  const urlParamsHandled = useRef(false)

  // Filter and sort doctor list
  const filteredDoctors = useMemo(() => {
    let list = [...doctorList]

    // 1. Search query filter
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim()
      list = list.filter(d => {
        const name = String(d.name || '').toLowerCase()
        const spec = String(d.specialization || d.specialty || d.speciality || '').toLowerCase()
        const degrees = String(d.degrees || '').toLowerCase()
        const bio = String(d.bio || d.detailedBio || d.about || '').toLowerCase()
        const servicesStr = String(d.services || '').toLowerCase()
        const dept = String(d.department || d.clinic || d.hospital || '').toLowerCase()

        return name.includes(q) || 
               spec.includes(q) || 
               degrees.includes(q) || 
               bio.includes(q) || 
               servicesStr.includes(q) ||
               dept.includes(q)
      })
    }

    // 2. Specialty filter with robust fuzzy/alias matching
    if (selectedSpecialty && selectedSpecialty !== 'All' && selectedSpecialty.toLowerCase() !== 'all') {
      list = list.filter(d => matchSpecialty(d, selectedSpecialty))
    }

    // 3. Status filter
    if (selectedStatus !== 'All' && selectedStatus.toLowerCase() !== 'all') {
      const targetStatus = selectedStatus.toLowerCase()
      list = list.filter(d => {
        const dStatus = String(d.status || '').toLowerCase()
        if (targetStatus === 'available') {
          return dStatus === 'available' || dStatus === 'active'
        }
        return dStatus === targetStatus
      })
    }

    // 4. Service filter with smart fallback
    if (serviceFilter && serviceFilter !== 'All' && serviceFilter.toLowerCase() !== 'all') {
      const sLower = serviceFilter.toLowerCase().trim()
      
      // Direct service matches
      const directMatches = list.filter(d => {
        const docServices = d.services ? String(d.services).toLowerCase().split(',').map(s => s.trim()) : []
        return docServices.some(s => s === sLower || s.includes(sLower) || sLower.includes(s))
      })

      if (directMatches.length > 0) {
        list = directMatches
      } else {
        // Find if this service belongs to a specific specialty in `services` store
        const foundService = services.find(s => 
          String(s.name || '').toLowerCase().trim() === sLower ||
          sLower.includes(String(s.name || '').toLowerCase().trim())
        )
        const serviceSpec = foundService?.speciality || foundService?.specialization || ''

        const specMatches = list.filter(d => {
          if (serviceSpec && matchSpecialty(d, serviceSpec)) {
            return true
          }
          const serviceWords = sLower.split(/[\s,&/]+/).filter(w => w.length > 3)
          const docText = `${d.name} ${d.specialization || ''} ${d.specialty || ''} ${d.services || ''} ${d.bio || ''}`.toLowerCase()
          return serviceWords.some(word => docText.includes(word))
        })

        if (specMatches.length > 0) {
          list = specMatches
        }
      }
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === 'experience-desc') {
        return (parseInt(b.experience || '0', 10) || 0) - (parseInt(a.experience || '0', 10) || 0)
      }
      if (sortBy === 'fee-asc') {
        return (Number(a.fee) || 0) - (Number(b.fee) || 0)
      }
      if (sortBy === 'fee-desc') {
        return (Number(b.fee) || 0) - (Number(a.fee) || 0)
      }
      if (sortBy === 'name-asc') {
        return String(a.name || '').localeCompare(String(b.name || ''))
      }
      return 0
    })

    return list
  }, [doctorList, searchTerm, selectedSpecialty, selectedStatus, sortBy, serviceFilter, services])

  // Get active specialties list
  const activeSpecialties = useMemo(() => {
    const list = specialities.filter(s => s.status === 'Active').map(s => s.name)
    doctorList.forEach(d => {
      const spec = d.specialization || d.specialty || d.speciality
      if (spec && typeof spec === 'string' && spec.trim() !== '' && !list.includes(spec.trim())) {
        list.push(spec.trim())
      }
    })
    if (selectedSpecialty && selectedSpecialty !== 'All' && !list.includes(selectedSpecialty)) {
      list.push(selectedSpecialty)
    }
    const unique = Array.from(new Set(list))
    unique.sort((a, b) => a.localeCompare(b))
    return ['All', ...unique]
  }, [specialities, doctorList, selectedSpecialty])

  const specialtyOptions = useMemo(() => {
    return activeSpecialties.map(spec => ({
      value: spec,
      label: spec === 'All' ? 'All Specialties' : spec
    }))
  }, [activeSpecialties])

  const serviceOptions = useMemo(() => {
    let list = services.filter(s => s.status === 'Active')
    if (selectedSpecialty && selectedSpecialty !== 'All' && selectedSpecialty.toLowerCase() !== 'all') {
      const filtered = list.filter(s => matchSpecialty({ specialization: s.speciality }, selectedSpecialty))
      if (filtered.length > 0) {
        list = filtered
      }
    }
    const opts = list.map(s => ({
      value: s.name,
      label: s.speciality ? `${s.name} (${s.speciality})` : s.name
    }))
    if (serviceFilter && serviceFilter !== 'All' && !opts.some(o => o.value === serviceFilter)) {
      opts.unshift({ value: serviceFilter, label: serviceFilter })
    }
    return [{ value: 'All', label: 'All Services' }, ...opts]
  }, [services, selectedSpecialty, serviceFilter])

  // Booking scheduling helper
  const doctorScheds = useMemo(() => {
    if (!selectedDoctor) return []
    return (doctorAvailability || []).filter(a => 
      parseInt(a.doctor_id) === parseInt(selectedDoctor.user_id) || 
      parseInt(a.doctor_id) === parseInt(selectedDoctor.id)
    )
  }, [selectedDoctor, doctorAvailability])

  const availableDates = useMemo(() => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = d.getDate()
      const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      
      const hasAvailability = doctorScheds.some(s => s.day === d.toLocaleDateString('en-US', { weekday: 'long' }) && s.status === 'Active')
      
      dates.push({ dayName, dayNum, monthYear, fullDate, isAvailable: hasAvailability || doctorScheds.length === 0 })
    }
    return dates
  }, [doctorScheds, selectedDoctor])

  const availableSlots = useMemo(() => {
    if (!bookingDate || !selectedDoctor) return []
    
    const [y, m, d] = bookingDate.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    
    const sched = doctorScheds.find(s => s.day === day && s.status === 'Active')
    let slots = []
    if (!sched || !sched.slots) {
      // Fallback slot template if doctor hasn't set explicit hours
      slots = ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM']
    } else {
      let parsed = []
      try {
        parsed = typeof sched.slots === 'string' ? JSON.parse(sched.slots) : sched.slots
      } catch (e) {
        parsed = typeof sched.slots === 'string' ? sched.slots.split(',').map(s => s.trim()) : []
      }

      if (!Array.isArray(parsed)) return []

      const formatTime = (time) => {
        if (!time) return ''
        const [h, min] = time.split(':').map(Number)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hours = h % 12 || 12
        return `${hours}:${String(min).padStart(2, '0')} ${ampm}`
      }

      slots = parsed
        .filter(s => s.status !== 'Inactive')
        .map(s => {
          if (typeof s === 'string') return s
          if (s.start && s.end) {
            return `${formatTime(s.start)} - ${formatTime(s.end)}`
          }
          return null
        })
        .filter(Boolean)
    }

    return slots.map(slotLabel => {
      const isPast = isSlotInPast(bookingDate, slotLabel)
      const bookingInfo = getSlotBookingInfo(selectedDoctor, bookingDate, slotLabel, appointments, currentUser)
      const isBooked = bookingInfo.isBooked
      const isOwnBooking = bookingInfo.isOwnBooking
      const isAvailable = !isPast && !isBooked
      return {
        label: slotLabel,
        isPast,
        isBooked,
        isOwnBooking,
        bookingDetails: bookingInfo.bookingDetails,
        isAvailable
      }
    })
  }, [bookingDate, doctorScheds, selectedDoctor, appointments, currentUser])

  const scrollDates = (dir) => {
    if (dateScrollRef.current) {
      const amt = dir === 'left' ? -200 : 200
      dateScrollRef.current.scrollBy({ left: amt, behavior: 'smooth' })
    }
  }

  // Calculate pricing based on doctor fee and promo
  const subtotal = selectedDoctor ? parseFloat(selectedDoctor.fee || 0) : 0
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0
    if (appliedPromo.discount_type === 'percentage') {
      return (subtotal * parseFloat(appliedPromo.discount_amount)) / 100
    }
    return parseFloat(appliedPromo.discount_amount)
  }, [appliedPromo, subtotal])

  const totalPayable = Math.max(0, subtotal - discountAmount)



  // Promo operations
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setValidatingPromo(true)
    const promo = await validatePromoCode(promoInput.toUpperCase())
    if (promo) {
      setAppliedPromo(promo)
    } else {
      setAppliedPromo(null)
    }
    setValidatingPromo(false)
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoInput('')
    toast.success('Promo code removed')
  }

  const openBookingFlow = (doc) => {
    setSelectedDoctor(doc)
    setBookingDate('')
    setBookingTime('')
    setBookingReason('')
    setPromoInput('')
    setAppliedPromo(null)
    setContactNumber(currentUser?.phone || '')
    setAttachedFiles([])
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const closeBookingFlow = () => {
    setSelectedDoctor(null)
    try {
      sessionStorage.removeItem('ecare_doctor_booking_draft')
    } catch (e) {}
  }

  // Persist draft booking state in sessionStorage
  useEffect(() => {
    if (selectedDoctor) {
      const draft = {
        doctorId: selectedDoctor.id || selectedDoctor.user_id,
        doctorName: selectedDoctor.name,
        bookingDate,
        bookingTime,
        bookingMode,
        bookingReason,
        contactNumber
      }
      try {
        sessionStorage.setItem('ecare_doctor_booking_draft', JSON.stringify(draft))
      } catch (e) {}
    }
  }, [selectedDoctor, bookingDate, bookingTime, bookingMode, bookingReason, contactNumber])

  // Read URL parameters on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const specName = params.get('specialty')
    const serviceName = params.get('service')
    const searchParam = params.get('search') || params.get('q')

    if (searchParam) {
      setSearchTerm(searchParam)
    }
    if (specName) {
      setSelectedSpecialty(specName)
    }
    if (serviceName) {
      setServiceFilter(serviceName)
    }
    urlParamsHandled.current = true
  }, [])

  // Auto-open doctor booking modal if 'doctor' parameter is in URL or restore saved draft
  const docModalOpenedRef = useRef(false)
  useEffect(() => {
    if (doctorList.length > 0 && !docModalOpenedRef.current) {
      let restoredFromDraft = false
      try {
        const savedDraft = sessionStorage.getItem('ecare_doctor_booking_draft')
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft)
          if (parsed && (parsed.doctorId || parsed.doctorName)) {
            const matchedDoc = doctorList.find(d => 
              (parsed.doctorId && (String(d.id) === String(parsed.doctorId) || String(d.user_id) === String(parsed.doctorId))) ||
              (parsed.doctorName && String(d.name || '').toLowerCase() === String(parsed.doctorName).toLowerCase())
            )
            if (matchedDoc) {
              setSelectedDoctor(matchedDoc)
              if (parsed.bookingDate) setBookingDate(parsed.bookingDate)
              if (parsed.bookingTime) setBookingTime(parsed.bookingTime)
              if (parsed.bookingMode) setBookingMode(parsed.bookingMode)
              if (parsed.bookingReason) setBookingReason(parsed.bookingReason)
              if (parsed.contactNumber) setContactNumber(parsed.contactNumber)
              docModalOpenedRef.current = true
              restoredFromDraft = true
            }
          }
        }
      } catch (e) {}

      if (!restoredFromDraft) {
        const params = new URLSearchParams(window.location.search)
        const docName = params.get('doctor')
        if (docName) {
          const matchedDoc = doctorList.find(d => 
            String(d.name || '').toLowerCase() === docName.toLowerCase() ||
            formatDoctorName(d.name).toLowerCase() === docName.toLowerCase()
          )
          if (matchedDoc) {
            openBookingFlow(matchedDoc)
            docModalOpenedRef.current = true
          }
        }
      }
    }
  }, [doctorList])

  // Synchronize state back to URL parameters without overwriting other params
  useEffect(() => {
    if (!urlParamsHandled.current) return

    const params = new URLSearchParams(window.location.search)

    if (selectedSpecialty && selectedSpecialty !== 'All') {
      params.set('specialty', selectedSpecialty)
    } else {
      params.delete('specialty')
    }

    if (serviceFilter && serviceFilter !== 'All') {
      params.set('service', serviceFilter)
    } else {
      params.delete('service')
    }

    if (selectedDoctor) {
      params.set('doctor', selectedDoctor.name)
    } else {
      params.delete('doctor')
    }

    if (searchTerm && searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    } else {
      params.delete('search')
      params.delete('q')
    }

    const newSearch = params.toString()
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '')
    if (window.location.search !== (newSearch ? `?${newSearch}` : '')) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [selectedSpecialty, serviceFilter, selectedDoctor, searchTerm])

  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)

  const executeDoctorBooking = async () => {
    if (!selectedDoctor) return
    setIsSubmittingBooking(true)
    try {
      const fee = Number(selectedDoctor.fee || 0)
      const isWcEnabled = !!(window.ecareConfig?.woocommerceEnabled || useStore.getState().woocommerceEnabled)

      if (fee > 0) {
        const itemId = `doctor_appointment_${selectedDoctor.id}`
        addToCart({
          id: itemId,
          type: 'doctor_appointment',
          name: `Doctor Consultation: Dr. ${selectedDoctor.name}`,
          price: fee,
          originalPrice: fee,
          doctor: selectedDoctor,
          bookingDate,
          bookingTime,
          bookingMode,
          bookingReason,
          attachedFiles,
          contactNumber
        })

        toast.success('Consultation added to cart! Proceeding to checkout...')
        try { sessionStorage.removeItem('ecare_doctor_booking_draft') } catch (e) {}
        setSelectedDoctor(null)

        if (typeof setActivePage === 'function') {
          setActivePage('cart')
        }
        if (!window.location.href.includes('wp-admin') && !window.location.href.includes('admin.php')) {
          const cartUrl = window.ecareConfig?.cartUrl || ((window.ecareConfig?.siteUrl || '') + '/ecare-cart')
          window.location.href = cartUrl
        }
        return
      }

      // Direct appointment scheduling for 0 fee / free consultations
      const res = await addAppointment({
        doctorName: selectedDoctor.name,
        doctor_id: selectedDoctor.user_id || selectedDoctor.id,
        doctor_user_id: selectedDoctor.user_id || null,
        date: bookingDate,
        time: bookingTime,
        specialty: selectedDoctor.specialization || selectedDoctor.specialty || 'General',
        service: 'Doctor Consultation',
        mode: bookingMode || 'Video Consult',
        paymentStatus: 'Paid',
        status: 'Pending',
        reason: bookingReason || '',
        attachments: attachedFiles?.length > 0 ? (Array.isArray(attachedFiles) ? JSON.stringify(attachedFiles) : attachedFiles) : '',
        contactNumber: contactNumber || ''
      })

      if (res && (res.id || res.data?.id)) {
        toast.success('Appointment scheduled successfully!')
        try { sessionStorage.removeItem('ecare_doctor_booking_draft') } catch (e) {}
        setSelectedDoctor(null)
        if (typeof setActivePage === 'function') {
          setActivePage('appointments')
        } else if (!window.location.href.includes('wp-admin') && !window.location.href.includes('admin.php')) {
          const portalUrl = window.ecareConfig?.portalUrl || ((window.ecareConfig?.siteUrl || '') + '/ecare-portal')
          window.location.href = `${portalUrl}?ecare_page=appointments`
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to book appointment')
      console.error(err)
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const handleDetailsSubmit = () => {
    if (!bookingDate) {
      toast.error('Please select an appointment date')
      return
    }
    if (!bookingTime) {
      toast.error('Please select a time slot')
      return
    }
    
    const chosenSlot = availableSlots.find(s => s.label === bookingTime)
    if (chosenSlot && chosenSlot.isOwnBooking) {
      toast.info('You have already booked this time slot. Please choose a different slot to book an additional session.')
      return
    }
    if (chosenSlot && chosenSlot.isBooked) {
      toast.error('This time slot is already booked. Please choose another slot.')
      return
    }
    if (chosenSlot && chosenSlot.isPast) {
      toast.error('This time slot has already passed. Please choose a future slot.')
      return
    }
    
    // Auth block
    if (!currentUser?.id) {
      setIsAuthModalOpen(true)
      return
    }

    executeDoctorBooking()
  }

  const handleAuthSuccess = (data) => {
    setIsAuthModalOpen(false)
    const authUser = data?.user || (data?.user_id ? { id: data.user_id, name: data.name || data.display_name || 'User' } : null)
    if (authUser) {
      useStore.setState({ user: authUser })
      if (window.ecareConfig) {
        window.ecareConfig.user = authUser
      }
      if (window.ecareAuthConfig) {
        window.ecareAuthConfig.user = authUser
      }
      toast.success(`Welcome, ${authUser.name || 'User'}! Completing your appointment...`)
      setTimeout(() => {
        executeDoctorBooking()
      }, 300)
    }
  }



  const renderDoctorSingleView = () => {
    const isOnline = selectedDoctor.status === 'Available'
    const isInSession = selectedDoctor.status === 'In Session'

    return (
      <motion.div 
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)', width: '100%' }}
      >
        {/* Back navigation */}
        <motion.button
          onClick={() => setSelectedDoctor(null)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          whileHover={{ scale: 1.06, x: -3 }}
          whileTap={{ scale: 0.94 }}
          title="Back to Doctors Directory"
          aria-label="Back to Doctors Directory"
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            color: 'var(--ecare-primary)',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            alignSelf: 'flex-start'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--ecare-primary)'
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.borderColor = 'var(--ecare-primary)'
            e.currentTarget.style.boxShadow = '0 4px 12px var(--ecare-primary-shadow, rgba(0,0,0,0.15))'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = 'var(--ecare-primary)'
            e.currentTarget.style.borderColor = '#e2e8f0'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </motion.button>

        {/* Dynamic 2-column details & booking grid */}
        <div className="ecare-doctors-detail-grid">
          {/* Column 1: Profile Card details */}
          <motion.div 
            className="ecare-card" 
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1.25rem)', padding: 'clamp(1rem, 2vw, 1.5rem)', height: 'fit-content', minWidth: 0 }}
          >
            {/* Top Avatar/Name Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: 'clamp(70px, 12vw, 90px)', height: 'clamp(70px, 12vw, 90px)', borderRadius: '22px', 
                  background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', overflow: 'hidden',
                  border: '2px solid #f1f5f9'
                }}>
                  {selectedDoctor.avatar ? (
                    <img src={selectedDoctor.avatar} alt={selectedDoctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedDoctor.name ? selectedDoctor.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'
                  )}
                </div>
                <span 
                  style={{ 
                    position: 'absolute', bottom: '2px', right: '2px', 
                    width: '18px', height: '18px', borderRadius: '50%', 
                    background: isOnline ? C.green : (isInSession ? C.yellow : C.muted),
                    border: '3px solid #ffffff',
                    boxShadow: isOnline ? `0 0 0 2px ${C.green}40` : 'none'
                  }}
                />
              </div>

              <div>
                <h3 style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontWeight: 800, color: 'var(--ecare-text-main)', margin: '0 0 4px 0' }}>
                  {selectedDoctor.name.toLowerCase().startsWith('dr') ? selectedDoctor.name : `Dr. ${selectedDoctor.name}`}
                </h3>
                <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.78rem)', color: 'var(--ecare-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {selectedDoctor.specialization || 'General Practitioner'}
                </div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.78rem)', color: 'var(--ecare-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                  {selectedDoctor.degrees || 'MBBS'}
                </div>
                {selectedDoctor.department && (
                  <div style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.72rem)', color: '#94a3b8', fontWeight: 700, marginTop: '4px' }}>
                    🏥 {selectedDoctor.department}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', marginTop: '0.5rem' }}>
              <div style={{ background: '#f8fafc', padding: 'clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ecare-primary)' }}>
                  <BookOpen size={16} strokeWidth={2.5} />
                  <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.65rem)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Experience</span>
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                  {parseInt(selectedDoctor.experience || '3', 10) || 3}+ Years
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 'clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ecare-primary)' }}>
                  <User size={16} strokeWidth={2.5} />
                  <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.65rem)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Patients</span>
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                  {selectedDoctor.patientsCount || '0'}+
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 'clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ecare-primary)' }}>
                  <Banknote size={16} strokeWidth={2.5} />
                  <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.65rem)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Fee</span>
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                  {currencySymbol}{Number(selectedDoctor.fee || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 'clamp(0.5rem, 1.5vw, 0.75rem)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ecare-primary)' }}>
                  <Clock size={16} strokeWidth={2.5} />
                  <span style={{ fontSize: 'clamp(0.6rem, 1vw, 0.65rem)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Follow Up</span>
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                  {selectedDoctor.followUpDays || '15'} Days
                </div>
              </div>
            </div>

            {/* Biography */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 'clamp(0.75rem, 2vw, 1rem)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>Biography</h4>
              <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.78rem)', color: 'var(--ecare-text-muted)', lineHeight: 1.5, margin: 0 }}>
                {selectedDoctor.bio || selectedDoctor.detailedBio || `Dr. ${selectedDoctor.name} is a dedicated medical specialist with over ${parseInt(selectedDoctor.experience || '3', 10) || 3} years of experience in providing comprehensive patient care. Known for exceptional clinical skills and empathetic approach, they are committed to helping patients achieve optimal wellness.`}
              </p>
            </div>
          </motion.div>

          {/* Column 2: Booking Stepper Details (Right Column) */}
          <motion.div 
            className="ecare-card" 
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1.25rem)', padding: 'clamp(1rem, 2vw, 1.5rem)', minWidth: 0 }}
          >
            
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
                
                {/* Fee Information Header */}
                <div style={{ background: 'var(--ecare-primary-bg)', padding: 'clamp(0.75rem, 1.5vw, 1rem)', borderRadius: '14px', border: '1px solid var(--ecare-primary-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 'clamp(32px, 6vw, 40px)', height: 'clamp(32px, 6vw, 40px)', borderRadius: '10px', background: '#ffffff', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.8125rem)', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>Clinical Consultation</h4>
                      <p style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.72rem)', color: 'var(--ecare-text-muted)', margin: 0 }}>Video Call or Clinic Visit</p>
                    </div>
                  </div>
                  <div style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', fontWeight: 900, color: 'var(--ecare-primary)', whiteSpace: 'nowrap' }}>
                    {currencySymbol}{Number(selectedDoctor.fee || 0).toLocaleString()}
                  </div>
                </div>

                {/* Visit Mode selector */}
                <div className="ecare-form-group">
                  <label className="ecare-label">Visit Mode</label>
                  <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px', flexWrap: 'wrap' }}>
                    {modeOptions.map(opt => {
                      const isActive = bookingMode === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBookingMode(opt.value)}
                          style={{
                            flex: '1 1 auto',
                            minWidth: 'clamp(80px, 40vw, 120px)',
                            padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                            borderRadius: '12px',
                            border: `1.5px solid ${isActive ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                            background: isActive ? 'var(--ecare-primary-bg)' : '#ffffff',
                            color: isActive ? 'var(--ecare-primary)' : 'var(--ecare-text-main)',
                            fontWeight: 700,
                            fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date Picker Scroller */}
                <div style={{ background: '#f8fafc', padding: 'clamp(0.75rem, 1.5vw, 1rem)', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: 'clamp(0.65rem, 1vw, 0.7rem)', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Select Consultation Date</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => scrollDates('left')} style={{ width: 'clamp(20px, 4vw, 22px)', height: 'clamp(20px, 4vw, 22px)', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ChevronLeft size={10} /></button>
                      <button type="button" onClick={() => scrollDates('right')} style={{ width: 'clamp(20px, 4vw, 22px)', height: 'clamp(20px, 4vw, 22px)', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ChevronRight size={10} /></button>
                    </div>
                  </div>

                  <div 
                    ref={dateScrollRef}
                    style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}
                  >
                    {availableDates.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setBookingDate(d.fullDate)
                          setBookingTime('')
                        }}
                        style={{
                          flexShrink: 0,
                          width: 'clamp(50px, 10vw, 56px)',
                          height: 'clamp(56px, 12vw, 64px)',
                          borderRadius: '12px',
                          border: `1.5px solid ${bookingDate === d.fullDate ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                          background: bookingDate === d.fullDate ? 'var(--ecare-primary-bg)' : '#ffffff',
                          color: bookingDate === d.fullDate ? 'var(--ecare-primary)' : 'var(--ecare-text-main)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: 'clamp(0.55rem, 1vw, 0.625rem)', textTransform: 'uppercase', fontWeight: 800, opacity: 0.6 }}>{d.dayName}</span>
                        <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', fontWeight: 900 }}>{d.dayNum}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slot Picker */}
                <div className="ecare-form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} style={{ color: 'var(--ecare-primary, #1b3b2b)' }} />
                      <label className="ecare-label" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        Available Time Slots
                      </label>
                      {bookingDate && availableSlots.length > 0 && (
                        <span style={{
                          background: availableSlots.filter(s => (typeof s === 'object' ? (!s.isBooked && !s.isPast) : true)).length > 0 ? '#dcfce7' : '#fee2e2',
                          color: availableSlots.filter(s => (typeof s === 'object' ? (!s.isBooked && !s.isPast) : true)).length > 0 ? '#15803d' : '#b91c1c',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {availableSlots.filter(s => (typeof s === 'object' ? (!s.isBooked && !s.isPast) : true)).length} Slots Available
                        </span>
                      )}
                    </div>
                    {bookingDate && availableSlots.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.68rem', color: '#64748b' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--ecare-primary, #10b981)' }}></span>
                          Available
                        </span>
                        {availableSlots.some(s => s && s.isOwnBooking) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }}></span>
                            Your Booking
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }}></span>
                          Booked
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                          Passed
                        </span>
                      </div>
                    )}
                  </div>
                  {!bookingDate ? (
                    <div style={{ 
                      padding: '1.25rem 1rem', 
                      borderRadius: '12px', 
                      background: '#f8fafc', 
                      fontSize: '0.8rem', 
                      color: '#64748b', 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Calendar size={22} style={{ color: '#94a3b8', opacity: 0.8 }} />
                      <span>Please select a consultation date from the calendar above to view available slots</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ 
                      padding: '1.25rem 1rem', 
                      borderRadius: '12px', 
                      background: '#fff1f2', 
                      fontSize: '0.8rem', 
                      color: '#e11d48', 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      border: '1.5px solid #fecdd3',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Clock size={22} style={{ color: '#e11d48', opacity: 0.8 }} />
                      <span>No clinical time slots configured for this date</span>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 120px), 1fr))', 
                      gap: '10px', 
                      marginTop: '6px' 
                    }}>
                      {availableSlots.map(slotObj => {
                        const slotLabel = typeof slotObj === 'string' ? slotObj : slotObj.label
                        const isBooked = typeof slotObj === 'object' ? !!slotObj.isBooked : false
                        const isOwnBooking = typeof slotObj === 'object' ? !!slotObj.isOwnBooking : false
                        const isPast = typeof slotObj === 'object' ? !!slotObj.isPast : false
                        const isSelected = bookingTime === slotLabel

                        const parts = (slotLabel || '').split('-').map(p => p.trim())
                        const startTime = parts[0] || slotLabel
                        const endTime = parts.length > 1 ? parts[1] : null

                        if (isOwnBooking) {
                          return (
                            <div
                              key={slotLabel}
                              onClick={() => toast.info('You have already booked this consultation time slot.')}
                              title="You already have an appointment booked for this slot"
                              style={{
                                padding: '8px 6px',
                                minHeight: '56px',
                                borderRadius: '12px',
                                border: '1.5px solid #93c5fd',
                                background: '#eff6ff',
                                color: '#1e40af',
                                cursor: 'pointer',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                userSelect: 'none',
                                boxSizing: 'border-box',
                                position: 'relative',
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
                              }}
                            >
                              <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px', 
                                fontSize: '0.62rem', 
                                color: '#2563eb', 
                                fontWeight: 800, 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.04em' 
                              }}>
                                <UserCheck size={10} strokeWidth={2.6} />
                                <span>Your Booking</span>
                              </div>
                              <span style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 800, 
                                color: '#1e3a8a',
                                lineHeight: 1.2 
                              }}>
                                {startTime}
                              </span>
                              {endTime && (
                                <span style={{ fontSize: '0.64rem', color: '#3b82f6', fontWeight: 600, lineHeight: 1.2 }}>
                                  to {endTime}
                                </span>
                              )}
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#2563eb'
                              }} />
                            </div>
                          )
                        }

                        if (isBooked) {
                          return (
                            <div
                              key={slotLabel}
                              title="This slot is already booked or reserved"
                              style={{
                                padding: '8px 6px',
                                minHeight: '56px',
                                borderRadius: '12px',
                                border: '1.5px dashed #fecdd3',
                                background: '#fff1f2',
                                color: '#9f1239',
                                cursor: 'not-allowed',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                userSelect: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px', 
                                fontSize: '0.62rem', 
                                color: '#e11d48', 
                                fontWeight: 800, 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.04em' 
                              }}>
                                <Lock size={10} strokeWidth={2.6} />
                                <span>Booked</span>
                              </div>
                              <span style={{ 
                                fontSize: '0.78rem', 
                                fontWeight: 700, 
                                color: '#9f1239', 
                                opacity: 0.65, 
                                textDecoration: 'line-through' 
                              }}>
                                {startTime}
                              </span>
                              {endTime && (
                                <span style={{ fontSize: '0.62rem', color: '#be123c', opacity: 0.5 }}>
                                  to {endTime}
                                </span>
                              )}
                            </div>
                          )
                        }

                        if (isPast) {
                          return (
                            <div
                              key={slotLabel}
                              title="This time slot has already passed"
                              style={{
                                padding: '8px 6px',
                                minHeight: '56px',
                                borderRadius: '12px',
                                border: '1.5px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#94a3b8',
                                cursor: 'not-allowed',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                userSelect: 'none',
                                opacity: 0.65,
                                boxSizing: 'border-box'
                              }}
                            >
                              <span style={{ 
                                fontSize: '0.78rem', 
                                fontWeight: 700, 
                                color: '#94a3b8', 
                                textDecoration: 'line-through' 
                              }}>
                                {startTime}
                              </span>
                              <span style={{ 
                                fontSize: '0.62rem', 
                                fontWeight: 700, 
                                color: '#94a3b8', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.03em' 
                              }}>
                                Passed
                              </span>
                            </div>
                          )
                        }

                        return (
                          <motion.button
                            key={slotLabel}
                            type="button"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setBookingTime(slotLabel)}
                            style={{
                              padding: '8px 8px',
                              minHeight: '56px',
                              borderRadius: '12px',
                              border: `1.5px solid ${isSelected ? 'var(--ecare-primary, #1b3b2b)' : '#e2e8f0'}`,
                              background: isSelected ? 'var(--ecare-primary, #1b3b2b)' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#0f172a',
                              cursor: 'pointer',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                              transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                              boxShadow: isSelected 
                                ? '0 4px 14px rgba(27, 59, 43, 0.28)' 
                                : '0 1px 2px rgba(0,0,0,0.04)',
                              boxSizing: 'border-box',
                              position: 'relative'
                            }}
                          >
                            <span style={{ 
                              fontSize: '0.84rem', 
                              fontWeight: 800, 
                              letterSpacing: '-0.01em', 
                              color: isSelected ? '#ffffff' : '#0f172a',
                              lineHeight: 1.2
                            }}>
                              {startTime}
                            </span>
                            {endTime && (
                              <span style={{ 
                                fontSize: '0.66rem', 
                                fontWeight: 600, 
                                color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#64748b',
                                lineHeight: 1.2
                              }}>
                                to {endTime}
                              </span>
                            )}
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#4ade80'
                              }} />
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Clinical Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'clamp(0.75rem, 1.5vw, 12px)' }}>
                  <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                    <label className="ecare-label">Reason for Consultation</label>
                    <textarea 
                      className="ecare-input" 
                      style={{ height: 'clamp(48px, 10vw, 56px)', resize: 'none', padding: 'clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(0.7rem, 1.2vw, 0.78rem)' }} 
                      placeholder="Briefly describe your symptoms..." 
                      value={bookingReason} 
                      onChange={e => setBookingReason(e.target.value)}
                    />
                  </div>

                  <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                    <label className="ecare-label">Emergency Contact Number</label>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.78rem)' }}
                      placeholder="Active contact phone number" 
                      value={contactNumber} 
                      onChange={e => setContactNumber(e.target.value)}
                    />
                  </div>

                  <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                    <label className="ecare-label">Attach Records (Optional)</label>
                    <div 
                      style={{
                        padding: 'clamp(0.75rem, 2vw, 1rem)',
                        border: `2px dashed ${uploadingFile ? 'var(--ecare-primary)' : '#cbd5e1'}`,
                        borderRadius: '12px',
                        background: '#f8fafc',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => document.getElementById('ecare-file-upload-input').click()}
                    >
                      <input 
                        id="ecare-file-upload-input"
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files)
                          if (files.length === 0) return
                          if (attachedFiles.length + files.length > 3) {
                            toast.error('Maximum 3 documents allowed')
                            return
                          }
                          setUploadingFile(true)
                          const uploaded = []
                          for (let f of files) {
                            const fileObj = await uploadFile(f)
                            if (fileObj) {
                              uploaded.push(fileObj)
                            }
                          }
                          setAttachedFiles(prev => [...prev, ...uploaded])
                          setUploadingFile(false)
                          toast.success('Files attached')
                        }}
                      />
                      <div style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: 'var(--ecare-primary)', marginBottom: '4px' }}>+</div>
                      <div style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.78rem)', fontWeight: 700, color: 'var(--ecare-text-main)' }}>Select Medical Documents</div>
                      <div style={{ fontSize: 'clamp(0.6rem, 1vw, 0.65rem)', color: '#94a3b8', marginTop: '2px' }}>Max 3 files · PDF, PNG, JPG</div>
                    </div>

                    {attachedFiles.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {attachedFiles.map((f, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', padding: 'clamp(3px, 0.8vw, 4px) clamp(6px, 1vw, 8px)', borderRadius: '6px', fontSize: 'clamp(0.65rem, 1vw, 0.72rem)', fontWeight: 600 }}>
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name || f.url || f}
                            </span>
                            <X size={12} strokeWidth={2.5} style={{ cursor: 'pointer' }} onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} />
                          </div>
                        ))}
                      </div>
                    )}
                    {uploadingFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'clamp(0.65rem, 1vw, 0.72rem)', color: 'var(--ecare-primary)', marginTop: '4px' }}>
                        <Loader2 className="ecare-spin" size={12} />
                        <span>Uploading documents...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary footer & CTA */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 'clamp(0.75rem, 2vw, 1.25rem)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: 'clamp(0.6rem, 1vw, 0.625rem)', color: 'var(--ecare-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Fee</div>
                    <div style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', fontWeight: 900, color: 'var(--ecare-primary)' }}>{currencySymbol}{Number(selectedDoctor.fee || 0).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={handleDetailsSubmit}
                    disabled={isSubmittingBooking}
                    className="ecare-button"
                    style={{ padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', whiteSpace: 'nowrap', width: '100%', flex: 1, cursor: isSubmittingBooking ? 'wait' : 'pointer' }}
                  >
                    {isSubmittingBooking ? 'Scheduling...' : !currentUser?.id ? 'Login to Continue' : 'Book Appointment'}
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </div>

              </div>

          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Auth modal JSX
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
                  background: '#fff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '480px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  position: 'relative',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                  pointerEvents: 'auto',
                  border: 'none',
                  padding: 0
                }}
              >
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
                    zIndex: 10
                  }}
                >
                  <X size={16} weight="bold" color="#64748b" />
                </button>
                <AuthApp onSuccess={handleAuthSuccess} popupMode />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )

  return (
    <div ref={containerRef} className="ecare-doctors-container" style={{ padding: '1.25rem 0', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)', boxSizing: 'border-box', background: 'transparent' }}>
      <AnimatePresence mode="wait">
        {selectedDoctor ? (
          <motion.div
            key={`doctor-single-${selectedDoctor.id || selectedDoctor.user_id || selectedDoctor.name}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          >
            {renderDoctorSingleView()}
          </motion.div>
        ) : (
          <motion.div
            key="doctor-archive-list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}
          >
            {/* Filter panel */}
            <div className="ecare-doctors-filters" style={{ padding: '0' }}>
              {/* Search row */}
              <div className="ecare-doctors-search-row">
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search
                    size={18}
                    strokeWidth={2}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                      display: 'block',
                      lineHeight: 1,
                      margin: 0,
                      padding: 0,
                      flexShrink: 0
                    }}
                  />
                  <input 
                    type="text" 
                    className="ecare-input" 
                    style={{ paddingLeft: '40px', fontSize: 'clamp(0.75rem, 1vw, 0.9375rem)' }} 
                    placeholder="Search clinician by name, specialization, degrees..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Dropdowns row */}
              <div className="ecare-doctors-filter-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: 'clamp(0.65rem, 1vw, 0.7rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter Specialty</span>
                  <CustomSelect 
                    value={selectedSpecialty}
                    onChange={setSelectedSpecialty}
                    options={specialtyOptions}
                    placeholder="Select Specialty"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: 'clamp(0.65rem, 1vw, 0.7rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter Service</span>
                  <CustomSelect 
                    value={serviceFilter || 'All'}
                    onChange={val => setServiceFilter(val === 'All' ? null : val)}
                    options={serviceOptions}
                    placeholder="Select Service"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: 'clamp(0.65rem, 1vw, 0.7rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</span>
                  <CustomSelect 
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={statusOptions}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: 'clamp(0.65rem, 1vw, 0.7rem)', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sort By</span>
                  <CustomSelect 
                    value={sortBy}
                    onChange={setSortBy}
                    options={sortOptions}
                  />
                </div>
              </div>
            </div>

            {/* Service Filter Alert */}
            {serviceFilter && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span>Filtering doctors offering service: </span>
                  <strong>{serviceFilter}</strong>
                </div>
                <button 
                  onClick={() => setServiceFilter(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#2563eb',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Grid List */}
            {filteredDoctors.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: 'clamp(2rem, 4vw, 3.5rem) clamp(1rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Animated background glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '28px',
                      background: 'var(--ecare-primary-bg, #eef3f0)',
                      filter: 'blur(4px)'
                    }}
                  />
                  {/* Central icon container */}
                  <motion.div
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                    style={{
                      position: 'relative',
                      width: '84px',
                      height: '84px',
                      borderRadius: '24px',
                      background: '#ffffff',
                      border: '1.5px solid var(--ecare-primary-border, rgba(27, 59, 43, 0.2))',
                      boxShadow: '0 8px 24px var(--ecare-primary-shadow, rgba(27, 59, 43, 0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ecare-primary)'
                    }}
                  >
                    <Search size={38} strokeWidth={2} />
                    <motion.div
                      animate={{ scale: [0.9, 1.1, 0.9] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <X size={14} strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                </div>
                <h3 style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', fontWeight: 800, color: 'var(--ecare-text-main)', margin: '0 0 6px 0' }}>No Doctors Found</h3>
                <p style={{ fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)', color: 'var(--ecare-text-muted)', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                  We couldn't find any doctor matching your search filters. Try refining your spelling or clearing filters.
                </p>
              </motion.div>
            ) : (
              <div className="ecare-doctors-grid">
                {filteredDoctors.map((doc, index) => (
                  <DoctorRegistryCard
                    key={doc.id}
                    doc={doc}
                    index={index}
                    currencySymbol={currencySymbol}
                    doctorAvailability={doctorAvailability}
                    appointments={appointments}
                    reviews={useStore.getState().reviews || []}
                    onConsult={openBookingFlow}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {AuthModal}
    </div>
  )
}
