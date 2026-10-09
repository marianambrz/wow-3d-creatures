CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'tutor' NOT NULL,
	"council_number" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_role_check" CHECK ("role" in ('tutor', 'veterinarian'))
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "animal" (
	"id" text PRIMARY KEY NOT NULL,
	"tutor_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"tutor_name" text DEFAULT '' NOT NULL,
	"animal_name" text DEFAULT '' NOT NULL,
	"animal_age" text DEFAULT '' NOT NULL,
	"species" text DEFAULT 'dog' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "animal_tutor_id_unique" UNIQUE("tutor_id"),
	CONSTRAINT "animal_species_check" CHECK ("species" in ('dog', 'cat', 'bird', 'rabbit', 'guinea-pig', 'horse', 'hamster'))
);
--> statement-breakpoint
CREATE TABLE "diary_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"animal_id" text NOT NULL REFERENCES "animal"("id") ON DELETE CASCADE,
	"activity" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaccination" (
	"id" text PRIMARY KEY NOT NULL,
	"animal_id" text NOT NULL REFERENCES "animal"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"next_dose" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "diary_entry_animal_created_at_idx" ON "diary_entry" USING btree ("animal_id", "created_at");
--> statement-breakpoint
CREATE INDEX "vaccination_animal_date_idx" ON "vaccination" USING btree ("animal_id", "date");
