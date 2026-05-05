const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};


const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"LocalServe" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your OTP for Email Verification - LocalServe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">🔐</div>
            <h2 style="color: #4F46E5;">Email Verification</h2>
          </div>
          <p>Hello,</p>
          <p>Thank you for registering with <strong>LocalServe</strong>!</p>
          <p>Please use the following OTP to verify your email address:</p>
          <div style="font-size: 36px; font-weight: bold; color: #4F46E5; background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #6B7280;">This OTP is valid for <strong>5 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">LocalServe - Your Local Service Marketplace</p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};

const sendBookingNotificationToProvider = async (providerEmail, providerName, bookingDetails) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"LocalServe" <${process.env.EMAIL_USER}>`,
      to: providerEmail,
      subject: '📅 New Service Booking Received!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">📅</div>
            <h2 style="color: #4F46E5;">New Booking Request</h2>
          </div>
          <p>Hello <strong>${providerName}</strong>,</p>
          <p>You have received a new service booking request. Please log in to your provider dashboard to accept or decline.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details:</h3>
            <p><strong>Service:</strong> ${bookingDetails.serviceTitle}</p>
            <p><strong>Customer:</strong> ${bookingDetails.customerName} (${bookingDetails.customerEmail})</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            <p><strong>Address:</strong> ${bookingDetails.address}</p>
            <p><strong>Total Amount:</strong> ₹${bookingDetails.totalAmount}</p>
            ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
          </div>
          <a href="${process.env.FRONTEND_URL}/provider/bookings" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View My Bookings</a>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">LocalServe - Your Local Service Marketplace</p>
        </div>
      `,
    });
    console.log(`✅ Booking notification sent to provider ${providerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send booking notification:', error);
    return false;
  }
};

const sendBookingAcceptanceToProvider = async (providerEmail, providerName, bookingDetails) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"LocalServe" <${process.env.EMAIL_USER}>`,
      to: providerEmail,
      subject: '✅ You Accepted a Booking - LocalServe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">✅</div>
            <h2 style="color: #4F46E5;">Booking Accepted Successfully</h2>
          </div>
          <p>Hello <strong>${providerName}</strong>,</p>
          <p>You have successfully <strong>accepted</strong> a booking request. Here are the details:</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details:</h3>
            <p><strong>Service:</strong> ${bookingDetails.serviceTitle}</p>
            <p><strong>Customer:</strong> ${bookingDetails.customerName} (${bookingDetails.customerEmail})</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            <p><strong>Address:</strong> ${bookingDetails.address}</p>
            <p><strong>Total Amount:</strong> ₹${bookingDetails.totalAmount}</p>
          </div>
          <p>Please ensure you are available at the scheduled time. You can contact the customer if needed.</p>
          <a href="${process.env.FRONTEND_URL}/provider/bookings" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Bookings</a>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">LocalServe - Your Local Service Marketplace</p>
        </div>
      `,
    });
    console.log(`✅ Booking acceptance confirmation sent to provider ${providerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send acceptance email to provider:', error);
    return false;
  }
};

const sendBookingAcceptedToUser = async (userEmail, userName, bookingDetails) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"LocalServe" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '✅ Your Booking Has Been Accepted!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">✅</div>
            <h2 style="color: #4F46E5;">Booking Accepted!</h2>
          </div>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Great news! Your booking has been <strong>accepted</strong> by the service provider.</p>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details:</h3>
            <p><strong>Service:</strong> ${bookingDetails.serviceTitle}</p>
            <p><strong>Provider:</strong> ${bookingDetails.providerName}</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            <p><strong>Address:</strong> ${bookingDetails.address}</p>
            <p><strong>Total Amount:</strong> ₹${bookingDetails.totalAmount}</p>
          </div>
          <p>The provider will now prepare for your service. You can track the status in your dashboard.</p>
          <a href="${process.env.FRONTEND_URL}/user/my-bookings" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View My Bookings</a>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">LocalServe - Your Local Service Marketplace</p>
        </div>
      `,
    });
    console.log(`✅ Booking accepted notification sent to user ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send acceptance email to user:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendBookingNotificationToProvider,
  sendBookingAcceptanceToProvider,
  sendBookingAcceptedToUser,
};