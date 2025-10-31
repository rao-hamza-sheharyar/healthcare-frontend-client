interface Review {
  id: number;
  user: {
    full_name: string;
  };
  rating: number;
  comment?: string;
  created_at: string;
}

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const stars = '⭐'.repeat(review.rating);
  const date = new Date(review.created_at).toLocaleDateString();

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0, color: '#2c3e50' }}>{review.user.full_name}</h4>
        <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>{date}</span>
      </div>
      <div style={{ marginBottom: '0.5rem' }}>{stars}</div>
      {review.comment && (
        <p style={{ color: '#555', margin: '0.5rem 0', lineHeight: '1.6' }}>{review.comment}</p>
      )}
    </div>
  );
}


