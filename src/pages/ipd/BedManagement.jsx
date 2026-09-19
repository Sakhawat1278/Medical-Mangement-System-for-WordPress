import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bed as BedIcon, Plus, UserPlus, ArrowsClockwise, CheckCircle, 
  Sparkle, Clock, Heartbeat, X, MagnifyingGlass, User, ShieldCheck,
  FileText, ArrowRight, CaretRight, Trash, CurrencyCircleDollar,
  Buildings, FirstAid, WarningCircle, Check, PaperPlaneTilt, Door
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'
import WardFloorPlan, { STATUS_CONFIG } from './WardFloorPlan'

export default function BedManagement() {
  const {
    ipdWards = [],
    ipdBeds = [],
    ipdAdmissions = [],
    patients = [],
    doctorList = [],
    user,
    initStore,
    addIpdWard,
    addIpdBed,
    updateIpdBed,
    deleteIpdBed,
    markBedStatus,
    addIpdAdmission,
    transferIpdBed,
    dischargeIpdPatient,
    addAdmissionClinicalNote
  } = useStore()

  // State
  const [selectedWardId, setSelectedWardId] = useState(null)
  const [viewMode, setViewMode] = useState('blueprint') // 'blueprint' or 'grid'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  
  // Selected bed for detail drawer
  const [selectedBed, setSelectedBed] = useState(null)

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)
  const [isClinicalNotesOpen, setIsClinicalNotesOpen] = useState(false)
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false)
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false)

  // Auto-select first ward on load
  useEffect(() => {
    if (!selectedWardId && ipdWards.length > 0) {
      setSelectedWardId(ipdWards[0].id)
    }
  }, [ipdWards, selectedWardId])

  // Current active ward
  const activeWard = useMemo(() => {
    return ipdWards.find(w => String(w.id) === String(selectedWardId)) || ipdWards[0] || null
  }, [ipdWards, selectedWardId])

  // Beds in current active ward
  const wardBeds = useMemo(() => {
    if (!activeWard) return ipdBeds
    return ipdBeds.filter(b => String(b.ward_id) === String(activeWard.id))
  }, [ipdBeds, activeWard])

  // Filtered beds for Grid view
  const gridFilteredBeds = useMemo(() => {
    return wardBeds.filter(b => {
      const matchSearch = (b.bed_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.room_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.current_patient_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchStatus = statusFilter === 'ALL' || (b.status || 'Available').toLowerCase() === statusFilter.toLowerCase()
      return matchSearch && matchStatus
    })
  }, [wardBeds, searchQuery, statusFilter])

  // Active admission for selected bed
  const selectedBedAdmission = useMemo(() => {
    if (!selectedBed) return null
    return ipdAdmissions.find(a => String(a.bed_id) === String(selectedBed.id) && a.status === 'Admitted')
  }, [selectedBed, ipdAdmissions])

  // Live KPI Stats for this ward
  const stats = useMemo(() => {
    const total = wardBeds.length
    const occupied = wardBeds.filter(b => b.status === 'Occupied').length
    const available = wardBeds.filter(b => (b.status || 'Available') === 'Available').length
    const cleaning = wardBeds.filter(b => b.status === 'Cleaning').length
    const reserved = wardBeds.filter(b => b.status === 'Reserved').length
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0
    return { total, occupied, available, cleaning, reserved, occupancyRate }
  }, [wardBeds])

  // Quick 1-click mark ready
  const handleQuickReady = async (bedId) => {
    const res = await markBedStatus(bedId, 'Available', 'Sanitization completed and verified by housekeeping.')
    if (res?.success) {
      toast.success('Bed marked Cleaned & Ready for Admission!')
      if (selectedBed && String(selectedBed.id) === String(bedId)) {
        setSelectedBed(prev => ({ ...prev, status: 'Available' }))
      }
    } else {
      toast.error('Could not update bed status.')
    }
  }

  // ---------------------------------------------------------
  // FORM STATES
  // ---------------------------------------------------------
  // Admit Form
  const [admitForm, setAdmitForm] = useState({
    patient_id: '',
    patient_name: '',
    doctor_id: '',
    doctor_name: '',
    bed_id: '',
    admit_date: new Date().toISOString().slice(0, 10),
    expected_discharge: '',
    admission_type: 'Elective',
    diagnosis: '',
    blood_pressure: '120/80',
    heart_rate: '75',
    temperature: '98.6',
    spo2: '98',
    advance_payment: '0',
    notes: ''
  })

  // Open admit modal pre-selected with bed if provided
  const handleOpenAdmit = (bed) => {
    setAdmitForm({
      patient_id: '',
      patient_name: '',
      doctor_id: (doctorList && doctorList[0]?.id) || '',
      doctor_name: (doctorList && doctorList[0]?.name) || '',
      bed_id: bed ? bed.id : '',
      admit_date: new Date().toISOString().slice(0, 10),
      expected_discharge: '',
      admission_type: 'Elective',
      diagnosis: '',
      blood_pressure: '120/80',
      heart_rate: '75',
      temperature: '98.6',
      spo2: '98',
      advance_payment: '0',
      notes: ''
    })
    setIsAdmitModalOpen(true)
  }

  // Submit Admission
  const handleSubmitAdmit = async (e) => {
    e.preventDefault()
    if (!admitForm.patient_name) {
      toast.error('Please enter or select a patient.')
      return
    }
    if (!admitForm.bed_id) {
      toast.error('Please select an available bed.')
      return
    }

    const targetBed = ipdBeds.find(b => String(b.id) === String(admitForm.bed_id))
    const admissionPayload = {
      ...admitForm,
      ward_id: targetBed?.ward_id || activeWard?.id,
      ward_name: activeWard?.name || 'General Ward',
      bed_number: targetBed?.bed_number || `Bed ${targetBed?.id}`,
      room_number: targetBed?.room_number || '401',
      daily_rate: targetBed?.daily_rate || 1500,
      vitals_at_admission: {
        bp: admitForm.blood_pressure,
        hr: admitForm.heart_rate,
        temp: admitForm.temperature,
        spo2: admitForm.spo2
      },
      clinical_notes: [
        {
          timestamp: new Date().toISOString(),
          recorded_by: user?.name || 'Admitting Staff',
          role: 'Admission Assessment',
          bp: admitForm.blood_pressure,
          hr: admitForm.heart_rate,
          temp: admitForm.temperature,
          spo2: admitForm.spo2,
          note: `Patient admitted with preliminary diagnosis: ${admitForm.diagnosis || 'Observation'}. Vitals stable.`
        }
      ]
    }

    const res = await addIpdAdmission(admissionPayload)
    if (res?.success) {
      toast.success(`Patient ${admitForm.patient_name} successfully admitted to ${targetBed?.bed_number}!`)
      setIsAdmitModalOpen(false)
      setSelectedBed(null)
    } else {
      toast.error(res?.message || 'Failed to complete admission.')
    }
  }

  // Transfer Form
  const [transferForm, setTransferForm] = useState({
    target_ward_id: '',
    target_bed_id: '',
    reason: 'Clinical requirement for closer monitoring'
  })

  const handleOpenTransfer = () => {
    setTransferForm({
      target_ward_id: activeWard?.id || '',
      target_bed_id: '',
      reason: 'Clinical requirement for closer monitoring'
    })
    setIsTransferModalOpen(true)
  }

  const handleConfirmTransfer = async () => {
    if (!transferForm.target_bed_id) {
      toast.error('Please select an available destination bed.')
      return
    }
    if (!selectedBedAdmission) {
      toast.error('No active admission found for this bed.')
      return
    }

    const res = await transferIpdBed(
      selectedBedAdmission.id,
      selectedBed.id,
      transferForm.target_bed_id,
      transferForm.reason
    )

    if (res?.success) {
      toast.success('Patient bed transfer completed successfully!')
      setIsTransferModalOpen(false)
      setSelectedBed(null)
    } else {
      toast.error(res?.message || 'Transfer failed.')
    }
  }

  // Discharge Form
  const [dischargeForm, setDischargeForm] = useState({
    discharge_date: new Date().toISOString().slice(0, 10),
    condition: 'Recovered & Clinically Stable',
    advice: 'Take prescribed medication for 5 days. Return for follow-up in 1 week.',
    payment_method: 'Cash',
    discount: '0'
  })

  // Calculate discharge financial figures
  const dischargeCalculations = useMemo(() => {
    if (!selectedBedAdmission || !selectedBed) return { days: 1, rate: 1500, roomCharge: 1500, total: 1500 }
    
    const admitDate = new Date(selectedBedAdmission.admit_date || selectedBedAdmission.created_at || new Date())
    const dischargeDate = new Date(dischargeForm.discharge_date)
    const diffTime = Math.abs(dischargeDate - admitDate)
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    
    const dailyRate = Number(selectedBed.daily_rate || selectedBedAdmission.daily_rate || 1500)
    const roomCharge = diffDays * dailyRate
    const discount = Number(dischargeForm.discount || 0)
    const total = Math.max(0, roomCharge - discount)

    return { days: diffDays, rate: dailyRate, roomCharge, discount, total }
  }, [selectedBedAdmission, selectedBed, dischargeForm])

  const handleOpenDischarge = () => {
    setDischargeForm({
      discharge_date: new Date().toISOString().slice(0, 10),
      condition: 'Recovered & Clinically Stable',
      advice: 'Take prescribed medication for 5 days. Return for follow-up in 1 week.',
      payment_method: 'Cash',
      discount: '0'
    })
    setIsDischargeModalOpen(true)
  }

  const handleConfirmDischarge = async () => {
    if (!selectedBedAdmission) {
      toast.error('No active admission found.')
      return
    }

    const dischargePayload = {
      discharge_date: dischargeForm.discharge_date,
      days_stayed: dischargeCalculations.days,
      room_charges: dischargeCalculations.roomCharge,
      total_amount: dischargeCalculations.total,
      condition: dischargeForm.condition,
      advice: dischargeForm.advice,
      payment_method: dischargeForm.payment_method
    }

    const res = await dischargeIpdPatient(selectedBedAdmission.id, dischargePayload)
    if (res?.success) {
      toast.success(`Patient discharged! Room charges invoice generated in Billing.`)
      setIsDischargeModalOpen(false)
      setSelectedBed(null)
    } else {
      toast.error(res?.message || 'Discharge failed.')
    }
  }

  // Clinical Rounds / Vitals Form
  const [newClinicalNote, setNewClinicalNote] = useState({
    bp: '120/80',
    hr: '72',
    temp: '98.6',
    spo2: '98',
    note: ''
  })

  const handleAddClinicalNote = async (e) => {
    e.preventDefault()
    if (!newClinicalNote.note.trim()) {
      toast.error('Please enter a clinical progress note.')
      return
    }
    if (!selectedBedAdmission) return

    const notePayload = {
      timestamp: new Date().toISOString(),
      recorded_by: user?.name || 'Attending Physician',
      role: user?.ecareRole || 'Doctor',
      bp: newClinicalNote.bp,
      hr: newClinicalNote.hr,
      temp: newClinicalNote.temp,
      spo2: newClinicalNote.spo2,
      note: newClinicalNote.note
    }

    const res = await addAdmissionClinicalNote(selectedBedAdmission.id, notePayload)
    if (res?.success) {
      toast.success('Clinical progress note saved to patient chart!')
      setNewClinicalNote({ bp: '120/80', hr: '72', temp: '98.6', spo2: '98', note: '' })
    } else {
      toast.error('Could not save note.')
    }
  }

  // Add Bed Form
  const [newBedForm, setNewBedForm] = useState({
    bed_number: '',
    room_number: '401',
    bed_type: 'Standard Electric',
    daily_rate: '1500',
    features: 'Oxygen Port, IV Pole, Nurse Call Button'
  })

  const handleAddBed = async (e) => {
    e.preventDefault()
    if (!newBedForm.bed_number) {
      toast.error('Please enter a bed number (e.g. Bed 401A).')
      return
    }

    const res = await addIpdBed({
      ...newBedForm,
      ward_id: activeWard?.id,
      ward_name: activeWard?.name,
      daily_rate: Number(newBedForm.daily_rate) || 1500,
      status: 'Available'
    })

    if (res?.success) {
      toast.success(`Bed ${newBedForm.bed_number} added successfully!`)
      setIsAddBedModalOpen(false)
      setNewBedForm({ bed_number: '', room_number: '401', bed_type: 'Standard Electric', daily_rate: '1500', features: 'Oxygen Port, IV Pole, Nurse Call Button' })
    } else {
      toast.error('Failed to add bed.')
    }
  }

  // Add Ward Form
  const [newWardForm, setNewWardForm] = useState({
    name: '',
    floor: 'Level 4',
    wing: 'East Wing',
    department: 'Medical-Surgical',
    charge_nurse: ''
  })

  const handleAddWard = async (e) => {
    e.preventDefault()
    if (!newWardForm.name) {
      toast.error('Please enter ward name.')
      return
    }

    const res = await addIpdWard(newWardForm)
    if (res?.success) {
      toast.success(`Ward "${newWardForm.name}" created!`)
      setIsAddWardModalOpen(false)
      setNewWardForm({ name: '', floor: 'Level 4', wing: 'East Wing', department: 'Medical-Surgical', charge_nurse: '' })
      if (res.data?.id) setSelectedWardId(res.data.id)
    } else {
      toast.error('Failed to create ward.')
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ paddingBottom: '3rem' }}
    >
      {/* Top Banner & Primary Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Inpatient Bed & Ward Management (IPD)
            </h1>
            <span style={{ 
              background: 'var(--ecare-primary-bg, #eff6ff)', 
              color: 'var(--ecare-primary, #0284c7)', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '2px 8px', 
              borderRadius: '999px',
              border: '1px solid var(--ecare-primary-border, #bfdbfe)'
            }}>
              LIVE CENSUS
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Real-time visual bed census, clinical admission workflows, patient transfers, and discharge billing.
          </p>
        </div>

        {/* Global CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenAdmit(null)}
            className="ecare-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'var(--ecare-primary, #0284c7)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
            }}
          >
            <UserPlus size={16} weight="bold" />
            Admit Patient
          </button>

          <button
            onClick={() => setIsAddBedModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1'
            }}
          >
            <Plus size={15} weight="bold" />
            Add Bed
          </button>

          <button
            onClick={() => setIsAddWardModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1'
            }}
          >
            <Buildings size={15} weight="bold" />
            Add Ward
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 5, '--stat-grid-cols-md': 3, marginBottom: '1.25rem' }}>
        {/* Total Beds */}
        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BedIcon size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Capacity</div>
            <div style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{stats.total} Beds</div>
          </div>
        </div>

        {/* Occupied */}
        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Occupied ({stats.occupancyRate}%)</div>
            <div style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 800 }}>{stats.occupied} Patients</div>
          </div>
        </div>

        {/* Available */}
        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Available Now</div>
            <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 800 }}>{stats.available} Ready</div>
          </div>
        </div>

        {/* Sanitizing / Cleaning */}
        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkle size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Sanitizing</div>
            <div style={{ color: '#d97706', fontSize: '1.25rem', fontWeight: 800 }}>{stats.cleaning} Housekeeping</div>
          </div>
        </div>

        {/* Reserved */}
        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Reserved</div>
            <div style={{ color: '#2563eb', fontSize: '1.25rem', fontWeight: 800 }}>{stats.reserved} On Hold</div>
          </div>
        </div>
      </div>

      {/* Ward Switcher Tabs & View Mode Switcher */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '1rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0.75rem'
      }}>
        {/* Ward Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {ipdWards.map(ward => {
            const isWardActive = String(ward.id) === String(activeWard?.id)
            const countInWard = ipdBeds.filter(b => String(b.ward_id) === String(ward.id)).length
            return (
              <button
                key={ward.id}
                onClick={() => {
                  setSelectedWardId(ward.id)
                  setSelectedBed(null)
                }}
                style={{
                  background: isWardActive ? '#0f172a' : '#ffffff',
                  color: isWardActive ? '#ffffff' : '#475569',
                  border: `1.5px solid ${isWardActive ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '999px',
                  padding: '7px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{ward.name}</span>
                <span style={{
                  background: isWardActive ? '#334155' : '#f1f5f9',
                  color: isWardActive ? '#ffffff' : '#64748b',
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '999px'
                }}>
                  {countInWard} beds
                </span>
              </button>
            )
          })}
        </div>

        {/* View Mode Toggle: Blueprint vs Grid */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('blueprint')}
            style={{
              background: viewMode === 'blueprint' ? '#ffffff' : 'transparent',
              color: viewMode === 'blueprint' ? 'var(--ecare-primary, #0284c7)' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: viewMode === 'blueprint' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🏛️ Architectural Blueprint
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              background: viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: viewMode === 'grid' ? 'var(--ecare-primary, #0284c7)' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📊 Grid List
          </button>
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      {viewMode === 'blueprint' ? (
        <WardFloorPlan
          ward={activeWard}
          beds={wardBeds}
          admissions={ipdAdmissions}
          onSelectBed={(bed) => setSelectedBed(bed)}
          onQuickReadyBed={handleQuickReady}
          selectedBedId={selectedBed?.id}
        />
      ) : (
        /* GRID VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', width: '300px' }}>
              <MagnifyingGlass size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search bed, room, patient..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'Available', 'Occupied', 'Cleaning', 'Reserved'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background: statusFilter === st ? '#0f172a' : '#ffffff',
                    color: statusFilter === st ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bed Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {gridFilteredBeds.map(bed => {
              const admission = ipdAdmissions.find(a => String(a.bed_id) === String(bed.id) && a.status === 'Admitted')
              const statusCfg = STATUS_CONFIG[bed.status || 'Available'] || STATUS_CONFIG.Available
              return (
                <div
                  key={bed.id}
                  onClick={() => setSelectedBed(bed)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedBed?.id === bed.id ? 'var(--ecare-primary, #0284c7)' : statusCfg.border}`,
                    padding: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      {bed.bed_number}
                    </div>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '999px',
                      background: statusCfg.badgeBg,
                      color: statusCfg.badgeText
                    }}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Room {bed.room_number || '401'} • {bed.bed_type || 'Standard'}
                  </div>

                  {bed.status === 'Occupied' && (
                    <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {admission?.patient_name || bed.current_patient_name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                        🩺 {admission?.diagnosis || bed.diagnosis || 'Post-Op'}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '0.75rem' }}>
                    <span style={{ color: '#64748b' }}>Daily Rate</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>৳{Number(bed.daily_rate || 1500).toLocaleString()}/day</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BED DETAIL DRAWER / SLIDEOVER MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedBed && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(3px)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'flex-end'
              }}
              onClick={() => setSelectedBed(null)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  height: '100%',
                  background: '#ffffff',
                  boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drawer Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: STATUS_CONFIG[selectedBed.status || 'Available']?.badgeBg,
                      color: STATUS_CONFIG[selectedBed.status || 'Available']?.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BedIcon size={20} weight="duotone" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                        {selectedBed.bed_number}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {activeWard?.name} • Room {selectedBed.room_number || '401'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedBed(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
                  
                  {/* Status Banner */}
                  <div style={{
                    background: STATUS_CONFIG[selectedBed.status || 'Available']?.bg,
                    border: `1.5px solid ${STATUS_CONFIG[selectedBed.status || 'Available']?.border}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_CONFIG[selectedBed.status || 'Available']?.dot }} />
                      <span style={{ fontWeight: 700, color: STATUS_CONFIG[selectedBed.status || 'Available']?.badgeText, fontSize: '0.86rem' }}>
                        {STATUS_CONFIG[selectedBed.status || 'Available']?.label}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                      ৳{Number(selectedBed.daily_rate || 1500).toLocaleString()}/day
                    </span>
                  </div>

                  {/* IF OCCUPIED: PATIENT CLINICAL SUMMARY */}
                  {selectedBed.status === 'Occupied' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Admitted Patient Details
                      </div>

                      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                              {selectedBedAdmission?.patient_name || selectedBed.current_patient_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Admission ID: #{selectedBedAdmission?.id || 'N/A'}
                            </div>
                          </div>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>
                            {selectedBedAdmission?.admission_type || 'Inpatient'}
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                          <div>
                            <span style={{ color: '#64748b' }}>Attending Doctor:</span>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>
                              {selectedBedAdmission?.doctor_name || selectedBed.doctor_name || 'Dr. Assigned'}
                            </div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Admitted Date:</span>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>
                              {selectedBedAdmission?.admit_date || 'Today'}
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#64748b' }}>Primary Diagnosis:</span>
                          <div style={{ fontWeight: 600, color: '#0f172a', background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '3px' }}>
                            🩺 {selectedBedAdmission?.diagnosis || selectedBed.diagnosis || 'Post-Operative Monitoring'}
                          </div>
                        </div>
                      </div>

                      {/* Primary Clinical Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          onClick={() => setIsClinicalNotesOpen(true)}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                          }}
                        >
                          <FileText size={18} weight="bold" />
                          Clinical Rounds & Daily Notes
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            onClick={handleOpenTransfer}
                            style={{
                              background: '#ffffff',
                              color: '#334155',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '9px 12px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <ArrowsClockwise size={16} weight="bold" />
                            Transfer Bed
                          </button>

                          <button
                            onClick={handleOpenDischarge}
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1.5px solid #fecaca',
                              borderRadius: '8px',
                              padding: '9px 12px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckCircle size={16} weight="bold" />
                            Discharge & Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IF AVAILABLE: QUICK ADMIT BUTTON */}
                  {selectedBed.status === 'Available' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ textAlign: 'center', padding: '16px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                        <CheckCircle size={32} color="#10b981" weight="duotone" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.95rem' }}>
                          Bed is Clean & Ready
                        </div>
                        <div style={{ color: '#047857', fontSize: '0.75rem', marginTop: '2px' }}>
                          Equipped with oxygen ports, fresh linens, and monitor.
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAdmit(selectedBed)}
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <UserPlus size={18} weight="bold" />
                        Admit Patient to this Bed
                      </button>
                    </div>
                  )}

                  {/* IF CLEANING: 1-CLICK MARK READY */}
                  {selectedBed.status === 'Cleaning' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ textAlign: 'center', padding: '16px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                        <Sparkle size={32} color="#f59e0b" weight="duotone" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem' }}>
                          Sanitization in Progress
                        </div>
                        <div style={{ color: '#b45309', fontSize: '0.75rem', marginTop: '2px' }}>
                          Bed linen changing, terminal disinfectant wipe-down.
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickReady(selectedBed.id)}
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle size={18} weight="bold" />
                        Mark Sanitized & Ready
                      </button>
                    </div>
                  )}

                  {/* Bed Amenities Specifications */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Bed Specifications
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>Type:</strong> {selectedBed.bed_type || 'Standard Electric Multi-Function'}</div>
                      <div><strong>Room:</strong> Room {selectedBed.room_number || '401'}</div>
                      <div><strong>Features:</strong> {selectedBed.features || 'Central O2, IV Pole, Nurse Alert, Emergency Cord'}</div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 1: ADMIT PATIENT */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAdmitModalOpen && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsAdmitModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '560px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--ecare-primary-bg, #eff6ff)', color: 'var(--ecare-primary, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserPlus size={18} weight="bold" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      Inpatient Admission (IPD)
                    </div>
                  </div>
                  <button onClick={() => setIsAdmitModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitAdmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Patient Name / Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Patient Name *
                    </label>
                    <CustomSelect
                      value={admitForm.patient_id}
                      onChange={(val) => {
                        const pat = patients.find(p => String(p.id) === String(val) || String(p.user_id) === String(val))
                        setAdmitForm(prev => ({
                          ...prev,
                          patient_id: val,
                          patient_name: pat ? pat.name : val
                        }))
                      }}
                      options={patients.map(p => ({ value: String(p.id), label: `${p.name} (Phone: ${p.phone || 'N/A'})` }))}
                      placeholder="Select existing patient or type name"
                      isSearchable={true}
                    />
                    {!admitForm.patient_id && (
                      <input
                        type="text"
                        placeholder="Or enter patient name manually"
                        value={admitForm.patient_name}
                        onChange={e => setAdmitForm(prev => ({ ...prev, patient_name: e.target.value }))}
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    )}
                  </div>

                  {/* Bed & Ward Selection */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Ward
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={activeWard?.name || 'Ward 4 East'} 
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.82rem', color: '#64748b' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Available Bed *
                      </label>
                      <CustomSelect
                        value={admitForm.bed_id}
                        onChange={(val) => setAdmitForm(prev => ({ ...prev, bed_id: val }))}
                        options={wardBeds.filter(b => (b.status || 'Available') === 'Available' || String(b.id) === String(admitForm.bed_id)).map(b => ({
                          value: String(b.id),
                          label: `${b.bed_number} (Room ${b.room_number}) - ৳${b.daily_rate}/d`
                        }))}
                        placeholder="Select Bed"
                      />
                    </div>
                  </div>

                  {/* Attending Doctor */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Attending Physician *
                    </label>
                    <CustomSelect
                      value={admitForm.doctor_id}
                      onChange={(val) => {
                        const doc = doctorList.find(d => String(d.id) === String(val) || String(d.user_id) === String(val))
                        setAdmitForm(prev => ({
                          ...prev,
                          doctor_id: val,
                          doctor_name: doc ? doc.name : val
                        }))
                      }}
                      options={doctorList.map(d => ({ value: String(d.id), label: `${d.name} (${d.specialty || 'General'})` }))}
                      placeholder="Select Doctor"
                      isSearchable={true}
                    />
                  </div>

                  {/* Dates & Admission Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Admission Date
                      </label>
                      <input
                        type="date"
                        value={admitForm.admit_date}
                        onChange={e => setAdmitForm(prev => ({ ...prev, admit_date: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Admission Type
                      </label>
                      <CustomSelect
                        value={admitForm.admission_type}
                        onChange={(val) => setAdmitForm(prev => ({ ...prev, admission_type: val }))}
                        options={[
                          { value: 'Elective', label: 'Elective' },
                          { value: 'Emergency', label: 'Emergency' },
                          { value: 'Post-Op Transfer', label: 'Post-Op Transfer' },
                          { value: 'Day Care', label: 'Day Care' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Primary Diagnosis / Chief Complaint
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acute Appendicitis, Knee Arthroplasty, Pneumonia"
                      value={admitForm.diagnosis}
                      onChange={e => setAdmitForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>

                  {/* Initial Vitals Grid */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Initial Admission Vitals
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>BP (mmHg)</span>
                        <input
                          type="text"
                          value={admitForm.blood_pressure}
                          onChange={e => setAdmitForm(prev => ({ ...prev, blood_pressure: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Pulse (bpm)</span>
                        <input
                          type="text"
                          value={admitForm.heart_rate}
                          onChange={e => setAdmitForm(prev => ({ ...prev, heart_rate: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Temp (°F)</span>
                        <input
                          type="text"
                          value={admitForm.temperature}
                          onChange={e => setAdmitForm(prev => ({ ...prev, temperature: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>SpO2 (%)</span>
                        <input
                          type="text"
                          value={admitForm.spo2}
                          onChange={e => setAdmitForm(prev => ({ ...prev, spo2: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAdmitModalOpen(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        background: 'var(--ecare-primary, #0284c7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                      }}
                    >
                      Confirm Admission
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 2: CLINICAL ROUNDS & DAILY NOTES */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isClinicalNotesOpen && selectedBedAdmission && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsClinicalNotesOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '620px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      Clinical Rounds & Daily Notes
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Patient: <strong>{selectedBedAdmission.patient_name}</strong> • {selectedBed?.bed_number}
                    </div>
                  </div>
                  <button onClick={() => setIsClinicalNotesOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Append New Note Form */}
                  <form onSubmit={handleAddClinicalNote} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                      + Record New Clinical Assessment / Round
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: '#64748b' }}>BP (mmHg)</span>
                        <input
                          type="text"
                          value={newClinicalNote.bp}
                          onChange={e => setNewClinicalNote(prev => ({ ...prev, bp: e.target.value }))}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Pulse (bpm)</span>
                        <input
                          type="text"
                          value={newClinicalNote.hr}
                          onChange={e => setNewClinicalNote(prev => ({ ...prev, hr: e.target.value }))}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Temp (°F)</span>
                        <input
                          type="text"
                          value={newClinicalNote.temp}
                          onChange={e => setNewClinicalNote(prev => ({ ...prev, temp: e.target.value }))}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', color: '#64748b' }}>SpO2 (%)</span>
                        <input
                          type="text"
                          value={newClinicalNote.spo2}
                          onChange={e => setNewClinicalNote(prev => ({ ...prev, spo2: e.target.value }))}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows="2"
                        placeholder="Enter doctor's examination findings, clinical response, and medications..."
                        value={newClinicalNote.note}
                        onChange={e => setNewClinicalNote(prev => ({ ...prev, note: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Save Clinical Note
                      </button>
                    </div>
                  </form>

                  {/* Previous Notes Timeline */}
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Historical Rounds & Observations ({(selectedBedAdmission.clinical_notes || []).length})
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                      {(selectedBedAdmission.clinical_notes || []).map((cn, idx) => (
                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              🩺 {cn.recorded_by} ({cn.role || 'Doctor'})
                            </span>
                            <span style={{ color: '#64748b' }}>
                              {cn.timestamp ? new Date(cn.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: '#0369a1', background: '#f0f9ff', padding: '3px 8px', borderRadius: '4px' }}>
                            <span>BP: <strong>{cn.bp || '120/80'}</strong></span>
                            <span>HR: <strong>{cn.hr || '72'} bpm</strong></span>
                            <span>Temp: <strong>{cn.temp || '98.6'}°F</strong></span>
                            <span>SpO2: <strong>{cn.spo2 || '98'}%</strong></span>
                          </div>

                          <p style={{ margin: 0, fontSize: '0.76rem', color: '#334155', lineHeight: 1.4 }}>
                            {cn.note}
                          </p>
                        </div>
                      ))}

                      {(!selectedBedAdmission.clinical_notes || selectedBedAdmission.clinical_notes.length === 0) && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.76rem', padding: '16px' }}>
                          No clinical notes entered yet.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 3: BED TRANSFER */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isTransferModalOpen && selectedBedAdmission && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsTransferModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '500px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    Transfer Patient Bed
                  </div>
                  <button onClick={() => setIsTransferModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                    <div>Patient: <strong>{selectedBedAdmission.patient_name}</strong></div>
                    <div>Current Location: <strong>{activeWard?.name} - {selectedBed?.bed_number}</strong></div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Select Target Available Bed *
                    </label>
                    <CustomSelect
                      value={transferForm.target_bed_id}
                      onChange={(val) => setTransferForm(prev => ({ ...prev, target_bed_id: val }))}
                      options={ipdBeds.filter(b => (b.status || 'Available') === 'Available' && String(b.id) !== String(selectedBed?.id)).map(b => ({
                        value: String(b.id),
                        label: `${b.bed_number} (${b.ward_name || 'Ward'}) - ৳${b.daily_rate}/d`
                      }))}
                      placeholder="Choose destination bed"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Reason for Bed Transfer
                    </label>
                    <input
                      type="text"
                      value={transferForm.reason}
                      onChange={e => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748b', background: '#fffbeb', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                    💡 Note: Upon transfer, <strong>{selectedBed?.bed_number}</strong> will automatically be flagged as <em>Cleaning / Sanitizing</em> for housekeeping.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTransfer}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 4: DISCHARGE PATIENT & INVOICE */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isDischargeModalOpen && selectedBedAdmission && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsDischargeModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '520px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    Patient Discharge & Bed Billing
                  </div>
                  <button onClick={() => setIsDischargeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Financial Bill Card */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1.5px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>Patient:</span>
                      <strong style={{ color: '#0f172a' }}>{selectedBedAdmission.patient_name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>Bed / Ward:</span>
                      <span>{selectedBed?.bed_number} ({activeWard?.name})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>Stay Duration:</span>
                      <span><strong>{dischargeCalculations.days} Days</strong> (@ ৳{dischargeCalculations.rate}/day)</span>
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Total Bed Charges:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                        ৳{dischargeCalculations.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Discharge Date & Condition */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Discharge Date
                      </label>
                      <input
                        type="date"
                        value={dischargeForm.discharge_date}
                        onChange={e => setDischargeForm(prev => ({ ...prev, discharge_date: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Discharge Condition
                      </label>
                      <CustomSelect
                        value={dischargeForm.condition}
                        onChange={(val) => setDischargeForm(prev => ({ ...prev, condition: val }))}
                        options={[
                          { value: 'Recovered & Clinically Stable', label: 'Recovered & Stable' },
                          { value: 'Improved', label: 'Improved' },
                          { value: 'Referred to Higher Facility', label: 'Referred' },
                          { value: 'Discharged Against Medical Advice (LAMA)', label: 'LAMA' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Settlement Payment Method
                    </label>
                    <CustomSelect
                      value={dischargeForm.payment_method}
                      onChange={(val) => setDischargeForm(prev => ({ ...prev, payment_method: val }))}
                      options={[
                        { value: 'Cash', label: 'Cash at Billing Desk' },
                        { value: 'Credit/Debit Card', label: 'Card' },
                        { value: 'bKash / Nagad', label: 'bKash / Nagad' },
                        { value: 'Health Insurance', label: 'Health Insurance' }
                      ]}
                    />
                  </div>

                  {/* Discharge Advice */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Discharge Advice & Follow-Up Instructions
                    </label>
                    <textarea
                      rows="2"
                      value={dischargeForm.advice}
                      onChange={e => setDischargeForm(prev => ({ ...prev, advice: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setIsDischargeModalOpen(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDischarge}
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      Confirm Discharge & Post Bill
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 5: ADD BED */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAddBedModalOpen && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsAddBedModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '460px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    Add New Bed to {activeWard?.name}
                  </div>
                  <button onClick={() => setIsAddBedModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddBed} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Bed Number * (e.g. Bed 401A, Bed 406B)
                    </label>
                    <input
                      type="text"
                      placeholder="Bed 401A"
                      value={newBedForm.bed_number}
                      onChange={e => setNewBedForm(prev => ({ ...prev, bed_number: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Room Number
                      </label>
                      <input
                        type="text"
                        placeholder="401"
                        value={newBedForm.room_number}
                        onChange={e => setNewBedForm(prev => ({ ...prev, room_number: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Daily Rate (৳)
                      </label>
                      <input
                        type="number"
                        placeholder="1500"
                        value={newBedForm.daily_rate}
                        onChange={e => setNewBedForm(prev => ({ ...prev, daily_rate: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Bed Type
                    </label>
                    <CustomSelect
                      value={newBedForm.bed_type}
                      onChange={(val) => setNewBedForm(prev => ({ ...prev, bed_type: val }))}
                      options={[
                        { value: 'Standard Semi-Fowler', label: 'Standard Semi-Fowler' },
                        { value: 'Full Electric ICU Bed', label: 'Full Electric ICU Bed' },
                        { value: 'VIP Deluxe Cabin Bed', label: 'VIP Deluxe Cabin Bed' },
                        { value: 'Pediatric Cot', label: 'Pediatric Cot' }
                      ]}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddBedModalOpen(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        background: 'var(--ecare-primary, #0284c7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Save Bed
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 6: ADD WARD */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAddWardModalOpen && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsAddWardModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '460px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    Create Hospital Ward / Wing
                  </div>
                  <button onClick={() => setIsAddWardModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddWard} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Ward Name * (e.g. Ward 5 West, Coronary Care Unit)
                    </label>
                    <input
                      type="text"
                      placeholder="Ward 5 West"
                      value={newWardForm.name}
                      onChange={e => setNewWardForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Floor / Level
                      </label>
                      <input
                        type="text"
                        placeholder="Level 4"
                        value={newWardForm.floor}
                        onChange={e => setNewWardForm(prev => ({ ...prev, floor: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Wing / Block
                      </label>
                      <input
                        type="text"
                        placeholder="East Wing"
                        value={newWardForm.wing}
                        onChange={e => setNewWardForm(prev => ({ ...prev, wing: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddWardModalOpen(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        background: 'var(--ecare-primary, #0284c7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Create Ward
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
