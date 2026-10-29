CREATE TABLE `fio_connection` (
	`user_id` text PRIMARY KEY NOT NULL,
	`encrypted_token` text,
	`token_fingerprint` text,
	`iban` text NOT NULL,
	`account_number` text NOT NULL,
	`currency` text NOT NULL,
	`last_synced_at` integer,
	`next_sync_at` integer DEFAULT (unixepoch()) NOT NULL,
	`sync_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fio_connection_token_fingerprint_unique` ON `fio_connection` (`token_fingerprint`);--> statement-breakpoint
CREATE TABLE `fio_receipt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`iban` text NOT NULL,
	`transaction_id` text NOT NULL,
	`payment_request_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`booked_on` text NOT NULL,
	FOREIGN KEY (`payment_request_id`) REFERENCES `payment_request`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fio_receipt_transaction_idx` ON `fio_receipt` (`iban`,`transaction_id`);--> statement-breakpoint
CREATE INDEX `fio_receipt_request_idx` ON `fio_receipt` (`payment_request_id`);--> statement-breakpoint
CREATE TABLE `payment_request` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_id` integer NOT NULL,
	`connection_id` text NOT NULL,
	`slot` integer NOT NULL,
	`player_name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`paid_at` integer,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `fio_connection`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_request_active_slot` ON `payment_request` (`participant_id`,`slot`) WHERE "payment_request"."cancelled_at" is null;--> statement-breakpoint
CREATE INDEX `payment_request_connection_idx` ON `payment_request` (`connection_id`);--> statement-breakpoint
ALTER TABLE `event` ADD `payment_mode` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `event` ADD `require_payment` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `event` ADD `price_per_person_cents` integer;--> statement-breakpoint
ALTER TABLE `event` ADD `fio_connection_id` text REFERENCES fio_connection(user_id);
