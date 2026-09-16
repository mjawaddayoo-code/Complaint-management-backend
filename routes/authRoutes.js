const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const SALT_ROUNDS = 10;

// ---------- Register ----------

router.post('/api/auth/register', asyncHandler(async (req, res) => {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';

    const errors = {};
    if (!name) errors.name = 'Full name is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errors).length === 0) {
        const existing = await User.findOne({ email });
        if (existing) errors.email = 'An account with this email already exists.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, password: hashedPassword });

    // Automatically log the new user in.
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
    res.status(201).json({ user: req.session.user });
}));

// ---------- Login ----------

router.post('/api/auth/login', asyncHandler(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const errors = {};
    if (!email) errors.email = 'Email is required.';
    if (!password) errors.password = 'Password is required.';
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }

    // Generic message on failure so we don't reveal whether the email exists.
    const genericError = 'Incorrect email or password.';
    const user = await User.findOne({ email });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
        return res.status(401).json({ errors: { general: genericError } });
    }

    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
    res.json({ user: req.session.user });
}));

// ---------- Logout ----------

router.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ ok: true });
    });
});

// ---------- Current session ----------

router.get('/api/auth/me', (req, res) => {
    res.json({ user: req.session.user || null });
});

module.exports = router;
