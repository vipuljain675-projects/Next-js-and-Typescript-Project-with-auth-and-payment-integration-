'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get('session_id');
      const bookingId = searchParams.get('booking_id');

      if (!sessionId || !bookingId) return;

      try {
        await api.post('/verify-payment', { session_id: sessionId, booking_id: bookingId });
        setVerifying(false);
      } catch (err) {
        alert("Payment verification failed. Please contact support.");
        router.push('/');
      }
    };
    verify();
  }, [searchParams, router]);

  if (verifying) return <div className="text-center mt-5">Verifying Payment...</div>;

  return (
    <div className="container text-center mt-5" style={{ paddingTop: '100px' }}>
      <div className="card shadow-lg p-5 border-0 rounded-4 d-inline-block">
        <div style={{ fontSize: '64px' }}>🎉</div>
        <h1 className="fw-bold text-success mb-3">Booking Confirmed!</h1>
        <p className="text-muted mb-4">Your trip has been successfully paid for and reserved.</p>
        <div className="d-flex gap-3 justify-content-center">
          <Link href="/bookings" className="btn btn-dark rounded-pill px-4 fw-bold">View My Trips</Link>
          <Link href="/" className="btn btn-outline-dark rounded-pill px-4 fw-bold">Explore More</Link>
        </div>
      </div>
    </div>
  );
}