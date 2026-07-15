const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'emails.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Email sender representing Resend / Brevo / SMTP API.
 * Appends details to a local log file, and sends a real email if SMTP credentials are provided.
 */
const sendEmail = async ({ to, subject, html }) => {
  const timestamp = new Date().toISOString();
  
  // Regex to extract a 6-digit numeric OTP code from the HTML template
  const otpMatch = html.match(/>\s*(\d{6})\s*</) || html.match(/\b(\d{6})\b/);
  const otpCode = otpMatch ? otpMatch[1] : 'N/A';

  const emailLogEntry = `
========================================
TIMESTAMP: ${timestamp}
TO: ${to}
SUBJECT: ${subject}
OTP: ${otpCode}
BODY:
${html}
========================================
\n`;

  // Always log to local emails.log for developer convenience
  try {
    fs.appendFileSync(logFile, emailLogEntry, 'utf8');
  } catch (err) {
    console.error('Failed to write to mock email log file:', err);
  }

  // If SMTP configurations are specified in .env, send a real email!
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log(`[Email Service] Sending real email to ${to} via SMTP host ${process.env.SMTP_HOST}...`);
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"TextileWasteHub" <no-reply@textilewastehub.com>',
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Real email sent successfully! MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('[Email Service] Failed to send SMTP email:', error);
      // Fail gracefully so auth response is still sent
    }
  }

  console.log(`[Email Service] Mock email logged to server/logs/emails.log | Target: ${to} | Subject: ${subject}`);
  // Simulate external network delay
  return new Promise((resolve) => setTimeout(resolve, 300));
};

module.exports = {
  sendEmail,
};
