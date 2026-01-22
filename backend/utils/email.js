const { Resend } = require('resend');

// This pulls the key we just put in your .env
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    await resend.emails.send({
      from: `Airbnb Clone <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error("Email error:", error);
  }
};

module.exports = sendEmail;