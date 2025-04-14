import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
// Configure the transporter (e.g., for Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., "gmail", "outlook", etc.)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(
  email: string,
  subject: string,
  template: string
) {
  try {
    // Define the email options
    const mailOptions = {
      from: "DoNotReply@willard.com",
      to: email,
      subject: subject,
      html: template,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (e) {
    console.error("Email sending error:", e);
    throw e;
  }
}
