import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';
import ReviewCard from '../components/ReviewCard';

interface Doctor {
  id: number;
  user: { full_name: string; phone?: string };
  specialization: string;
  description?: string;
  rating: number;
  total_reviews: number;
  experience_years: number;
}

interface Review {
  id: number;
  user: { full_name: string };
  rating: number;
  comment?: string;
  created_at: string;
}

export default function Home() {
  const [topDoctors, setTopDoctors] = useState<Doctor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [doctorsRes, reviewsRes] = await Promise.all([
        api.get('/doctors?limit=6'),
        api.get('/reviews?limit=6'),
      ]);
      setTopDoctors(doctorsRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ width: '100%', margin: 0, padding: 0 }}>
      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: '#3498db',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome to Healthcare Portal</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Find the best doctors and book appointments easily
        </p>
        <Link to="/search" style={{
          padding: '1rem 2rem',
          backgroundColor: 'white',
          color: '#3498db',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'inline-block'
        }}>
          Search Doctors
        </Link>
      </section>

      {/* Top Doctors Section */}
      <section style={{ padding: '4rem 2rem', backgroundColor: '#ecf0f1' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2c3e50' }}>
          Top Rated Doctors
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {topDoctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/doctors" style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3498db',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px'
          }}>
            View All Doctors
          </Link>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" style={{ padding: '4rem 2rem', backgroundColor: 'white' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2c3e50' }}>
          Why Choose Us - Patient Reviews
        </h2>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        backgroundColor: '#2c3e50',
        color: 'white',
        textAlign: 'center'
      }}>
        <p>&copy; 2024 Healthcare Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}

