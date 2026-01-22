'use client';
import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { AuthContext } from '@/context/AuthContext';

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '' 
  });
  const auth = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/signup', formData); // Connects to authController.postSignup
      if (auth) {
        auth.login(res.data.user, res.data.token); // Saves to localStorage & State
        router.push('/'); // Redirect to home
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <main className="container-fluid p-0">
      <div className="row g-0" style={{ height: '100vh' }}>
        {/* Left Side: Sexy Image */}
        <div className="col-lg-6 d-none d-lg-block">
          <img 
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop" 
            className="w-100 h-100" 
            style={{ objectFit: 'cover' }} 
            alt="Signup Background" 
          />
        </div>

        {/* Right Side: Signup Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: '550px' }}>
            <div className="mb-4">
              <Link href="/">
                <svg width="32" height="32" fill="#FF385C" viewBox="0 0 32 32" className="mb-4">
                  <path d="M16 1c2 0 3.46 1.67 3.46 3.33 0 2-1.46 3.67-3.46 3.67s-3.46-1.67-3.46-3.67C12.54 2.67 14 1 16 1zm0 24.5c-1.86 0-3.54.5-5.17 1.42L8.7 19.1a7.34 7.34 0 0 1-.45-2.6c0-3.91 3.18-7.08 7.08-7.08h1.34c3.91 0 7.08 3.18 7.08 7.08 0 .9-.17 1.78-.45 2.6l-2.13 7.82c-1.63-.92-3.31-1.42-5.17-1.42z"/>
                </svg>
              </Link>
              <h1 className="fw-bold h2 mb-2">Create an account</h1>
              <p className="text-secondary">Join us and start your journey.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6 text-start">
                  <label className="form-label small fw-bold">First Name</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg fs-6 rounded-3" 
                    placeholder="John" 
                    required
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                  />
                </div>
                <div className="col-md-6 text-start">
                  <label className="form-label small fw-bold">Last Name</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg fs-6 rounded-3" 
                    placeholder="Doe" 
                    required
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                  />
                </div>
              </div>
              <div className="mb-3 text-start">
                <label className="form-label small fw-bold">Email Address</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg fs-6 rounded-3" 
                  placeholder="name@example.com" 
                  required
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              <div className="mb-4 text-start">
                <label className="form-label small fw-bold">Password</label>
                <input 
                  type="password" 
                  className="form-control form-control-lg fs-6 rounded-3" 
                  placeholder="Create a password" 
                  required
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 fw-bold rounded-3 mb-3" 
                style={{ backgroundColor: '#ff385c', border: 'none' }}
              >
                Sign Up
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-muted small">
                Already have an account? 
                <Link href="/login" className="fw-bold text-dark ms-1 text-decoration-none">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}