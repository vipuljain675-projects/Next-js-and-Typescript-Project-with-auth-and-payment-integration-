'use client';
import { useEffect, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useContext(AuthContext);

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr && auth) {
      try {
        const user = JSON.parse(userStr);
        // Login using Context
        auth.login(user, token);
        // Redirect to home after successful login
        router.push('/');
      } catch (e) {
        console.error("Auth parsing error", e);
        router.push('/login');
      }
    } else if (!token) {
        // If no token, go back to login
       router.push('/login');
    }
  }, [searchParams, auth, router]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-danger" role="status">
        <span className="visually-hidden">Logging you in...</span>
      </div>
      <h4 className="ms-3">Finalizing Login...</h4>
    </div>
  );
}

export default function AuthSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}