import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api, { apiOp } from '../utils/api'
import toast from 'react-hot-toast'
import React from 'react'
import { 
  UserPlus, User, Users, CalendarPlus, 
  Stethoscope, Briefcase, 
  CreditCard, Video, CheckCircle, Phone
} from 'lucide-react'
import { normalizeGender } from '../utils/gender'
import { formatPaymentMethod } from '../utils/formatters'

const isVideoConsultMode = (mode) => {
  const normalized = String(mode || '').trim().toLowerCase()
  return normalized === 'video consult' || normalized === 'telemedicine'
}

const parseTimeValue = (timeStr) => {
  const value = String(timeStr || '').trim()
  if (!value) return null

  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHour) {
    return {
      hours: parseInt(twentyFourHour[1], 10),
      minutes: parseInt(twentyFourHour[2], 10),
    }
  }

  const twelveHour = value.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!twelveHour) return null

  let hours = parseInt(twelveHour[1], 10)
  const minutes = parseInt(twelveHour[2], 10)
  const ampm = twelveHour[3].toUpperCase()
  if (ampm === 'PM' && hours < 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  return { hours, minutes }
}

// Utility to check if an appointment timeslot has already ended
export const isTimeslotEnded = (dateStr, timeStr) => {
  if (!dateStr) return false;
  try {
    let timePart = timeStr || '12:00 PM';
    let hasEndPart = false;
    if (timePart.includes('-')) {
      timePart = timePart.split('-')[1].trim();
      hasEndPart = true;
    }
    const parsedTime = parseTimeValue(timePart) || { hours: 12, minutes: 0 };
    const { hours, minutes } = parsedTime;
    const [year, month, day] = dateStr.split('-').map(Number);
    const appointmentEndTime = new Date(year, month - 1, day, hours, minutes);
    if (!hasEndPart) {
      // If there is no end time part, assume 1 hour duration
      appointmentEndTime.setHours(appointmentEndTime.getHours() + 1);
    }
    return new Date() > appointmentEndTime;
  } catch (e) {
    const d = new Date();
    const today = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return dateStr < today;
  }
};

// Utility to check if an appointment timeslot is currently active (including a 15-min check-in buffer)
export const isTimeslotActive = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  try {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    if (dateStr < todayStr) return false; // Past day
    if (dateStr > todayStr) return false; // Future day

    let startPart = timeStr;
    let endPart = timeStr;
    let hasEndPart = false;
    if (timeStr.includes('-')) {
      const parts = timeStr.split('-');
      startPart = parts[0].trim();
      endPart = parts[1].trim();
      hasEndPart = true;
    }

    const start = parseTimeValue(startPart);
    const end = parseTimeValue(endPart);
    if (!start || !end) return true;

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    const startMin = start.hours * 60 + start.minutes - 15; // 15-min early buffer
    let endMin;
    if (hasEndPart) {
      endMin = end.hours * 60 + end.minutes;
    } else {
      endMin = start.hours * 60 + start.minutes + 60; // 1 hour duration
    }

    return currentMin >= startMin && currentMin <= endMin;
  } catch (e) {
    return true;
  }
};

// Utility to check if an appointment timeslot is scheduled for the future
export const isTimeslotFuture = (dateStr, timeStr) => {
  if (!dateStr) return false;
  try {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    if (dateStr > todayStr) return true;
    if (dateStr < todayStr) return false;

    let startPart = timeStr || '12:00 PM';
    if (timeStr && timeStr.includes('-')) {
      startPart = timeStr.split('-')[0].trim();
    }

    const parsedTime = parseTimeValue(startPart) || { hours: 12, minutes: 0 };
    const { hours, minutes } = parsedTime;
    const [year, month, day] = dateStr.split('-').map(Number);
    const appointmentStartTime = new Date(year, month - 1, day, hours, minutes);
    
    const nowWithBuffer = new Date(new Date().getTime() + 15 * 60 * 1000);
    return appointmentStartTime > nowWithBuffer;
  } catch (e) {
    return false;
  }
};

// Centralized Notification Compiler for all user roles, clinical events, booking states, and payments
const compileDynamicNotifications = (
  currentUser, dbNotifs, allDoctors, careProviders, ambulance, 
  manualVerifications, supportTickets, supportMessages, appointments, 
  careProviderBookings, ambulanceBookings, telemedMessages, billing,
  labOrders = [], readSystemNotifs = []
) => {
  const dynamicNotifs = [];
  if (!currentUser?.id) return Array.isArray(dbNotifs) ? dbNotifs : [];

  const rawRole = String(currentUser?.ecareRole || currentUser?.role || 'none').toLowerCase();
  const wpRoles = (Array.isArray(currentUser?.wpRoles) ? currentUser.wpRoles : []).map(r => String(r).toLowerCase());

  const isAdmin = rawRole === 'admin' || rawRole === 'administrator' || wpRoles.includes('administrator');
  const isDoctor = rawRole === 'doctor';
  const isPatient = rawRole === 'patient';
  const isStaff = isAdmin || ['staff', 'receptionist', 'nurse', 'pharmacist', 'lab_tech', 'clinic_staff', 'manager', 'editor', 'shop_manager'].includes(rawRole);
  const currentUserId = parseInt(currentUser.id);

  // Helper to check if a dynamic alert is marked read locally
  const isRead = (id) => (Array.isArray(readSystemNotifs) ? readSystemNotifs : []).includes(id);

  // 1. ADMIN & CLINIC STAFF ALERTS
  if (isStaff) {
    // A. Pending Doctor Applications
    (Array.isArray(allDoctors) ? allDoctors : []).filter(d => d.status === 'Pending').forEach(d => {
      const id = `sys-doc-pending-${d.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: 'New Doctor Application',
          description: `${d.name} (${d.speciality || d.specialization || 'General Medicine'}) registered and requires verification.`,
          read: false,
          time: 'Verify'
        });
      }
    });

    // B. Pending Care Provider Registrations
    (Array.isArray(careProviders) ? careProviders : []).filter(p => p.status === 'Pending').forEach(p => {
      const id = `sys-cp-pending-${p.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: 'New Care Provider Registration',
          description: `${p.name} (${p.speciality || 'General'}) awaiting credential verification.`,
          read: false,
          time: 'Verify'
        });
      }
    });

    // C. Pending Ambulance Drivers / Vehicles
    (Array.isArray(ambulance) ? ambulance : []).filter(a => a.status === 'Pending').forEach(a => {
      const id = `sys-amb-pending-${a.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'ambulance',
          title: 'New Ambulance Verification',
          description: `${a.driver_name || a.driverName || 'New Operator'} registered vehicle ${a.vehiclePlate || ''} awaiting approval.`,
          read: false,
          time: 'Verify'
        });
      }
    });

    // D. Pending Offline Manual Payment Transfers
    (Array.isArray(manualVerifications) ? manualVerifications : []).filter(v => v.status === 'Pending').forEach(v => {
      const id = `sys-mv-pending-${v.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'billing',
          title: 'Pending Offline Payment Transfer',
          description: `Manual transfer for Invoice #${v.invoiceNo || v.id} (৳${v.amount}) submitted by ${v.patientName || 'Patient'} needs review.`,
          read: false,
          time: 'Review'
        });
      }
    });

    // E. Open Support Tickets
    (Array.isArray(supportTickets) ? supportTickets : []).filter(t => t.status === 'Open').forEach(t => {
      const id = `sys-ticket-open-${t.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'emergency',
          title: 'Open Support Ticket',
          description: `Support ticket #${t.id} '${t.title}' from ${t.user_name || 'User'} needs assistance.`,
          read: false,
          time: 'Open'
        });
      }
    });

    // F. User Replies on Support Tickets
    (Array.isArray(supportTickets) ? supportTickets : []).forEach(t => {
      const msgs = (Array.isArray(supportMessages) ? supportMessages : []).filter(m => parseInt(m.ticket_id) === parseInt(t.id));
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.sender_role === 'patient' || parseInt(lastMsg.sender_id) === parseInt(t.user_id)) {
          const id = `sys-ticket-msg-${lastMsg.id}`;
          if (!isRead(id)) {
            dynamicNotifs.push({
              id,
              type: 'emergency',
              title: `New Reply on Ticket #${t.id}`,
              description: `User ${t.user_name || 'Patient'} replied: "${lastMsg.message}"`,
              read: false,
              time: 'New Reply'
            });
          }
        }
      }
    });

    // G. New Pending Clinical Booking Requests
    (Array.isArray(appointments) ? appointments : []).filter(a => a.status === 'Pending' && !a.missedBy).forEach(a => {
      const id = `sys-appt-pending-${a.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: 'New Clinical Booking Request',
          description: `${a.patientName || 'Patient'} requested consultation on ${a.date} at ${a.time}.`,
          read: false,
          time: 'Review'
        });
      }
    });

    // H. Unassigned Active Instant Call Queries
    (Array.isArray(appointments) ? appointments : []).filter(a => a.mode === 'Instant Call' && a.status === 'Query').forEach(a => {
      const id = `sys-admin-instant-query-${a.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: 'Active Instant Call Query',
          description: `Broadcasting instant call query by ${a.patientName || 'Patient'} (${a.specialty || 'General'}).`,
          read: false,
          time: 'Broadcasting'
        });
      }
    });

    // I. Pending Care Provider Bookings
    (Array.isArray(careProviderBookings) ? careProviderBookings : []).filter(b => b.status === 'Pending').forEach(b => {
      const id = `sys-care-pending-booking-${b.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: 'New Care Provider Booking',
          description: `${b.patientName || 'Patient'} requested home care: ${b.duration || 'Service'}.`,
          read: false,
          time: 'Review'
        });
      }
    });

    // J. Pending Emergency Ambulance Booking Requests
    (Array.isArray(ambulanceBookings) ? ambulanceBookings : []).filter(b => b.status === 'Pending').forEach(b => {
      const id = `sys-amb-pending-booking-${b.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'ambulance',
          title: 'Emergency Ambulance Request',
          description: `Transport requested to ${b.destination || b.dest || 'Medical Center'} (${b.type || 'Ambulance'}).`,
          read: false,
          time: 'Dispatch'
        });
      }
    });

    // K. Pending Lab Test Orders
    (Array.isArray(labOrders) ? labOrders : []).filter(l => l.status === 'Pending' || l.payment_status === 'Paid').forEach(l => {
      const id = `sys-admin-lab-pending-${l.id}`;
      if (!isRead(id)) {
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: 'New Diagnostic Lab Order',
          description: `Order #${l.id} (${l.testName || l.test_name || 'Lab Test'}) placed by ${l.patientName || 'Patient'}.`,
          read: false,
          time: 'Process'
        });
      }
    });
  }

  // 2. DOCTOR ALERTS
  if (isDoctor) {
    const currentDoctor = (Array.isArray(allDoctors) ? allDoctors : []).find(d => parseInt(d.user_id || d.userId) === currentUserId || parseInt(d.id) === currentUserId);
    const docSpecialty = currentDoctor ? String(currentDoctor.specialty || currentDoctor.specialization || 'General').toLowerCase() : 'general';

    // Match appointments assigned to this doctor by User ID, Staff ID, or Doctor Name
    const docAppts = (Array.isArray(appointments) ? appointments : []).filter(a => {
      const docUserId = parseInt(a.doctor_user_id || a.doctorUserId || a.doctor_id);
      const matchesId = docUserId === currentUserId || (currentDoctor && docUserId === parseInt(currentDoctor.id));
      const matchesName = currentDoctor && currentDoctor.name && a.doctorName && (
        a.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase()) || 
        currentDoctor.name.toLowerCase().includes(a.doctorName.toLowerCase())
      );
      return matchesId || matchesName;
    });

    // A. Consultations scheduled for Today
    const todayStr = new Date().toISOString().split('T')[0];
    docAppts.forEach(a => {
      if (a.date === todayStr && !['Cancelled', 'Completed', 'Expired', 'Closed'].includes(a.status)) {
        const id = `sys-appt-today-${a.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'appointment',
            title: "Today's Consultation Schedule",
            description: `Session with patient ${a.patientName || 'Patient'} is set for ${a.time}.`,
            read: false,
            time: a.time
          });
        }
      }
    });

    // B. Confirmed & Active Assigned Patient Appointments
    docAppts.filter(a => a.status === 'Confirmed' || a.status === 'Active').forEach(a => {
      const id = `sys-doc-assigned-appt-${a.id}`;
      if (!isRead(id)) {
        const isLive = a.status === 'Active';
        dynamicNotifs.push({
          id,
          type: 'appointment',
          title: isLive ? 'Consultation Currently Active' : 'New Patient Scheduled',
          description: isLive 
            ? `Patient ${a.patientName} is connected in consultation room.`
            : `Patient ${a.patientName} scheduled for ${a.date} at ${a.time}.`,
          read: false,
          time: isLive ? 'Live' : a.date
        });
      }
    });

    // C. Incoming Instant Call Queries Matching Specialty
    (Array.isArray(appointments) ? appointments : []).filter(a => a.mode === 'Instant Call' && a.status === 'Query').forEach(a => {
      const apptSpecialty = String(a.specialty || 'General').toLowerCase();
      const matchesSpec = apptSpecialty === 'general' || apptSpecialty.includes('general') || docSpecialty.includes(apptSpecialty) || apptSpecialty.includes(docSpecialty);
      if (matchesSpec) {
        const id = `sys-doc-instant-query-${a.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'appointment',
            title: 'Incoming Instant Call Request',
            description: `Patient ${a.patientName || 'Patient'} is requesting an instant virtual call (${a.specialty || 'General'}).`,
            read: false,
            time: 'Urgent Call'
          });
        }
      }
    });

    // D. Virtual Consult Chat Messages (from Patient)
    (Array.isArray(telemedMessages) ? telemedMessages : []).forEach(m => {
      if (parseInt(m.sender_id) !== currentUserId) {
        const id = `sys-telemed-msg-${m.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'billing',
            title: 'New Consult Message',
            description: `Patient chat message: "${m.message || 'Attached file'}"`,
            read: false,
            time: 'Chat'
          });
        }
      }
    });
  }

  // 3. PATIENT ALERTS
  if (isPatient) {
    const patientAppts = (Array.isArray(appointments) ? appointments : []).filter(a => {
      const pUserId = parseInt(a.patient_user_id || a.patientUserId || a.patient_id);
      const matchesId = pUserId === currentUserId;
      const matchesName = currentUser?.name && a.patientName && (
        a.patientName.toLowerCase() === currentUser.name.toLowerCase()
      );
      return matchesId || matchesName;
    });

    // A. Confirmed / Active Appointments & Doctor Acceptances
    patientAppts.forEach(a => {
      if (a.status === 'Confirmed' || a.status === 'Active') {
        const id = `sys-appt-patient-conf-${a.id}`;
        if (!isRead(id)) {
          const isLive = a.status === 'Active';
          dynamicNotifs.push({
            id,
            type: 'appointment',
            title: isLive ? 'Doctor Connected & Call Ready' : 'Clinical Consultation Confirmed',
            description: isLive 
              ? `Dr. ${a.doctorName || 'your doctor'} has joined the session. Click to enter.`
              : `Appointment with Dr. ${a.doctorName || 'Clinician'} confirmed for ${a.date} at ${a.time}.`,
            read: false,
            time: isLive ? 'Live Call' : a.time
          });
        }
      } else if (a.status === 'Query' && a.mode === 'Instant Call') {
        const id = `sys-appt-patient-broadcasting-${a.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'appointment',
            title: 'Instant Call Search Active',
            description: `Broadcasting request to ${a.specialty || 'General'} specialists — awaiting doctor acceptance.`,
            read: false,
            time: 'Broadcasting'
          });
        }
      } else if (a.status === 'Refund Pending' || a.status === 'Expired') {
        const id = `sys-appt-patient-expired-${a.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'billing',
            title: 'Instant Call Search Timed Out',
            description: `No doctor responded within 5 minutes. Full refund process has been automatically initiated.`,
            read: false,
            time: 'Auto Refund'
          });
        }
      } else if (a.status === 'Completed' || a.status === 'Closed') {
        const id = `sys-appt-patient-completed-${a.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'appointment',
            title: 'Consultation Session Completed',
            description: `Session with Dr. ${a.doctorName || 'Doctor'} complete. Clinical notes saved in Medical Vault.`,
            read: false,
            time: 'Done'
          });
        }
      }
    });

    // B. Unpaid Invoices & Payment Dues
    const openBillingStatuses = new Set(['Pending', 'Unpaid', 'Partially Paid', 'Due', 'Under Verify']);
    (Array.isArray(billing) ? billing : []).forEach(t => {
      const pUserId = parseInt(t.patient_user_id || t.patient_id);
      const matchesId = pUserId === currentUserId;
      const matchesName = currentUser?.name && t.patientName && (
        t.patientName.toLowerCase() === currentUser.name.toLowerCase()
      );

      if (matchesId || matchesName || openBillingStatuses.has(t.status)) {
        if (openBillingStatuses.has(t.status)) {
          const id = `sys-txn-unpaid-${t.id}`;
          if (!isRead(id)) {
            dynamicNotifs.push({
              id,
              type: 'billing',
              title: 'Unpaid Medical Invoice',
              description: `Invoice for ${t.serviceName || t.category || 'Consultation'} (৳${t.amount}) is awaiting payment.`,
              read: false,
              time: 'Due'
            });
          }
        } else if (t.status === 'Refund Pending' || t.status === 'Refunded') {
          const id = `sys-txn-refund-${t.id}`;
          if (!isRead(id)) {
            dynamicNotifs.push({
              id,
              type: 'billing',
              title: t.status === 'Refunded' ? 'Refund Processed' : 'Refund In Progress',
              description: t.status === 'Refunded'
                ? `Refund for Invoice #${t.invoiceNo || t.id} (৳${t.paidAmount || t.amount}) completed.`
                : `Refund request for Invoice #${t.invoiceNo || t.id} is being processed.`,
              read: false,
              time: t.status === 'Refunded' ? 'Completed' : 'Pending'
            });
          }
        }
      }
    });

    // C. Support Ticket Replies from Help Desk
    (Array.isArray(supportTickets) ? supportTickets : []).filter(t => parseInt(t.user_id) === currentUserId).forEach(t => {
      if (t.status === 'Resolved') {
        const id = `sys-ticket-resolved-${t.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'appointment',
            title: 'Support Ticket Resolved',
            description: `Your help ticket #${t.id} '${t.title}' was marked resolved.`,
            read: false,
            time: 'Resolved'
          });
        }
      }

      const msgs = (Array.isArray(supportMessages) ? supportMessages : []).filter(m => parseInt(m.ticket_id) === parseInt(t.id));
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.sender_role === 'admin' || lastMsg.sender_role === 'staff' || lastMsg.sender_role === 'receptionist') {
          const id = `sys-ticket-patient-reply-${lastMsg.id}`;
          if (!isRead(id)) {
            dynamicNotifs.push({
              id,
              type: 'emergency',
              title: 'Support Desk Reply',
              description: `Help desk answered ticket #${t.id}: "${lastMsg.message}"`,
              read: false,
              time: 'New Reply'
            });
          }
        }
      }
    });

    // D. Ambulance Dispatch Updates
    (Array.isArray(ambulanceBookings) ? ambulanceBookings : []).forEach(b => {
      const pUserId = parseInt(b.patient_id || b.patient_user_id);
      const matchesId = pUserId === currentUserId;
      const matchesName = currentUser?.name && b.patient && (
        b.patient.toLowerCase() === currentUser.name.toLowerCase()
      );
      if ((matchesId || matchesName) && (b.status === 'Active' || b.status === 'Dispatched')) {
        const id = `sys-amb-patient-disp-${b.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'ambulance',
            title: 'Ambulance Dispatched',
            description: `Vehicle ${b.vehiclePlate || 'Unit'} en route. Operator: ${b.driverName || 'Driver'} (${b.phone || b.driverPhone || 'Contact'}).`,
            read: false,
            time: b.status
          });
        }
      }
    });

    // E. Offline Payment Verification Updates
    (Array.isArray(manualVerifications) ? manualVerifications : []).filter(v => parseInt(v.patientId || v.patient_id || v.user_id) === currentUserId || (currentUser?.name && v.patientName && v.patientName.toLowerCase() === currentUser.name.toLowerCase())).forEach(v => {
      if (v.status === 'Approved') {
        const id = `sys-mv-patient-approved-${v.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'billing',
            title: 'Offline Payment Verified',
            description: `Payment for Invoice #${v.invoiceNo || v.id} (৳${v.amount}) verified successfully.`,
            read: false,
            time: 'Approved'
          });
        }
      } else if (v.status === 'Rejected') {
        const id = `sys-mv-patient-rejected-${v.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'billing',
            title: 'Offline Payment Verification Failed',
            description: `Verification for Invoice #${v.invoiceNo || v.id} failed: ${v.notes || 'Reference mismatch'}.`,
            read: false,
            time: 'Attention'
          });
        }
      }
    });

    // F. Telemed Chat Messages from Doctor
    (Array.isArray(telemedMessages) ? telemedMessages : []).forEach(m => {
      if (parseInt(m.sender_id) !== currentUserId) {
        const id = `sys-telemed-msg-pat-${m.id}`;
        if (!isRead(id)) {
          dynamicNotifs.push({
            id,
            type: 'billing',
            title: 'New Message from Doctor',
            description: `Doctor chat: "${m.message || 'Attached file'}"`,
            read: false,
            time: 'Chat'
          });
        }
      }
    });
  }

  // G. Combine Database notifications with live system notifications
  const dbNotifsFiltered = (Array.isArray(dbNotifs) ? dbNotifs : []).filter(Boolean);
  const combinedNotifs = [...dbNotifsFiltered];
  dynamicNotifs.forEach(d => {
    const exists = dbNotifsFiltered.some(db => db.id === d.id || db.title === d.title);
    if (!exists) {
      combinedNotifs.push(d);
    }
  });

  return combinedNotifs;
};

const normalizePatientRecord = (patient) => ({
  ...patient,
  gender: normalizeGender(patient?.gender) || patient?.gender || ''
})

const CART_STORAGE_KEY = 'ecare_shopping_cart';

const getInitialStoredCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // Backward-compatibility: migrate from legacy ecare-storage-v5 if present
    const legacyRaw = localStorage.getItem('ecare-storage-v5');
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (parsedLegacy?.state?.cart && Array.isArray(parsedLegacy.state.cart) && parsedLegacy.state.cart.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsedLegacy.state.cart));
        return parsedLegacy.state.cart;
      }
    }
  } catch (e) {}
  return [];
};

const useStore = create(
  persist(
    (set, get) => ({
      // ─── AUTH & APP STATE ───────────────────────────────────────────
      user: {
        id: null,
        name: 'Sullivan Drayson',
        email: '',
        ecareRole: 'none',
        wpRoles: [],
        caps: [],
        permissions: [],
        avatar: null
      },
      getCurrentDoctor: () => {
        const { user, doctorList } = get()
        return (doctorList || []).find(d => parseInt(d.user_id) === parseInt(user?.id))
      },
      activePage: 'dashboard',
      cart: getInitialStoredCart(),
      isSidebarCollapsed: false,
      isAppointmentModalOpen: false,
      isCareProviderBookingModalOpen: false,
      isAmbulanceModalOpen: false,
      isLabBookingModalOpen: false,
      isTelemedPaymentModalOpen: false,
      isSyncing: false,
      telemedPaymentData: null,
      selectedRoomId: null,
      activeTab: 'chats',
      setSelectedRoomId: (id) => set({ selectedRoomId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      doctorOnlineStatus: true,
      doctorConsultationStatus: true,
      doctorInstantCallStatus: false,
      isLoading: false,
      confirmModal: {
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null
      },

      // ─── DYNAMIC COLLECTIONS ───────────────────────────────────────
      stats: {
        total_patients: 0,
        total_appointments: 0,
        today_appointments: 0,
        pending_verifications: 0,
        total_revenue: 0
      },
      patients: [],
      staff: [],
      doctorList: [],
      pendingDoctors: [],
      specialities: [],
      services: [],
      appointments: [],
      reviews: [],
      careProviderBookings: [],
      careProviders: [],
      pendingCareProviders: [],
      ambulanceBookings: [],
      ambulance: [],
      pendingAmbulanceDrivers: [],
      transactions: [],
      notifications: [],
      readSystemNotifs: [],
      seenSupportMessageIds: [],
      manualVerifications: [],
      refunds: [],
      payouts: [],
      patientDues: [],
      labTests: [],
      labOrders: [],
      labLocations: [],
      telemedRooms: [],
      telemedMessages: [],
      doctorAvailability: [],
      consultationNotes: [],
      staffAttendance: [],
      supportTickets: [],
      supportMessages: [],
      telemedSettings: {
        provider: window.ecareConfig?.settings?.telemedProvider || 'agora',
        agoraEnabled: window.ecareConfig?.settings?.agoraEnabled ?? true,
        agoraAppId: window.ecareConfig?.settings?.agoraAppId || '',
        hasAgoraAppCertificate: window.ecareConfig?.settings?.hasAgoraAppCertificate ?? false,
        agoraTokenExpiry: window.ecareConfig?.settings?.agoraTokenExpiry || 3600,
        jitsiServer: 'https://meet.jit.si',
        paymentDeadline: 2 // hours
      },
      consultationModes: [
        { id: 'In-Person', label: 'In-Person Visit', icon: 'Hospital', enabled: true },
        { id: 'Video Consult', label: 'Video Consult (Telemed)', icon: 'VideoCamera', enabled: true },
        { id: 'Home Visit', label: 'Home Visit', icon: 'HouseLine', enabled: true }
      ],
      isSetupCompleted: window.ecareConfig?.isSetupCompleted || false,
      primaryColor: window.ecareConfig?.settings?.primaryColor || window.ecareConfig?.primaryColor || '#1b3b2b',
      platformCommission: 20,
      serviceCommissions: {
        doctors: { rate: 20, enabled: true },
        ambulance: { rate: 15, enabled: true },
        careProviders: { rate: 15, enabled: true },
        lab: { rate: 10, enabled: true },
        ...(typeof window.ecareConfig?.settings?.serviceCommissions === 'object' ? window.ecareConfig.settings.serviceCommissions : {})
      },
      editingDoctor: null,
      editingPatient: null,
      editingAppointment: null,
      editingCareProvider: null,
      editingCareProviderBooking: null,
      editingAmbulanceBooking: null,
      editingAmbulance: null,

      setTelemedPaymentModal: (isOpen, data = null) => set({ isTelemedPaymentModalOpen: isOpen, telemedPaymentData: data }),
      setDoctorOnlineStatus: (status) => set({ doctorOnlineStatus: status }),
      toggleDoctorConsultation: async () => {
        const nextStatus = !get().doctorConsultationStatus;
        set({ doctorConsultationStatus: nextStatus });
        try {
          const userId = get().user.id;
          const currentDoctor = get().doctorList.find(d => parseInt(d.user_id) === parseInt(userId));
          if (currentDoctor) {
            set({
              doctorList: get().doctorList.map(d => 
                d.id === currentDoctor.id ? { ...d, consultationStatus: nextStatus ? 'Active' : 'Inactive' } : d
              )
            });
            await api.put('doctors/' + currentDoctor.id, { 
              consultationStatus: nextStatus ? 'Active' : 'Inactive' 
            });
            toast.success(nextStatus ? 'Clinical Consultation: LIVE' : 'Clinical Consultation: OFFLINE', {
              icon: <Video size={18} color="var(--ecare-primary)" />
            });
          }
        } catch (e) {
          toast.error('Failed to update consultation status');
          console.error('Failed to sync consultation status:', e);
        }
      },
      toggleInstantCall: async () => {
        const nextStatus = !get().doctorInstantCallStatus;
        set({ doctorInstantCallStatus: nextStatus });
        try {
          const userId = get().user.id;
          const currentDoctor = get().doctorList.find(d => parseInt(d.user_id) === parseInt(userId));
          if (currentDoctor) {
            set({
              doctorList: get().doctorList.map(d => 
                d.id === currentDoctor.id ? { ...d, instantCallStatus: nextStatus ? 'Active' : 'Inactive' } : d
              )
            });
            await api.put('doctors/' + currentDoctor.id, { 
              instantCallStatus: nextStatus ? 'Active' : 'Inactive' 
            });
            toast.success(nextStatus ? 'Instant Call: ENABLED' : 'Instant Call: DISABLED', {
              icon: <Phone size={18} color="#f97316" />
            });
          }
        } catch (e) {
          toast.error('Failed to update instant call status');
          console.error('Failed to sync instant call status:', e);
        }
      },

      saveAvailability: async (availabilityData) => {
        try {
          const res = await api.post('doctor-availability', availabilityData);
          const data = res.data;
          if (data && (data.success || data.id)) {
            toast.success('Clinical Schedule Saved Successfully', {
              icon: <CalendarPlus size={18} color="var(--ecare-primary)" />
            });
            get().initStore(true);
            return true;
          }
          return false;
        } catch (error) {
          toast.error('Failed to save clinical schedule');
          console.error('Save availability error:', error);
          return false;
        }
      },

      isPaymentExpired: (appt) => {
        if (!appt || appt.paymentStatus === 'Paid') return false;
        // Deadline logic only for scheduled telemed
        if (!isVideoConsultMode(appt.mode)) return false;
        
        const apptDate = new Date(`${appt.date}T${appt.time}`);
        const now = new Date();
        const deadlineHours = get().telemedSettings.paymentDeadline;
        const diffMs = apptDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return diffHours < deadlineHours;
      },

      createTelemedRoom: async (data) => {
        return get().handleOp('telemed-rooms', 'post', data, 'Consultation room initialized', 'telemedRooms');
      },

      updateTelemedRoomCall: async (roomId, callData) => {
        const room = get().telemedRooms.find(r => r.id === roomId || r.id == roomId);
        if (!room) return null;
        if (callData.callStatus === 'connected' || callData.callStatus === 'ringing') {
          try { sessionStorage.setItem('ecare_active_call_room_id', String(roomId)) } catch (e) {}
        } else if (callData.callStatus === 'ended' || callData.callStatus === 'rejected' || callData.callStatus === 'idle') {
          try { sessionStorage.removeItem('ecare_active_call_room_id') } catch (e) {}
        }
        return get().handleOp('telemed-rooms', 'put', { ...room, ...callData }, null, 'telemedRooms', roomId);
      },

      fetchJitsiSession: async (roomId) => {
        try {
          const parsedId = (typeof roomId === 'object' && roomId !== null)
            ? (roomId.id || roomId.room_id || roomId.appointment_id || 1)
            : (Number(roomId) || 1);
          const res = await api.post('telemed/token', { room_id: parsedId, id: parsedId });
          return res.data; // { room_name, jitsi_server, user_name, is_owner, expires_at }
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to initialize Jitsi video consultation.';
          toast.error(msg);
          return null;
        }
      },

      fetchDailySession: async (roomId) => {
        return get().fetchJitsiSession(roomId);
      },

      fetchAgoraToken: async (roomId, appointmentId) => {
        try {
          const parsedRoomId = (typeof roomId === 'object' && roomId !== null)
            ? (roomId.id || roomId.room_id || roomId.appointment_id || 1)
            : (Number(roomId) || 1);
          const parsedApptId = appointmentId || (typeof roomId === 'object' && roomId?.appointment_id ? roomId.appointment_id : null);
          const res = await api.post('telemed/agora/token', {
            room_id: parsedRoomId,
            appointment_id: parsedApptId
          });
          return res.data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to generate Agora consultation token.';
          toast.error(msg);
          return null;
        }
      },

      testAgoraConnection: async (credentials = {}) => {
        try {
          const res = await api.post('telemed/agora/test', credentials);
          return res.data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Agora connection test failed.';
          throw new Error(msg);
        }
      },

      updateTelemedSessionPresence: async (roomId, event) => {
        try {
          await api.post('telemed/room/presence', { room_id: roomId, event });
        } catch (err) {
          console.warn('Failed to update room presence:', err);
        }
      },

      testDailyConnection: async (apiKey) => {
        try {
          const res = await api.post('telemed/test-daily', { api_key: apiKey });
          return res.data;
        } catch (err) {
          const msg = err.response?.data?.message || 'Daily.co API test failed.';
          throw new Error(msg);
        }
      },

      processTelemedPayment: async (appointmentId, data) => {
        try {
          // In a real scenario, this calls the gateway (Stripe/SSLCommerz)
          // For now, we simulate a successful transaction and update the appointment
          const appointment = get().appointments.find(a => a.id === appointmentId);
          if (!appointment) return false;

          const updatedData = { 
            ...appointment, 
            paymentStatus: 'Paid', 
            transactionId: `TXN-${Date.now()}` 
          };
          if (appointment.mode === 'Instant Call') {
            updatedData.status = 'Query';
            updatedData.query_started_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
          }
          await get().updateAppointment(appointmentId, updatedData);

          // Find and update the associated billing record
          const billing = get().transactions.find(t => t.appointmentId == appointmentId);
          if (billing) {
            await get().handleOp('billing', 'put', {
              ...billing,
              status: 'Paid',
              paidAmount: billing.amount,
              method: data.method || 'card'
            }, null, 'transactions', billing.id);
          }
          
          toast.success('Payment verified! Your session is now active.');
          return true;
        } catch (e) {
          toast.error('Payment verification failed.');
          return false;
        }
      },

      setEditingAmbulance: (ambulance) => set({ editingAmbulance: ambulance }),
      setEditingCareProvider: (provider) => set({ editingCareProvider: provider }),

      // ... existing code ...
      updateCareProvider: (id, data) => get().handleOp('care-providers', 'put', data, 'Provider profile updated', 'careProviders', id),

      // Settings & Config
      instantCallFee: window.ecareConfig?.settings?.instantCallFee || 500,
      partialPayment: window.ecareConfig?.settings?.partialPayment || { enabled: false, minDepositPercent: 30 },
      instantRefundDuration: window.ecareConfig?.settings?.instantRefundDuration || 48,
      standardRefundDuration: window.ecareConfig?.settings?.standardRefundDuration || 7,
      providerTypes: window.ecareConfig?.settings?.providerTypes || [],
      servicePricing: window.ecareConfig?.settings?.servicePricing || [],
      paymentGateways: (() => {
        const wcGateways = window.ecareConfig?.wcGateways || {};
        const isWooCommerceActive = !!window.ecareConfig?.settings?.isWooCommerceActive;
        const gateways = {};
        if (Object.keys(wcGateways).length > 0) {
          Object.entries(wcGateways).forEach(([id, g]) => {
            gateways[id] = { enabled: true, name: formatPaymentMethod(g.title || id), description: g.description || '' };
          });
        } else if (isWooCommerceActive) {
          gateways.woo_bkash = { enabled: true, name: 'bKash' };
          gateways.woo_rocket = { enabled: true, name: 'Rocket' };
          gateways.woo_nagad = { enabled: true, name: 'Nagad' };
          gateways.woo_upay = { enabled: true, name: 'Upay' };
          gateways.cod = { enabled: true, name: 'Cash on Delivery' };
          gateways.bacs = { enabled: true, name: 'Bank Transfer' };
        }
        return gateways;
      })(),
      woocommerceEnabled: !!window.ecareConfig?.settings?.woocommerceEnabled,
      isWooCommerceActive: window.ecareConfig?.settings?.isWooCommerceActive || false,
      currencySymbol: window.ecareConfig?.settings?.currencySymbol || '৳',
      currencyCode: window.ecareConfig?.settings?.currencyCode || 'BDT',
      ambulancePricing: {
        'ICU': 5000,
        'Non-AC': 2000,
        'AC': 3500,
        'Freezer': 6000,
        ...(window.ecareConfig?.settings?.ambulancePricing || {})
      },

      // Dashboard Mock/Config
      appointmentTypes: [
        { name: 'General', value: 40, color: 'var(--ecare-primary)' },
        { name: 'Emergency', value: 25, color: 'var(--ecare-primary-v2)' },
        { name: 'Follow-up', value: 20, color: 'var(--ecare-primary-v3)' },
        { name: 'Diagnostic', value: 15, color: 'var(--ecare-primary-v4)' },
      ],
      operationalWidgets: {
        pharmacy: { stock: 12, pending: 5 },
        ambulance: { available: 8, total: 12, mission: 4 },
        careProvider: { active: 18, scheduled: 24 },
        staff: { attendance: 94, onDuty: 42 }
      },
      trendData: [
        { day: 'Mon', count: 400, revenue: 2400 },
        { day: 'Tue', count: 300, revenue: 1398 },
        { day: 'Wed', count: 200, revenue: 9800 },
        { day: 'Thu', count: 278, revenue: 3908 },
        { day: 'Fri', count: 189, revenue: 4800 },
        { day: 'Sat', count: 239, revenue: 3800 },
        { day: 'Sun', count: 349, revenue: 4300 },
      ],

      // ─── INITIALIZATION ────────────────────────────────────────────
      initStore: async (silent = false) => {
        if (!silent) set({ isLoading: true });
        try {
          const currentUser = get().user;
          const statsQuery = (currentUser?.ecareRole === 'doctor' || currentUser?.ecareRole === 'patient') ? `stats?user_id=${currentUser.id}` : 'stats';
          const role = currentUser?.ecareRole || 'guest';

          const getEndpointPromise = (endpoint, isObject = false) => {
            if (endpoint === 'telemed-rooms' || endpoint === 'telemed-messages') {
              return Promise.resolve({ data: endpoint === 'telemed-rooms' ? get().telemedRooms : get().telemedMessages });
            }
            const allowedForGuest = ['doctors', 'specialities', 'services', 'settings'];
            const allowedForPatient = [
              'stats', 'patients', 'doctors', 'specialities', 'services', 'appointments', 
              'care-provider-bookings', 'ambulance-bookings', 'billing', 'lab-tests', 'lab-orders', 
              'lab-locations', 'telemed-rooms', 'telemed-messages', 'settings', 'support-tickets', 
              'support-messages', 'notifications'
            ];
            const allowedForDoctor = [
              'stats', 'patients', 'doctors', 'specialities', 'services', 'appointments', 
              'billing', 'lab-tests', 'lab-orders', 'lab-locations', 'telemed-rooms', 
              'telemed-messages', 'doctor-availability', 'consultation-notes', 'settings', 
              'support-tickets', 'support-messages', 'notifications', 'payouts'
            ];

            let isAllowed = false;
            if (role === 'admin') {
              isAllowed = true;
            } else if (role === 'doctor') {
              isAllowed = allowedForDoctor.includes(endpoint);
            } else if (role === 'patient') {
              isAllowed = allowedForPatient.includes(endpoint);
            } else {
              isAllowed = allowedForGuest.includes(endpoint);
            }

            if (!isAllowed) {
              return Promise.resolve({ data: isObject ? {} : [] });
            }

            const query = (endpoint === 'stats') ? statsQuery : endpoint;
            return api.get(query).catch(() => ({ data: isObject ? {} : [] }));
          };

          let stats, patients, staff, doctors, specialities, services, 
              appointments, careProviders, careProviderBookings, ambulance, 
              ambulanceBookings, billing, refunds, manualVerifications, 
              labTests, labOrders, labLocations, telemedRooms, telemedMessages, 
              doctorAvailability, consultationNotes, staffAttendance, settings,
              supportTickets, supportMessages, notificationsResp, payoutsResp;

          let bootstrapResp = null;
          try {
            bootstrapResp = await api.get('bootstrap');
          } catch (err) {
            console.warn('Bootstrap API endpoint call failed, falling back to parallel fetch', err);
          }

          if (bootstrapResp && bootstrapResp.data && typeof bootstrapResp.data === 'object' && !Array.isArray(bootstrapResp.data)) {
            const b = bootstrapResp.data;
            stats                = { data: b.stats || {} };
            patients             = { data: b.patients || [] };
            staff                = { data: b.staff || [] };
            doctors              = { data: b.doctors || [] };
            specialities         = { data: b.specialities || [] };
            services             = { data: b.services || [] };
            appointments         = { data: b.appointments || [] };
            careProviders        = { data: b['care-providers'] || [] };
            careProviderBookings = { data: b['care-provider-bookings'] || [] };
            ambulance            = { data: b.ambulance || [] };
            ambulanceBookings    = { data: b['ambulance-bookings'] || [] };
            billing              = { data: b.billing || [] };
            refunds              = { data: b.refunds || [] };
            manualVerifications  = { data: b['manual-verifications'] || [] };
            labTests             = { data: b['lab-tests'] || [] };
            labOrders            = { data: b['lab-orders'] || [] };
            labLocations         = { data: b['lab-locations'] || [] };
            telemedRooms         = { data: b['telemed-rooms'] || [] };
            telemedMessages      = { data: b['telemed-messages'] || [] };
            doctorAvailability   = { data: b['doctor-availability'] || [] };
            consultationNotes    = { data: b['consultation-notes'] || [] };
            staffAttendance      = { data: b['staff-attendance'] || [] };
            settings             = { data: b.settings || {} };
            supportTickets       = { data: b['support-tickets'] || [] };
            supportMessages      = { data: b['support-messages'] || [] };
            notificationsResp    = { data: b.notifications || [] };
            payoutsResp          = { data: b.payouts || [] };
          } else {
            [
              stats, patients, staff, doctors, specialities, services, 
              appointments, careProviders, careProviderBookings, ambulance, 
              ambulanceBookings, billing, refunds, manualVerifications, 
              labTests, labOrders, labLocations, telemedRooms, telemedMessages, 
              doctorAvailability, consultationNotes, staffAttendance, settings,
              supportTickets, supportMessages, notificationsResp, payoutsResp
            ] = await Promise.all([
              getEndpointPromise('stats', true),
              getEndpointPromise('patients'),
              getEndpointPromise('staff'),
              getEndpointPromise('doctors'),
              getEndpointPromise('specialities'),
              getEndpointPromise('services'),
              getEndpointPromise('appointments'),
              getEndpointPromise('care-providers'),
              getEndpointPromise('care-provider-bookings'),
              getEndpointPromise('ambulance'),
              getEndpointPromise('ambulance-bookings'),
              getEndpointPromise('billing'),
              getEndpointPromise('refunds'),
              getEndpointPromise('manual-verifications'),
              getEndpointPromise('lab-tests'),
              getEndpointPromise('lab-orders'),
              getEndpointPromise('lab-locations'),
              getEndpointPromise('telemed-rooms'),
              getEndpointPromise('telemed-messages'),
              getEndpointPromise('doctor-availability'),
              getEndpointPromise('consultation-notes'),
              getEndpointPromise('staff-attendance'),
              getEndpointPromise('settings', true),
              getEndpointPromise('support-tickets'),
              getEndpointPromise('support-messages'),
              getEndpointPromise('notifications'),
              getEndpointPromise('payouts')
            ]);
          }

          const allDoctors = Array.isArray(doctors.data) ? doctors.data : [];

          // Generate dynamic live alerts
          const combinedNotifs = compileDynamicNotifications(
            currentUser,
            notificationsResp.data,
            allDoctors,
            careProviders.data,
            ambulance.data,
            manualVerifications.data,
            supportTickets.data,
            supportMessages.data,
            appointments.data,
            careProviderBookings.data,
            ambulanceBookings.data,
            telemedMessages.data,
            billing.data,
            labOrders.data || [],
            get().readSystemNotifs || []
          );

          set({
            stats: stats.data || {},
            notifications: combinedNotifs,
            patients: Array.isArray(patients.data) ? patients.data.map(normalizePatientRecord) : [],
            staff: Array.isArray(staff.data) ? staff.data : [],
            doctorList: allDoctors.filter(d => d.status !== 'Pending'),
            pendingDoctors: allDoctors.filter(d => d.status === 'Pending'),
            specialities: Array.isArray(specialities.data) ? specialities.data : [],
            services: Array.isArray(services.data) ? services.data.map(s => ({
              ...s,
              telemedicine: s.telemedicine === true || s.telemedicine === 1 || s.telemedicine === '1'
            })) : [],
            appointments: Array.isArray(appointments.data) ? appointments.data : [],
            careProviderBookings: Array.isArray(careProviderBookings.data) ? careProviderBookings.data : [],
            careProviders: Array.isArray(careProviders.data) ? careProviders.data.filter(p => p.status !== 'Pending') : [],
            pendingCareProviders: Array.isArray(careProviders.data) ? careProviders.data.filter(p => p.status === 'Pending') : [],
            ambulance: Array.isArray(ambulance.data) ? ambulance.data.map(a => ({
              ...a,
              driverName: a.driverName || a.driver_name || a.drivername,
              driverPhone: a.driverPhone || a.driver_phone || a.driverphone,
              driverEmail: a.driverEmail || a.driver_email || a.driveremail,
              driverLicense: a.driverLicense || a.driver_license || a.driverlicense,
              driverNid: a.driverNid || a.driver_nid || a.drivernid,
              driverPhoto: a.driverPhoto || a.driver_photo || a.driverphoto,
              vehicleType: a.vehicleType || a.vehicle_type || a.vehicletype,
              vehicleModel: a.vehicleModel || a.vehicle_model || a.vehiclemodel,
              insuranceExpiry: a.insuranceExpiry || a.insurance_expiry || a.insuranceexpiry,
              fitnessExpiry: a.fitnessExpiry || a.fitness_expiry || a.fitnessexpiry
            })).filter(a => a.status !== 'Pending') : [],
            pendingAmbulanceDrivers: Array.isArray(ambulance.data) ? ambulance.data.map(a => ({
              ...a,
              driverName: a.driverName || a.driver_name || a.drivername,
              driverPhone: a.driverPhone || a.driver_phone || a.driverphone,
              driverPhoto: a.driverPhoto || a.driver_photo || a.driverphoto
            })).filter(a => a.status === 'Pending') : [],
            ambulanceBookings: Array.isArray(ambulanceBookings.data) ? ambulanceBookings.data.map(b => ({
              ...b,
              // Normalize all possible API field name variants
              patient:      b.patient      || b.patient_name  || b.patientName  || b.patientname  || '',
              type:         b.type         || b.ambulance_type || b.ambulanceType || b.vehicleType  || 'Non-AC',
              location:     b.location     || b.pickup_location || b.pickupLocation || b.pickup     || '',
              dest:         b.dest         || b.destination   || b.drop_location || b.dropLocation  || '',
              time:         b.time         || b.dispatch_time || b.dispatchTime  || '',
              priority:     b.priority     || b.urgency       || 'Normal',
              phone:        b.phone        || b.contact_phone || b.contactPhone  || b.patient_phone || '',
              vehicleId:    b.vehicleId    || b.vehicle_id    || b.ambulance_id  || '',
              vehiclePlate: b.vehiclePlate || b.vehicle_plate || b.vehicleplate  || '',
              driverName:   b.driverName   || b.driver_name   || b.drivername    || '',
              issuedBy:     b.issuedBy     || b.issued_by     || b.created_by    || 'System',
            })) : [],
            transactions: Array.isArray(billing.data) ? billing.data : [],
            payouts: Array.isArray(payoutsResp.data) ? payoutsResp.data : [],
            refunds: Array.isArray(refunds.data) ? refunds.data : [],
            manualVerifications: Array.isArray(manualVerifications.data) ? manualVerifications.data : [],
            labTests: Array.isArray(labTests.data) ? labTests.data : [],
            labOrders: Array.isArray(labOrders.data) ? labOrders.data : [],
            labLocations: Array.isArray(labLocations.data) ? labLocations.data : [],
            telemedRooms: Array.isArray(telemedRooms.data) ? telemedRooms.data : [],
            telemedMessages: Array.isArray(telemedMessages.data) ? telemedMessages.data : [],
            doctorAvailability: Array.isArray(doctorAvailability.data) ? doctorAvailability.data : [],
            consultationNotes: Array.isArray(consultationNotes.data) ? consultationNotes.data : [],
            staffAttendance: Array.isArray(staffAttendance.data) ? staffAttendance.data : [],
            supportTickets: Array.isArray(supportTickets.data) ? supportTickets.data : [],
            supportMessages: Array.isArray(supportMessages.data) ? supportMessages.data : [],
            telemedSettings: {
              provider: settings.data?.telemedProvider || window.ecareConfig?.settings?.telemedProvider || 'agora',
              agoraEnabled: settings.data?.agoraEnabled ?? window.ecareConfig?.settings?.agoraEnabled ?? true,
              agoraAppId: settings.data?.agoraAppId || window.ecareConfig?.settings?.agoraAppId || '',
              hasAgoraAppCertificate: settings.data?.hasAgoraAppCertificate ?? window.ecareConfig?.settings?.hasAgoraAppCertificate ?? false,
              agoraTokenExpiry: settings.data?.agoraTokenExpiry || window.ecareConfig?.settings?.agoraTokenExpiry || 3600,
              jitsiServer: settings.data?.jitsiServer || 'https://meet.jit.si',
              paymentDeadline: settings.data?.telemedPaymentDeadline || 2
            },
            providerTypes: settings.data?.providerTypes || [],
            servicePricing: settings.data?.servicePricing || [],
            paymentGateways: settings.data?.paymentGateways || get().paymentGateways,
            consultationModes: (Array.isArray(settings.data?.consultationModes) && settings.data.consultationModes.length > 0) 
              ? settings.data.consultationModes 
              : get().consultationModes,
            primaryColor: settings.data?.primaryColor || get().primaryColor,
            platformCommission: settings.data?.platformCommission || 20,
            instantCallFee: settings.data?.instantCallFee || 500,
            instantRefundDuration: settings.data?.instantRefundDuration || 48,
            standardRefundDuration: settings.data?.standardRefundDuration || 7,
            serviceCommissions: (typeof settings.data?.serviceCommissions === 'object' && settings.data.serviceCommissions !== null)
              ? settings.data.serviceCommissions 
              : get().serviceCommissions,
            woocommerceEnabled: !!settings.data?.woocommerceEnabled,
            isWooCommerceActive: settings.data?.isWooCommerceActive || false,
            partialPayment: settings.data?.partialPayment || { enabled: false, minDepositPercent: 30 },
            isLoading: false
          });

          // Auto-restore active call room state if page was refreshed during call
          try {
            const savedCallRoomId = sessionStorage.getItem('ecare_active_call_room_id')
            if (savedCallRoomId) {
              const roomList = Array.isArray(telemedRooms.data) ? telemedRooms.data : []
              const activeRoom = roomList.find(r => String(r.id) === String(savedCallRoomId))
              if (activeRoom && (activeRoom.callStatus === 'connected' || activeRoom.callStatus === 'ringing')) {
                set({ selectedRoomId: activeRoom.id, activeTab: 'room', activePage: 'telemedicine' })
              } else {
                sessionStorage.removeItem('ecare_active_call_room_id')
              }
            }
          } catch (e) {}

          // Sync doctor status toggles from fetched data
          if (currentUser?.ecareRole === 'doctor') {
            const currentDoctor = allDoctors.find(d => parseInt(d.user_id) === parseInt(currentUser.id));
            if (currentDoctor) {
              set({
                doctorConsultationStatus: currentDoctor.consultationStatus === 'Active',
                doctorInstantCallStatus: currentDoctor.instantCallStatus === 'Active'
              });
            }
          }

          // Removed Socket.io real-time listeners, relying on standard polling
        } catch (error) {
          console.error('Critical sync error:', error);
          set({ isLoading: false });
        }
      },



      // ─── LIVE SYNC ENGINE ─────────────────────────────────────────
      syncLive: async () => {
        if (get().isSyncing) return;
        set({ isSyncing: true });
        try {
          const currentUser = get().user;
          const role = currentUser?.ecareRole || 'guest';

          const allowedForGuest = ['doctors', 'reviews'];
          const allowedForPatient = [
            'stats', 'doctors', 'appointments', 'billing', 'notifications', 
            'telemed-rooms', 'support-tickets', 'support-messages', 
            'care-provider-bookings', 'ambulance-bookings', 'telemed-messages',
            'patients', 'reviews'
          ];
          const allowedForDoctor = [
            'stats', 'doctors', 'appointments', 'billing', 'notifications', 
            'telemed-rooms', 'support-tickets', 'support-messages', 'telemed-messages',
            'patients', 'reviews'
          ];
          const allowedForAdmin = [
            'stats', 'doctors', 'appointments', 'billing', 'notifications', 
            'telemed-rooms', 'support-tickets', 'support-messages', 
            'care-providers', 'ambulance', 'manual-verifications',
            'care-provider-bookings', 'ambulance-bookings', 'telemed-messages',
            'patients', 'staff', 'reviews'
          ];

          let modulesToSync = [];
          if (role === 'admin') {
            modulesToSync = allowedForAdmin;
          } else if (role === 'doctor') {
            modulesToSync = allowedForDoctor;
          } else if (role === 'patient') {
            modulesToSync = allowedForPatient;
          } else {
            modulesToSync = allowedForGuest;
          }

          // Call the unified endpoint in a single REST request
          const response = await api.post('sync-live', {
            modules: modulesToSync,
            user_id: (currentUser?.ecareRole === 'doctor' || currentUser?.ecareRole === 'patient') ? currentUser.id : null
          });

          const data = response.data || {};

          const statsData = data['stats'] || {};
          const doctorsData = Array.isArray(data['doctors']) ? data['doctors'] : [];
          const appointmentsData = Array.isArray(data['appointments']) ? data['appointments'] : [];
          const billingData = Array.isArray(data['billing']) ? data['billing'] : [];
          const notificationsData = Array.isArray(data['notifications']) ? data['notifications'] : [];
          const telemedRoomsData = Array.isArray(data['telemed-rooms']) ? data['telemed-rooms'] : [];
          const supportTicketsData = Array.isArray(data['support-tickets']) ? data['support-tickets'] : [];
          const supportMessagesData = Array.isArray(data['support-messages']) ? data['support-messages'] : [];
          const careProvidersData = Array.isArray(data['care-providers']) ? data['care-providers'] : [];
          const ambulanceData = Array.isArray(data['ambulance']) ? data['ambulance'] : [];
          const manualVerificationsData = Array.isArray(data['manual-verifications']) ? data['manual-verifications'] : [];
          const careProviderBookingsData = Array.isArray(data['care-provider-bookings']) ? data['care-provider-bookings'] : [];
          const ambulanceBookingsData = Array.isArray(data['ambulance-bookings']) ? data['ambulance-bookings'] : [];
          const telemedMessagesData = Array.isArray(data['telemed-messages']) ? data['telemed-messages'] : [];
          const patientsData = Array.isArray(data['patients']) ? data['patients'] : [];
          const staffData = Array.isArray(data['staff']) ? data['staff'] : [];
          const labOrdersData = Array.isArray(data['lab-orders']) ? data['lab-orders'] : (get().labOrders || []);
          const reviewsData = Array.isArray(data['reviews']) ? data['reviews'] : [];

          const allDoctors = doctorsData;

          // Generate dynamic live alerts using our centralized compiler
          const combinedNotifs = compileDynamicNotifications(
            currentUser,
            notificationsData,
            allDoctors,
            careProvidersData,
            ambulanceData,
            manualVerificationsData,
            supportTicketsData,
            supportMessagesData,
            appointmentsData,
            careProviderBookingsData,
            ambulanceBookingsData,
            telemedMessagesData,
            billingData,
            labOrdersData,
            get().readSystemNotifs || []
          );

          set({
            stats: statsData || get().stats,
            doctorList: allDoctors.filter(d => d.status !== 'Pending'),
            pendingDoctors: allDoctors.filter(d => d.status === 'Pending'),
            appointments: appointmentsData,
            reviews: reviewsData,
            transactions: billingData,
            notifications: combinedNotifs,
            telemedRooms: telemedRoomsData,
            telemedMessages: telemedMessagesData,
            supportTickets: supportTicketsData,
            supportMessages: supportMessagesData,
            pendingCareProviders: careProvidersData.filter(p => p.status === 'Pending'),
            patients: data['patients'] ? patientsData.map(normalizePatientRecord) : get().patients,
            staff: data['staff'] ? staffData : get().staff,
            // Refresh fleet and bookings in live sync
            ambulance: ambulanceData.map(a => ({
              ...a,
              driverName: a.driverName || a.driver_name || a.drivername,
              driverPhone: a.driverPhone || a.driver_phone || a.driverphone,
              driverEmail: a.driverEmail || a.driver_email || a.driveremail,
              vehicleType: a.vehicleType || a.vehicle_type || a.vehicletype,
              vehicleModel: a.vehicleModel || a.vehicle_model || a.vehiclemodel,
              driverPhoto: a.driverPhoto || a.driver_photo || a.driverphoto
            })).filter(a => a.status !== 'Pending'),
            pendingAmbulanceDrivers: ambulanceData.map(a => ({
              ...a,
              driverName: a.driverName || a.driver_name || a.drivername,
              driverPhone: a.driverPhone || a.driver_phone || a.driverphone,
              driverPhoto: a.driverPhoto || a.driver_photo || a.driverphoto
            })).filter(a => a.status === 'Pending'),
            ambulanceBookings: ambulanceBookingsData.map(b => ({
              ...b,
              patient:      b.patient      || b.patient_name  || b.patientName  || b.patientname  || '',
              type:         b.type         || b.ambulance_type || b.ambulanceType || b.vehicleType  || 'Non-AC',
              location:     b.location     || b.pickup_location || b.pickupLocation || b.pickup     || '',
              dest:         b.dest         || b.destination   || b.drop_location || b.dropLocation  || '',
              time:         b.time         || b.dispatch_time || b.dispatchTime  || '',
              priority:     b.priority     || b.urgency       || 'Normal',
              phone:        b.phone        || b.contact_phone || b.contactPhone  || b.patient_phone || '',
              vehicleId:    b.vehicleId    || b.vehicle_id    || b.ambulance_id  || '',
              vehiclePlate: b.vehiclePlate || b.vehicle_plate || b.vehicleplate  || '',
              driverName:   b.driverName   || b.driver_name   || b.drivername    || '',
              issuedBy:     b.issuedBy     || b.issued_by     || b.created_by    || 'System',
            })),
            manualVerifications: manualVerificationsData
          });

          // Sync doctor status toggles from fetched data
          if (currentUser?.ecareRole === 'doctor') {
            const currentDoctor = allDoctors.find(d => parseInt(d.user_id) === parseInt(currentUser.id));
            if (currentDoctor) {
              set({
                doctorConsultationStatus: currentDoctor.consultationStatus === 'Active',
                doctorInstantCallStatus: currentDoctor.instantCallStatus === 'Active'
              });
            }
          }
        } catch (e) {
          console.warn('Live sync heartbeat failed (transient network):', e?.message || e);
        } finally {
          set({ isSyncing: false });
        }
      },

      // ─── ACTIONS ───────────────────────────────────────────────────
      
      // Generic CRUD helpers for the store
      handleOp: async (module, method, data, successMsg, stateKey, id = null) => {
        const url = id ? `${module}/${id}` : `${module}`;
        try {
          // Axios delete handles data differently (usually in config.data)
          const config = method === 'delete' ? { data } : data;
          const res = await apiOp(() => {
            if (method === 'delete') return api.delete(url, config);
            return api[method](url, data);
          }, successMsg);
          
          await get().initStore(true);
          return res;
        } catch (e) { return null; }
      },

      bulkDelete: (module, ids) => get().handleOp(`bulk-delete/${module}`, 'post', { ids }, `Successfully removed ${ids.length} records`, module),

      // Patients
      addPatient: (data) => get().handleOp('patients', 'post', data, { text: 'Patient added successfully', icon: <UserPlus size={18} color="var(--ecare-primary)" /> }, 'patients'),
      updatePatient: (id, data) => get().handleOp('patients', 'put', data, { text: 'Patient updated', icon: <User size={18} color="#3b82f6" /> }, 'patients', id),
      deletePatient: (id) => get().handleOp('patients', 'delete', null, 'Patient record removed', 'patients', id),

      // Doctors & Staff
      addDoctor: (data) => get().handleOp('doctors', 'post', data, { text: 'Doctor registered', icon: <Stethoscope size={18} color="var(--ecare-primary)" /> }, 'doctorList'),
      updateDoctor: (id, data) => get().handleOp('doctors', 'put', data, { text: 'Doctor updated', icon: <Stethoscope size={18} color="#3b82f6" /> }, 'doctorList', id),
      deleteDoctorFromList: (id) => get().handleOp('doctors', 'delete', null, 'Doctor removed', 'doctorList', id),
      
      addStaff: (data) => get().handleOp('staff', 'post', data, { text: 'Staff member added', icon: <User size={18} color="var(--ecare-primary)" /> }, 'staff'),
      updateStaff: (id, data) => get().handleOp('staff', 'put', data, { text: 'Staff updated', icon: <User size={18} color="#3b82f6" /> }, 'staff', id),
      deleteStaff: (id) => get().handleOp('staff', 'delete', null, 'Staff record removed', 'staff', id),

      addStaffAttendance: (data) => get().handleOp('staff-attendance', 'post', data, 'Attendance logged', 'staffAttendance'),
      updateStaffAttendance: (id, data) => get().handleOp('staff-attendance', 'put', data, 'Attendance updated', 'staffAttendance', id),
      deleteStaffAttendance: (id) => get().handleOp('staff-attendance', 'delete', null, 'Attendance record removed', 'staffAttendance', id),

      // Appointments
      addAppointment: (data) => {
        const user = get().user;
        const issuedBy = data.issuedBy || user?.name || 'System';
        const patient_user_id = user.ecareRole === 'patient' ? user.id : (data.patient_user_id || null);
        return get().handleOp('appointments', 'post', { ...data, issuedBy, patient_user_id }, { text: 'Appointment scheduled', icon: <CalendarPlus size={18} color="#8b5cf6" /> }, 'appointments');
      },
      updateAppointment: (id, data) => get().handleOp('appointments', 'put', data, 'Appointment updated', 'appointments', id),
      deleteAppointment: async (id) => {
        const txn = get().transactions.find(t => String(t.appointmentId || t.appointment_id) === String(id));
        if (txn && get().user.ecareRole === 'admin') {
          await get().handleOp('billing', 'delete', null, null, 'transactions', txn.id);
        }
        return get().handleOp('appointments', 'delete', null, 'Appointment cancelled', 'appointments', id);
      },

      // Reviews
      addReview: (data) => get().handleOp('reviews', 'post', data, 'Review submitted successfully', 'reviews'),
      updateReview: (id, data) => get().handleOp('reviews', 'put', data, 'Review updated', 'reviews', id),
      deleteReview: (id) => get().handleOp('reviews', 'delete', null, 'Review removed', 'reviews', id),

      // Lab Management
      addLabTest: (data) => get().handleOp('lab-tests', 'post', data, 'Lab test added', 'labTests'),
      updateLabTest: (id, data) => get().handleOp('lab-tests', 'put', data, 'Lab test updated', 'labTests', id),
      deleteLabTest: (id) => get().handleOp('lab-tests', 'delete', null, 'Lab test removed', 'labTests', id),
      
      addLabOrder: (data) => {
        const user = get().user;
        const patient_user_id = user.ecareRole === 'patient' ? user.id : (data.patient_user_id || null);
        return get().handleOp('lab-orders', 'post', { ...data, patient_user_id }, 'Lab order placed', 'labOrders');
      },
      updateLabOrder: (id, data) => get().handleOp('lab-orders', 'put', data, 'Lab order updated', 'labOrders', id),
      deleteLabOrder: async (id) => {
        const txn = get().transactions.find(t => String(t.labOrderId || t.lab_order_id) === String(id));
        if (txn && get().user.ecareRole === 'admin') {
          await get().handleOp('billing', 'delete', null, null, 'transactions', txn.id);
        }
        return get().handleOp('lab-orders', 'delete', null, 'Lab order removed', 'labOrders', id);
      },
      
      addLabLocation: (data) => get().handleOp('lab-locations', 'post', data, 'Location added', 'labLocations'),
      updateLabLocation: (id, data) => get().handleOp('lab-locations', 'put', data, 'Location updated', 'labLocations', id),
      deleteLabLocation: (id) => get().handleOp('lab-locations', 'delete', null, 'Location removed', 'labLocations', id),

      // Specialities & Services
      addSpeciality: (data) => get().handleOp('specialities', 'post', data, { text: 'Speciality added', icon: <CheckCircle size={18} color="var(--ecare-primary)" /> }, 'specialities'),
      updateSpeciality: (id, data) => get().handleOp('specialities', 'put', data, { text: 'Speciality updated', icon: <CheckCircle size={18} color="#3b82f6" /> }, 'specialities', id),
      deleteSpeciality: (id) => get().handleOp('specialities', 'delete', null, 'Speciality removed', 'specialities', id),

      addService: (data) => get().handleOp('services', 'post', data, { text: 'Service added', icon: <Briefcase size={18} color="var(--ecare-primary)" /> }, 'services'),
      updateService: (id, data) => get().handleOp('services', 'put', data, 'Service updated', 'services', id),
      deleteService: (id) => get().handleOp('services', 'delete', null, 'Service removed', 'services', id),
      toggleServiceTelemed: async (id) => {
        const service = get().services.find(s => s.id === id);
        if (!service) return;
        const currentVal = service.telemedicine === true || service.telemedicine === 1 || service.telemedicine === '1';
        const newVal = currentVal ? 0 : 1;
        
        // Use partial update to avoid potential conflicts with other fields
        return get().handleOp('services', 'put', { telemedicine: newVal }, { text: 'Telemedicine updated', icon: <Video size={18} color="#3b82f6" /> }, 'services', id);
      },

      // Care Providers & Ambulance
      addPendingCareProvider: (data) => get().handleOp('care-providers', 'post', data, 'Application submitted', 'pendingCareProviders'),
      addCareProviderBooking: (data) => {
        const user = get().user;
        const patient_user_id = user.ecareRole === 'patient' ? user.id : (data.patient_user_id || null);
        return get().handleOp('care-provider-bookings', 'post', { ...data, status: 'Confirmed', patient_user_id }, 'Booking created', 'careProviderBookings');
      },
      updateCareProviderBooking: (id, data) => get().handleOp('care-provider-bookings', 'put', data, 'Booking updated', 'careProviderBookings', id),
      deleteCareProviderBooking: async (id) => {
        const txn = get().transactions.find(t => String(t.careProviderBookingId || t.care_provider_booking_id) === String(id));
        if (txn && get().user.ecareRole === 'admin') {
          await get().handleOp('billing', 'delete', null, null, 'transactions', txn.id);
        }
        return get().handleOp('care-provider-bookings', 'delete', null, 'Booking removed', 'careProviderBookings', id);
      },
      
      registerAmbulance: (data) => {
        const isPending = data.status === 'Pending';
        const msg = isPending ? 'Driver application submitted' : 'Ambulance unit onboarded successfully';
        return get().handleOp('ambulance', 'post', data, msg, isPending ? 'pendingAmbulanceDrivers' : 'ambulance');
      },
      updateAmbulance: (id, data) => get().handleOp('ambulance', 'put', data, 'Ambulance unit updated', 'ambulance', id),
      addAmbulanceBooking: (data) => {
        const user = get().user;
        const patient_user_id = user.ecareRole === 'patient' ? user.id : (data.patient_user_id || null);
        return get().handleOp('ambulance-bookings', 'post', { ...data, status: 'Pending', patient_user_id }, 'Booking request received', 'ambulanceBookings');
      },
      updateAmbulanceBooking: (id, data) => get().handleOp('ambulance-bookings', 'put', data, 'Dispatch updated', 'ambulanceBookings', id),
      assignAmbulance: async (bookingId, vehicleId) => {
        const booking = get().ambulanceBookings.find(b => b.id === bookingId)
        const vehicle = get().ambulance.find(v => v.id === vehicleId)
        if (!booking || !vehicle) return;

        // Update booking with vehicle info and change status
        await get().updateAmbulanceBooking(bookingId, { 
          vehicleId: vehicleId,
          vehiclePlate: vehicle.plate || vehicle.license,
          driverName: vehicle.name || vehicle.driverName,
          status: 'On Mission'
        })

        // Update vehicle status to Busy/On Mission (assuming we have a fleet update action)
        await get().handleOp('ambulance', 'put', { status: 'On Mission' }, null, 'ambulance', vehicleId)
      },
      deleteAmbulanceBooking: async (id) => {
        const txn = get().transactions.find(t => String(t.ambulanceBookingId || t.ambulance_booking_id) === String(id));
        if (txn && get().user.ecareRole === 'admin') {
          await get().handleOp('billing', 'delete', null, null, 'transactions', txn.id);
        }
        return get().handleOp('ambulance-bookings', 'delete', null, 'Mission removed', 'ambulanceBookings', id);
      },
      deleteAmbulance: (id) => get().handleOp('ambulance', 'delete', null, 'Ambulance removed from fleet', 'ambulance', id),

      // Application Management (Approvals/Rejections)
      removePendingDoctor: (id) => get().handleOp('doctors', 'delete', null, 'Application removed', 'pendingDoctors', id),
      removePendingCareProvider: (id) => get().handleOp('care-providers', 'delete', null, 'Application removed', 'pendingCareProviders', id),
      deleteCareProvider: (id) => get().handleOp('care-providers', 'delete', null, 'Provider record removed', 'careProviders', id),

      // Billing
      addTransaction: (data) => {
        const prefix = 'ECR'
        const randomNo = Math.floor(1000 + Math.random() * 9000);
        const invoiceNo = `${prefix} - ${randomNo}`;
        const user = get().user;
        const issuedBy = data.issuedBy || user?.name || 'System';
        const patient_user_id = user.ecareRole === 'patient' ? user.id : (data.patient_user_id || null);
        return get().handleOp('billing', 'post', { 
          ...data, 
          invoiceNo: data.invoiceNo || invoiceNo, 
          issuedBy,
          patient_user_id 
        }, 'Transaction recorded', 'transactions');
      },
      addPaymentToTransaction: async (id, paymentAmount, method = 'Cash') => {
        const txn = get().transactions.find(t => t.id === id);
        if (!txn) return;
        
        const newPaidAmount = (Number(txn.paidAmount) || 0) + Number(paymentAmount);
        const newStatus = newPaidAmount >= Number(txn.amount) ? 'Paid' : 'Partially Paid';
        
        // Handle Payment History
        let history = [];
        try {
          history = typeof txn.paymentHistory === 'string' ? JSON.parse(txn.paymentHistory) : (Array.isArray(txn.paymentHistory) ? txn.paymentHistory : []);
        } catch (e) { history = []; }
        
        const newEntry = {
          amount: paymentAmount,
          method,
          date: new Date().toISOString()
        };
        
        const updatedHistory = JSON.stringify([...history, newEntry]);
        
        return get().updateTransaction(id, { 
          paidAmount: newPaidAmount, 
          status: newStatus, 
          method,
          paymentHistory: updatedHistory
        });
      },
      updateTransaction: async (id, data) => {
        const res = await get().handleOp('billing', 'put', data, 'Transaction updated', 'transactions', id);
        if (res && data.status) {
          // Sync status back to linked modules if applicable
          const txn = get().transactions.find(t => t.id === id);
          if (txn) {
            const aid = txn.appointmentId || txn.appointment_id;
            const cpid = txn.careProviderBookingId || txn.care_provider_booking_id;
            const loid = txn.labOrderId || txn.lab_order_id;

            if (aid) {
              const updates = { paymentStatus: data.status };
              if (data.method) updates.paymentMethod = formatPaymentMethod(data.method);
              get().updateAppointment(aid, updates);
            } else if (cpid) {
              const updates = { paymentStatus: data.status };
              if (data.method) updates.paymentMethod = formatPaymentMethod(data.method);
              get().updateCareProviderBooking(cpid, updates);
            } else if (loid) {
              const updates = { payment_status: data.status };
              if (data.method) updates.payment_method = formatPaymentMethod(data.method);
              get().updateLabOrder(loid, updates);
            } else if (txn.ambulanceBookingId || txn.ambulance_booking_id) {
              const abid = txn.ambulanceBookingId || txn.ambulance_booking_id;
              const updates = { paymentStatus: data.status };
              if (data.method) updates.paymentMethod = formatPaymentMethod(data.method);
              get().updateAmbulanceBooking(abid, updates);
            }
          }
        }
        return res;
      },
      deleteTransaction: (id) => get().handleOp('billing', 'delete', null, 'Transaction removed', 'transactions', id),

      // General UI Actions
      setActivePage: (page) => {
        console.log('Store setActivePage action called with:', page)
        set({ activePage: page })
      },
      setEditingDoctor: (doctor) => set({ editingDoctor: doctor }),
      setEditingPatient: (patient) => set({ editingPatient: patient }),
      setEditingAppointment: (appt) => set({ editingAppointment: appt }),
      setEditingCareProviderBooking: (booking) => set({ editingCareProviderBooking: booking }),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      setAppointmentModal: (isOpen) => set({ isAppointmentModalOpen: isOpen, editingAppointment: isOpen ? get().editingAppointment : null }),
      setCareProviderBookingModal: (isOpen) => set({ isCareProviderBookingModalOpen: isOpen, editingCareProviderBooking: isOpen ? get().editingCareProviderBooking : null }),
      setAmbulanceModal: (isOpen, booking = null) => set({ isAmbulanceModalOpen: isOpen, editingAmbulanceBooking: booking || (isOpen ? get().editingAmbulanceBooking : null) }),
      setLabBookingModal: (isOpen) => set({ isLabBookingModalOpen: isOpen }),
      setUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
      openConfirm: (config) => set({ confirmModal: { ...config, isOpen: true } }),
      closeConfirm: () => set({ 
        confirmModal: { 
          isOpen: false, title: '', message: '', confirmText: 'Confirm', cancelText: 'Cancel', onConfirm: null 
        } 
      }),

      // Notifications
      markNotificationAsRead: async (id) => {
        if (typeof id === 'string' && id.startsWith('sys-')) {
          set((state) => {
            const updatedRead = [...(state.readSystemNotifs || []), id];
            return {
              readSystemNotifs: updatedRead,
              notifications: (state.notifications || []).filter(n => n.id !== id)
            };
          });
        } else {
          // Persist read state in DB
          try {
            await api.put('notifications/' + id, { read: true });
            set((state) => ({
              notifications: (state.notifications || []).map(n => n.id === id ? { ...n, read: true } : n)
            }));
          } catch (e) {
            console.error('Failed to mark notification as read in DB:', e);
          }
        }
      },
      markAllAsRead: async () => {
        const sysIds = (get().notifications || [])
          .filter(n => typeof n.id === 'string' && n.id.startsWith('sys-'))
          .map(n => n.id);
        
        const dbIds = (get().notifications || [])
          .filter(n => !(typeof n.id === 'string' && n.id.startsWith('sys-')))
          .map(n => n.id);

        set((state) => ({
          readSystemNotifs: [...(state.readSystemNotifs || []), ...sysIds],
          notifications: (state.notifications || []).map(n => ({ ...n, read: true }))
        }));

        // Persist DB notifications as read
        for (const dbId of dbIds) {
          try {
            await api.put('notifications/' + dbId, { read: true });
          } catch (e) {
            console.error('Failed to mark DB notification read:', e);
          }
        }
      },
      clearNotifications: async () => {
        const sysIds = (get().notifications || [])
          .filter(n => typeof n.id === 'string' && n.id.startsWith('sys-'))
          .map(n => n.id);
        
        const dbIds = (get().notifications || [])
          .filter(n => !(typeof n.id === 'string' && n.id.startsWith('sys-')))
          .map(n => n.id);

        set((state) => ({
          readSystemNotifs: [...(state.readSystemNotifs || []), ...sysIds],
          notifications: []
        }));

        // Delete DB notifications
        for (const dbId of dbIds) {
          try {
            await api.delete('notifications/' + dbId);
          } catch (e) {
            console.error('Failed to delete DB notification:', e);
          }
        }
      },

      // Manual Verifications
      addManualVerification: (data) => get().handleOp('manual-verifications', 'post', { ...data, status: 'Pending', submittedAt: new Date().toISOString().split('T')[0] }, 'Sent for verification', 'manualVerifications'),
      verifyManualPayment: (id) => get().handleOp('manual-verifications', 'put', { status: 'Verified' }, 'Payment verified', 'manualVerifications', id),
      rejectManualPayment: (id) => get().handleOp('manual-verifications', 'put', { status: 'Rejected' }, 'Payment rejected', 'manualVerifications', id),



      // Payouts
      addPayout: (data) => get().handleOp('payouts', 'post', { ...data, date: new Date().toISOString().split('T')[0] }, 'Payout recorded', 'payouts'),
      processPayout: (id, updateData = {}) => get().handleOp('payouts', 'put', { ...updateData, status: 'Paid' }, 'Payout processed', 'payouts', id),
      deletePayout: (id) => get().handleOp('payouts', 'delete', {}, 'Payout removed', 'payouts', id),

      // Support Ticketing & Messaging
      addSupportTicket: (data) => get().handleOp('support-tickets', 'post', data, 'Support ticket created successfully', 'supportTickets'),
      updateSupportTicket: (id, data) => get().handleOp('support-tickets', 'put', data, 'Ticket updated successfully', 'supportTickets', id),
      deleteSupportTicket: (id) => get().handleOp('support-tickets', 'delete', null, 'Ticket deleted', 'supportTickets', id),
      addSupportMessage: (data) => get().handleOp('support-messages', 'post', data, null, 'supportMessages'),
      deleteSupportMessage: (id) => get().handleOp('support-messages', 'delete', null, 'Message deleted', 'supportMessages', id),
      updateSupportMessage: (id, data) => get().handleOp('support-messages', 'put', data, null, 'supportMessages', id),
      deleteTelemedMessage: (id) => get().handleOp('telemed-messages', 'delete', null, 'Message deleted', 'telemedMessages', id),
      updateTelemedMessage: (id, data) => get().handleOp('telemed-messages', 'put', data, null, 'telemedMessages', id),
      markSupportMessagesAsSeen: (ticketId) => {
        const ticketMsgs = (get().supportMessages || []).filter(m => parseInt(m.ticket_id) === parseInt(ticketId));
        const ticketMsgIds = ticketMsgs.map(m => m.id);
        set((state) => {
          const currentSeen = state.seenSupportMessageIds || [];
          const nextSeen = Array.from(new Set([...currentSeen, ...ticketMsgIds]));
          return { seenSupportMessageIds: nextSeen };
        });
      },

      // Refunds & Compensation Actions
      addRefund: (data) => get().handleOp('refunds', 'post', data, 'Refund initiated successfully', 'refunds'),
      processRefund: (data) => get().handleOp('refunds', 'post', data, 'Refund processed successfully', 'refunds'),
      updateRefund: (id, data) => get().handleOp('refunds', 'put', data, 'Refund updated successfully', 'refunds', id),
      deleteRefund: (id) => get().handleOp('refunds', 'delete', null, 'Refund removed', 'refunds', id),

      // Promo Codes
      addPromoCode: (data) => get().handleOp('promo-codes', 'post', data, 'Promo code added', 'promoCodes'),
      updatePromoCode: (id, data) => get().handleOp('promo-codes', 'put', data, 'Promo code updated', 'promoCodes', id),
      deletePromoCode: (id) => get().handleOp('promo-codes', 'delete', null, 'Promo code deleted', 'promoCodes', id),

      validatePromoCode: async (code) => {
        try {
          const res = await api.post('validate-promo', { code });
          const data = res.data;
          if (data && data.success && data.promo) {
            toast.success('Promo code applied!');
            return data.promo;
          }
        } catch (e) {
          toast.error(e.response?.data?.message || 'Invalid or expired promo code');
        }
        return null;
      },

      addToCart: (item) => {
        let currentCart = getInitialStoredCart();
        const inMemCart = get().cart;
        if (Array.isArray(inMemCart) && inMemCart.length > currentCart.length) {
          currentCart = inMemCart;
        }
        const exists = currentCart.some(c => c.id === item.id);
        let updatedCart = [];
        if (exists) {
          updatedCart = currentCart.map(c => c.id === item.id ? { ...c, ...item } : c);
        } else {
          updatedCart = [...currentCart, item];
        }
        set({ cart: updatedCart });
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
        } catch (e) {}
        toast.success(exists ? `${item.name} updated in cart!` : `${item.name} added to cart!`);
        window.dispatchEvent(new CustomEvent('ecare_cart_updated', { detail: { cart: updatedCart } }));
      },

      removeFromCart: (id) => {
        let currentCart = getInitialStoredCart();
        const inMemCart = get().cart;
        if (Array.isArray(inMemCart) && inMemCart.length > 0) {
          currentCart = inMemCart;
        }
        const updatedCart = currentCart.filter(c => c.id !== id);
        set({ cart: updatedCart });
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
        } catch (e) {}
        toast.success('Item removed from cart');
        window.dispatchEvent(new CustomEvent('ecare_cart_updated', { detail: { cart: updatedCart } }));
      },

      clearCart: () => {
        set({ cart: [] });
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('ecare_cart_updated', { detail: { cart: [] } }));
      },

      uploadFile: async (file, purpose = 'clinical') => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('purpose', purpose);
          const res = await api.post('upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          const data = res.data;
          if (data && data.success && data.files && data.files.length > 0) {
            return data.files[0];
          }
        } catch (e) {
          toast.error('File upload failed');
        }
        return null;
      },

      completeAppointment: async (id) => {
        return get().updateAppointment(id, { status: 'Completed' });
      },

      missAppointment: async (id, missedBy) => {
        const appt = get().appointments.find(a => a.id === id);
        if (!appt) return false;

        const updates = { 
          status: 'Pending', 
          missedBy: missedBy 
        };

        if (missedBy === 'doctor') {
          updates.refundStatus = 'pending_7_days';
          
          // Generate 7-day refund record in database!
          const refundDate = new Date();
          refundDate.setDate(refundDate.getDate() + 7);
          const refundDateStr = refundDate.toISOString().split('T')[0];

          try {
            await get().addRefund({
              transactionId: appt.transactionId || appt.transaction_id || `TXN-MISS-${id}`,
              appointmentId: id,
              amount: appt.price || appt.amount || 0,
              patientName: appt.patientName,
              patientId: appt.patient_user_id || appt.patientId || appt.userId || 0,
              reason: `Doctor missed booked slot on ${appt.date} (${appt.time})`,
              scheduledDate: refundDateStr,
              status: 'Pending'
            });
          } catch (e) {
            console.error('Failed to auto-process doctor-missed refund:', e);
          }
        }

        return get().updateAppointment(id, updates);
      },

      // Settings Actions
      setInstantCallFee: (fee) => set({ instantCallFee: fee }),
      setInstantRefundDuration: (dur) => set({ instantRefundDuration: dur }),
      setStandardRefundDuration: (dur) => set({ standardRefundDuration: dur }),
      setProviderTypes: (types) => set({ providerTypes: types }),
      setServicePricing: (pricing) => set({ servicePricing: pricing }),
      setWooCommerceEnabled: (enabled) => set({ woocommerceEnabled: enabled }),
      setPartialPayment: (partialPayment) => set({ partialPayment }),
      setConsultationModes: (modes) => set({ consultationModes: modes }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setPlatformCommission: (percent) => set({ platformCommission: percent }),
      setServiceCommissions: (commissions) => set({ serviceCommissions: commissions }),
      updateServiceCommission: async (category, data) => {
        const next = { ...get().serviceCommissions, [category]: { ...get().serviceCommissions[category], ...data } }
        set({ serviceCommissions: next })
        
        // Instant sync to database
        try {
          const settings = { ...(window.ecareConfig?.settings || {}), serviceCommissions: next }
          await api.post('settings', settings)
          window.ecareConfig.settings = settings
        } catch (e) {
          console.error('Failed to auto-sync commission:', e)
        }
      },
      updatePaymentGateway: (key, data) => set((state) => ({
        paymentGateways: { ...state.paymentGateways, [key]: { ...state.paymentGateways[key], ...data } }
      })),
      setCurrency: (symbol, code) => set({ currencySymbol: symbol, currencyCode: code }),
      completeOnboarding: async (onboardingData) => {
        set({ isLoading: true })
        try {
          const response = await api.post('onboarding/complete', onboardingData)
          if (response.data?.success) {
            set({ isSetupCompleted: true })
            if (response.data.settings) {
              window.ecareConfig.settings = response.data.settings
              window.ecareConfig.isSetupCompleted = true
              set({
                primaryColor: response.data.settings.primaryColor || get().primaryColor
              })
            }
            return true
          }
          return false
        } catch (err) {
          console.error('Onboarding complete error:', err)
          throw err
        } finally {
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'ecare-storage-v5', // bumped to v5 to fix dashboard widget structure
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        activePage: state.activePage, 
        isSidebarCollapsed: state.isSidebarCollapsed,
        readSystemNotifs: state.readSystemNotifs,
        seenSupportMessageIds: state.seenSupportMessageIds
      }),
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          useStore.setState({ cart: parsed });
        }
      } catch (err) {}
    }
  });
  window.addEventListener('ecare_cart_updated', (e) => {
    if (e.detail?.cart && Array.isArray(e.detail.cart)) {
      useStore.setState({ cart: e.detail.cart });
    }
  });
}

export default useStore
