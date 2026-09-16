const express = require('express');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const { requireAuth } = require('../middleware/auth');
const { sendComplaintNotification } = require('../config/mail');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/api/complaints', requireAuth, asyncHandler(async (req, res) => {
    const subject = (req.body.subject || '').trim();
    const description = (req.body.description || '').trim();

    const errors = {};
    if (!subject) errors.subject = 'Subject is required.';
    if (!description) errors.description = 'Description is required.';
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }

    // User identity comes ONLY from the authenticated session — never from
    // a client-supplied field.
    const { id: userId, name: userName, email: userEmail } = req.session.user;

    // STEP 1: save to MongoDB first. The complaint exists as soon as this
    // resolves, regardless of what happens with email next.
    const complaint = await Complaint.create({ userId, userName, userEmail, subject, description });

    // STEP 2: attempt the admin email AFTER the save. A failure here is
    // logged on the complaint itself but never returned as an error to the
    // client and never rolls back the save.
    try {
        const result = await sendComplaintNotification(complaint);
        complaint.emailSent = result.success;
        complaint.emailError = result.success ? null : result.error;
        await complaint.save();
    } catch (err) {
        console.error('Unexpected error while notifying admin:', err.message);
    }

    res.status(201).json({ complaint });
}));

router.get('/api/complaints/:id', requireAuth, asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = await Complaint.findOne({
        _id: req.params.id,
        userId: req.session.user.id
    });

    if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
    }

    res.json({ complaint });
}));

module.exports = router;
