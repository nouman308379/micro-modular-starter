import amqp from "amqplib";
import { sendEmail } from "../core/utils/email.util.js";

const RABBITMQ_URL = process.env.MESSAGE_BROKER_URL || "amqp://rabbitmq:5672";
const QUEUE_NAME = "email_queue";

async function consumeEmails() {
  let connected = false;
  while (!connected) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      console.log("Waiting for messages in", QUEUE_NAME);

      channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (msg) {
            const emailData = JSON.parse(msg.content.toString());
            const { email, subject, template } = emailData;

            try {
              await sendEmail(email, subject, template);
              console.log("Email sent successfully to:", email);
              channel.ack(msg);
            } catch (error) {
              console.error("Email sending failed:", error);
              channel.nack(msg);
            }
          }
        },
        { noAck: false }
      );

      connected = true;
    } catch (error) {
      console.error("RabbitMQ consumer error:", error);
      console.log("Retrying connection in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

consumeEmails();