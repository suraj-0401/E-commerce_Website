const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Set the JWT secret key
const jwtSecret = '123';
const tokenBlacklist = new Set(); // Token blacklist for invalidating tokens

// Initialize Express
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());

// Connect to MongoDB Atlas
const mongoURI = 'mongodb+srv://admin:root@cluster0.jpvch.mongodb.net/user';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

// Define a user model
const userSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { fName, lName, email, password, cPassword } = req.body;

    if (!fName || !lName || !email || !password || !cPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    if (password !== cPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fName,
      lName,
      email,
      password: hashedPassword,
    });

    await user.save();

    return res.status(200).json({
      message: 'Signup successful!',
      data: {
        fName,
        lName,
        email,
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from header
    if (token) {
      tokenBlacklist.add(token); // Add token to blacklist
      return res.status(200).json({ message: 'Logged out successfully!' });
    } else {
      return res.status(400).json({ message: 'Token is required.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Middleware to check token validity
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
  next();
});

// Listen on port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error(`Error starting server: ${error.message}`);
});
