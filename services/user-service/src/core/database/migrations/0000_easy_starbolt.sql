CREATE TYPE "public"."role" AS ENUM('client', 'stakeHolder', 'legislator', 'staff');--> statement-breakpoint
CREATE TABLE "failed_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"error" text NOT NULL,
	"error_details" jsonb,
	"type" text,
	"attempt_count" integer DEFAULT 1,
	"last_attempt_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"role" "role" NOT NULL,
	"invited_by" integer,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"password" text,
	"role" "role" NOT NULL,
	"is_active" boolean DEFAULT true,
	"title" text,
	"organization_name" text,
	"is_verified" boolean DEFAULT false,
	"failed_login_attempts" integer DEFAULT 0,
	"last_failed_login_at" timestamp,
	"is_locked" boolean DEFAULT false,
	"locked_at" timestamp,
	"google_id" text,
	"linkedin_id" text,
	"microsoft_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;