DROP INDEX "event_feedback_from_to_idx";--> statement-breakpoint
DROP INDEX "sport_date_idx";--> statement-breakpoint
DROP INDEX "organizer_idx";--> statement-breakpoint
DROP INDEX "venue_idx";--> statement-breakpoint
DROP INDEX "series_id_idx";--> statement-breakpoint
DROP INDEX "user_idx";--> statement-breakpoint
DROP INDEX "event_user_idx";--> statement-breakpoint
DROP INDEX "user_sport_idx";--> statement-breakpoint
DROP INDEX "city_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
UPDATE `event` SET "currency" = 'CZK'; --> statement-breakpoint
ALTER TABLE `event` ALTER COLUMN "currency" TO "currency" text NOT NULL DEFAULT 'CZK';--> statement-breakpoint
CREATE UNIQUE INDEX `event_feedback_from_to_idx` ON `event_feedback` (`event_id`,`from_user_id`,`to_user_id`);--> statement-breakpoint
CREATE INDEX `sport_date_idx` ON `event` (`sport`,`date`);--> statement-breakpoint
CREATE INDEX `organizer_idx` ON `event` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `venue_idx` ON `event` (`venue_id`);--> statement-breakpoint
CREATE INDEX `series_id_idx` ON `event` (`series_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notification` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_user_idx` ON `participant` (`event_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sport_idx` ON `user_skill` (`user_id`,`sport`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `venue` (`city`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);