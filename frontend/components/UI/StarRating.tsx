import React from 'react';

interface StarRatingProps {
  rating: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
    } else {
      stars.push(<i key={i} className="bi bi-star text-secondary opacity-25"></i>);
    }
  }

  return <div className="d-flex gap-1" style={{ fontSize: '0.85rem' }}>{stars}</div>;
};

export default StarRating;