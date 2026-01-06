ALTER TABLE `event` ADD `url_slug` text;--> statement-breakpoint
UPDATE `event`
SET `url_slug` = (
  CASE
    WHEN length(trim(`title`)) = 0 THEN 'event'
    ELSE lower(replace(trim(`title`), ' ', '-'))
  END
  || '-' || replace(`date`, '/', '-')
  || '-' || substr(`id`, 1, 6)
);--> statement-breakpoint
ALTER TABLE `event` ALTER COLUMN `url_slug` TO `url_slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `event_url_slug_idx` ON `event` (`url_slug`);