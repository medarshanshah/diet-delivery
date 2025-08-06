import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to: string, message: string): Promise<void> => {
  try {
    // Format phone number for Nepal
    let formattedPhone = to;
    
    // Remove spaces and dashes
    formattedPhone = formattedPhone.replace(/[\s-]/g, '');
    
    // Add country code if not present
    if (!formattedPhone.startsWith('+977') && !formattedPhone.startsWith('977')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+977' + formattedPhone.substring(1);
      } else {
        formattedPhone = '+977' + formattedPhone;
      }
    } else if (formattedPhone.startsWith('977')) {
      formattedPhone = '+' + formattedPhone;
    }

    const messageBody = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`SMS sent successfully to ${formattedPhone}, SID: ${messageBody.sid}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
};

export const sendVerificationSMS = async (phone: string, otp: string): Promise<void> => {
  const message = `Your HealthyBites verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  await sendSMS(phone, message);
};

export const sendOrderStatusSMS = async (phone: string, orderNumber: string, status: string): Promise<void> => {
  let message = '';
  
  switch (status) {
    case 'confirmed':
      message = `Your HealthyBites order ${orderNumber} has been confirmed and is being prepared. Track your order on our app.`;
      break;
    case 'preparing':
      message = `Good news! Your order ${orderNumber} is being prepared by our chef. Estimated delivery time: 30-45 minutes.`;
      break;
    case 'out_for_delivery':
      message = `Your order ${orderNumber} is on the way! Our delivery partner will reach you shortly. Track live location on the app.`;
      break;
    case 'delivered':
      message = `Your order ${orderNumber} has been delivered! Enjoy your healthy meal. Rate your experience on the app.`;
      break;
    case 'cancelled':
      message = `Your order ${orderNumber} has been cancelled. If you have any questions, please contact our support team.`;
      break;
    default:
      message = `Your order ${orderNumber} status has been updated to: ${status}. Check the app for more details.`;
  }
  
  await sendSMS(phone, message);
};

export const sendDeliveryLocationSMS = async (
  phone: string, 
  orderNumber: string, 
  deliveryPersonName: string,
  deliveryPersonPhone: string
): Promise<void> => {
  const message = `Your HealthyBites order ${orderNumber} is out for delivery! Your delivery partner ${deliveryPersonName} (${deliveryPersonPhone}) will reach you soon. Track live location on the app.`;
  await sendSMS(phone, message);
};

export const sendConsultationReminderSMS = async (
  phone: string, 
  consultationTime: string,
  dietitianName: string
): Promise<void> => {
  const message = `Reminder: Your consultation with Dr. ${dietitianName} is scheduled at ${consultationTime}. Join through the HealthyBites app. Support: 01-4444444`;
  await sendSMS(phone, message);
};

export const sendPasswordResetSMS = async (phone: string, resetCode: string): Promise<void> => {
  const message = `Your HealthyBites password reset code is: ${resetCode}. Valid for 10 minutes. Do not share this code.`;
  await sendSMS(phone, message);
};

export const sendPromotionalSMS = async (phone: string, offer: string): Promise<void> => {
  const message = `🎉 Special offer from HealthyBites! ${offer} Order now through our app. Valid for limited time only. Reply STOP to unsubscribe.`;
  await sendSMS(phone, message);
};

export const sendSubscriptionReminderSMS = async (
  phone: string, 
  nextDeliveryDate: string,
  mealType: string
): Promise<void> => {
  const message = `Your ${mealType} subscription meal will be delivered tomorrow (${nextDeliveryDate}). Manage your subscription on the HealthyBites app.`;
  await sendSMS(phone, message);
};

export default {
  sendSMS,
  sendVerificationSMS,
  sendOrderStatusSMS,
  sendDeliveryLocationSMS,
  sendConsultationReminderSMS,
  sendPasswordResetSMS,
  sendPromotionalSMS,
  sendSubscriptionReminderSMS
};