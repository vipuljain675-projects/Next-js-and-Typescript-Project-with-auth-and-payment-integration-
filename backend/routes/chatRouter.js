// backend/routes/chatRouter.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');
const isAuth = require('../middleware/is-auth');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/chat-files/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File filter checking:', file.mimetype);
  
  // Accept images and documents
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDFs, and Word documents are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication
router.use(isAuth);

// GET /api/chat/conversations - Get all conversations for logged-in user
router.get('/conversations', chatController.getConversations);

// GET /api/chat/conversation-details/:homeId - Get conversation details for a home
router.get('/conversation-details/:homeId', chatController.getConversationDetails);

// GET /api/chat/messages/:conversationId - Get messages for a conversation
router.get('/messages/:conversationId', chatController.getMessages);

// POST /api/chat/send - Send a new message
router.post('/send', chatController.sendMessage);

// POST /api/chat/send-file - Send a file message with proper error handling
router.post('/send-file', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      
      // Handle specific multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File too large. Maximum size is 5MB.' 
        });
      }
      
      return res.status(400).json({ 
        message: `Upload error: ${err.message}` 
      });
    } else if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ 
        message: err.message || 'Invalid file upload' 
      });
    }
    
    // No error, proceed to controller
    next();
  });
}, chatController.sendFile);

// PUT /api/chat/messages/:messageId - Edit a message
router.put('/messages/:messageId', chatController.editMessage);

// DELETE /api/chat/messages/:messageId - Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

// POST /api/chat/mark-read - Mark messages as read
router.post('/mark-read', chatController.markAsRead);

module.exports = router;