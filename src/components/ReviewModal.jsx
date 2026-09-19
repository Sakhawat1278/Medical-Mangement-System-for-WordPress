import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'phosphor-react';
import { Portal } from '../utils/portal';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, appointment }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addReview, user, reviews } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a brief review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addReview({
        patient_id: user?.id,
        patient_name: user?.name,
        doctor_id: appointment?.doctor_user_id || appointment?.doctorId,
        doctor_name: appointment?.doctorName,
        appointment_id: appointment?.id,
        rating,
        review_text: reviewText,
        status: 'Pending',
        created_at: new Date().toISOString()
      });
      toast.success('Thank you! Your review has been submitted for moderation.');
      setRating(0);
      setReviewText('');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ 
              background: '#fff', width: '100%', maxWidth: '450px', 
              borderRadius: '20px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Rate Doctor</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Leave a review for {appointment?.doctorName}</p>
              </div>
              <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '4px',
                      color: (hoverRating || rating) >= star ? '#f59e0b' : '#e2e8f0',
                      transition: 'color 0.2s'
                    }}
                  >
                    <Star size={32} weight={(hoverRating || rating) >= star ? "fill" : "regular"} />
                  </button>
                ))}
              </div>

              <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>Your Experience</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was your consultation?"
                  style={{
                    width: '100%', padding: '0.875rem 1rem', borderRadius: '12px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    fontSize: '0.875rem', color: '#1e293b',
                    resize: 'vertical', minHeight: '100px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="ecare-button"
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
};

export default ReviewModal;
