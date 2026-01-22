const Stripe = require('stripe');
const Home = require('../models/home');
const Booking = require('../models/booking');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  try {
    const { homeId, checkIn, checkOut, adults, children, seniors } = req.body;
    const userId = req.userId; // From is-auth middleware

    const home = await Home.findById(homeId);
    if (!home) return res.status(404).json({ message: "Home not found" });

    // Calculate nights
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (nights < 1) return res.status(400).json({ message: "Invalid dates" });

    const totalAmount = home.price * nights;

    // Create a Pending Booking FIRST
    const booking = new Booking({
      homeId,
      userId,
      homeName: home.houseName,
      checkIn: start,
      checkOut: end,
      price: home.price,
      totalPrice: totalAmount,
      guests: { adults, children, seniors },
      status: 'Pending' // Will update to Confirmed after payment
    });

    await booking.save();

    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr', // Use 'usd' if international
            product_data: {
              name: home.houseName,
              description: `Reservation for ${nights} nights in ${home.location}`,
              images: home.photoUrl.slice(0, 1), // Send first image
            },
            unit_amount: home.price * 100, // Amount in smallest currency unit (paise/cents)
          },
          quantity: nights,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL_API || 'http://localhost:3000'}/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
      cancel_url: `${process.env.CLIENT_URL_API || 'http://localhost:3000'}/homes/${homeId}?error=payment_cancelled`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: userId.toString()
      }
    });

    res.status(200).json({ id: session.id, url: session.url });

  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Verify payment after redirect
exports.verifyPayment = async (req, res) => {
  try {
    const { session_id, booking_id } = req.body;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      await Booking.findByIdAndUpdate(booking_id, { status: 'Confirmed' });
      res.status(200).json({ message: "Payment successful" });
    } else {
      res.status(400).json({ message: "Payment not verified" });
    }
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};