import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChatCenteredText, WarningCircle, Tag, Clock, PaperPlaneRight, 
  X, MagnifyingGlass, Folder, CheckCircle, Shield, User, Plus, 
  Chat, CaretRight, Circle, CaretLeft
} from 'phosphor-react'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import CustomSelect from '../components/CustomSelect'

const Support = () => {
  const { 
    user, 
    supportTickets, 
    supportMessages, 
    addSupportTicket, 
    updateSupportTicket, 
    deleteSupportTicket, 
    addSupportMessage,
    updateSupportMessage,
    deleteSupportMessage,
    primaryColor,
    seenSupportMessageIds = [],
    markSupportMessagesAsSeen,
    openConfirm,
    closeConfirm
  } = useStore()

  // State Management
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [newMessageText, setNewMessageText] = useState('')
  const [ticketSearchQuery, setTicketSearchQuery] = useState('')
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  
  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    title: '',
    category: 'General',
    priority: 'Medium',
    initialMessage: ''
  })

  // Chat message autoscroll ref
  const chatEndRef = useRef(null)

  // Determine user role and active state
  const isAdmin = user?.ecareRole === 'admin'
  const currentUserId = user?.id

  // Fetch / Sync updates in background
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [supportMessages, selectedTicketId])

  // Mark messages of the active ticket as seen automatically
  useEffect(() => {
    if (selectedTicketId) {
      markSupportMessagesAsSeen(selectedTicketId)
    }
  }, [selectedTicketId, supportMessages, markSupportMessagesAsSeen])

  // Filter support tickets based on permissions and search query
  const safeTickets = Array.isArray(supportTickets) ? supportTickets : []
  const safeMessages = Array.isArray(supportMessages) ? supportMessages : []

  // Users can only view their own tickets; admins view all
  const filteredTickets = safeTickets
    .filter(t => {
      const matchesRole = isAdmin || String(t.user_id) === String(currentUserId)
      const matchesSearch = (t.title || '').toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                            (t.user_name || '').toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                            (t.category || '').toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                            (t.description || t.initial_message || '').toLowerCase().includes(ticketSearchQuery.toLowerCase())
      return matchesRole && matchesSearch
    })
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))

  // Auto select first ticket if none is selected
  useEffect(() => {
    if (!selectedTicketId && filteredTickets.length > 0) {
      setSelectedTicketId(filteredTickets[0].id)
    }
  }, [filteredTickets, selectedTicketId])

  // Find currently active ticket (using string matching to prevent parseInt truncation on string IDs)
  const activeTicket = safeTickets.find(t => String(t.id) === String(selectedTicketId))
  
  // Filter messages for currently active ticket
  const activeMessages = safeMessages
    .filter(m => String(m.ticket_id) === String(selectedTicketId))
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))

  // Handle support ticket creation
  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!newTicket.title.trim() || !newTicket.initialMessage.trim()) return

    const ticketData = {
      user_id: currentUserId,
      user_name: user?.name || 'Anonymous User',
      user_role: user?.ecareRole || 'patient',
      title: newTicket.title,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'Open',
      description: newTicket.initialMessage,
      initial_message: newTicket.initialMessage
    }

    const res = await addSupportTicket(ticketData)
    if (res && res.id) {
      // Auto-insert first support message using the new ticket ID
      await addSupportMessage({
        ticket_id: res.id,
        sender_id: currentUserId,
        sender_name: user?.name || 'Anonymous User',
        sender_role: user?.ecareRole || 'patient',
        message: newTicket.initialMessage
      })

      // Reset form and select new ticket
      setNewTicket({
        title: '',
        category: 'General',
        priority: 'Medium',
        initialMessage: ''
      })
      setIsCreatingTicket(false)
      setSelectedTicketId(res.id)
      setMobileShowChat(true)
    }
  }

  // Handle sending new reply messages
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessageText.trim() || !selectedTicketId) return

    if (editingMessage) {
      await updateSupportMessage(editingMessage.id, {
        ...editingMessage,
        message: newMessageText,
        is_edited: true
      })
      setEditingMessage(null)
      setNewMessageText('')
    } else {
      const messageData = {
        ticket_id: selectedTicketId,
        sender_id: currentUserId,
        sender_name: user?.name || 'Anonymous User',
        sender_role: user?.ecareRole || 'patient',
        message: newMessageText,
        reply_to_id: replyToMessage ? replyToMessage.id : undefined
      }

      const res = await addSupportMessage(messageData)
      if (res) {
        setNewMessageText('')
        setReplyToMessage(null)
      }
    }
  }

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const styles = {
      'Open': { bg: '#edfcf2', color: '#0ea5e9', border: '1px solid #bae6fd' },
      'In Progress': { bg: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7' },
      'Resolved': { bg: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
    }
    const style = styles[status] || styles['Open']
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...style
      }}>
        {status}
      </span>
    )
  }

  // Priority Color Helper
  const getPriorityBadge = (priority) => {
    const styles = {
      'High': { bg: '#fef2f2', color: '#ef4444' },
      'Medium': { bg: '#fffbeb', color: '#f59e0b' },
      'Low': { bg: '#eff6ff', color: '#3b82f6' }
    }
    const style = styles[priority] || styles['Medium']
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: style.color,
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        <Circle size={8} weight="fill" color={style.color} />
        {priority}
      </span>
    )
  }

  return (
    <div className="ecare-support-grid ecare-keep-grid">
      
      {/* LEFT SIDEBAR: Support Tickets List */}
      <div className={`ecare-card ecare-support-sidebar ${mobileShowChat ? 'ecare-support-mobile-hide' : ''}`} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>Support Tickets</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: 0 }}>
              {isAdmin ? 'Manage system tickets' : 'Connect with system admin'}
            </p>
          </div>
          {!isAdmin && (
            <button 
              onClick={() => setIsCreatingTicket(true)}
              className="ecare-button"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Search Box */}
        <div style={{ position: 'relative' }}>
          <MagnifyingGlass size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ecare-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tickets..."
            className="ecare-input" 
            style={{ paddingLeft: '36px', height: '38px', borderRadius: '10px' }}
            value={ticketSearchQuery}
            onChange={(e) => setTicketSearchQuery(e.target.value)}
          />
        </div>

        {/* Tickets Scroll View */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
          {filteredTickets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--ecare-text-muted)', padding: '2rem', textAlign: 'center' }}>
              <ChatCenteredText size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>No tickets found</div>
              <div style={{ fontSize: '0.75rem' }}>{isAdmin ? 'No support cases open currently.' : 'Need help? Click + to create a support ticket.'}</div>
            </div>
          ) : (
            filteredTickets.map(t => {
              const isActive = String(t.id) === String(selectedTicketId)
              const lastMsg = safeMessages
                .filter(m => String(m.ticket_id) === String(t.id))
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]

              const isUnseen = lastMsg && String(lastMsg.sender_id) !== String(currentUserId) && !(seenSupportMessageIds || []).includes(lastMsg.id);

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicketId(t.id)
                    setMobileShowChat(true)
                  }}
                  style={{
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: isActive ? `1.5px solid ${primaryColor}` : '1.5px solid #f1f5f9',
                    backgroundColor: isActive ? `${primaryColor}06` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ 
                      fontWeight: isUnseen ? 800 : 600, 
                      fontSize: '0.85rem', 
                      color: isActive ? primaryColor : (isUnseen ? '#0f172a' : 'var(--ecare-text-main)'), 
                      lineClamp: 1, 
                      display: '-webkit-box', 
                      WebkitLineClamp: 1, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      flex: 1
                    }}>
                      {t.title}
                      {isUnseen && (
                        <span style={{ 
                          display: 'inline-block', 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: '#0ea5e9', 
                          marginLeft: '6px', 
                          verticalAlign: 'middle',
                          boxShadow: '0 0 6px #0ea5e9'
                        }} />
                      )}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>
                  
                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--ecare-text-muted)' }}>
                      <User size={12} />
                      <span style={{ fontWeight: 500 }}>{t.user_name} ({t.user_role})</span>
                    </div>
                  )}

                  {lastMsg && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.75rem', 
                      fontWeight: isUnseen ? 700 : 400,
                      color: isUnseen ? '#0284c7' : 'var(--ecare-text-muted)', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden' 
                    }}>
                      {parseInt(lastMsg.sender_id) === parseInt(currentUserId) ? 'You: ' : `${lastMsg.sender_name}: `}
                      {lastMsg.message}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    {getPriorityBadge(t.priority)}
                    <span style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: Chat Panel */}
      <div className={`ecare-card ecare-support-chat ${!mobileShowChat ? 'ecare-support-mobile-hide' : ''}`} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTicket ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
            
            {/* Chat Room Header */}
            <div className="ecare-support-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0, flex: '1 1 auto' }}>
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="ecare-support-back-btn"
                  style={{
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.4rem 0.65rem',
                    cursor: 'pointer',
                    display: 'none',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--ecare-text-main)',
                    flexShrink: 0
                  }}
                >
                  <CaretLeft size={16} weight="bold" />
                  <span>Back</span>
                </button>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ChatCenteredText size={20} weight="fill" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{activeTicket.title}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', whiteSpace: 'nowrap' }}>Category: <strong style={{ color: 'var(--ecare-text-main)' }}>{activeTicket.category}</strong></span>
                    <span style={{ color: '#e2e8f0' }}>|</span>
                    {getPriorityBadge(activeTicket.priority)}
                  </div>
                </div>
              </div>

              {/* Admin Actions: Update ticket status & category */}
              <div className="ecare-support-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
                {isAdmin ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                    {activeTicket.status !== 'In Progress' && activeTicket.status !== 'Resolved' && (
                      <button
                        onClick={() => updateSupportTicket(activeTicket.id, { ...activeTicket, status: 'In Progress' })}
                        className="ecare-button"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', height: '32px', whiteSpace: 'nowrap', width: 'auto', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                      >
                        Start Solving
                      </button>
                    )}
                    {activeTicket.status !== 'Resolved' && (
                      <button
                        onClick={() => updateSupportTicket(activeTicket.id, { ...activeTicket, status: 'Resolved' })}
                        className="ecare-button"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', height: '32px', whiteSpace: 'nowrap', width: 'auto' }}
                      >
                        Mark Resolved
                      </button>
                    )}
                    {activeTicket.status === 'Resolved' && (
                      <button
                        onClick={() => updateSupportTicket(activeTicket.id, { ...activeTicket, status: 'In Progress' })}
                        className="ecare-btn-secondary"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', height: '32px', whiteSpace: 'nowrap', width: 'auto' }}
                      >
                        Reopen Ticket
                      </button>
                    )}
                    <button
                      onClick={() => {
                        openConfirm({
                          title: 'Delete Support Ticket',
                          message: 'Are you sure you want to permanently delete this support ticket? This will remove the entire conversation history from all users.',
                          confirmText: 'Delete Permanently',
                          cancelText: 'Cancel',
                          onConfirm: async () => {
                            const success = await deleteSupportTicket(activeTicket.id);
                            if (success) {
                              setSelectedTicketId(null);
                              setMobileShowChat(false);
                            }
                            closeConfirm();
                          }
                        });
                      }}
                      className="ecare-btn-secondary"
                      style={{ 
                        padding: '0.5rem 0.75rem', 
                        fontSize: '0.75rem', 
                        height: '32px', 
                        borderColor: '#ef4444', 
                        color: '#ef4444',
                        background: 'transparent',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        width: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Delete Ticket
                    </button>
                  </div>
                ) : (
                  getStatusBadge(activeTicket.status)
                )}
              </div>
            </div>

            {/* Chat Messages Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fafbfc' }}>
              
              {/* Submitted Ticket Information Card */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem'
                    }}>
                      {(activeTicket.user_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>
                        {activeTicket.user_name || 'Anonymous User'} 
                        <span style={{ 
                          fontSize: '0.725rem', 
                          fontWeight: 600, 
                          color: 'var(--ecare-text-muted)', 
                          marginLeft: '6px',
                          textTransform: 'capitalize' 
                        }}>
                          ({activeTicket.user_role || 'patient'})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>
                        Submitted {activeTicket.created_at ? new Date(activeTicket.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.725rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                      {activeTicket.category || 'General'}
                    </span>
                    {getPriorityBadge(activeTicket.priority)}
                  </div>
                </div>

                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '0.75rem', 
                  fontSize: '0.875rem', 
                  color: '#334155', 
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ecare-text-muted)', marginBottom: '0.35rem', letterSpacing: '0.03em' }}>
                    Original Issue Details:
                  </div>
                  {activeTicket.description || activeTicket.initial_message || activeTicket.message || (activeMessages[0] ? activeMessages[0].message : 'No detailed description provided.')}
                </div>
              </div>

              {activeMessages.map((m) => {
                const isMe = String(m.sender_id) === String(currentUserId)
                const isSystemAdmin = m.sender_role === 'admin'
                const parentMsg = m.reply_to_id ? activeMessages.find(msg => String(msg.id) === String(m.reply_to_id)) : null;
                return (
                  <div
                    key={m.id}
                    id={`msg-${m.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-main)' }}>
                        {isMe ? 'You' : m.sender_name}
                      </span>
                      {isSystemAdmin && !isMe && (
                        <span style={{
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          border: '1px solid #fecaca',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Shield size={10} />
                          Support Specialist
                        </span>
                      )}
                      <span style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)' }}>
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>

                    <div style={{
                      maxWidth: '70%',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '14px',
                      fontSize: '0.875rem',
                      lineHeight: '1.45',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      backgroundColor: isMe ? primaryColor : 'white',
                      color: isMe ? 'white' : 'var(--ecare-text-main)',
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      borderTopRightRadius: isMe ? '2px' : '14px',
                      borderTopLeftRadius: isMe ? '14px' : '2px',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {parentMsg && (
                        <div 
                          onClick={() => {
                            const el = document.getElementById(`msg-${parentMsg.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          style={{
                            background: isMe ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
                            borderLeft: `3px solid ${isMe ? 'white' : 'var(--ecare-primary)'}`,
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            color: isMe ? 'white' : 'var(--ecare-text-main)',
                            opacity: 0.95,
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: '2px', color: isMe ? 'white' : 'var(--ecare-primary)' }}>
                            {String(parentMsg.sender_id) === String(currentUserId) ? 'You' : parentMsg.sender_name}
                          </div>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                            {parentMsg.message}
                          </div>
                        </div>
                      )}
                      {m.message}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem', alignItems: 'center', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <button 
                        type="button" 
                        onClick={() => { setReplyToMessage(m); setEditingMessage(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--ecare-text-muted)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        Reply
                      </button>
                      {isMe && (
                        <button 
                          type="button" 
                          onClick={() => { setEditingMessage(m); setReplyToMessage(null); setNewMessageText(m.message); }}
                          style={{ background: 'none', border: 'none', color: 'var(--ecare-text-muted)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        >
                          Edit
                        </button>
                      )}
                      {(isMe || isAdmin) && (
                        <button 
                          type="button" 
                          onClick={() => {
                            openConfirm({
                              title: 'Delete Message',
                              message: 'Are you sure you want to permanently delete this message? This action cannot be undone.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              onConfirm: async () => {
                                await deleteSupportMessage(m.id);
                                closeConfirm();
                              }
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        >
                          Delete
                        </button>
                      )}
                      {m.is_edited && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)', fontStyle: 'italic' }}>
                          (edited)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Room Footer Input Area */}
            {activeTicket.status === 'Resolved' ? (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--ecare-text-muted)', fontSize: '0.8rem', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--ecare-primary)" />
                This ticket has been marked as <strong>Resolved</strong>. {isAdmin ? 'Reopen the ticket to write a reply.' : 'You can open a new ticket if the problem persists.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                {replyToMessage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 1.5rem', borderLeft: '4px solid var(--ecare-primary)', fontSize: '0.75rem' }}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%', textAlign: 'left' }}>
                      Replying to <strong style={{ color: 'var(--ecare-primary)' }}>{replyToMessage.sender_name}</strong>: <span style={{ color: 'var(--ecare-text-muted)' }}>{replyToMessage.message}</span>
                    </div>
                    <button type="button" onClick={() => setReplyToMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><X size={14} weight="bold" /></button>
                  </div>
                )}
                {editingMessage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef3c7', padding: '8px 1.5rem', borderLeft: '4px solid #f59e0b', fontSize: '0.75rem' }}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%', textAlign: 'left' }}>
                      Editing message: <span style={{ color: '#b45309' }}>{editingMessage.message}</span>
                    </div>
                    <button type="button" onClick={() => { setEditingMessage(null); setNewMessageText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><X size={14} weight="bold" /></button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <textarea
                    placeholder="Type your message here..."
                    className="ecare-input"
                    style={{ flex: 1, resize: 'none', height: '44px', padding: '0.6rem 1rem', borderRadius: '12px' }}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="ecare-button"
                    style={{
                      width: '44px',
                      height: '44px',
                      padding: 0,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                  </button>
                </form>
              </div>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--ecare-text-muted)', padding: '3rem', textAlign: 'center' }}>
            <Chat size={64} style={{ opacity: 0.15, marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ecare-text-main)', fontSize: '1.1rem', fontWeight: 600 }}>Select a Ticket</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', maxWidth: '320px' }}>
              Choose a ticket from the left sidebar panel to view conversation logs, chat history, or connect with help center staff.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: CREATE SUPPORT TICKET */}
      <Portal>
        <AnimatePresence>
          {isCreatingTicket && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreatingTicket(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.3)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 3000
                }}
              />
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 3001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                pointerEvents: 'none'
              }}>
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="ecare-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    width: '100%', 
                    maxWidth: '480px', 
                    pointerEvents: 'auto',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ecare-primary)',
                        flexShrink: 0
                      }}>
                        <ChatCenteredText size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          Create Support Ticket
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Submit your request to our support helpdesk
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTicket(false)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTicket} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="ecare-scrollbar">
                    {/* Ticket Title */}
                    <div className="ecare-form-group">
                      <label className="ecare-label">Ticket Title</label>
                      <input
                        type="text"
                        required
                        placeholder="Briefly summarize your issue..."
                        className="ecare-input"
                        value={newTicket.title}
                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      />
                    </div>

                    {/* Category & Priority in side-by-side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ecare-form-group">
                        <label className="ecare-label">Category</label>
                        <CustomSelect
                          value={newTicket.category}
                          onChange={(val) => setNewTicket({ ...newTicket, category: val })}
                          options={[
                            { value: 'General', label: 'General' },
                            { value: 'Billing', label: 'Billing & Payouts' },
                            { value: 'Technical', label: 'Technical Issue' },
                            { value: 'Medical', label: 'Medical Queries' }
                          ]}
                          customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                        />
                      </div>

                      <div className="ecare-form-group">
                        <label className="ecare-label">Priority</label>
                        <CustomSelect
                          value={newTicket.priority}
                          onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                          options={[
                            { value: 'Low', label: 'Low' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'High', label: 'High' }
                          ]}
                          customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                        />
                      </div>
                    </div>

                    {/* Initial Description Message */}
                    <div className="ecare-form-group">
                      <label className="ecare-label">Describe Your Issue</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Provide details about your problem, background context, or steps to reproduce..."
                        className="ecare-input"
                        style={{ resize: 'none', padding: '0.625rem 0.875rem' }}
                        value={newTicket.initialMessage}
                        onChange={(e) => setNewTicket({ ...newTicket, initialMessage: e.target.value })}
                      />
                    </div>

                    {/* Submission Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button 
                        type="button"
                        onClick={() => setIsCreatingTicket(false)}
                        className="ecare-btn-secondary" 
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="ecare-button" 
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <CheckCircle size={18} weight="bold" /> Submit Ticket
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  )
}

export default Support
