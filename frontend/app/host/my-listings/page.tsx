'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Home } from "@/types";

export default function MyListingsPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800";
    return url.startsWith("http") ? url : `http://localhost:3500${url}`;
  };

  useEffect(() => {
    api.get("/host/host-home-list") // Endpoint from hostRouter.js
      .then((res) => {
        setHomes(res.data.homes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this listing?")) {
      try {
        await api.post(`/host/delete-home/${id}`);
        setHomes(homes.filter((h) => h._id !== id));
      } catch (err) {
        alert("Failed to delete.");
      }
    }
  };

  if (loading) return <div className="text-center mt-40">Loading your listings...</div>;

  return (
    <main className="container mb-5" style={{ marginTop: "180px" }}>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 className="fw-bold h2">Your Listings</h1>
        <Link href="/host/add-home" className="btn btn-dark rounded-pill px-4 fw-bold">Create new listing</Link>
      </div>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {homes.map((home) => (
          <div className="col" key={home._id}>
            <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
              <img src={getImageUrl(home.photoUrl[0])} className="w-100 object-fit-cover" style={{ aspectRatio: "4/3" }} alt={home.houseName} />
              <div className="card-body p-3">
                <h5 className="fw-bold text-truncate">{home.houseName}</h5>
                <div className="d-flex gap-2 mt-3">
// Find this line (around line 52):
<Link href={`/host/edit-home/${home._id}`} className="btn btn-outline-dark btn-sm rounded-pill grow">
  Edit
</Link>                  <button onClick={() => handleDelete(home._id)} className="btn btn-outline-danger btn-sm rounded-pill">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}