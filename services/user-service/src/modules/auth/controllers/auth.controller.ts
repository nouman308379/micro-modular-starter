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
      await publishToQueue({
        email,
        subject: "Verify Your Email Address",
        templateData: { verificationCode, firstName, lastName },
      });

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

      if (!user) {
        return successResponse(res, 401, "Invalid email or password");
      }

      if (user.isVerified == false) {
        return successResponse(res, 401, "Verify your email first");
      }

      if (user.status == false) {
        return successResponse(res, 401, "Account is Blocked By Admin");
      }

      if (
        user.failedLoginAttempts &&
        user.failedLoginAttempts > 5 &&
        user.lastFailedLoginAt &&
        user.lastFailedLoginAt.getTime() < Date.now() + 15 * 60 * 1000
      ) {
        return successResponse(
          res,
          403,
          "Account is locked. Please try again later."
        );
      }

      const isPasswordValid =
        user.password && (await bcrypt.compare(password, user.password));

      console.log("isPasswordValid", isPasswordValid);

      if (!isPasswordValid) {
        // Update failed login attempts
        const updatedFailedAttempts = (user.failedLoginAttempts || 0) + 1;
        const lastFailedLoginAt = new Date();

        await db
          .update(users)
          .set({
            failedLoginAttempts: updatedFailedAttempts,
            lastFailedLoginAt: lastFailedLoginAt,
          })
          .where(eq(users.id, user.id));

        return successResponse(res, 401, "Invalid email or password");
      }

      if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
        await db
          .update(users)
          .set({
            failedLoginAttempts: 0,
            lastFailedLoginAt: null,
          })
          .where(eq(users.id, user.id));
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
        .innerJoin(
          verificationCodes,
          and(
            eq(users.id, verificationCodes.userId),
            eq(verificationCodes.code, verificationCode)
          )
        )
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return successResponse(res, 400, "Invalid verification code or email");
      }

      if (user.verification_codes.expiresAt < new Date()) {
        return successResponse(res, 400, "Verification code has been expired");
      }

      await db
        .update(verificationCodes)
        .set({
          used: true,
          expiresAt: new Date(0),
        })
        .where(eq(verificationCodes.id, user.verification_codes.id));

      await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, user.users.id));

      const token = jwt.sign(
        { id: user.users.id },
        process.env.JWT_SECRET as string,
        { expiresIn: parseInt(process.env.JWT_EXPIRATION_TIME as string, 10) }
      );

      return successResponse(res, 200, "Email verified successfully", {
        token,
        user: {
          id: user.users.id,
          email: user.users.email,
          isVerified: true,
        },
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
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

      const resetUrl = `https://localhsot:3000/reset-password?token=${token}`;

      await publishToQueue({
        email,
        subject: "Verify Your Email Address",
        templateData: { user: `${user.firstName} ${user.lastName}`, resetUrl },
      });
      const templatePath = "../templates/forgot-email.ejs";
      const template = await ejs.renderFile(templatePath, {
        data: {
          email,
        },
      });
      console.log("template", template);
      // await sendEmail(email, "Reset Your Password", template);

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
