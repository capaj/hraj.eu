CREATE TABLE `organizer_block` (
	`id` integer PRIMARY KEY NOT NULL,
	`organizer_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organizer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizer_block_pair_idx` ON `organizer_block` (`organizer_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `organizer_block_user_idx` ON `organizer_block` (`user_id`);
