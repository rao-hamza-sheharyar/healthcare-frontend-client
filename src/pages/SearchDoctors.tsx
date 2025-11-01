import { useState, useEffect } from 'react';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';

interface Doctor {
  id: number;
  user: { full_name: string; phone?: string };
  specialization: string;
  description?: string;
  rating: number;
  total_reviews: number;
  experience_years: number;
}

export default function SearchDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery || specialization) {
      searchDoctors();
    } else {
      fetchAllDoctors();
    }
  }, [searchQuery, specialization]);

  const fetchAllDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (specialization) params.append('specialization', specialization);
      
      const response = await api.get(`/doctors/search?${params.toString()}`);
      setDoctors(response.data);
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Search Doctors</h1>
      
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1',
            minWidth: '200px',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <input
          type="text"
          placeholder="Filter by specialization..."
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          style={{
            flex: '1',
            minWidth: '200px',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {doctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
          {doctors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
              No doctors found. Try a different search.
            </div>
          )}
        </>
      )}
    </div>
  );
}

