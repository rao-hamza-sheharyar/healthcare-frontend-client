import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { user, isLoading, login: authLogin } = useAuth();
  const [step, setStep] = useState<'role' | 'login'>('role');
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in (unless they're trying to switch role)
  useEffect(() => {
    if (!isLoading && user) {
      // If user is already logged in, redirect to home
      navigate('/');
      toast.info('You are already logged in. Redirecting to homepage...');
    }
  }, [user, isLoading, navigate]);

  const handleRoleSelect = (role: 'patient' | 'doctor' | 'admin') => {
    setLoginRole(role);
    setStep('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);

      // Validate role matches selection (optional check, but verify anyway)
      if (loginRole === 'admin' && user.role !== 'admin') {
        setError('This account is not an admin account');
        toast.error('Invalid role selection');
        return;
      }
      if (loginRole === 'doctor' && user.role !== 'doctor' && !user.doctor) {
        setError('This account is not a doctor account');
        toast.error('Invalid role selection');
        return;
      }

      // Redirect based on actual user role
      if (user.role === 'admin') {
        // Admin goes to admin dashboard (different port/URL)
        const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175';
        window.location.href = `${adminUrl}/login?token=${token}`;
        return;
      } else if (user.role === 'doctor' || user.doctor) {
        // Doctor goes to doctor dashboard
        const doctorUrl = import.meta.env.VITE_DOCTOR_URL || 'http://localhost:5174';
        window.location.href = `${doctorUrl}/login?token=${token}`;
        return;
      } else {
        // Patient stays on patient frontend
        // Use AuthContext login function to ensure proper state update with role validation
        await authLogin(email, password);
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
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
        minHeight: '80vh'
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
            Are you a Patient or Doctor?
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
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
              onClick={() => handleRoleSelect('admin')}
              style={{
                padding: '1.5rem',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔐 I'm an Admin
            </button>
          </div>
          <p style={{ marginTop: '2rem', color: '#7f8c8d' }}>
            Don't have an account? <Link to="/register" style={{ color: '#3498db' }}>Sign up</Link>
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
      minHeight: '80vh'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            {loginRole === 'admin' ? '🔐 Admin Login' : loginRole === 'doctor' ? '👨‍⚕️ Doctor Login' : '👤 Patient Login'}
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loginRole === 'admin' ? '#e74c3c' : loginRole === 'doctor' ? '#3498db' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '1rem' }}>
          <Link to="/forgot-password" style={{ color: '#3498db', fontSize: '0.9rem' }}>
            Forgot password?
          </Link>
        </p>
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '0.5rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#3498db' }}>Sign up</Link>
        </p>
      </form>
    </div>
  );
}
