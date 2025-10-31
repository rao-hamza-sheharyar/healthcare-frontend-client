import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/password_resets', { email });
      setSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{
        padding: '4rem 2rem',
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>✓ Email Sent!</h2>
          <p style={{ color: '#555', marginBottom: '2rem' }}>
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Please check your email and click the link to reset your password.
          </p>
          <Link to="/login" style={{
            color: '#3498db',
            textDecoration: 'none'
          }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '4rem 2rem',
      maxWidth: '500px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Forgot Password</h1>
        <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2c3e50' }}>
              Email Address
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
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
          <Link to="/login" style={{
            display: 'block',
            textAlign: 'center',
            color: '#3498db',
            textDecoration: 'none'
          }}>
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}


