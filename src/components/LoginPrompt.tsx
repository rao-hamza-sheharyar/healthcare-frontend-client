import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface LoginPromptProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

export default function LoginPrompt({ onLoginSuccess, onClose }: LoginPromptProps) {
  const [step, setStep] = useState<'message' | 'role' | 'login' | 'register'>('message');
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'patient' | 'doctor' | 'admin') => {
    setLoginRole(role);
    setStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);

      // Validate role matches selection
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
      if (loginRole === 'patient' && user.role !== 'patient') {
        // Patient can proceed - they might be logging in as patient
        if (user.role === 'admin' || user.role === 'doctor') {
          setError('Please use the correct portal for this account');
          toast.error('Invalid role selection');
          return;
        }
      }

      // If patient or valid role, proceed
      if (user.role === 'patient' || (loginRole === 'patient' && user.role === 'patient')) {
        // Store token in localStorage first
        localStorage.setItem('token', token);
        // Call login to update auth context
        await login(email, password);
        toast.success('Login successful!');
        
        // Wait for auth context to fully update
        // The login function updates the context, but we need to ensure it's complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Verify token is still in localStorage (in case login cleared it)
        if (!localStorage.getItem('token')) {
          localStorage.setItem('token', token);
        }
        
        onLoginSuccess();
        onClose();
      } else {
        // Redirect to appropriate portal
        if (user.role === 'admin') {
          const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175';
          window.location.href = `${adminUrl}/login?token=${token}`;
        } else if (user.role === 'doctor' || user.doctor) {
          const doctorUrl = import.meta.env.VITE_DOCTOR_URL || 'http://localhost:5174';
          window.location.href = `${doctorUrl}/login?token=${token}`;
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'message') {
    return (
      <div>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50', textAlign: 'center' }}>
          🔐 Login Required
        </h2>
        <p style={{ marginBottom: '2rem', color: '#7f8c8d', textAlign: 'center' }}>
          To book an appointment, you need to login or sign up first.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button
            onClick={() => setStep('role')}
            style={{
              padding: '1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '1rem',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Sign Up
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div>
        <h2 style={{ marginBottom: '2rem', color: '#2c3e50', textAlign: 'center' }}>
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
            onClick={() => setStep('message')}
            style={{
              padding: '0.75rem',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
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

      <form onSubmit={handleLogin}>
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
            backgroundColor: loading ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#7f8c8d', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

