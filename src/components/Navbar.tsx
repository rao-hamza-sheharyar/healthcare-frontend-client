import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();

  // Only show user options if user is actually loaded and present (not loading)
  const isAuthenticated = !isLoading && user !== null;

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      backgroundColor: '#2c3e50',
      color: 'white',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Healthcare Portal
      </Link>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/search" style={{ color: 'white', textDecoration: 'none' }}>Search Doctors</Link>
        <Link to="/doctors" style={{ color: 'white', textDecoration: 'none' }}>Best Doctors</Link>
        <Link to="/#reviews" style={{ color: 'white', textDecoration: 'none' }}>Why Choose Us</Link>
        {isAuthenticated ? (
          <>
            <Link to="/appointments" style={{ color: 'white', textDecoration: 'none' }}>My Appointments</Link>
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
            <button onClick={logout} style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

