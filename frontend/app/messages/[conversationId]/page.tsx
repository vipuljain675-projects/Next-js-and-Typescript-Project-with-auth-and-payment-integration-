'use client';
import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useChat } from '@/context/ChatContext';
import { AuthContext } from '@/context/AuthContext';

interface Message {
  _id: string;
  senderId: { _id: string; firstName: string; lastName: string };
  receiverId: { _id: string; firstName: string; lastName: string };
  homeId?: { _id: string; houseName: string; photoUrl: string[] };
  message: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isRead: boolean;
  createdAt: string;
  isEdited?: boolean;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useContext(AuthContext);
  const { socket } = useChat();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [homeInfo, setHomeInfo] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationId = params.conversationId as string;

  useEffect(() => {
    if (!conversationId) return;
    
    fetchMessages();

    if (socket) {
      socket.emit('join_conversation', conversationId);
      
      socket.on('new_message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      socket.on('user_typing', ({ isTyping: typing }: { isTyping: boolean }) => {
        setIsTyping(typing);
      });

      socket.on('messages_read', () => {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', conversationId);
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('messages_read');
      }
    };
  }, [conversationId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/messages/${conversationId}`);
      const msgs = res.data.messages || [];
      setMessages(msgs);
      
      if (msgs.length > 0) {
        const firstMsg = msgs[0];
        const other = firstMsg.senderId._id === auth?.user?._id 
          ? firstMsg.receiverId 
          : firstMsg.senderId;
        setOtherUser(other);
        
        if (firstMsg.homeId) {
          setHomeInfo(firstMsg.homeId);
        }
      } else {
        const parts = conversationId.split('_');
        if (parts.length === 3) {
          const homeId = parts[2];
          const homeRes = await api.get(`/homes/${homeId}`);
          const home = homeRes.data.home;
          
          setHomeInfo({
            _id: home._id,
            houseName: home.houseName,
            photoUrl: home.photoUrl
          });
          
          setOtherUser({
            _id: home.userId._id,
            firstName: home.userId.firstName,
            lastName: home.userId.lastName,
            email: home.userId.email
          });
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { conversationId, isTyping: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { conversationId, isTyping: false });
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    if (!otherUser?._id || !homeInfo?._id) {
      alert('Unable to send message. Please refresh and try again.');
      return;
    }

    const messageData = {
      receiverId: otherUser._id,
      homeId: homeInfo._id,
      message: newMessage.trim(),
      type: 'text'
    };

    setSending(true);
    const tempMessage = newMessage;
    setNewMessage('');

    try {
      await api.post('/chat/send', messageData);
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(tempMessage);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editedText.trim()) return;

    try {
      await api.put(`/chat/messages/${messageId}`, {
        message: editedText.trim()
      });
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, message: editedText.trim(), isEdited: true } : msg
      ));
      
      setEditingMessageId(null);
      setEditedText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Check file sizes
    const oversizedFiles = fileArray.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed 5MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles(fileArray);
    setShowFilePreview(true);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setSending(true);

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiverId', otherUser!._id);
        formData.append('homeId', homeInfo!._id);

        await api.post('/chat/send-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSelectedFiles([]);
      setShowFilePreview(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload files:', err);
      alert('Failed to upload some files');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Check if message contains URL
  const containsUrl = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  };

  // Check if message is an image URL
  const isImageUrl = (text: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(text);
  };

  // Render message with clickable links
  const renderMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: '600'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border text-danger" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p>Conversation not found</p>
          <button onClick={() => router.back()} className="btn btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#F7F7F7'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#fff',
        borderBottom: '1px solid #EBEBEB',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
      }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%'
          }}
        >
          ←
        </button>

        {homeInfo?.photoUrl?.[0] && (
          <img 
            src={homeInfo.photoUrl[0].startsWith('http') ? homeInfo.photoUrl[0] : `http://localhost:3500${homeInfo.photoUrl[0]}`}
            alt={homeInfo.houseName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
        )}
        
        <div style={{ flex: 1 }}>
          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#222' }}>
            {otherUser?.firstName} {otherUser?.lastName}
          </h5>
          {homeInfo && (
            <p style={{ margin: 0, fontSize: '14px', color: '#717171' }}>
              {homeInfo.houseName}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            color: '#717171'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h4 style={{ fontWeight: '600', color: '#222', marginBottom: '8px' }}>
              Start a conversation
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Send a message to {otherUser?.firstName} about {homeInfo?.houseName}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId._id === auth?.user?._id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId._id !== msg.senderId._id;
            const isEditing = editingMessageId === msg._id;
            const hasImage = msg.type === 'image' || (msg.fileUrl && isImageUrl(msg.fileUrl));
            const hasFile = (msg.type === 'file' || msg.type === 'document') && !hasImage;

            return (
              <div 
                key={msg._id}
                style={{ 
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  gap: '8px',
                  alignItems: 'flex-end'
                }}
                onMouseEnter={() => setHoveredMessageId(msg._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {!isOwn && showAvatar && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#FF385C',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {msg.senderId.firstName.charAt(0)}
                  </div>
                )}
                {!isOwn && !showAvatar && <div style={{ width: '32px' }} />}

                <div style={{ maxWidth: '60%', position: 'relative' }}>
                  {isEditing ? (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      backgroundColor: '#fff',
                      border: '2px solid #FF385C',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      <input
                        type="text"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditMessage(msg._id);
                          if (e.key === 'Escape') { setEditingMessageId(null); setEditedText(''); }
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '15px',
                          marginBottom: '12px',
                          fontFamily: 'inherit'
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEditMessage(msg._id)}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#FF385C',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingMessageId(null); setEditedText(''); }}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#F7F7F7',
                            color: '#222',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: hasImage ? '4px' : (hasFile ? '0' : '12px 16px'),
                      borderRadius: '16px',
                      backgroundColor: isOwn ? '#FF385C' : '#fff',
                      color: isOwn ? '#fff' : '#222',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      position: 'relative'
                    }}>
                      {/* Hover Menu - Show for ALL message types */}
                      {isOwn && hoveredMessageId === msg._id && (
                        <div style={{
                          position: 'absolute',
                          top: hasImage ? '8px' : (hasFile ? '8px' : '-32px'),
                          right: hasImage || hasFile ? '8px' : '0',
                          backgroundColor: '#fff',
                          borderRadius: '20px',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                          display: 'flex',
                          gap: '4px',
                          padding: '4px',
                          zIndex: 10
                        }}>
                          {!hasImage && !hasFile && (
                            <button
                              onClick={() => { setEditingMessageId(msg._id); setEditedText(msg.message); }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                fontSize: '20px'
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '16px',
                              cursor: 'pointer',
                              fontSize: '20px',
                              color: '#DC3545'
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                      {/* Image Message */}
                      {hasImage && msg.fileUrl && (
                        <div>
                          <img 
                            src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `http://localhost:3500${msg.fileUrl}`}
                            alt={msg.fileName || 'Image'}
                            onClick={() => setShowImagePreview(msg.fileUrl!)}
                            style={{
                              maxWidth: '300px',
                              width: '100%',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              display: 'block'
                            }}
                          />
                          <div style={{ 
                            padding: '8px 12px', 
                            fontSize: '11px', 
                            opacity: 0.8,
                            color: isOwn ? '#fff' : '#717171'
                          }}>
                            {formatTime(msg.createdAt)}
                            {isOwn && msg.isRead && ' • ✓✓'}
                          </div>
                        </div>
                      )}

                      {/* PDF/Document Message - WhatsApp Style */}
                      {hasFile && msg.fileUrl && (
                        <div style={{ minWidth: '280px', maxWidth: '340px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '12px 16px'
                          }}>
                            {/* PDF Icon */}
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              backgroundColor: isOwn ? 'rgba(255,255,255,0.25)' : '#DCF8C6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '28px',
                              flexShrink: 0
                            }}>
                              📄
                            </div>
                            
                            {/* File Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: '14px', 
                                fontWeight: '600', 
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: isOwn ? '#fff' : '#222'
                              }}>
                                {msg.fileName || 'Document.pdf'}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                opacity: 0.8,
                                color: isOwn ? '#fff' : '#667781'
                              }}>
                                {msg.fileSize ? `${(msg.fileSize / 1024).toFixed(0)} KB • ` : ''}PDF
                              </div>
                            </div>
                            
                            {/* Download Button */}
                            <a 
                              href={msg.fileUrl.startsWith('http') ? msg.fileUrl : `http://localhost:3500${msg.fileUrl}`}
                              download={msg.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                fontSize: '20px',
                                flexShrink: 0,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              title="Download PDF"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isOwn ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.05)';
                              }}
                            >
                              ⬇️
                            </a>
                          </div>
                          
                          {/* Timestamp */}
                          <div style={{ 
                            padding: '0 16px 12px 16px', 
                            fontSize: '11px', 
                            opacity: 0.7,
                            color: isOwn ? '#fff' : '#667781',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {msg.isEdited && <span>• Edited</span>}
                            {isOwn && msg.isRead && <span>• ✓✓</span>}
                          </div>
                        </div>
                      )}

                      {/* Text Message */}
                      {!hasImage && !hasFile && (
                        <div>
                          <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                            {renderMessageWithLinks(msg.message)}
                          </p>
                          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
                            {formatTime(msg.createdAt)}
                            {msg.isEdited && <span> · Edited</span>}
                            {isOwn && msg.isRead && <span> · ✓✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#717171',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {otherUser?.firstName?.charAt(0) || 'U'}
            </div>
            <div style={{ 
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}>
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ 
        backgroundColor: '#fff',
        borderTop: '1px solid #EBEBEB',
        padding: '16px 24px',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.04)'
      }}>
        <div style={{ 
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #DDDDDD',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Attach file"
          >
            📎
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              style={{
                width: '100%',
                padding: '12px 60px 12px 16px',
                border: '1px solid #DDDDDD',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
            />
            
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: newMessage.trim() ? '#FF385C' : '#DDDDDD',
                color: '#fff',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div 
          onClick={() => setShowImagePreview(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '40px'
          }}
        >
          <button
            onClick={() => setShowImagePreview(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          <img 
            src={showImagePreview.startsWith('http') ? showImagePreview : `http://localhost:3500${showImagePreview}`}
            alt="Preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* File Preview Modal (Before Sending) */}
      {showFilePreview && selectedFiles.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '40px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#222' }}>
                Send {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => {
                  setShowFilePreview(false);
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#717171',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {selectedFiles.map((file, index) => {
                const isImage = file.type.startsWith('image/');
                const fileUrl = URL.createObjectURL(file);

                return (
                  <div 
                    key={index}
                    style={{
                      border: '1px solid #EBEBEB',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      backgroundColor: '#F7F7F7'
                    }}
                  >
                    {isImage ? (
                      <img 
                        src={fileUrl}
                        alt={file.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        backgroundColor: '#DCF8C6',
                        color: '#222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        fontWeight: '600'
                      }}>
                        {file.type.includes('pdf') ? '📄' : '📎'}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#222',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#717171' }}>
                        {(file.size / 1024).toFixed(0)} KB
                      </div>
                    </div>

                    <button
                      onClick={() => removeSelectedFile(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DC3545'
                      }}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowFilePreview(false);
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#F7F7F7',
                  color: '#222',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendSelectedFiles}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#FF385C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.7 : 1
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #717171;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}