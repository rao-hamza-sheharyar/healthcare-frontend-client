import { Link } from 'react-router-dom';

interface Doctor {
  id: number;
  user: {
    full_name: string;
    phone?: string;
  };
  specialization: string;
  description?: string;
  rating: number;
  total_reviews: number;
  experience_years: number;
}

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const stars = '⭐'.repeat(Math.floor(doctor.rating));

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <Link to={`/doctors/${doctor.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{doctor.user.full_name}</h3>
        <p style={{ color: '#7f8c8d', margin: '0.5rem 0' }}>{doctor.specialization}</p>
        <div style={{ margin: '0.5rem 0' }}>
          <span>{stars} {doctor.rating.toFixed(1)}</span>
          <span style={{ marginLeft: '1rem', color: '#7f8c8d' }}>({doctor.total_reviews} reviews)</span>
        </div>
        <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '0.5rem 0' }}>
          {doctor.experience_years} years of experience
        </p>
        {doctor.description && (
          <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '1rem' }}>
            {doctor.description.substring(0, 100)}...
          </p>
        )}
      </Link>
    </div>
  );
}


