import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import LoginPrompt from '../components/LoginPrompt';

interface Doctor {
  id: number;
  user: {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
  };
  specialization: string;
  description?: string;
  qualifications?: string;
  experience_years: number;
  rating: number;
  total_reviews: number;
  license_number?: string;
}

interface Appointment {
  id: number;
  user: {
    full_name: string;
    email: string;
  };
  appointment_date: string;
  status: string;
}

interface Review {
  id: number;
  user: {
    full_name: string;
  };
  rating: number;
  comment?: string;
  created_at: string;
}

export default function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<string>('09:00');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDoctorDetails();
    }
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      const doctorRes = await api.get(`/doctors/${id}`);
      setDoctor(doctorRes.data);
      
      // Fetch approved appointments for this doctor (public stats)
      try {
        const appointmentsRes = await api.get(`/appointments?doctor_id=${id}&status=approved`);
        setAppointments(appointmentsRes.data || []);
      } catch (err) {
        console.log('Could not fetch appointments');
      }
      
      // Fetch reviews for this doctor
      try {
        const reviewsRes = await api.get(`/reviews?doctor_id=${id}`);
        console.log('📋 Fetched reviews for doctor:', id, 'Count:', reviewsRes.data?.length || 0);
        console.log('📋 Reviews data:', reviewsRes.data);
        setReviews(reviewsRes.data || []);
      } catch (reviewError) {
        console.error('Error fetching reviews:', reviewError);
        setReviews([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointmentClick = () => {
    // Wait for auth to finish loading
    if (authLoading) {
      toast.info('Please wait while we verify your login...');
      return;
    }
    
    // Check if user exists
    if (!user) {
      // Double-check localStorage token - might be a state sync issue
      const token = localStorage.getItem('token');
      console.log('🔍 Checking auth state - user:', user, 'token:', !!token, 'authLoading:', authLoading);
      
      if (token) {
        console.warn('⚠️ Token exists in localStorage but user state is null');
        toast.error('Session expired. Please login again.');
        // Clear potentially invalid token
        localStorage.removeItem('token');
        setShowLoginPrompt(true);
        return;
      }
      
      setShowLoginPrompt(true);
      return;
    }
    
    // User is logged in - show booking form
    console.log('✅ User authenticated, showing booking form');
    setShowBookingForm(true);
  };

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error('Please login to book an appointment');
      setShowLoginPrompt(true);
      return;
    }

    if (!appointmentDate) {
      toast.error('Please select an appointment date');
      return;
    }

    // Combine date and time
    const dateStr = appointmentDate.toISOString().split('T')[0];
    const datetime = `${dateStr}T${appointmentTime}:00`;

    setBookingLoading(true);
    try {
      // Ensure token is in localStorage before making request
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        setShowLoginPrompt(true);
        setShowBookingForm(false);
        setBookingLoading(false);
        return;
      }

      // Debug: Log token and user info
      console.log('📅 ====== BOOKING APPOINTMENT ======');
      console.log('📅 User from context:', user?.email, 'Role:', user?.role, 'ID:', user?.id);
      console.log('📅 Token in localStorage:', !!token, 'Length:', token?.length || 0);
      console.log('📅 Token preview:', token ? token.substring(0, 20) + '...' : 'NONE');
      
      // Verify token is still valid by checking with backend
      try {
        const verifyResponse = await api.get('/auth/me');
        console.log('✅ Token verified - User:', verifyResponse.data?.user?.email);
      } catch (verifyError: any) {
        console.error('❌ Token verification failed:', verifyError.response?.status, verifyError.response?.data);
        if (verifyError.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          setShowBookingForm(false);
          setShowLoginPrompt(true);
          setBookingLoading(false);
          return;
        }
      }

      // The API interceptor should add the token automatically
      console.log('📅 Making booking request...');
      const response = await api.post('/appointments', {
        appointment: {
          doctor_id: id,
          appointment_date: datetime,
          notes: notes,
        },
      });
      console.log('✅ Booking successful!', response.data);
      toast.success('Appointment booked successfully!');
      setShowBookingForm(false);
      setAppointmentDate(null);
      setAppointmentTime('09:00');
      setNotes('');
      fetchDoctorDetails();
    } catch (error: any) {
      console.error('❌ ====== BOOKING ERROR ======');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', error);
      
      if (error.response?.status === 401) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Session expired';
        console.error('❌ 401 Unauthorized - Error:', errorMsg);
        
        // Check if token still exists
        const currentToken = localStorage.getItem('token');
        console.error('❌ Token after 401:', !!currentToken);
        
        toast.error(`${errorMsg}. Please login again.`);
        setShowBookingForm(false);
        setShowLoginPrompt(true);
      } else {
        const errorMsg = error.response?.data?.errors?.[0] || error.response?.data?.error || 'Failed to book appointment';
        console.error('❌ Other error:', errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading doctor profile...</h2>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Doctor not found</h2>
        <button onClick={() => navigate('/search')} style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Back to Search
        </button>
      </div>
    );
  }

  const stars = '⭐'.repeat(Math.floor(doctor.rating));
  const approvedCount = appointments.length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '2rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#95a5a6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{doctor.user.full_name}</h1>
            <p style={{ fontSize: '1.2rem', color: '#3498db', margin: '0.5rem 0' }}>{doctor.specialization}</p>
            <div style={{ margin: '1rem 0' }}>
              <span style={{ fontSize: '1.2rem' }}>{stars} {doctor.rating.toFixed(1)}</span>
              <span style={{ marginLeft: '1rem', color: '#7f8c8d' }}>({doctor.total_reviews} reviews)</span>
            </div>
            <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>
              {doctor.experience_years} years of experience
            </p>
            {doctor.license_number && (
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                License: {doctor.license_number}
              </p>
            )}
          </div>
          <button
            onClick={handleBookAppointmentClick}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Book Appointment
          </button>
        </div>

        <Modal
          isOpen={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setAppointmentDate(null);
            setAppointmentTime('09:00');
            setNotes('');
          }}
          title="Book Appointment"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleBookAppointment(); }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Date
              </label>
              <DatePicker
                selected={appointmentDate}
                onChange={(date: Date | null) => setAppointmentDate(date)}
                minDate={new Date()}
                dateFormat="MMMM d, yyyy"
                required
                wrapperClassName="date-picker-wrapper"
                className="date-picker-input"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Time
              </label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={bookingLoading || !appointmentDate}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: bookingLoading || !appointmentDate ? '#95a5a6' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: bookingLoading || !appointmentDate ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBookingForm(false);
                  setAppointmentDate(null);
                  setAppointmentTime('09:00');
                  setNotes('');
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
          </form>
        </Modal>

        {doctor.description && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#2c3e50' }}>About</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>{doctor.description}</p>
          </div>
        )}

        {doctor.qualifications && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#2c3e50' }}>Qualifications</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>{doctor.qualifications}</p>
          </div>
        )}

        {doctor.user.phone && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#2c3e50' }}>Contact</h3>
            <p style={{ color: '#555' }}>Phone: {doctor.user.phone}</p>
            <p style={{ color: '#555' }}>Email: {doctor.user.email}</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>Approved Appointments</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
            {approvedCount}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>Total Reviews</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
            {doctor.total_reviews}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>Experience</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
            {doctor.experience_years} years
          </p>
        </div>
      </div>

      {/* Patient History */}
      {appointments.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Previous Patients</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {appointments.slice(0, 10).map((appointment) => (
              <div key={appointment.id} style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa'
              }}>
                <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: '#2c3e50' }}>
                  {appointment.user.full_name}
                </p>
                <p style={{ margin: '0.25rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                  Appointment Date: {new Date(appointment.appointment_date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Patient Reviews</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>
                    {review.user.full_name}
                  </p>
                  <span style={{ color: '#f39c12' }}>
                    {'⭐'.repeat(review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#555', lineHeight: '1.6' }}>
                    {review.comment}
                  </p>
                )}
                <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.85rem' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Patient Reviews</h2>
          <p style={{ color: '#7f8c8d' }}>No reviews yet. Be the first to review this doctor!</p>
        </div>
      )}

      <Modal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      >
        <LoginPrompt
          onLoginSuccess={() => {
            setShowLoginPrompt(false);
            setShowBookingForm(true);
          }}
          onClose={() => setShowLoginPrompt(false)}
        />
      </Modal>
    </div>
  );
}

