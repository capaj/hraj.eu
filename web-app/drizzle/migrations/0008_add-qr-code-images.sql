ALTER TABLE `event` ADD `qr_code_images` text;--> statement-breakpoint
UPDATE `event` SET `qr_code_images` = '[]' WHERE `qr_code_images` IS NULL;