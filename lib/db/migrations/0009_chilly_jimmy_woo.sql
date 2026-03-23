CREATE TABLE IF NOT EXISTS "Subscriber" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"agreedToTos" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "Subscriber_email_unique" UNIQUE("email")
);
