'use client';

import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Home, Review } from '@/types';
import { AuthContext } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapSection = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div style={{ height: '450px', background: '#f8f9fa' }} className="rounded-4 border d-flex align-items-center justify-content-center">Loading map...</div>
});

// Custom Dropdown Component
const ReviewActionsDropdown = ({ review, onEdit, onDelete }: { 
  review: Review; 
  onEdit: () => void; 
  onDelete: () => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      <button 
        className="btn btn-sm text-dark p-1"
        onClick={() => setIsOpen(!isOpen)}
        style={{ lineHeight: 1 }}
      >
        <i className="bi bi-three-dots-vertical fs-6"></i>
      </button>
      {isOpen && (
        <div className="position-absolute end-0 bg-white border rounded-3 shadow-lg py-1 mt-1" style={{ zIndex: 50, minWidth: '120px' }}>
          <button 
            className="btn btn-sm w-100 text-start px-3 py-2 border-0 fw-bold"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
          >
            Edit
          </button>
          <button 
            className="btn btn-sm w-100 text-start px-3 py-2 border-0 text-danger fw-bold"
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default function HomeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useContext(AuthContext);

  const [home, setHome] = useState<Home | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });

  const totalGuestCount = guests.adults + guests.children + guests.infants;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setShowGuestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getImageUrl = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800";
    return url.startsWith("http") ? url : `http://localhost:3500${url}`;
  };

  const totalNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/homes/${params.id}`);
      setHome(res.data.home);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleContactHost = async () => {
    if (!auth?.isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      const res = await api.get(`/chat/conversation-details/${home?._id}`);
      const { conversationId } = res.data;
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation');
    }
  };

  // Inside HomeDetailsPage component...

const handleReserve = async () => {
  if (!auth?.isLoggedIn) return router.push('/login');
  if (!checkIn || !checkOut || totalNights === 0) return alert("Please select valid dates");
  
  try {
    // 🟢 Call the new Payment endpoint
    const res = await api.post('/create-checkout-session', { 
      homeId: home?._id, 
      checkIn, 
      checkOut, 
      adults: guests.adults,
      children: guests.children,
      seniors: guests.infants 
    });
    
    // 🟢 Redirect to Stripe
    if (res.data.url) {
      window.location.href = res.data.url;
    }
  } catch (err: any) { 
    console.error(err);
    alert(err.response?.data?.message || "Payment initialization failed"); 
  }
};

  const handlePostReview = async () => {
    if (!newReview.comment.trim()) return alert("Please add a comment");
    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, newReview);
        alert("Review updated!");
      } else {
        await api.post('/reviews', { homeId: home?._id, ...newReview });
        alert("Review posted!");
      }
      setShowReviewForm(false);
      setEditingReviewId(null);
      setNewReview({ rating: 5, comment: "" });
      fetchData();
    } catch (err: any) { 
      alert(err.response?.data?.message || "Review failed"); 
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      alert("Review deleted!");
      fetchData();
    } catch (err) { 
      alert("Failed to delete review"); 
    }
  };

  const startEditReview = (rev: Review) => {
    setEditingReviewId(rev._id);
    setNewReview({ rating: rev.rating, comment: rev.comment });
    setShowReviewForm(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Guest counter handlers
  const updateGuestCount = (type: 'adults' | 'children' | 'infants' | 'pets', delta: number) => {
    setGuests(prev => {
      const newValue = prev[type] + delta;
      if (type === 'adults' && newValue < 1) return prev; // At least 1 adult
      if (newValue < 0) return prev; // No negative values
      return { ...prev, [type]: newValue };
    });
  };

  if (loading || !home) return <div className="text-center mt-5">Loading...</div>;

  return (
    <main className="container-fluid px-4 px-md-5" style={{ marginTop: "40px", maxWidth: "1280px" }}>
      <div className="text-start mb-4">
        <h1 className="fw-bold h2 mb-2">{home.houseName}</h1>
        <div className="d-flex gap-2 small">
          <span className="fw-bold">★ {home.rating}</span>
          <span className="text-decoration-underline fw-bold">{reviews.length} reviews</span>
          <span>·</span>
          <span className="text-decoration-underline fw-bold">{home.location}</span>
        </div>
      </div>
      
      {/* 5-Image Grid */}
      <div className="photo-grid-v2 mb-5 rounded-4 overflow-hidden shadow-sm">
        <div className="photo-hero border-end">
          <img src={getImageUrl(home.photoUrl[0])} alt="Main" className="w-100 h-100 object-fit-cover" style={{ height: '500px' }} />
        </div>
        <div className="photo-side-grid">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="photo-item border-bottom border-start" style={{ height: '250px' }}>
              {home.photoUrl[index] ? (
                <img src={getImageUrl(home.photoUrl[index])} alt={`Side ${index}`} className="w-100 h-100 object-fit-cover" />
              ) : (
                <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted small">No photo</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="row g-5 pb-5">
        <div className="col-lg-7 text-start">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
            <div>
              <h2 className="h4 fw-bold mb-1">Hosted by {home.userId?.firstName || 'Super'}</h2>
              <p className="text-muted mb-0">Entire home hosted by {home.userId?.firstName || 'Super'}</p>
            </div>
            <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: "48px", height: "48px" }}>
              {(home.userId?.firstName || 'S').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="availability-box p-3 border rounded-4 bg-light mb-4 shadow-sm">
            <div className="small fw-bold text-uppercase mb-2 text-muted" style={{ letterSpacing: '1px', fontSize: '11px' }}>Availability</div>
            <div className="fw-bold fs-6">
              {new Date(home.availableFrom).toLocaleDateString()} – {new Date(home.availableTo).toLocaleDateString()}
            </div>
          </div>

          <p className="py-2 border-bottom mb-4 fs-5">{home.description}</p>

          <div className="mb-5">
            <h3 className="fw-bold mb-4">Where you'll be</h3>
            <div className="rounded-4 overflow-hidden border shadow-sm" style={{ height: "450px" }}>
              <MapSection location={home.location} />
            </div>
            <p className="mt-3 fw-bold">{home.location}</p>
          </div>

          <div className="border-top pt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0">★ {home.rating} · {reviews.length} reviews</h3>
              {auth?.isLoggedIn && !editingReviewId && (
                <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn btn-outline-dark rounded-pill fw-bold px-4">
                  {showReviewForm ? "Cancel" : "Write a Review"}
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="card border-0 bg-light p-4 rounded-4 mb-5 shadow-sm">
                <h5 className="fw-bold mb-3 text-dark">{editingReviewId ? "Update your experience" : "How was your stay?"}</h5>
                <div className="mb-3">
                  <label className="small fw-bold mb-2">Rating</label>
                  <select className="form-select border-0 shadow-sm" value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}>
                    <option value="5">5 Stars - Amazing</option>
                    <option value="4">4 Stars - Very Good</option>
                    <option value="3">3 Stars - Good</option>
                    <option value="2">2 Stars - Fair</option>
                    <option value="1">1 Star - Poor</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="small fw-bold mb-2">Comment</label>
                  <textarea className="form-control border-0 shadow-sm" rows={3} value={newReview.comment} placeholder="Tell us about the home..." onChange={(e) => setNewReview({...newReview, comment: e.target.value})}></textarea>
                </div>
                <div className="d-flex gap-2">
                  <button onClick={handlePostReview} className="btn btn-danger px-5 fw-bold rounded-3">
                    {editingReviewId ? "Update Review" : "Post Review"}
                  </button>
                  {editingReviewId && (
                    <button onClick={() => { 
                      setShowReviewForm(false); 
                      setEditingReviewId(null); 
                      setNewReview({rating:5, comment:""}); 
                    }} className="btn btn-outline-secondary px-4 rounded-3">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="row g-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="col-md-6">
                  <div className="d-flex justify-content-between align-items-start mb-2 text-start">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: "40px", height: "40px" }}>
                        {(rev.userId?.firstName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold small">{rev.userId?.firstName} {rev.userId?.lastName}</div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{new Date(rev.date).toDateString()}</div>
                      </div>
                    </div>
                    {auth?.user?._id === rev.userId?._id && (
                      <ReviewActionsDropdown
                        review={rev}
                        onEdit={() => startEditReview(rev)}
                        onDelete={() => handleDeleteReview(rev._id)}
                      />
                    )}
                  </div>
                  <p className="small text-dark mb-0 text-start">★ {rev.rating} · {rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="booking-card shadow-lg border p-4 rounded-4 sticky-top" style={{ top: '120px' }}>
            <div className="mb-4 text-start d-flex justify-content-between align-items-baseline">
              <div><span className="fs-4 fw-bold">₹{home.price.toLocaleString()}</span><span className="text-muted"> night</span></div>
              <div className="small fw-bold text-decoration-underline">★ {home.rating} · {reviews.length} reviews</div>
            </div>
            <div className="border rounded-3 mb-3 text-start">
              <div className="row g-0 border-bottom">
                <div className="col-6 border-end p-2">
                  <label className="small fw-bold d-block text-muted" style={{ fontSize: '10px' }}>CHECK-IN</label>
                  <input type="date" className="form-control border-0 p-0 shadow-none" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div className="col-6 p-2">
                  <label className="small fw-bold d-block text-muted" style={{ fontSize: '10px' }}>CHECK-OUT</label>
                  <input type="date" className="form-control border-0 p-0 shadow-none" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>
              <div className="p-2 position-relative" ref={guestDropdownRef}>
                <label className="small fw-bold d-block text-muted" style={{ fontSize: '10px' }}>GUESTS</label>
                <div 
                  className="cursor-pointer d-flex justify-content-between align-items-center py-1" 
                  onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{totalGuestCount} guest{totalGuestCount !== 1 ? 's' : ''}</span>
                  <i className={`bi bi-chevron-${showGuestDropdown ? 'up' : 'down'}`}></i>
                </div>

                {/* Guest Dropdown */}
                {showGuestDropdown && (
                  <div 
                    className="position-absolute bg-white border rounded-3 shadow-lg p-3 mt-2" 
                    style={{ 
                      zIndex: 1000, 
                      width: '100%',
                      left: 0,
                      top: '100%'
                    }}
                  >
                    {/* Adults */}
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                      <div>
                        <div className="fw-bold">Adults</div>
                        <div className="small text-muted">Age 13+</div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('adults', -1);
                          }}
                          disabled={guests.adults <= 1}
                        >
                          −
                        </button>
                        <span className="fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{guests.adults}</span>
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('adults', 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                      <div>
                        <div className="fw-bold">Children</div>
                        <div className="small text-muted">Ages 2-12</div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('children', -1);
                          }}
                          disabled={guests.children <= 0}
                        >
                          −
                        </button>
                        <span className="fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{guests.children}</span>
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('children', 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                      <div>
                        <div className="fw-bold">Infants</div>
                        <div className="small text-muted">Under 2</div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('infants', -1);
                          }}
                          disabled={guests.infants <= 0}
                        >
                          −
                        </button>
                        <span className="fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{guests.infants}</span>
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('infants', 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Pets */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">Pets</div>
                        <div className="small text-muted">
                          <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>Bringing a service animal?</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('pets', -1);
                          }}
                          disabled={guests.pets <= 0}
                        >
                          −
                        </button>
                        <span className="fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{guests.pets}</span>
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateGuestCount('pets', 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button 
                      className="btn btn-sm btn-dark w-100 mt-3 fw-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGuestDropdown(false);
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contact Host Button */}
            <button 
              onClick={handleContactHost}
              className="btn btn-outline-dark w-100 py-3 fw-bold rounded-3 mb-3"
              style={{ border: '2px solid #222' }}
            >
              <i className="bi bi-chat-dots me-2"></i>
              Contact Host
            </button>

            {/* Reserve Button */}
            <button onClick={handleReserve} className="btn btn-primary w-100 py-3 fw-bold rounded-3 mb-3 shadow-sm" style={{ background: '#FF385C', border: 'none' }}>
              Reserve
            </button>
            
            <div className="d-flex justify-content-between fw-bold fs-5 mt-3 pt-3 border-top">
              <span>Total Payout</span><span>₹{(home.price * (totalNights || 1)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}