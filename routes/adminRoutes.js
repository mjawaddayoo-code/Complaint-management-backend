const express = require('express');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const { requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const PAGE_SIZE = 10;

// ---------- Admin login ----------

router.post('/api/admin/login', (req, res) => {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
        console.error('ADMIN_PASSWORD is not configured in .env');
        return res.status(500).json({ error: 'Admin login is not configured. Contact the site owner.' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Incorrect admin password.' });
    }

    req.session.isAdmin = true;
    res.json({ isAdmin: true });
});

router.post('/api/admin/logout', (req, res) => {
    req.session.isAdmin = false;
    req.session.save(() => res.json({ ok: true }));
});

router.get('/api/admin/me', (req, res) => {
    res.json({ isAdmin: Boolean(req.session.isAdmin) });
});

// Every route below requires an authenticated admin session. Hitting any
// of these endpoints directly without logging in returns 401 — knowing the
// URL is never enough.
router.use('/api/admin', requireAdmin);

// ---------- Dashboard stats ----------

router.get('/api/admin/stats', asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [totalComplaints, complaintsToday, complaintsThisWeek, latestComplaint] = await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ createdAt: { $gte: startOfToday } }),
        Complaint.countDocuments({ createdAt: { $gte: startOfWeek } }),
        Complaint.findOne().sort({ createdAt: -1 })
    ]);

    res.json({ totalComplaints, complaintsToday, complaintsThisWeek, latestComplaint });
}));

// ---------- Complaints list ----------

router.get('/api/admin/complaints', asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const search = (req.query.search || '').trim();
    const from = req.query.from || '';
    const to = req.query.to || '';

    const filter = {};
    if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ userName: regex }, { userEmail: regex }, { subject: regex }];
    }
    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00`);
        if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59`);
    }

    const totalCount = await Complaint.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);

    const complaints = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE);

    res.json({ complaints, totalCount, totalPages, currentPage, search, from, to });
}));

// ---------- Complaint details ----------

router.get('/api/admin/complaints/:id', asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found.' });
    }

    res.json({ complaint });
}));

module.exports = router;
