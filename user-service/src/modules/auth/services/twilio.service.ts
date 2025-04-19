// services/TwilioService.ts
import twilio, { Twilio } from "twilio";
import logger from "../../../core/utils/logger.util.js";

export class TwilioService {
  private client: Twilio;
  private phoneNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || "";

    if (!accountSid || !authToken || !this.phoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSms(to: string, body: string): Promise<void> {
    try {
      await this.client.messages.create({
        body,
        to,
        from: this.phoneNumber,
      });
      logger.info(`SMS sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send SMS to ${to}`, error);
      throw new Error("Failed to send SMS");
    }
  }
}
