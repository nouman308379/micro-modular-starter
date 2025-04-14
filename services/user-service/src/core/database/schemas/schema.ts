import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  pgEnum,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

import { USER_ROLES } from "../../types/users.js";

export const userRoleEnum = pgEnum("role", USER_ROLES);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phoneNumber: text("phone_number"),
  password: text("password"),

  role: userRoleEnum("role").notNull(),

  status: boolean("is_active").default(true),
  title: text("title"),
  organizationName: text("organization_name"),

  isVerified: boolean("is_verified").default(false),

  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLoginAt: timestamp("last_failed_login_at"),

  isLocked: boolean("is_locked").default(false),
  lockedAt: timestamp("locked_at"),

  googleId: text("google_id"),
  linkedinId: text("linkedin_id"),
  microsoftId: text("microsoft_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  role: userRoleEnum("role").notNull(),

  invitedBy: integer("invited_by").references(() => users.id, {
    onDelete: "set null",
  }),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const failedEmails = pgTable("failed_emails", {
  id: serial("id").primaryKey(),

  email: text("email").notNull(),
  subject: text("subject").notNull(),
  error: text("error").notNull(),
  errorDetails: jsonb("error_details"),
  type: text("type"),

  attemptCount: integer("attempt_count").default(1),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
