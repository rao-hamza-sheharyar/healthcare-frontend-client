import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const { user, isLoading, setAuthState } = useAuth();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });
  const [doctorData, setDoctorData] = useState({
    license_number: '',
    specialization: '',
    qualifications: '',
    experience_years: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
      toast.info('You are already logged in. Redirecting to homepage...');
    }
  }, [user, isLoading, navigate]);

  const handleRoleSelect = (selectedRole: 'patient' | 'doctor') => {
    setRole(selectedRole);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'doctor') {
        // Register as doctor - first create user, then doctor profile
        const userResponse = await api.post('/auth/register', {
          user: {
            ...formData,
            role: 'patient', // First register as patient
          },
        });

        const { token } = userResponse.data;

        // Set token for subsequent requests
        localStorage.setItem('token', token);

        // Then create doctor profile
        const doctorResponse = await api.post(
          '/doctors/register',
          {
            doctor: {
              license_number: doctorData.license_number,
              specialization: doctorData.specialization,
              qualifications: doctorData.qualifications,
              experience_years: parseInt(doctorData.experience_years),
              description: doctorData.description,
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Refresh user data to get updated role
        const updatedUserResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedUser = updatedUserResponse.data.user;

        // Verify user is now a doctor
        if (updatedUser.role === 'doctor' || updatedUser.doctor) {
          // Auto login - redirect to doctor dashboard
          toast.success('Registration successful! Redirecting to Doctor Dashboard...');
          // Use explicit port 5174 for doctor frontend
          const doctorUrl = 'http://localhost:5174';
          console.log('✅ Doctor registration successful!');
          console.log('✅ Redirecting to doctor dashboard:', doctorUrl);
          console.log('✅ User role:', updatedUser.role);
          console.log('✅ Has doctor profile:', !!updatedUser.doctor);
          
          // Small delay to ensure toast is visible, then redirect
          setTimeout(() => {
            const redirectUrl = `${doctorUrl}/login?token=${token}`;
            console.log('🚀 Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          toast.error('Doctor profile created, but role update failed. Please login manually.');
          navigate('/login');
        }
      } else {
        // Register as patient
        const response = await api.post('/auth/register', {
          user: {
            ...formData,
            role: 'patient',
          },
        });
        
        // Auto-login after registration
        const { token: authToken, user: userData } = response.data;
        
        // Update auth context directly with the data from registration
        // This avoids making another API call and ensures we use the correct token
        setAuthState(authToken, userData);
        
        toast.success('Registration successful! You are now logged in.');
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate to homepage
        navigate('/');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors?.[0] || err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '2rem', color: '#2c3e50' }}>
            Are you a Doctor or Patient?
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button
              onClick={() => handleRoleSelect('doctor')}
              style={{
                padding: '1.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              👨‍⚕️ I'm a Doctor
            </button>
            <button
              onClick={() => handleRoleSelect('patient')}
              style={{
                padding: '1.5rem',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              👤 I'm a Patient
            </button>
          </div>
          <p style={{ marginTop: '2rem', color: '#7f8c8d' }}>
            Already have an account? <Link to="/login" style={{ color: '#3498db' }}>Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '2rem'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '600px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            {role === 'doctor' ? '👨‍⚕️ Doctor Registration' : '👤 Patient Registration'}
          </h2>
          <button
            type="button"
            onClick={() => setStep('role')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <small style={{ color: '#7f8c8d' }}>Minimum 6 characters</small>
        </div>

        {role === 'doctor' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                License Number *
              </label>
              <input
                type="text"
                value={doctorData.license_number}
                onChange={(e) => setDoctorData({ ...doctorData, license_number: e.target.value })}
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Specialization *
              </label>
              <input
                type="text"
                value={doctorData.specialization}
                onChange={(e) => setDoctorData({ ...doctorData, specialization: e.target.value })}
                required
                placeholder="e.g., Cardiology, Pediatrics, etc."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Qualifications *
              </label>
              <input
                type="text"
                value={doctorData.qualifications}
                onChange={(e) => setDoctorData({ ...doctorData, qualifications: e.target.value })}
                required
                placeholder="e.g., MD, MBBS, etc."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Years of Experience *
              </label>
              <input
                type="number"
                value={doctorData.experience_years}
                onChange={(e) => setDoctorData({ ...doctorData, experience_years: e.target.value })}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Description (Optional)
              </label>
              <textarea
                value={doctorData.description}
                onChange={(e) => setDoctorData({ ...doctorData, description: e.target.value })}
                rows={3}
                placeholder="Brief description about yourself..."
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
          </>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
            Phone (optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            Address (optional)
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: role === 'doctor' ? '#3498db' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Registering...' : `Register as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}
        </button>

        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Already have an account? <Link to="/login" style={{ color: '#3498db' }}>Login</Link>
        </p>
      </form>
    </div>
  );
}
