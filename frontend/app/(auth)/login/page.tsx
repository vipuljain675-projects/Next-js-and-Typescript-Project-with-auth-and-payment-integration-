'use client';
import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { AuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const auth = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', formData);
      if (auth) {
        auth.login(res.data.user, res.data.token);
        router.push('/');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Invalid email or password");
    }
  };

  const handleGoogleLogin = () => {
    // 🟢 FIXED: Uses the environment variable so it works on Mobile & Live Site
    // Falls back to localhost only if the variable is missing
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500/api';
    
    // Redirect browser to the backend Google endpoint
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <main className="container-fluid p-0">
      <div className="row g-0" style={{ height: '100vh' }}>
        {/* Left Side: Sexy Image */}
        <div className="col-lg-6 d-none d-lg-block">
          <img 
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" 
            className="w-100 h-100" 
            style={{ objectFit: 'cover' }} 
            alt="Login Background" 
          />
        </div>
        
        {/* Right Side: Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: '450px' }}>
            <div className="mb-4">
              <Link href="/">
                <svg width="32" height="32" fill="#FF385C" viewBox="0 0 32 32" className="mb-4">
                  <path d="M16 1c2 0 3.46 1.67 3.46 3.33 0 2-1.46 3.67-3.46 3.67s-3.46-1.67-3.46-3.67C12.54 2.67 14 1 16 1zm0 24.5c-1.86 0-3.54.5-5.17 1.42L8.7 19.1a7.34 7.34 0 0 1-.45-2.6c0-3.91 3.18-7.08 7.08-7.08h1.34c3.91 0 7.08 3.18 7.08 7.08 0 .9-.17 1.78-.45 2.6l-2.13 7.82c-1.63-.92-3.31-1.42-5.17-1.42z"/>
                </svg>
              </Link>
              <h1 className="fw-bold h2 mb-2">Welcome back</h1>
              <p className="text-secondary">Please enter your details.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Email Address</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg fs-6 rounded-3" 
                  placeholder="Enter your email" 
                  required
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold">Password</label>
                <input 
                  type="password" 
                  className="form-control form-control-lg fs-6 rounded-3" 
                  placeholder="••••••••" 
                  required
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 fw-bold rounded-3 mb-3" 
                style={{ backgroundColor: '#ff385c', border: 'none' }}
              >
                Log in
              </button>
            </form>
            
            {/* Divider and Google Button */}
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1" style={{ color: '#dddddd' }} /> 
              <span className="mx-2 text-muted small">or</span> 
              <hr className="flex-grow-1" style={{ color: '#dddddd' }} />
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="btn btn-outline-dark w-100 py-3 fw-bold rounded-3 mb-3 d-flex align-items-center justify-content-center gap-2"
              style={{ border: '1px solid #222' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="text-center mt-4">
              <p className="text-muted small">
                Don't have an account? 
                <Link href="/signup" className="fw-bold text-dark ms-1 text-decoration-none">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}