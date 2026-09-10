/**
 * Gmail SMTP email sender via nodemailer.
 *
 * Required env vars:
 *   GMAIL_USER       — your Gmail address e.g. yourname@gmail.com
 *   GMAIL_APP_PASSWORD — Gmail App Password (not your regular password)
 *
 * How to get a Gmail App Password:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to myaccount.google.com → Security → App passwords
 *   3. Create one for "Mail" → copy the 16-char password
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require("nodemailer");

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

// Lazy transporter — created on first use so missing env vars don't crash at import time
let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: `"ConvertIt" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
