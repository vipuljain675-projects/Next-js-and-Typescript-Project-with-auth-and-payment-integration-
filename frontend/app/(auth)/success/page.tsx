'use client';
import { useEffect, useContext, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useContext(AuthContext);
  
  // 🟢 NEW: This creates a "memory" to track if we already logged in
  const processed = useRef(false);

  useEffect(() => {
    // 🟢 CHECK: If we already did this, STOP immediately.
    if (processed.current) return;

    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr && auth) {
      try {
        // 🟢 MARK AS DONE: Set this to true so it never runs again
        processed.current = true;

        const user = JSON.parse(userStr);
        
        // Perform login
        auth.login(user, token);
        
        // Redirect home
        router.replace('/'); 
      } catch (e) {
        console.error("Auth parsing error", e);
        router.push('/login');
      }
    } else if (!token) {
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