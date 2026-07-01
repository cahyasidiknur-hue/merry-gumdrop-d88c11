ALTER TABLE "transactions" ADD COLUMN "transfer_type" text DEFAULT 'internal';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "bank_code" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "method" text DEFAULT 'bifast';