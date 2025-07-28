/**
 * contact.controller.js
 * @description :: exports authentication methods
 */

const { STATUS_CODE, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants/message.constant');

const { sendEmail } = require('../services/email');

/**
 * @description : Submit contact form
 * @param {Object} req : request including body for creating new document
 * @param {Object} res : response contains created document
 * @return {Object} : created document. {status, message, data}
 */
const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !subject || !message) {
         return { status: 0, message: 'Full name, email, subject, and message are required.', data: null };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { status: 0, message: 'Please provide a valid email address.', data: null };
    }

    // Prepare email data
    const emailData = {
      fullName,
      email,
      phone: phone || 'Not provided',
      subject,
      message,
      submittedAt: new Date().toLocaleString()
    };

    // Send email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@uvision.com',
      subject: `Contact Us Uvision : ${subject}`,
      template: '/views/contact-admin-notification',
      data: emailData
    });

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Thank you for contacting uVision - We\'ve received your message',
      template: '/views/contact-user-confirmation',
      data: emailData
    });

    return { status: 1, message: 'Thank you for your message! We\'ll get back to you soon.', data: null, submittedAt: emailData.submittedAt };

  } catch (error) {
    console.error('Contact form submission error:', error);
       return { status: 0, message: error.message || 'Failed to submit contact form', data: null };
  }
};

module.exports = {
  submitContactForm
};
