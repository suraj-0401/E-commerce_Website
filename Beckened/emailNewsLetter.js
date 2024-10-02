// Import required modules
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

// Create an Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Create a transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // For TLS
  secure: false, // Set to true if using port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates (not recommended for production)
  },
});

// Email sending route
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Set up email options
  const mailOptions = {
    from: 'shekharsuraj201@gmail.com', // Sender address
    to: email, // Recipient address
    subject: 'Recommended Products for You!',
    text: 'Here are some products we recommend for you...',
    html: '<p>Check out our <strong>latest products</strong> now!</p>', // Email content
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Subscription successful! Check your email for recommended products.' });
  });
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));