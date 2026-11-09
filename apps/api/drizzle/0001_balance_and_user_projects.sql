CREATE TABLE `availability_ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`days` integer NOT NULL,
	`reference_date` text NOT NULL,
	`reference_year` integer,
	`note` text,
	`created_by_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "availability_ledger_entries_type_check" CHECK(type in ('ACCRUAL', 'GRANT', 'SALE')),
	CONSTRAINT "availability_ledger_entries_days_check" CHECK(days > 0),
	CONSTRAINT "availability_ledger_entries_note_check" CHECK(type = 'ACCRUAL' or note is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `availability_ledger_entries_accrual_key` ON `availability_ledger_entries` (`user_id`,`type`,`reference_year`) WHERE type = 'ACCRUAL';--> statement-breakpoint
CREATE INDEX `availability_ledger_entries_user_id_reference_date_idx` ON `availability_ledger_entries` (`user_id`,`reference_date`);--> statement-breakpoint
CREATE TABLE `user_projects` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_projects_project_id_idx` ON `user_projects` (`project_id`);--> statement-breakpoint
ALTER TABLE `availability_settings` ADD `days_per_year` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `communications` ADD `deducted_days` integer;--> statement-breakpoint
CREATE INDEX `communications_author_id_status_idx` ON `communications` (`author_id`,`status`);--> statement-breakpoint
ALTER TABLE `users` ADD `credit_base_date` text;--> statement-breakpoint
INSERT INTO `user_projects` (`user_id`, `project_id`) SELECT `id`, `project_id` FROM `users` WHERE `project_id` IS NOT NULL;
