'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AddHomePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    houseName: "",
    price: "",
    location: "",
    description: "",
    rating: "4.5",
    availableFrom: "",
    availableTo: "",
    amenities: [] as string[],
  });
  
  const [photos, setPhotos] = useState<File[]>([]); 

  const handleAmenityChange = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert("Please upload at least one photo");
      return;
    }

    setIsSubmitting(true);

    try {
      // 🟢 We must use FormData because we are sending files
      const data = new FormData();
      data.append("houseName", formData.houseName);
      data.append("price", formData.price);
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("rating", formData.rating);
      data.append("availableFrom", formData.availableFrom);
      data.append("availableTo", formData.availableTo);
      
      // Send amenities as a stringified array
      data.append("amenities", JSON.stringify(formData.amenities));

      // Append all selected files
      photos.forEach((file) => {
        data.append("photos", file);
      });

      // 🟢 Hitting your backend endpoint
      const response = await api.post("/host/add-home", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201 || response.status === 200) {
        alert("Home published successfully!");
        // 🟢 REDIRECT: Go back home to see the listing
        router.push("/"); 
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      alert(err.response?.data?.message || "Failed to publish home");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#fff',
      paddingTop: '100px',
      paddingBottom: '60px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>
            Add a New Home
          </h1>
          <p style={{ color: '#717171', fontSize: '14px', margin: 0 }}>
            Fill in the details to start hosting
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '48px'
          }}>
            {/* Left Column - Form Fields */}
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#222', marginBottom: '24px' }}>
                Property Details
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>Home Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seaside Villa"
                  value={formData.houseName}
                  onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>Price per Night (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>Initial Rating</label>
                  <input
                    type="number"
                    step="0.1" min="0" max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>Availability Window</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <small style={{ display: 'block', color: '#717171', fontSize: '12px', marginBottom: '4px' }}>FROM</small>
                    <input
                      type="date"
                      required
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <small style={{ display: 'block', color: '#717171', fontSize: '12px', marginBottom: '4px' }}>TO</small>
                    <input
                      type="date"
                      required
                      value={formData.availableTo}
                      onChange={(e) => setFormData({...formData, availableTo: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>Description</label>
                <textarea
                  required
                  placeholder="Describe your place..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #B0B0B0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '12px' }}>Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {["Wifi", "AC", "Pool", "TV", "Kitchen", "Gym"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAmenityChange(item)}
                      style={{
                        padding: '12px',
                        border: '1px solid #B0B0B0',
                        borderRadius: '8px',
                        backgroundColor: formData.amenities.includes(item) ? '#222' : '#fff',
                        color: formData.amenities.includes(item) ? '#fff' : '#222',
                        fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Photos & Submit */}
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#222', marginBottom: '24px' }}>
                Property Photos ({photos.length}/5)
              </h2>

              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={photos.length >= 5}
                  style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: photos.length >= 5 ? 'not-allowed' : 'pointer', zIndex: 2 }}
                />
                <div style={{ border: '2px dashed #DDDDDD', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', backgroundColor: '#FAFAFA' }}>
                  <div style={{ fontSize: '48px', color: '#FF385C', marginBottom: '12px' }}>☁️↑</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#222', marginBottom: '4px' }}>Click to add photos</div>
                  <div style={{ fontSize: '12px', color: '#717171' }}>Support for JPG, PNG</div>
                </div>
              </div>

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  {photos.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview"
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #DDDDDD' }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', border: 'none', backgroundColor: '#FF385C', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: isSubmitting ? '#ccc' : '#FF385C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isSubmitting ? "Publishing..." : "Publish Your Home"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}