import React from 'react';

interface BadgeProps {
  type: 'favourite' | 'new' | 'verified';
}

const Badge: React.FC<BadgeProps> = ({ type }) => {
  const getBadgeContent = () => {
    switch (type) {
      case 'favourite':
        return {
          text: 'Guest favourite',
          icon: '❤️',
          bgColor: '#fff',
          textColor: '#222',
        };
      case 'new':
        return {
          text: 'New',
          icon: '✨',
          bgColor: '#FF385C',
          textColor: '#fff',
        };
      case 'verified':
        return {
          text: 'Verified',
          icon: '✓',
          bgColor: '#008489',
          textColor: '#fff',
        };
      default:
        return {
          text: '',
          icon: '',
          bgColor: '#fff',
          textColor: '#222',
        };
    }
  };

  const badge = getBadgeContent();

  return (
    <div
      className="position-absolute badge-overlay"
      style={{
        top: '12px',
        left: '12px',
        backgroundColor: badge.bgColor,
        color: badge.textColor,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1,
      }}
    >
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
    </div>
  );
};

export default Badge;