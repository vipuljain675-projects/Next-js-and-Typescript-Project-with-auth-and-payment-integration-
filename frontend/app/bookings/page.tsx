'use client';
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { QRCodeSVG } from 'qrcode.react';

interface Booking {
  _id: string;
  homeName: string;
  checkIn: string;
  checkOut: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  totalPrice: number;
  guests?: {
    adults: number;
    children: number;
    seniors: number;
  };
  user: {
    email: string;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'History'>('Upcoming');

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings");
      setBookings(res.data.bookings);
    } catch (err) {
      console.error("Fetch bookings failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchBookings(); 
  }, []);

  const handleCancelTrip = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this trip?")) return;
    
    try {
      await api.post("/cancel-booking", { bookingId });
      alert("Trip cancelled successfully.");
      fetchBookings();
    } catch (err) {
      alert("Failed to cancel trip. Please try again.");
    }
  };

  // Calculate total guests with safe fallback for old bookings
  const getTotalGuests = (guests?: { adults: number; children: number; seniors: number }) => {
    if (!guests) return 1; // Fallback for old bookings without guests data
    return guests.adults + guests.children + guests.seniors;
  };

  // Filter logic for Tabs
  const displayedBookings = bookings.filter(b => 
    activeTab === 'Upcoming' ? (b.status === 'Pending' || b.status === 'Confirmed') : b.status === 'Cancelled'
  );

  if (loading) return <div className="text-center mt-5 pt-5">Loading your trips...</div>;

  return (
    <main className="container" style={{ marginTop: "120px", maxWidth: "900px" }}>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
           <h2 className="fw-bold mb-1 text-start">Your Trips</h2>
           <p className="text-secondary small mb-0">Manage your upcoming adventures</p>
        </div>
        {/* Tab Switcher */}
        <div className="bg-light p-1 rounded-pill d-flex shadow-sm">
           <button 
             onClick={() => setActiveTab('Upcoming')} 
             className={`btn rounded-pill px-4 fw-bold small ${activeTab === 'Upcoming' ? 'shadow-sm text-white' : 'btn-light'}`} 
             style={activeTab === 'Upcoming' ? {backgroundColor: '#ff385c', border:'none'} : {}}
           >
             Upcoming
           </button>
           <button 
             onClick={() => setActiveTab('History')} 
             className={`btn rounded-pill px-4 fw-bold small ${activeTab === 'History' ? 'shadow-sm text-white' : 'btn-light'}`} 
             style={activeTab === 'History' ? {backgroundColor: '#ff385c', border:'none'} : {}}
           >
             History
           </button>
        </div>
      </div>
      
      <div className="d-flex flex-column gap-5 pb-5">
        {displayedBookings.length === 0 ? (
          <div className="text-center py-5 border rounded-4 bg-light text-secondary">No trips found in this section.</div>
        ) : (
          displayedBookings.map((booking) => (
            <div key={booking._id}>
              {booking.status === "Pending" ? (
                /* YELLOW PENDING CARD */
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden text-start">
                  <div className="px-4 py-2 text-white fw-bold small d-flex justify-content-between" style={{ backgroundColor: '#FFB400' }}>
                    <span>REQUEST PENDING</span>
                    <button onClick={() => handleCancelTrip(booking._id)} className="btn btn-sm text-white p-0 fw-bold border-0" style={{fontSize:'12px'}}>CANCEL REQUEST ×</button>
                  </div>
                  <div className="row g-0 p-4 align-items-center bg-white">
                    <div className="col-md-7 border-end pe-4">
                      <h4 className="fw-bold mb-1">{booking.homeName}</h4>
                      <div className="d-flex gap-5 my-3">
                        <div>
                          <label className="small text-secondary fw-bold d-block">CHECK-IN</label>
                          <span className="fw-bold">{new Date(booking.checkIn).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <label className="small text-secondary fw-bold d-block">CHECK-OUT</label>
                          <span className="fw-bold">{new Date(booking.checkOut).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <label className="small text-secondary fw-bold d-block">GUESTS</label>
                          <span className="fw-bold">{getTotalGuests(booking.guests)}</span>
                        </div>
                      </div>
                      <div className="text-success fw-bold fs-5">₹{booking.totalPrice.toLocaleString()}</div>
                    </div>
                    <div className="col-md-5 ps-4 text-center">
                      <div className="spinner-border text-warning mb-2" role="status"></div>
                      <h5 className="fw-bold">Awaiting Approval</h5>
                      <p className="small text-secondary">The host has 24 hours to respond.</p>
                    </div>
                  </div>
                </div>
              ) : booking.status === "Confirmed" ? (
                /* GREEN BOARDING PASS CARD */
                <div className="card border-0 shadow rounded-4 overflow-hidden text-start bg-white">
                  <div className="px-4 py-2 text-white fw-bold small d-flex justify-content-between" style={{ backgroundColor: '#008489' }}>
                    <span>CONFIRMED RESERVATION</span>
                    <button onClick={() => handleCancelTrip(booking._id)} className="btn btn-sm text-white p-0 fw-bold border-0" style={{fontSize:'12px'}}>CANCEL TRIP ×</button>
                  </div>
                  <div className="row g-0 p-4 align-items-center bg-white">
                    <div className="col-md-8 border-end pe-4">
                      <h3 className="fw-bold text-dark mb-1">{booking.homeName}</h3>
                      <p className="text-secondary mb-4 small">Present this pass at check-in.</p>
                      
                      <div className="row mb-4">
                        <div className="col-4 border-end">
                          <label className="small text-secondary fw-bold d-block">PASSENGER</label>
                          <span className="fw-bold text-uppercase small">{booking.user.email.split('@')[0]}</span>
                        </div>
                        <div className="col-4 border-end">
                          <label className="small text-secondary fw-bold d-block">DATES</label>
                          <span className="fw-bold small">{new Date(booking.checkIn).toLocaleDateString()}</span>
                        </div>
                        <div className="col-4">
                          <label className="small text-secondary fw-bold d-block">GUESTS</label>
                          <span className="fw-bold">{getTotalGuests(booking.guests)}</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
                        <div>
                          <span className="small text-secondary d-block">TOTAL PAID</span>
                          <span className="fw-bold fs-4 text-success">₹{booking.totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="text-end">
                           <span className="small text-secondary d-block">BOOKING ID</span>
                           <span className="fw-bold text-muted small">{booking._id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4 ps-4 text-center d-flex flex-column align-items-center">
                      <div className="p-2 bg-white border rounded-3 shadow-sm mb-2">
                         <QRCodeSVG value={`BOARDING_PASS_${booking._id}`} size={130} />
                      </div>
                      <span className="fw-bold text-muted small mt-2" style={{ letterSpacing: "2px" }}>SCAN FOR ENTRY</span>
                    </div>
                  </div>
                  <div className="p-3 bg-light text-center small text-muted border-top">Boarding Pass valid with Government ID.</div>
                </div>
              ) : (
                /* HISTORY VIEW (CANCELLED) */
                <div className="card border p-4 rounded-4 bg-white shadow-sm text-start opacity-75 grayscale">
                   <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="fw-bold mb-1">{booking.homeName}</h5>
                        <p className="text-danger small fw-bold mb-2">● CANCELLED</p>
                        <p className="text-secondary small mb-0">Check-in was scheduled for: {new Date(booking.checkIn).toDateString()}</p>
                      </div>
                      <div className="text-end">
                         <span className="badge bg-light text-secondary border">Trip History</span>
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}