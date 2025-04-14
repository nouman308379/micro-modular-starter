import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

import { USER_ROLES } from "../../../modules/auth/types/users.js";

export const userRoleEnum = pgEnum("role", USER_ROLES);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  phoneNumber: text("phone_number"),
  password: text("password"),


  
  role: userRoleEnum("role"),

  isActive: boolean("is_active").default(true),
  title: text("title"),
  organizationName: text("organization_name"),
  verificationCode: text("verification_code"),
  isVerified: boolean("is_verified").default(false),

  googleId: text("google_id"),
  linkedinId: text("linkedin_id"),
  microsoftId: text("microsoft_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
