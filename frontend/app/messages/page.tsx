'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  home: {
    _id: string;
    houseName: string;
    photoUrl: string[];
  };
  lastMessage: string;
  lastMessageType: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800";
    return url.startsWith("http") ? url : `http://localhost:3500${url}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border text-danger" />
      </div>
    );
  }

  return (
    <main className="container" style={{ marginTop: '120px', maxWidth: '900px', paddingBottom: '60px' }}>
      <div className="mb-4 text-start">
        <h1 className="fw-bold h2 mb-2">Messages</h1>
        <p className="text-secondary small mb-0">Connect with hosts and guests</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-light">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h3 className="fw-bold mb-2">No messages yet</h3>
          <p className="text-secondary">Start a conversation with a host to book your stay</p>
          <Link href="/" className="btn btn-danger mt-3">Explore Homes</Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {conversations.map((conv) => (
            <Link
              key={conv.conversationId}
              href={`/messages/${conv.conversationId}`}
              className="text-decoration-none"
            >
              <div 
                className="p-3 border rounded-4 d-flex gap-3 align-items-center hover-bg-light"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: conv.unreadCount > 0 ? '#FFF9F0' : '#fff'
                }}
              >
                {/* Property Image */}
                <img
                  src={getImageUrl(conv.home?.photoUrl?.[0])}
                  alt={conv.home?.houseName}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '12px', 
                    objectFit: 'cover' 
                  }}
                />

                {/* Message Content */}
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                      {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                    </h5>
                    <span className="text-muted small">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <p className="text-muted small mb-1">{conv.home?.houseName}</p>
                  <p 
                    className="mb-0 small text-truncate" 
                    style={{ 
                      fontWeight: conv.unreadCount > 0 ? '600' : '400',
                      color: conv.unreadCount > 0 ? '#222' : '#717171'
                    }}
                  >
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread Badge */}
                {conv.unreadCount > 0 && (
                  <div 
                    className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      fontSize: '12px',
                      flexShrink: 0
                    }}
                  >
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}