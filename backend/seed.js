require('dotenv').config();
const mongoose = require("mongoose");
const Home = require("./models/home");
const User = require("./models/user");

// 🔴 ENSURE THIS MATCHES YOUR MONGO URL
const MONGODB_URI = process.env.MONGODB_URI;

// 1. DATA SOURCES
const locations = [
  "Goa, India", "Manali, Himachal Pradesh", "Kerala, India", 
  "Mumbai, Maharashtra", "Delhi, India", "Jaipur, Rajasthan",
  "Udaipur, Rajasthan", "Bangalore, Karnataka", "Pune, Maharashtra",
  "Chennai, Tamil Nadu", "Pondicherry, India", "Rishikesh, Uttarakhand",
  "Dubai, UAE", "London, UK", "Bali, Indonesia", "Paris, France", 
  "New York, USA", "Tokyo, Japan", "Santorini, Greece", "Maldives"
];

const homeTypes = [
  "Villa", "Apartment", "Cottage", "Loft", "Bungalow", 
  "Penthouse", "Studio", "Farmhouse", "Cabin", "Mansion"
];

const adjectives = [
  "Luxury", "Cozy", "Modern", "Seaside", "Hidden", "Vintage", 
  "Charming", "Spacious", "Private", "Romantic", "Urban", "Rustic"
];

// 2. GUARANTEED WORKING IMAGES (High Res Architecture)
const imageUrls = [
  "https://images.unsplash.com/photo-1600596542815-2a4d04774c13?q=80&w=800&auto=format&fit=crop", // Luxury Villa
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop", // Modern House
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop", // White Villa
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800&auto=format&fit=crop", // Cozy House
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", // Balcony view
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?q=80&w=800&auto=format&fit=crop", // Living Room
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=800&auto=format&fit=crop", // Modern Interior
  "https://images.unsplash.com/photo-1598228723793-52759bba239c?q=80&w=800&auto=format&fit=crop", // Bedroom
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop", // Cottage
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=800&auto=format&fit=crop", // Backyard
  "https://images.unsplash.com/photo-1513584685908-7636e32cd7c9?q=80&w=800&auto=format&fit=crop", // Pink Apt
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop", // Loft
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800&auto=format&fit=crop", // Colorful Room
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800&auto=format&fit=crop", // Cabin
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=800&auto=format&fit=crop", // Kitchen
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop", // Pool
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800&auto=format&fit=crop", // Stairs
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop", // Grey Modern
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=800&auto=format&fit=crop", // Glass House
  "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=800&auto=format&fit=crop"  // Wood House
];

// Helper Function
const sample = (array) => array[Math.floor(Math.random() * array.length)];
const amenitiesList = ["Wifi", "AC", "Pool", "TV", "Kitchen", "Gym", "Parking", "Jacuzzi"];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🔥 Connected to DB");

    // 1. Get Host ID
    let hostUser = await User.findOne();
    if (!hostUser) {
        console.log("No users found. Creating dummy host...");
        hostUser = new User({
            firstName: "Super",
            lastName: "Host",
            email: "host@airbnb.com",
            password: "hashedpassword123",
            userType: "host"
        });
        await hostUser.save();
    }
    console.log(`👤 Using host: ${hostUser.firstName}`);

    // 2. Clean DB
    await Home.deleteMany({});
    console.log("🧹 Cleared old homes");

    // 3. Generate 100 Listings
    const homes = [];
    for (let i = 0; i < 100; i++) {
        const location = sample(locations);
        const adj = sample(adjectives);
        const type = sample(homeTypes);
        const price = Math.floor(Math.random() * 20000) + 1500; 
        const rating = (Math.random() * (5 - 3.5) + 3.5).toFixed(2); // Two decimal rating
        
        // Cycle through reliable images
        const coverImage = imageUrls[i % imageUrls.length];

        homes.push({
            houseName: `${adj} ${type} in ${location.split(',')[0]}`,
            price: price,
            location: location,
            description: `Escape to this ${adj.toLowerCase()} ${type.toLowerCase()} located in the heart of ${location}. Enjoy breathtaking views, modern amenities, and a truly relaxing atmosphere. Perfect for vacations and workations.`,
            photoUrl: [coverImage], 
            rating: rating,
            amenities: amenitiesList.sort(() => 0.5 - Math.random()).slice(0, 4),
            userId: hostUser._id,
            availableFrom: new Date(),
            availableTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });
    }

    await Home.insertMany(homes);
    console.log(`✅ Successfully seeded ${homes.length} listings with WORKING images!`);

    mongoose.connection.close();
    console.log("👋 Connection closed");

  } catch (err) {
    console.log("❌ Error:", err);
  }
};

seedDB();