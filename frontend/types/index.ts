export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Home {
  _id: string;
  houseName: string;
  price: number;
  location: string;
  rating: number;
  photoUrl: string[];
  description: string;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  maxGuests?: number; // Added to fix TypeScript error
  userId: User; 
}
// ... rest of your existing interfaces (Booking, Review)
export interface Booking {
  _id: string;
  homeId: Home;
  userId: User; // The Guest
  homeName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  // Matches the enum in your Booking model
  status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled';
  guests: {
    adults: number;
    children: number;
    seniors: number;
  };
  createdAt?: string;
}

export interface Review {
  _id: string;
  homeId: string;
  userId: { 
    _id: string; 
    firstName: string; 
    lastName: string; 
  };
  rating: number;
  comment: string;
  date: string; // Defaults to Date.now in backend
}

// Add these to your existing types/index.ts

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiverId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  homeId: {
    _id: string;
    houseName: string;
    photoUrl: string[];
  };
  bookingId?: string;
  message: string;
  type: 'text' | 'system' | 'booking_request' | 'booking_confirmed' | 'booking_cancelled';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
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