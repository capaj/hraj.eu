ALTER TABLE `event` ADD `url_slug` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `event`
SET `url_slug` = (
  CASE
    WHEN length(trim(`title`)) = 0 THEN 'event'
    ELSE lower(replace(trim(`title`), ' ', '-'))
  END
  || '-' || replace(`date`, '/', '-')
  || '-' || substr(`id`, 1, 6)
);--> statement-breakpoint
CREATE UNIQUE INDEX `event_url_slug_idx` ON `event` (`url_slug`);
