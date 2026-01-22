'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Home } from '@/types';

export default function WishlistPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/favourite-list')
      .then(res => {
        setHomes(res.data.homes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRemove = async (homeId: string) => {
    try {
      await api.post('/favourite-list/remove', { homeId });
      setHomes(homes.filter(home => home._id !== homeId));
    } catch (err) {
      alert("Could not remove from wishlist");
    }
  };

  if (loading) return <div className="text-center mt-40">Loading your wishlist...</div>;

  return (
    <main className="container" style={{ marginTop: '180px' }}>
      <div className="mb-4 text-start">
        <h2 className="fw-bold">Your Wishlist</h2>
        <p className="text-secondary">Homes you have saved for later.</p>
      </div>

      {homes.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {homes.map(home => (
            <div className="col" key={home._id}>
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="position-relative">
                  <Link href={`/homes/${home._id}`}>
                    <img src={home.photoUrl[0]} className="card-img-top object-cover" alt={home.houseName} style={{ height: '250px' }} />
                  </Link>
                  <button onClick={() => handleRemove(home._id)} className="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-2" style={{ width: '35px', height: '35px' }}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div className="card-body text-start">
                  <h5 className="fw-bold mb-1 text-truncate">{home.houseName}</h5>
                  <p className="text-muted small mb-2">{home.location}</p>
                  <span className="fw-bold">₹{home.price.toLocaleString()}</span> <span className="small text-muted">night</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <h4 className="text-muted">No favourites yet.</h4>
          <Link href="/" className="btn btn-dark rounded-pill px-4 mt-3 fw-bold">Explore Homes</Link>
        </div>
      )}
    </main>
  );
}