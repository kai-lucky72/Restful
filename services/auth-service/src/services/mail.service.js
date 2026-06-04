const nodemailer = require('nodemailer');
const { logger } = require('@fes/shared');
const config = require('../config');

let transporter;

function enabled() {
  return config.mail.mode === 'smtp';
}

function getTransporter() {
  if (!enabled()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: {
        user: config.mail.user,
        pass: config.mail.password,
      },
    });
  }
  return transporter;
}

function htmlLayout(title, body) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.6">
      <h2 style="color:#b91c1c;margin-bottom:8px">${title}</h2>
      ${body}
      <p style="margin-top:24px;color:#6b7280;font-size:13px">TZW Fire Safety</p>
    </div>
  `;
}

async function sendMail({ to, subject, text, html }) {
  if (!to) return;

  if (!enabled()) {
    logger.info('Email simulated', { to, subject });
    return;
  }

  if (!config.mail.host || !config.mail.user || !config.mail.password || !config.mail.from) {
    logger.warn('SMTP email skipped because configuration is incomplete', { to, subject });
    return;
  }

  try {
    await getTransporter().sendMail({
      from: config.mail.from,
      to,
      subject,
      text,
      html,
    });
    logger.info('Email sent', { to, subject });
  } catch (err) {
    logger.error('Email delivery failed', { to, subject, message: err.message });
  }
}

async function sendWelcomeEmail(user) {
  await sendMail({
    to: user.email,
    subject: 'Welcome to TZW Fire Safety',
    text: `Hello ${user.firstName}, your TZW Fire Safety account has been created. You can sign in at ${config.mail.frontendUrl}/login.`,
    html: htmlLayout(
      'Welcome to TZW Fire Safety',
      `<p>Hello ${user.firstName},</p>
       <p>Your account has been created successfully. You can now sign in and manage your fire-safety workspace.</p>
       <p><a href="${config.mail.frontendUrl}/login" style="color:#b91c1c;font-weight:700">Sign in to your account</a></p>`
    ),
  });
}

async function sendPasswordResetEmail(user, resetUrl) {
  await sendMail({
    to: user.email,
    subject: 'Reset your TZW Fire Safety password',
    text: `Use this link to reset your password. It expires in 15 minutes: ${resetUrl}`,
    html: htmlLayout(
      'Reset your password',
      `<p>Hello ${user.firstName},</p>
       <p>Use the secure link below to reset your password. It expires in 15 minutes.</p>
       <p><a href="${resetUrl}" style="color:#b91c1c;font-weight:700">Reset password</a></p>
       <p>If you did not request this, you can ignore this email.</p>`
    ),
  });
}

async function sendOtpEmail(user, code) {
  await sendMail({
    to: user.email,
    subject: 'Your TZW Fire Safety verification code',
    text: `Hello ${user.firstName}, your verification code is ${code}. It expires in 10 minutes.`,
    html: htmlLayout(
      'Verify your email',
      `<p>Hello ${user.firstName},</p>
       <p>Use the code below to verify your TZW Fire Safety account. It expires in 10 minutes.</p>
       <p style="font-size:30px;font-weight:800;letter-spacing:8px;color:#b91c1c;margin:16px 0">${code}</p>
       <p>If you did not create an account, you can safely ignore this email.</p>`
    ),
  });
}

async function sendPasswordChangedEmail(user) {
  await sendMail({
    to: user.email,
    subject: 'Your TZW Fire Safety password was changed',
    text: 'Your TZW Fire Safety password was changed successfully. If this was not you, contact an administrator immediately.',
    html: htmlLayout(
      'Password changed',
      `<p>Hello ${user.firstName},</p>
       <p>Your password was changed successfully. If this was not you, contact an administrator immediately.</p>`
    ),
  });
}

module.exports = { sendWelcomeEmail, sendOtpEmail, sendPasswordResetEmail, sendPasswordChangedEmail };
