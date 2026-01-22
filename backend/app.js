require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');

// Load Passport Config
require('./config/passport');

const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');
const chatRouter = require('./routes/chatRouter');
const setupSocket = require('./socket');

const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
const server = http.createServer(app);

// 🟢 CLEANED: Only allow Localhost and the variable from .env
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL_API // This allows you to update the URL in .env without changing code
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupSocket(io);
app.set('io', io);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 🟢 UPDATED CORS: stricter rules
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is explicitly allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // (Optional) Allow any Vercel preview deployment for convenience
    // If you want strict security, delete these 3 lines below:
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
       return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(passport.initialize());

// Routes
app.use('/api', authRouter);
app.use('/api', storeRouter);
app.use('/api/host', hostRouter);
app.use('/api/chat', chatRouter);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint Not Found', path: req.originalUrl });
});

// Error Handler
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  res.status(status).json({ message: message });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    const port = process.env.PORT || 3500;
    server.listen(port, () => {
      console.log(`🔥 API Server live on Atlas & running at port ${port}`);
      console.log(`✅ CORS Allowed Origins:`, allowedOrigins);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err);
  });