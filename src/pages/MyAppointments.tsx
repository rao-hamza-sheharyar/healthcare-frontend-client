import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Appointment {
  id: number;
  doctor: {
    id: number;
    specialization: string;
    user: {
      full_name: string;
      email: string;
    };
  };
  appointment_date: string;
  status: string;
  notes?: string;
  rejection_reason?: string;
  reschedule_requested_date?: string;
  reschedule_reason?: string;
  reschedule_status?: string | null;
  created_at: string;
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingDoctor, setRatingDoctor] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reschedulingAppointment, setReschedulingAppointment] = useState<number | null>(null);
  const [requestingReschedule, setRequestingReschedule] = useState<number | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(null);
  const [newAppointmentTime, setNewAppointmentTime] = useState<string>('09:00');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateDoctor = async (appointment: Appointment) => {
    console.log('🎯 handleRateDoctor called with appointment:', appointment);
    console.log('🎯 Rating:', rating);
    console.log('🎯 Comment:', reviewComment);
    
    if (!reviewComment.trim()) {
      console.warn('⚠️ Review comment is empty');
      toast.error('Please add a review comment');
      return;
    }

    try {
      console.log('📝 Submitting review:', {
        doctor_id: appointment.doctor.id,
        rating: rating,
        comment: reviewComment,
        appointment_id: appointment.id
      });
      
      const reviewData = {
        review: {
          doctor_id: appointment.doctor.id,
          rating: rating,
          comment: reviewComment,
          appointment_id: appointment.id, // Include appointment_id for better tracking
        },
      };
      
      console.log('📤 Sending POST to /reviews with data:', JSON.stringify(reviewData, null, 2));
      
      const response = await api.post('/reviews', reviewData);
      
      console.log('✅ Review submitted successfully:', response.data);
      toast.success('Thank you for your review!');
      
      // Reset form state
      setRatingDoctor(null);
      setReviewComment('');
      setRating(5);
      
      // Refresh appointments to get updated data
      await fetchAppointments();
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        window.location.reload(); // Force page refresh to ensure UI is updated
      }, 500);
    } catch (error: any) {
      console.error('❌ Review submission error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      
      const errorMessage = error.response?.data?.errors?.[0] || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to submit review';
      toast.error(errorMessage);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await api.post(`/appointments/${appointmentId}/cancel`);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    // Only for pending appointments - direct reschedule
    setReschedulingAppointment(appointment.id);
    const currentDate = new Date(appointment.appointment_date);
    setNewAppointmentDate(currentDate);
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    setNewAppointmentTime(`${hours}:${minutes}`);
  };

  const handleRequestRescheduleClick = (appointment: Appointment) => {
    // For approved appointments - request reschedule
    setRequestingReschedule(appointment.id);
    const currentDate = new Date(appointment.appointment_date);
    setNewAppointmentDate(currentDate);
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    setNewAppointmentTime(`${hours}:${minutes}`);
    setRescheduleReason('');
  };

  const handleRescheduleSubmit = async (appointmentId: number) => {
    if (!newAppointmentDate) {
      toast.error('Please select a date');
      return;
    }

    // Combine date and time
    const [hours, minutes] = newAppointmentTime.split(':');
    const combinedDate = new Date(newAppointmentDate);
    combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if the new date is in the future
    if (combinedDate <= new Date()) {
      toast.error('Please select a date and time in the future');
      return;
    }

    setRescheduleLoading(true);
    try {
      await api.post(`/appointments/${appointmentId}/reschedule`, {
        appointment_date: combinedDate.toISOString()
      });
      toast.success('Appointment rescheduled successfully');
      setReschedulingAppointment(null);
      setNewAppointmentDate(null);
      setNewAppointmentTime('09:00');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.errors?.[0] || 'Failed to reschedule appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRequestRescheduleSubmit = async (appointmentId: number) => {
    if (!newAppointmentDate) {
      toast.error('Please select a date');
      return;
    }

    if (!rescheduleReason.trim()) {
      toast.error('Please provide a reason for rescheduling');
      return;
    }

    // Combine date and time
    const [hours, minutes] = newAppointmentTime.split(':');
    const combinedDate = new Date(newAppointmentDate);
    combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if the new date is in the future
    if (combinedDate <= new Date()) {
      toast.error('Please select a date and time in the future');
      return;
    }

    setRescheduleLoading(true);
    try {
      await api.post(`/appointments/${appointmentId}/request_reschedule`, {
        appointment_date: combinedDate.toISOString(),
        reschedule_reason: rescheduleReason
      });
      toast.success('Reschedule request submitted. Waiting for doctor approval.');
      setRequestingReschedule(null);
      setNewAppointmentDate(null);
      setNewAppointmentTime('09:00');
      setRescheduleReason('');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.errors?.[0] || 'Failed to submit reschedule request');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const canReschedule = (appointment: Appointment) => {
    // Can directly reschedule if appointment is pending and not in the past
    return appointment.status === 'pending' && 
           new Date(appointment.appointment_date) > new Date();
  };

  const canRequestReschedule = (appointment: Appointment) => {
    // Can request reschedule if appointment is approved and no pending request exists
    return appointment.status === 'approved' && 
           appointment.reschedule_status !== 'pending' &&
           new Date(appointment.appointment_date) > new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#27ae60';
      case 'pending':
        return '#f39c12';
      case 'rejected':
        return '#e74c3c';
      case 'cancelled':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'approved' && 
           new Date(appointment.appointment_date) > new Date();
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please login to view your appointments.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading appointments...</h2>
      </div>
    );
  }

  const canRate = (appointment: Appointment) => {
    const isApproved = appointment.status === 'approved';
    const appointmentDate = new Date(appointment.appointment_date);
    const now = new Date();
    const isPast = appointmentDate < now;
    
    console.log(`🔍 canRate check for appointment ${appointment.id}:`, {
      status: appointment.status,
      isApproved,
      appointment_date: appointment.appointment_date,
      appointmentDate: appointmentDate.toISOString(),
      now: now.toISOString(),
      isPast,
      canRate: isApproved && isPast
    });
    
    return isApproved && isPast;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>My Appointments</h1>

      {appointments.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
            You don't have any appointments yet.
          </p>
          <button
            onClick={() => window.location.href = '/search'}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Search Doctors
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getStatusColor(appointment.status)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                    Dr. {appointment.doctor.user.full_name}
                  </h3>
                  <p style={{ color: '#3498db', margin: '0.25rem 0' }}>
                    {appointment.doctor.specialization}
                  </p>
                  <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>
                    <strong>Date & Time:</strong> {new Date(appointment.appointment_date).toLocaleString()}
                  </p>
                  <p style={{ 
                    color: '#7f8c8d', 
                    margin: '0.25rem 0',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getStatusColor(appointment.status) + '20',
                    borderRadius: '4px',
                    display: 'inline-block',
                    textTransform: 'capitalize'
                  }}>
                    Status: <strong>{appointment.status}</strong>
                  </p>
                  {appointment.notes && (
                    <p style={{ color: '#555', margin: '0.5rem 0', fontStyle: 'italic' }}>
                      Notes: {appointment.notes}
                    </p>
                  )}
                  {appointment.rejection_reason && (
                    <p style={{ color: '#e74c3c', margin: '0.5rem 0' }}>
                      Rejection Reason: {appointment.rejection_reason}
                    </p>
                  )}
                  {appointment.reschedule_status === 'pending' && (
                    <p style={{ color: '#f39c12', margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                      ⏳ Reschedule request pending approval
                      {appointment.reschedule_requested_date && (
                        <span> - New date: {new Date(appointment.reschedule_requested_date).toLocaleString()}</span>
                      )}
                    </p>
                  )}
                  {appointment.reschedule_status === 'approved' && (
                    <p style={{ color: '#27ae60', margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                      ✅ Reschedule request approved - Status changed to pending
                    </p>
                  )}
                  {appointment.reschedule_status === 'rejected' && (
                    <p style={{ color: '#e74c3c', margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                      ❌ Reschedule request was rejected
                    </p>
                  )}
                  <p style={{ color: '#7f8c8d', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                    Booked: {new Date(appointment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  {canReschedule(appointment) && (
                    <button
                      onClick={() => handleRescheduleClick(appointment)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Reschedule
                    </button>
                  )}
                  {canRequestReschedule(appointment) && (
                    <button
                      onClick={() => handleRequestRescheduleClick(appointment)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Request Reschedule
                    </button>
                  )}
                  {canCancel(appointment) && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  {canRate(appointment) && (
                    <button
                      onClick={() => setRatingDoctor(appointment.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f39c12',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Rate Doctor
                    </button>
                  )}
                </div>
              </div>

              {requestingReschedule === appointment.id && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h4 style={{ marginTop: 0, color: '#2c3e50' }}>Request Reschedule</h4>
                  <p style={{ color: '#7f8c8d', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Your reschedule request will be sent to the doctor for approval.
                  </p>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Select New Date
                    </label>
                    <div style={{ width: '100%' }}>
                      <DatePicker
                        selected={newAppointmentDate}
                        onChange={(date: Date | null) => setNewAppointmentDate(date)}
                        minDate={new Date()}
                        dateFormat="MMMM d, yyyy"
                        wrapperClassName="date-picker-wrapper"
                        className="date-picker-input"
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Select New Time
                    </label>
                    <input
                      type="time"
                      value={newAppointmentTime}
                      onChange={(e) => setNewAppointmentTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Reason for Reschedule <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      rows={3}
                      placeholder="Please provide a reason for requesting reschedule..."
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleRequestRescheduleSubmit(appointment.id)}
                      disabled={rescheduleLoading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: rescheduleLoading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        opacity: rescheduleLoading ? 0.6 : 1
                      }}
                    >
                      {rescheduleLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      onClick={() => {
                        setRequestingReschedule(null);
                        setNewAppointmentDate(null);
                        setNewAppointmentTime('09:00');
                        setRescheduleReason('');
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {reschedulingAppointment === appointment.id && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h4 style={{ marginTop: 0, color: '#2c3e50' }}>Reschedule Appointment</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Select New Date
                    </label>
                    <div style={{ width: '100%' }}>
                      <DatePicker
                        selected={newAppointmentDate}
                        onChange={(date: Date | null) => setNewAppointmentDate(date)}
                        minDate={new Date()}
                        dateFormat="MMMM d, yyyy"
                        wrapperClassName="date-picker-wrapper"
                        className="date-picker-input"
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Select New Time
                    </label>
                    <input
                      type="time"
                      value={newAppointmentTime}
                      onChange={(e) => setNewAppointmentTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleRescheduleSubmit(appointment.id)}
                      disabled={rescheduleLoading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: rescheduleLoading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        opacity: rescheduleLoading ? 0.6 : 1
                      }}
                    >
                      {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                    </button>
                    <button
                      onClick={() => {
                        setReschedulingAppointment(null);
                        setNewAppointmentDate(null);
                        setNewAppointmentTime('09:00');
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {ratingDoctor === appointment.id && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h4 style={{ marginTop: 0, color: '#2c3e50' }}>Rate & Review</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Rating: {rating} ⭐
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>1 ⭐</span>
                      <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>5 ⭐</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                      Review Comment
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Share your experience..."
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔘 Submit Review button clicked for appointment:', appointment.id);
                        handleRateDoctor(appointment);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => {
                        setRatingDoctor(null);
                        setReviewComment('');
                        setRating(5);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

