'use client';
import React, { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import gsap from "@/lib/gsap";

const Navbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
  });
  
  const auth = useContext(AuthContext); 
  const { unreadCount } = useChat();
  const router = useRouter();
  const pathname = usePathname();

  // GSAP Refs
  const navbarRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navbar entrance animation on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navbarRef.current, {
        y: -100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });

      gsap.from(logoRef.current, {
        scale: 0,
        rotation: -180,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "elastic.out(1, 0.5)"
      });

      gsap.from(searchBarRef.current, {
        scaleX: 0,
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: "power2.out"
      });
    });

    return () => ctx.revert();
  }, []);

  // Dropdown animation
  useEffect(() => {
    if (showUserMenu && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { 
          opacity: 0, 
          y: -20,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)"
        }
      );
    }
  }, [showUserMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const closeMenu = () => setShowUserMenu(false);
    if (showUserMenu) {
      window.addEventListener("click", closeMenu);
    }
    return () => window.removeEventListener("click", closeMenu);
  }, [showUserMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Search button pulse animation
    gsap.to(".search-button", {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });

    const params = new URLSearchParams();
    if (searchQuery.location) params.set("location", searchQuery.location);
    if (searchQuery.checkIn) params.set("checkIn", searchQuery.checkIn);
    if (searchQuery.checkOut) params.set("checkOut", searchQuery.checkOut);
    router.push(`/?${params.toString()}`);
  };

  const userInitial = auth?.user?.firstName ? auth.user.firstName.charAt(0).toUpperCase() : "";

  return (
    <header ref={navbarRef} className="fixed-top bg-white border-bottom navbar-shadow" style={{ zIndex: 1030 }}>
      <div className="container-fluid px-4 px-md-5">
        <div className="d-flex justify-content-between align-items-center" style={{ height: "80px" }}>
          
          {/* Logo with REAL Airbnb Bélo Symbol */}
          <div ref={logoRef}>
            <Link href="/" className="text-decoration-none d-flex align-items-center logo-container">
              <svg width="30" height="32" fill="#FF385C" viewBox="0 0 448 512" className="logo-icon">
                <path d="M224 373.12c-25.24-31.67-40.08-59.43-45-83.18-22.55-88 112.61-88 90.06 0-5.45 24.25-20.29 52-45 83.18zm138.15 73.23c-42.06 18.31-83.67-10.88-119.3-50.47 103.9-130.07 46.11-200-18.85-200-54.92 0-85.16 46.51-73.28 100.5 6.93 29.19 25.23 62.39 54.43 99.5-32.53 36.05-60.55 52.69-85.15 54.92-50 7.43-89.11-41.06-71.3-91.09 15.1-39.16 111.72-231.18 115.87-241.56 15.75-30.07 25.56-57.4 59.38-57.4 32.34 0 43.4 25.94 60.37 59.87 36 70.62 89.35 177.48 114.84 239.09 13.17 33.07-1.37 71.29-37.01 86.64zm47-136.12C280.27 35.93 273.13 32 224 32c-45.52 0-64.87 31.67-84.66 72.79C33.18 317.1 22.89 347.19 22 349.81-3.22 419.14 48.74 480 111.63 480c21.71 0 60.61-6.06 112.37-62.4 58.68 63.78 101.26 62.4 112.37 62.4 62.89.05 114.85-60.86 89.61-130.19.02-3.89-16.82-38.9-16.82-39.58z"/>
              </svg>
              <span className="ms-2 fw-bold fs-4 d-none d-sm-inline logo-text" style={{ color: "#FF385C" }}>airbnb</span>
            </Link>
          </div>

          {/* Top Navigation with Real Icons */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            <Link href="/" className={`nav-tab-link-top d-flex align-items-center gap-2 ${pathname === '/' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 1l-9 8v14c0 1.1.9 2 2 2h5v-7h4v7h5c1.1 0 2-.9 2-2V9l-9-8z"/>
              </svg>
              <span>Homes</span>
            </Link>
            
            <Link href="/experiences" className="nav-tab-link-top d-flex align-items-center gap-2 position-relative">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 1C8.82 1 3 6.82 3 14c0 3.64 1.48 6.93 3.88 9.32l.01.01L16 32l9.11-8.67c.01 0 .01-.01.01-.01A12.94 12.94 0 0 0 29 14c0-7.18-5.82-13-13-13zm0 18a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
              </svg>
              <span>Experiences</span>
              <span className="badge bg-danger text-white" style={{ fontSize: '9px', padding: '2px 6px', marginLeft: '-4px' }}>NEW</span>
            </Link>
            
            <Link href="/services" className="nav-tab-link-top d-flex align-items-center gap-2 position-relative">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 1c-8.28 0-15 6.72-15 15 0 8.28 6.72 15 15 15 8.28 0 15-6.72 15-15 0-8.28-6.72-15-15-15zm7 16h-6v6h-2v-6H9v-2h6V9h2v6h6v2z"/>
              </svg>
              <span>Services</span>
              <span className="badge bg-danger text-white" style={{ fontSize: '9px', padding: '2px 6px', marginLeft: '-4px' }}>NEW</span>
            </Link>
          </div>

          {/* Right Menu */}
          <div className="d-flex align-items-center gap-3">
            {auth?.isLoggedIn ? (
               <div className="d-none d-md-flex align-items-center gap-3">
                  <Link href="/bookings" className="nav-link-animated text-dark fw-semibold small text-decoration-none">Trips</Link>
                  <Link href="/wishlist" className="nav-link-animated text-dark fw-semibold small text-decoration-none">Saved</Link>
                  
                  <Link 
                    href="/messages" 
                    className="nav-link-animated text-dark fw-semibold small text-decoration-none position-relative"
                  >
                    <i className="bi bi-chat-dots fs-6 me-1"></i>
                    Messages
                    {unreadCount > 0 && (
                      <span 
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger badge-pulse"
                        style={{ fontSize: '9px', padding: '2px 5px', marginLeft: '-10px' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link href="/host/my-listings" className="nav-link-animated text-dark fw-semibold small text-decoration-none">Switch to Host</Link>
               </div>
            ) : (
              <Link href="/host" className="nav-tab-link-top d-none d-md-block">Airbnb your home</Link>
            )}
            
            {/* User Menu */}
            <div className="position-relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="user-menu-pill d-flex align-items-center gap-2 border rounded-pill bg-white py-1 px-2"
              >
                <i className="bi bi-list fs-5 ms-1"></i>
                <div 
                  className="rounded-circle bg-dark d-flex align-items-center justify-content-center text-white fw-bold user-avatar" 
                  style={{ width: "32px", height: "32px", fontSize: "14px" }}
                >
                  {auth?.isLoggedIn ? userInitial : <i className="bi bi-person-fill"></i>}
                </div>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div 
                  ref={dropdownRef}
                  className="position-absolute end-0 mt-2 bg-white rounded-4 shadow-lg border py-2 text-start dropdown-menu-custom" 
                  style={{ width: "240px", zIndex: 1050 }}
                >
                  {auth?.isLoggedIn ? (
                    <>
                      <div className="px-4 py-2 fw-bold small text-secondary">Hi, {auth.user?.firstName}</div>
                      <Link href="/messages" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">
                        <i className="bi bi-chat-dots me-2"></i>
                        Messages
                        {unreadCount > 0 && (
                          <span className="badge bg-danger ms-2" style={{ fontSize: '10px' }}>
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link href="/bookings" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">My Trips</Link>
                      <Link href="/wishlist" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">Saved Homes</Link>
                      <hr className="my-2" />
                      <Link href="/host/my-listings" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">Manage Listings</Link>
                      <Link href="/host/manage-bookings" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">Handle Requests</Link>
                      <hr className="my-2" />
                      <button onClick={auth.logout} className="dropdown-item-custom d-block w-100 text-start px-4 py-2 border-0 bg-transparent text-danger fw-bold">Log out</button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark fw-bold">Log in</Link>
                      <Link href="/signup" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">Sign up</Link>
                      <hr className="my-2" />
                      <Link href="/host" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">Airbnb your home</Link>
                      <Link href="/help" className="dropdown-item-custom d-block px-4 py-2 text-decoration-none text-dark">Help Center</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div ref={searchBarRef} className="pb-3 d-flex justify-content-center">
          <form onSubmit={handleSearch} className="search-bar-container w-100" style={{ maxWidth: '850px' }}>
            <div className="search-section search-section-start">
              <label className="search-label">Where</label>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search destinations"
                onChange={(e) => setSearchQuery({...searchQuery, location: e.target.value})}
              />
            </div>
            <div className="search-section search-section-middle">
              <label className="search-label">Check in</label>
              <input 
                type="date" 
                className="search-input"
                onChange={(e) => setSearchQuery({...searchQuery, checkIn: e.target.value})}
              />
            </div>
            <div className="search-section search-section-middle">
              <label className="search-label">Check out</label>
              <input 
                type="date" 
                className="search-input"
                onChange={(e) => setSearchQuery({...searchQuery, checkOut: e.target.value})}
              />
            </div>
            <button type="submit" className="search-button me-2">
              <i className="bi bi-search text-white"></i>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Navbar;