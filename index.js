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

if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set. Add it to your .env file (see .env.example).');
    process.exit(1);
}

app.set('trust proxy', 1);

app.use(cors({
    origin: frontendUrl,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 4 // 4 hours
    }
}));

// ---------- Routes ----------

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});
app.get("/", (req, res) => {
  res.json({
    message: "Complaint Management API is running",
    status: "OK"
  });
});

app.use(authRoutes);
app.use(complaintRoutes);
app.use(adminRoutes);

// ---------- Error handling ----------

app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: isProduction ? 'Something went wrong.' : err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
