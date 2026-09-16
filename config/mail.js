const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_SECURE !== 'false',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// Verify the connection once at startup so misconfiguration shows up in the
// logs immediately instead of silently failing on the first complaint.
transporter.verify((err) => {
    if (err) {
        console.error('Mail transporter is not ready:', err.message);
    } else {
        console.log('Mail transporter is ready');
    }
});

/**
 * Sends the admin notification email for a newly-created complaint.
 * This function NEVER throws — callers should treat it as fire-and-forget
 * and always continue regardless of the outcome, since a complaint must
 * never be lost or blocked because of an email problem. It returns
 * { success, error } so the caller can log/record the result.
 */
async function sendComplaintNotification(complaint) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        const error = 'ADMIN_EMAIL is not configured';
        console.error('Email notification skipped:', error);
        return { success: false, error };
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to: adminEmail,
        replyTo: complaint.userEmail,
        subject: `New Complaint: ${complaint.subject}`,
        html: `
            <h2>New Complaint Submitted</h2>
            <p><strong>Complaint ID:</strong> ${complaint._id}</p>
            <p><strong>Submitted by:</strong> ${complaint.userName} (${complaint.userEmail})</p>
            <p><strong>Submitted at:</strong> ${complaint.createdAt.toLocaleString()}</p>
            <p><strong>Subject:</strong> ${complaint.subject}</p>
            <p><strong>Description:</strong></p>
            <p>${complaint.description}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, error: null };
    } catch (err) {
        console.error(`Failed to send admin notification for complaint ${complaint._id}:`, err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { transporter, sendComplaintNotification };
