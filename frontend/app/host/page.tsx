'use client';
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";

export default function HostGatewayPage() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // 1. If not logged in, just show the landing page
    if (!auth?.isLoggedIn) {
      setCheckingStatus(false);
      return;
    }

    // 2. If logged in, check if they already have homes to decide where to send them
    const verifyHostStatus = async () => {
      try {
        const res = await api.get("/host"); 
        if (res.data.hasHomes) {
          // 🟢 Redirect active hosts straight to my-listings
          router.push("/my-listings");
        } else {
          setCheckingStatus(false);
        }
      } catch (err) {
        setCheckingStatus(false);
      }
    };

    verifyHostStatus();
  }, [auth?.isLoggedIn, router]);

  const handleGetStarted = () => {
    if (auth?.isLoggedIn) {
      // 🟢 Redirect to your listings page as requested
      router.push("/host/my-listings");
    } else {
      // If not logged in, take them to login first
      router.push("/login");
    }
  };

  if (auth?.isLoggedIn && checkingStatus) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-danger" role="status"></div>
      </div>
    );
  }

  return (
    <main className="container-fluid p-0">
      <div className="row g-0" style={{ minHeight: "calc(100vh - 80px)", marginTop: "80px" }}>
        {/* Left Side: Airbnb It Visual */}
        <div className="col-lg-6 position-relative bg-dark">
          <img
            src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop"
            alt="Become a Host"
            className="w-100 h-100 object-fit-cover opacity-75 position-absolute"
          />
          <div className="position-absolute top-50 start-0 translate-middle-y p-5 text-white text-start">
            <h1 className="display-1 fw-bold mb-3">Airbnb it.</h1>
            <p className="fs-2">You could earn money by sharing your extra space.</p>
          </div>
        </div>

        {/* Right Side: Welcome & Get Started */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
          <div className="w-100 p-5" style={{ maxWidth: "550px" }}>
            <h1 className="fw-bold mb-4 text-start" style={{ color: "#ff385c" }}>Open your door to the world</h1>
            
            <div className="card border-0 bg-light p-4 rounded-4 mb-4 text-start shadow-sm">
               <h5 className="fw-bold">Airbnb Setup</h5>
               <p className="text-secondary small mb-0">The super easy way to start hosting on our platform.</p>
            </div>

            <button 
              onClick={handleGetStarted} 
              className="btn btn-primary btn-lg w-100 fw-bold py-3 rounded-pill shadow-sm" 
              style={{ backgroundColor: "#ff385c", border: "none" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}