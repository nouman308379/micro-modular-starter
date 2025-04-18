import { transporter } from "../config/nodemailer.config.js";

export async function sendEmail(
  email: string,
  subject: string,
  template: string
) {
  try {
    // Define the email options
    const mailOptions = {
      from: "DoNotReply@lobbyIQ.com",
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
