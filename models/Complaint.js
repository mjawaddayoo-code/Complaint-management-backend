const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    // Reference to the User document — kept alongside the snapshot fields
    // below so a complaint's history stays intact even if the user's
    // profile (name/email) changes later.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Tracks whether the admin notification email went out, purely so the
    // admin-facing details page can show accurate delivery status. This is
    // never shown to the submitting user and never affects whether the
    // complaint itself was saved.
    emailSent: {
        type: Boolean,
        default: false
    },
    emailError: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('Complaint', complaintSchema);
