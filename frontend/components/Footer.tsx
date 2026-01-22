'use client';
import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-light border-top pt-5 pb-4 mt-5">
      <div className="container" style={{ maxWidth: "1120px" }}>
        <div className="row g-4 text-start">
          {/* Column 1: Support */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold mb-3 small">Support</h6>
            <ul className="list-unstyled small d-grid gap-2 text-secondary">
              <li><Link href="#">Help Centre</Link></li>
              <li><Link href="#">AirCover</Link></li>
              <li><Link href="#">Anti-discrimination</Link></li>
              <li><Link href="#">Disability support</Link></li>
              <li><Link href="#">Cancellation options</Link></li>
            </ul>
          </div>

          {/* Column 2: Hosting */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold mb-3 small">Hosting</h6>
            <ul className="list-unstyled small d-grid gap-2 text-secondary">
              <li><Link href="/host">Airbnb your home</Link></li>
              <li><Link href="#">AirCover for Hosts</Link></li>
              <li><Link href="#">Hosting resources</Link></li>
              <li><Link href="#">Community forum</Link></li>
              <li><Link href="#">Hosting responsibly</Link></li>
            </ul>
          </div>

          {/* Column 3: Airbnb */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold mb-3 small">Airbnb</h6>
            <ul className="list-unstyled small d-grid gap-2 text-secondary">
              <li><Link href="#">Newsroom</Link></li>
              <li><Link href="#">New features</Link></li>
              <li><Link href="#">Careers</Link></li>
              <li><Link href="#">Investors</Link></li>
              <li><Link href="#">Gift cards</Link></li>
            </ul>
          </div>

          {/* Column 4: Social */}
          <div className="col-6 col-md-3 text-md-end">
            <h6 className="fw-bold mb-3 small">Follow Us</h6>
            <div className="d-flex gap-3 justify-content-md-end fs-5 text-dark">
              <i className="bi bi-facebook cursor-pointer"></i>
              <i className="bi bi-twitter-x cursor-pointer"></i>
              <i className="bi bi-instagram cursor-pointer"></i>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary gap-3">
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            <span>© 2025 Airbnb, Inc.</span>
            <span>·</span>
            <Link href="#">Privacy</Link>
            <span>·</span>
            <Link href="#">Terms</Link>
            <span>·</span>
            <Link href="#">Sitemap</Link>
          </div>
          <div className="d-flex gap-3 fw-bold text-dark">
            <span className="cursor-pointer"><i className="bi bi-globe me-2"></i>English (IN)</span>
            <span className="cursor-pointer">₹ INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;