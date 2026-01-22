// backend/controllers/chatController.js
const Message = require('../models/message');
const User = require('../models/user');
const Home = require('../models/home');
const Booking = require('../models/booking');

// Generate conversationId from two user IDs (always in same order)
const generateConversationId = (userId1, userId2, homeId) => {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `${sorted[0]}_${sorted[1]}_${homeId}`;
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastMessageType: { $first: '$type' },
          lastMessageTime: { $first: '$createdAt' },
          senderId: { $first: '$senderId' },
          receiverId: { $first: '$receiverId' },
          homeId: { $first: '$homeId' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Populate user and home details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.senderId.toString() === userId.toString() 
          ? conv.receiverId 
          : conv.senderId;

        const [otherUser, home] = await Promise.all([
          User.findById(otherUserId).select('firstName lastName email'),
          Home.findById(conv.homeId).select('houseName photoUrl')
        ]);

        return {
          conversationId: conv._id,
          otherUser,
          home,
          lastMessage: conv.lastMessage,
          lastMessageType: conv.lastMessageType,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.status(200).json({ conversations: populatedConversations });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Failed to load conversations' });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'firstName lastName email')
      .populate('receiverId', 'firstName lastName email')
      .populate('homeId', 'houseName photoUrl')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId, 
        receiverId: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Failed to load messages' });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, homeId, message, type = 'text', bookingId } = req.body;
    const senderId = req.userId;

    if (!receiverId || !homeId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const conversationId = generateConversationId(senderId, receiverId, homeId);

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      homeId,
      bookingId,
      message,
      type
    });

    await newMessage.save();

    // Populate before sending back
    await newMessage.populate('senderId', 'firstName lastName email');
    await newMessage.populate('receiverId', 'firstName lastName email');
    await newMessage.populate('homeId', 'houseName photoUrl');

    // Emit via WebSocket (handled in socket.js)
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', newMessage);
      io.to(`user_${receiverId}`).emit('notification', {
        type: 'new_message',
        message: newMessage
      });
    }

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.userId;

    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    const msg = await Message.findById(messageId);
    
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns this message
    if (msg.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    msg.message = message;
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();

    // Emit via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(msg.conversationId).emit('message_edited', {
        messageId: msg._id,
        message: msg.message
      });
    }

    res.status(200).json({ message: msg });
  } catch (err) {
    console.error('Edit message error:', err);
    res.status(500).json({ message: 'Failed to edit message' });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const msg = await Message.findById(messageId);
    
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns this message
    if (msg.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    // Emit via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(msg.conversationId).emit('message_deleted', {
        messageId: msg._id
      });
    }

    res.status(200).json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

// Get conversation details (for starting a new chat)
exports.getConversationDetails = async (req, res) => {
  try {
    const { homeId } = req.params;
    const userId = req.userId;

    console.log('Getting conversation details for homeId:', homeId, 'userId:', userId);

    const home = await Home.findById(homeId).populate('userId', 'firstName lastName email');
    
    if (!home) {
      console.log('Home not found:', homeId);
      return res.status(404).json({ message: 'Home not found' });
    }

    const hostId = home.userId._id;
    
    // Don't allow messaging yourself
    if (hostId.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot message yourself' });
    }

    const conversationId = generateConversationId(userId, hostId, homeId);

    console.log('Conversation details:', {
      conversationId,
      host: home.userId,
      home: { _id: home._id, houseName: home.houseName }
    });

    res.status(200).json({
      conversationId,
      host: home.userId,
      home: {
        _id: home._id,
        houseName: home.houseName,
        photoUrl: home.photoUrl
      }
    });
  } catch (err) {
    console.error('Get conversation details error:', err);
    res.status(500).json({ message: 'Failed to load conversation details' });
  }
};

// Add this method to your existing chatController.js file

// Send a file message
exports.sendFile = async (req, res) => {
  try {
    const { receiverId, homeId } = req.body;
    const senderId = req.userId;
    const file = req.file;

    if (!receiverId || !homeId || !file) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const conversationId = generateConversationId(senderId, receiverId, homeId);

    // Determine file type
    let fileType = 'file';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype === 'application/pdf') {
      fileType = 'document';
    }

    // Create file URL (adjust based on your server setup)
    const fileUrl = `/uploads/chat-files/${file.filename}`;

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      homeId,
      message: file.originalname,
      type: fileType,
      fileUrl: fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    await newMessage.save();

    // Populate before sending back
    await newMessage.populate('senderId', 'firstName lastName email');
    await newMessage.populate('receiverId', 'firstName lastName email');
    await newMessage.populate('homeId', 'houseName photoUrl');

    // Emit via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', newMessage);
      io.to(`user_${receiverId}`).emit('notification', {
        type: 'new_message',
        message: newMessage
      });
    }

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Send file error:', err);
    res.status(500).json({ message: 'Failed to send file' });
  }
};

// Add this method to your existing chatController.js file
exports.sendFile = async (req, res) => {
  try {
    // Check if file was uploaded successfully by multer
    if (!req.file) {
      console.error('No file received by multer');
      return res.status(400).json({ 
        message: 'No file uploaded or file type not allowed',
        details: 'Please ensure the file is an image, PDF, or Word document under 5MB'
      });
    }

    const { receiverId, homeId } = req.body;
    const senderId = req.userId;
    const file = req.file;

    console.log('File upload attempt:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      receiverId,
      homeId
    });

    if (!receiverId || !homeId) {
      return res.status(400).json({ message: 'Missing receiverId or homeId' });
    }

    const conversationId = generateConversationId(senderId, receiverId, homeId);

    // Determine file type
    let fileType = 'file';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype === 'application/pdf') {
      fileType = 'document';
    }

    // Create file URL (adjust based on your server setup)
    const fileUrl = `/uploads/chat-files/${file.filename}`;

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      homeId,
      message: file.originalname,
      type: fileType,
      fileUrl: fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    await newMessage.save();

    // Populate before sending back
    await newMessage.populate('senderId', 'firstName lastName email');
    await newMessage.populate('receiverId', 'firstName lastName email');
    await newMessage.populate('homeId', 'houseName photoUrl');

    console.log('File message saved successfully:', newMessage._id);

    // Emit via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', newMessage);
      io.to(`user_${receiverId}`).emit('notification', {
        type: 'new_message',
        message: newMessage
      });
    }

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Send file error:', err);
    res.status(500).json({ 
      message: 'Failed to send file',
      error: err.message 
    });
  }
};