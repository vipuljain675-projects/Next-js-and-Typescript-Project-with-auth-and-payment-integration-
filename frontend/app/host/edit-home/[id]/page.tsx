'use client';

import React, { useEffect, useState, use } from "react"; // Added 'use' for Next.js 15 params
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function EditHomePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Properly unwrap the ID for Next.js 15
  const { id: homeId } = use(params);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    houseName: "",
    price: "",
    location: "",
    description: "",
    availableFrom: "",
    availableTo: "",
    amenities: [] as string[],
  });
  
  // State for existing images (URLs from server) and new images (File objects)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]); 

  useEffect(() => {
    if (!homeId) return;

    api.get(`/homes/${homeId}`)
      .then((res) => {
        const home = res.data.home;
        setFormData({
          houseName: home.houseName || "",
          price: home.price?.toString() || "",
          location: home.location || "",
          description: home.description || "",
          availableFrom: home.availableFrom ? new Date(home.availableFrom).toISOString().split('T')[0] : "",
          availableTo: home.availableTo ? new Date(home.availableTo).toISOString().split('T')[0] : "",
          amenities: home.amenities || [],
        });
        setExistingPhotos(home.photoUrl || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [homeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Limit to 5 total photos (existing + new)
      setNewPhotos((prev) => [...prev, ...selectedFiles].slice(0, 5 - existingPhotos.length));
    }
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };
// Inside your EditHomePage component
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const data = new FormData();
    data.append("homeId", homeId); // Critical for backend to find the home
    data.append("houseName", formData.houseName);
    data.append("price", formData.price);
    data.append("location", formData.location);
    data.append("description", formData.description);
    data.append("availableFrom", formData.availableFrom);
    data.append("availableTo", formData.availableTo);
    data.append("amenities", JSON.stringify(formData.amenities));

    newPhotos.forEach(file => data.append("photos", file));

    await api.post(`/host/edit-home`, data, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    alert("Listing updated successfully!");
    
    // 🟢 REDIRECT CHANGE: Go to the home details page to see results
    router.push(`/homes/${homeId}`); 
    
  } catch (err: any) {
    alert("Update failed. Make sure all fields are filled.");
  } finally {
    setIsSubmitting(false);
  }
};


  if (loading) return <div className="text-center mt-5 p-5">Loading your home details...</div>;

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '1000px' }}>
      <h1 className="fw-bold mb-4 text-start">Edit Your Home</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="row g-5">
          {/* Left Column: Details */}
          <div className="col-lg-7 text-start">
            <div className="mb-3">
              <label className="fw-bold small mb-1">Home Name</label>
              <input type="text" className="form-control" value={formData.houseName} onChange={e => setFormData({...formData, houseName: e.target.value})} required />
            </div>

            <div className="row mb-3">
              <div className="col-6">
                <label className="fw-bold small mb-1">Price (₹)</label>
                <input type="number" className="form-control" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className="col-6">
                <label className="fw-bold small mb-1">Location</label>
                <input type="text" className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
              </div>
            </div>

            <div className="mb-3">
              <label className="fw-bold small mb-1">Description</label>
              <textarea className="form-control" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>
            
            <div className="row mb-4 text-start">
                <div className="col-6">
                    <label className="fw-bold small mb-1">Available From</label>
                    <input type="date" className="form-control" value={formData.availableFrom} onChange={e => setFormData({...formData, availableFrom: e.target.value})} />
                </div>
                <div className="col-6">
                    <label className="fw-bold small mb-1">Available To</label>
                    <input type="date" className="form-control" value={formData.availableTo} onChange={e => setFormData({...formData, availableTo: e.target.value})} />
                </div>
            </div>
          </div>

          {/* Right Column: Restored Images */}
          <div className="col-lg-5 text-start">
            <h4 className="fw-bold mb-3">Property Photos</h4>
            
            {/* Upload Area Restored */}
            <div className="position-relative mb-3">
              <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              <div className="border-dashed p-4 text-center bg-light rounded-3">
                 <i className="bi bi-cloud-arrow-up fs-2 text-danger"></i>
                 <div className="small fw-bold">Click to add more photos</div>
              </div>
            </div>

            {/* New Previews Section */}
            <div className="row g-2">
              {newPhotos.map((file, idx) => (
                <div key={idx} className="col-4 position-relative">
                  <img src={URL.createObjectURL(file)} className="w-100 rounded-2 border" style={{ height: '70px', objectFit: 'cover' }} alt="New Preview" />
                  <button type="button" onClick={() => removeNewPhoto(idx)} className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 p-0" style={{ width: '20px', height: '20px' }}>×</button>
                </div>
              ))}
              {/* Existing Photos thumbnails */}
              {existingPhotos.map((url, idx) => (
                <div key={idx} className="col-4">
                  <img src={url.startsWith('http') ? url : `http://localhost:3500${url}`} className="w-100 rounded-2 grayscale" style={{ height: '70px', objectFit: 'cover', opacity: 0.6 }} alt="Existing" />
                </div>
              ))}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-100 mt-4 py-3 fw-bold rounded-3 shadow-sm" style={{ backgroundColor: '#FF385C', border: 'none' }}>
              {isSubmitting ? "Updating..." : "Update Listing"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}