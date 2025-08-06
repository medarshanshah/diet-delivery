import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendEmail = async (to: string, subject: string, html: string, text?: string): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions: EmailOptions = {
      to,
      subject,
      html,
      text: text || undefined
    };

    // Add from address
    const from = process.env.EMAIL_FROM || 'noreply@healthybites.com.np';

    await transporter.sendMail({
      from,
      ...mailOptions
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const subject = 'Welcome to HealthyBites!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to HealthyBites!</h1>
        <p style="color: white; margin: 10px 0;">Your journey to healthy eating starts here</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Hi ${name}!</h2>
        <p>Thank you for joining HealthyBites - Nepal's premier health-focused food delivery platform.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4CAF50; margin-top: 0;">What you can do with HealthyBites:</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li>🥗 Order nutritionist-approved healthy meals</li>
            <li>📱 Get personalized meal recommendations</li>
            <li>👨‍⚕️ Consult with certified dietitians</li>
            <li>📊 Track your nutrition and health goals</li>
            <li>🏥 Access specialized hospital meal plans</li>
            <li>💪 Join health challenges and earn rewards</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://healthybites.com.np/complete-profile" 
             style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Your Health Profile
          </a>
        </div>
        
        <p style="color: #666;">
          Complete your health profile to get personalized meal recommendations 
          based on your dietary preferences, health goals, and medical conditions.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Need help? Reply to this email or contact our support team at 
          <a href="mailto:support@healthybites.com.np">support@healthybites.com.np</a>
        </p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0;">Best regards,</p>
        <p style="margin: 5px 0; font-weight: bold;">The HealthyBites Team</p>
        <p style="margin: 10px 0; font-size: 12px; opacity: 0.8;">
          Kathmandu, Nepal | healthybites.com.np
        </p>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
};

export const sendOrderConfirmationEmail = async (
  email: string, 
  name: string, 
  orderNumber: string, 
  orderDetails: any
): Promise<void> => {
  const subject = `Order Confirmed - ${orderNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        <p style="color: white; margin: 10px 0;">Order #${orderNumber}</p>
      </div>
      
      <div style="padding: 30px;">
        <h2>Hi ${name}!</h2>
        <p>Your order has been confirmed and is being prepared with care.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Order Details:</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery}</p>
          <p><strong>Total Amount:</strong> Rs. ${orderDetails.totalAmount}</p>
        </div>
        
        <p>You can track your order in real-time through our app or website.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://healthybites.com.np/track-order/${orderNumber}" 
             style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Track Your Order
          </a>
        </div>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string): Promise<void> => {
  const subject = 'Reset Your HealthyBites Password';
  const resetUrl = `https://healthybites.com.np/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email. 
          This link will expire in 1 hour for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
};

export const sendConsultationReminderEmail = async (
  email: string, 
  name: string, 
  consultationDetails: any
): Promise<void> => {
  const subject = 'Upcoming Dietitian Consultation Reminder';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px;">
        <h2 style="color: #4CAF50;">Consultation Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a friendly reminder about your upcoming consultation with our dietitian.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Consultation Details:</h3>
          <p><strong>Dietitian:</strong> ${consultationDetails.dietitianName}</p>
          <p><strong>Date & Time:</strong> ${consultationDetails.dateTime}</p>
          <p><strong>Type:</strong> ${consultationDetails.type}</p>
          <p><strong>Duration:</strong> ${consultationDetails.duration} minutes</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://healthybites.com.np/consultation/${consultationDetails.id}" 
             style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Join Consultation
          </a>
        </div>
        
        <p style="color: #666;">
          Please make sure you have a stable internet connection and your device is ready 15 minutes before the session.
        </p>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendConsultationReminderEmail
};