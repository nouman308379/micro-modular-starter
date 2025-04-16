import { Request, Response } from "express";
import {
  successResponse,
  failureResponse,
} from "../../../core/utils/responses.utils.js";
import db from "../../../core/database/index.js";
import jwt from "jsonwebtoken";
import {
  users,
  verificationCodes,
} from "../../../core/database/schemas/schema.js";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import ejs from "ejs";

import { generateVerificationCode } from "../../../core/utils/auth.util.js";
import twilio from "twilio";
import { publishToQueue } from "../../../core/utils/rabbitmq.util.js";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
class AuthController {
  async signUpUser(req: Request, res: Response): Promise<void> {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        title,
        organizationName,
      } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = generateVerificationCode(6);

      const [newUser] = await db
        .insert(users)
        .values({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phoneNumber,
          title,
          organizationName,
          role: "client",
          isVerified: false,
        })
        .returning();

      await db
        .insert(verificationCodes)
        .values({
          userId: newUser.id,
          code: verificationCode,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        })
        .returning();

      const subject = "Verify Your Email Address";
      const templatePath = "../templates/verify-email.ejs";
      const template = await ejs.renderFile(templatePath, {
        data: { subject, verificationCode, firstName, lastName },
      });

      await publishToQueue({ email, subject, template });

      return successResponse(res, 201, "User registered successfully", {
        user: newUser,
      });
    } catch (error: any) {
      console.error(`Signup failed: ${error.message}`);
      return failureResponse(res, 500, "Internal Server Error");
    }
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || !user.status || !user.isVerified) {
        return successResponse(res, 401, "Invalid email or password");
      }

      if (user.isLocked) {
        const lockedDuration = user.lockedAt
          ? Date.now() - new Date(user.lockedAt).getTime()
          : 0;
        if (lockedDuration < 5 * 60 * 1000) {
          return successResponse(
            res,
            403,
            "Account is locked. Please try again later."
          );
        } else {
          await db
            .update(users)
            .set({ isLocked: false, lockedAt: null })
            .where(eq(users.id, user.id));
        }
      }

      if (
        !user ||
        !user.password ||
        !(await bcrypt.compare(password, user.password))
      ) {
        return successResponse(res, 401, "Invalid email or password");
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET as string,
        {
          expiresIn: process.env.JWT_EXPIRATION_TIME as any,
        }
      );

      return successResponse(res, 200, "Login successful", { token });
    } catch (error: any) {
      console.error(`Login failed: ${error.message}`);
      return failureResponse(
        res,
        500,
        error.message || "Internal Server Error"
      );
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, verificationCode } = req.body;
      const [user] = await db
        .select()
        .from(users)
        .innerJoin(verificationCodes, eq(users.id, verificationCodes.userId))
        .where(
          and(
            eq(users.email, email),
            eq(verificationCodes.code, verificationCode)
          )
        )
        .limit(1);

      const token = jwt.sign(
        { id: user.users.id },
        process.env.JWT_SECRET as string,
        { expiresIn: parseInt(process.env.JWT_EXPIRATION_TIME as string, 10) }
      );

      return successResponse(res, 200, "Email verified successfully", {
        token,
      });
    } catch (error: any) {
      console.error(`Email verification failed: ${error.message}`);
      return failureResponse(res, 500, "Internal Server Error");
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!user) return failureResponse(res, 401, "Invalid email");

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: parseInt(process.env.JWT_EXPIRATION_TIME as string, 10) }
      );
      const resetUrl = `https://yourfrontendurl.com/reset-password?token=${token}`;
      const templatePath = "../templates/forgot-email.ejs";
      const template = await ejs.renderFile(templatePath, {
        data: {
          user: `${user.firstName} ${user.lastName}`,
          resetUrl,
          email,
        },
      });
      console.log("template", template);

      return successResponse(
        res,
        200,
        "Reset password email sent successfully"
      );
    } catch (error: any) {
      console.error(`Forgot password failed: ${error.message}`);
      return failureResponse(res, 500, "Internal Server Error");
    }
  }

  async setPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, newPassword, confirmPassword } = req.body;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!user) return failureResponse(res, 404, "User does not exist");
      if (confirmPassword && newPassword !== confirmPassword)
        return failureResponse(res, 400, "Passwords do not match");

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));
      return successResponse(
        res,
        200,
        "Password has been changed successfully"
      );
    } catch (error: any) {
      return failureResponse(res, 500, "Internal Server Error");
    }
  }

  async forgetEmail(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      await client.messages.create({
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: "This is the ship that made the Run in fourteen parsecs?",
      });
      return successResponse(res, 200, "SMS sent successfully");
    } catch (error: any) {
      return failureResponse(res, 500, "Error sending SMS");
    }
  }
}

export default new AuthController();
