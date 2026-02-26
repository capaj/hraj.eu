CREATE TABLE `core_group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `core_group_created_by_idx` ON `core_group` (`created_by`);
--> statement-breakpoint
CREATE UNIQUE INDEX `core_group_creator_name_idx` ON `core_group` (`created_by`,`name`);
--> statement-breakpoint
CREATE TABLE `core_group_member` (
	`id` text PRIMARY KEY NOT NULL,
	`core_group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`core_group_id`) REFERENCES `core_group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `core_group_user_idx` ON `core_group_member` (`core_group_id`,`user_id`);
--> statement-breakpoint
CREATE INDEX `core_group_member_user_idx` ON `core_group_member` (`user_id`);
--> statement-breakpoint
ALTER TABLE `event` ADD `core_group_id` text REFERENCES core_group(id) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `event` ADD `core_group_exclusive_until` integer;
--> statement-breakpoint
CREATE INDEX `core_group_idx` ON `event` (`core_group_id`);
