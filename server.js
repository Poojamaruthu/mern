
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:Ramram123@cluster0.7vmdf.mongodb.net/restaurent', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Create a Schema and Model for Reservations
const reservationSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    telephone: String,
    guests: Number,
    date: String,
    occasion: String,
    preferences: String,
    comments: String,
    time: String,
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Routes
// app.post('/reservations', async (req, res) => {
//     try {
//         const reservation = new Reservation(req.body);
//         await reservation.save();
//         res.status(201).json({ message: 'Reservation created successfully!' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to create reservation.' });
//     }
// });



// User Schema and Model
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
});

const User = mongoose.model('User', userSchema);

// Signup Route
app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, 'pooja', { expiresIn: '1h' });
        console.log(token)

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});


// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract token from header
    if (!token) {
        return res.status(403).json({ message: 'No token provided, access denied.' });
    }

    jwt.verify(token, 'pooja', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is not valid' });
        }
        req.user = decoded; // Store user data in request object
        next();
    });
};

//Protected Reservation Route
app.post('/reservations', authenticateJWT, async (req, res) => {
    try {
        const { firstName, lastName, telephone, guests, date, occasion, preferences, comments, time } = req.body;

        const reservation = new Reservation({
            firstName,
            lastName,
            email: req.user.email, // Associate the reservation with the logged-in user's email
            telephone,
            guests,
            date,
            occasion,
            preferences,
            comments,
            time,
        });

        await reservation.save();
        res.status(201).json({ message: 'Reservation created successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reservation.' });
    }
});

// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ error: 'User not found' });
//         }

//         // Compare passwords
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         // Generate JWT
//         const token = jwt.sign({ userId: user._id, email: user.email }, 'pooja', { expiresIn: '1h' });

//         res.status(200).json({ message: 'Login successful', token });
//     } catch (error) {
//         console.error('Login Error:', error);
//         res.status(500).json({ error: 'Error logging in' });
//     }
// });





// Feedback Schema & Model
const feedbackSchema = new mongoose.Schema({
    name: String,
    score: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// POST Route for Feedback
app.post('/feedback', async (req, res) => {
    try {
        const { name, score, comment } = req.body;
        const feedback = new Feedback({ name, score, comment });
        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback.' });
    }
});
// Start the Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


