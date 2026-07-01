CREATE TYPE "fraud_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "transaction_status" AS ENUM('pending', 'success', 'failed', 'flagged');--> statement-breakpoint
CREATE TYPE "transaction_type" AS ENUM('transfer', 'qris', 'deposit', 'withdrawal');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"account_id" integer,
	"action" text NOT NULL,
	"detail" text DEFAULT '',
	"ip_address" text DEFAULT '',
	"user_agent" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY,
	"identity_user_id" text NOT NULL UNIQUE,
	"account_number" text NOT NULL UNIQUE,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '',
	"balance" bigint DEFAULT 1000000 NOT NULL,
	"pin" text DEFAULT '',
	"avatar_url" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fraud_alerts" (
	"id" serial PRIMARY KEY,
	"transaction_id" integer,
	"account_id" integer,
	"severity" "fraud_severity" NOT NULL,
	"reason" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY,
	"reference_id" text NOT NULL UNIQUE,
	"from_account_id" integer,
	"to_account_id" integer,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending'::"transaction_status" NOT NULL,
	"amount" bigint NOT NULL,
	"description" text DEFAULT '',
	"merchant_name" text DEFAULT '',
	"qris_code" text DEFAULT '',
	"fee" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_account_id_bank_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bank_accounts"("id");--> statement-breakpoint
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_transaction_id_transactions_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id");--> statement-breakpoint
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_account_id_bank_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bank_accounts"("id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_account_id_bank_accounts_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "bank_accounts"("id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_account_id_bank_accounts_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "bank_accounts"("id");