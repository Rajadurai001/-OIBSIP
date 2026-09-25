const nodemailer = require('nodemailer');

// Single shared transporter built from SMTP creds in .env.
// Works out of the box with a free https://ethereal.email test inbox,
// or swap in real SMTP (SendGrid, Gmail app password, SES, etc.) for production.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pizza Hub <no-reply@pizzahub.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    // Email failures should never crash the request that triggered them -
    // log and move on (e.g. registration should still succeed even if the
    // verification email bounces because SMTP creds aren't configured yet).
    console.error(`Failed to send email to ${to}:`, err.message);
    return null;
  }
};

module.exports = sendEmail;
