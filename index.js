
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

require('./db');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.set('trust proxy', 1);

app.use(cors({
    origin: frontendUrl,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 4
    }
}));

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Complaint Management API is running'
    });
});

// API Routes
app.use(authRoutes);
app.use(complaintRoutes);
app.use(adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API route not found',
        path: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// Local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`API running on port ${PORT}`);
    });
}

// Vercel serverless export
module.exports = app;
