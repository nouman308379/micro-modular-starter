import { Request, Response } from "express";
import {
  successResponse,
  failureResponse,
} from "../../../core/utils/responses.utils.js";
import db from "../../../core/database/index.js";
import { users } from "../../../core/database/schemas/schema.js";

import { eq } from "drizzle-orm";
import ejs from "ejs";
import { generateVerificationCode } from "../../../core/utils/auth.util.js";

import { publishToQueue } from "../../../core/utils/rabbitmq.util.js";

class UserController {
  async inviteCompanyUser(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, status, role } = req.body;

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return failureResponse(res, 400, "User already exists");
      }

      const verificationCode = generateVerificationCode(6);
      
      const [newUser] = await db
        .insert(users)
        .values({
          firstName,
          lastName,
          email,
          status,
          role,
          isVerified: false,
        })
        .returning();

      const subject = "Invitation To Register";
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
}

export default new UserController();
