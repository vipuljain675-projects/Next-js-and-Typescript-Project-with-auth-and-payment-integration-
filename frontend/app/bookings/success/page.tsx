'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

// 1. Create a sub-component for the logic that uses search params
function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    const confirmBooking = async () => {
      try {
        // Call backend to confirm payment
        await api.post('/store/bookings/confirm', { sessionId });
        setLoading(false);
      } catch (err: any) {
        console.error("Booking confirmation failed:", err);
        setError(err.response?.data?.message || "Payment verification failed.");
        setLoading(false);
      }
    };

    confirmBooking();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3 className="text-secondary">Verifying your payment...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container d-flex flex-column align-items-center justify-content-center vh-100 text-center">
        <div className="text-danger mb-4">
          <svg width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </div>
        <h2 className="mb-3">Something went wrong</h2>
        <p className="text-muted mb-4">{error}</p>
        <Link href="/" className="btn btn-dark btn-lg">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100 text-center">
      <div className="text-success mb-4">
        <svg width="100" height="100" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
      </div>
      <h1 className="fw-bold mb-3">Booking Confirmed!</h1>
      <p className="text-muted fs-5 mb-5" style={{ maxWidth: '500px' }}>
        Thank you for your booking. We have sent a confirmation email to your inbox. Your host has been notified.
      </p>
      <div className="d-flex gap-3">
        <Link href="/" className="btn btn-outline-dark px-4 py-2">Go Home</Link>
        <Link href="/trips" className="btn btn-danger px-4 py-2" style={{ backgroundColor: '#ff385c', border: 'none' }}>
          View My Trips
        </Link>
      </div>
    </div>
  );
}

// 2. Wrap it in Suspense in the main export
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center p-5">Loading payment details...</div>}>
      <BookingSuccessContent />
    </Suspense>
  );
}