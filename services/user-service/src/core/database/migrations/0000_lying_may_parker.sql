CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone_number" text,
	"password" text,
	"title" text,
	"organization_name" text,
	"verificationCode" text,
	"is_verified" boolean DEFAULT false,
	"google_id" text,
	"linkedin_id" text,
	"microsoft_id" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
