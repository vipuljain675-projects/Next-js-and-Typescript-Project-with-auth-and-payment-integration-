🏡 Full-Stack Airbnb Clone
A production-ready vacation rental platform featuring real-time availability, secure payments, and instant messaging.

🔴 LIVE DEMO | ⚙️ BACKEND API

📖 About The Project
This is a fully functional full-stack web application designed to replicate core Airbnb features. It handles the complete user flow from browsing listings to booking a stay and processing payments.

Unlike simple UI clones, this project is logic-heavy, featuring a robust backend, complex state management, and third-party integrations for payments and authentication.

✨ Key Features
🔐 Authentication: Secure login/signup with JWT & Google OAuth (Passport.js).

💳 Payments: Fully integrated Stripe checkout (Test Mode) for secure transactions.

💬 Real-Time Chat: Instant messaging between Guests and Hosts using Socket.io.

🗺️ Interactive Maps: Dynamic location browsing with Leaflet Maps.

📅 Booking System: Smart date-picking with conflict detection (prevents double bookings).

🏠 Host Dashboard: Users can become hosts, add properties, and manage bookings.

☁️ Image Upload: Multi-image upload support.

🛠️ Tech Stack
Frontend
Next.js 14 (App Router)

TypeScript

Bootstrap (Responsive UI)

Redux / Context API (State Management)

Backend
Node.js

Express.js

Socket.io

Database & Services
MongoDB (Mongoose ODM)

Stripe API

Google Cloud Platform

Render (Backend Hosting) & Vercel (Frontend Hosting)

🚀 Getting Started Locally
Follow these steps to run the project on your local machine.

1. Clone the Repository
Bash
git clone https://github.com/vipuljain675/airbnb-clone-v2.git
cd airbnb-clone-v2
2. Install Dependencies
You need to install packages for both the frontend and backend.

Bash
# Install Backend Deps
cd backend
npm install

# Install Frontend Deps
cd ../frontend
npm install
3. Configure Environment Variables
Create a .env file in both the frontend and backend folders.

Backend .env:

Code snippet
PORT=3500
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
Frontend .env:

Code snippet
NEXT_PUBLIC_API_URL=http://localhost:3500/api
4. Run the App
Open two terminal tabs:

Terminal 1 (Backend):

Bash
cd backend
npm start
# Server runs on port 3500
Terminal 2 (Frontend):

Bash
cd frontend
npm run dev
# App runs on http://localhost:3000
