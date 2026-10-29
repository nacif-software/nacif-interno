CREATE TABLE `approval_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`approver_id` text NOT NULL,
	`created_at` text NOT NULL,
	`undoable_until` text NOT NULL,
	`undone_at` text,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `availability_default_approvers` (
	`settings_id` integer DEFAULT 1 NOT NULL,
	`user_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`settings_id`, `user_id`),
	FOREIGN KEY (`settings_id`) REFERENCES `availability_settings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `availability_default_approvers_user_id_key` ON `availability_default_approvers` (`user_id`);--> statement-breakpoint
CREATE TABLE `availability_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`min_notice_days` integer DEFAULT 7 NOT NULL,
	`max_simultaneous_per_project` integer DEFAULT 2 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `communication_counters` (
	`year` integer PRIMARY KEY NOT NULL,
	`last_sequence` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `communications` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`year` integer NOT NULL,
	`sequence` integer NOT NULL,
	`author_id` text NOT NULL,
	`project_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`business_days` integer NOT NULL,
	`cover_id` text NOT NULL,
	`approver_id` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'IN_REVIEW' NOT NULL,
	`submitted_at` text NOT NULL,
	`cancelled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cover_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "communications_status_check" CHECK(status in ('IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communications_code_key` ON `communications` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `communications_year_sequence_key` ON `communications` (`year`,`sequence`);--> statement-breakpoint
CREATE INDEX `communications_author_id_submitted_at_idx` ON `communications` (`author_id`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `communications_approver_id_status_submitted_at_idx` ON `communications` (`approver_id`,`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `communications_project_id_status_start_date_end_date_idx` ON `communications` (`project_id`,`status`,`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `communications_status_start_date_end_date_idx` ON `communications` (`status`,`start_date`,`end_date`);--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`communication_id` text NOT NULL,
	`type` text NOT NULL,
	`decider_id` text NOT NULL,
	`decided_at` text NOT NULL,
	`justification` text,
	`batch_id` text,
	`reverted_at` text,
	FOREIGN KEY (`communication_id`) REFERENCES `communications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decider_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `approval_batches`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "decisions_type_check" CHECK(type in ('APPROVED', 'REJECTED'))
);
--> statement-breakpoint
CREATE INDEX `decisions_communication_id_decided_at_idx` ON `decisions` (`communication_id`,`decided_at`);--> statement-breakpoint
CREATE INDEX `decisions_batch_id_idx` ON `decisions` (`batch_id`);--> statement-breakpoint
CREATE TABLE `flow_events` (
	`id` text PRIMARY KEY NOT NULL,
	`communication_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_id` text,
	`occurred_at` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`communication_id`) REFERENCES `communications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "flow_events_type_check" CHECK(type in ('SUBMITTED', 'IN_REVIEW', 'DECISION', 'CANCELLED', 'EDITED', 'DECISION_REVERTED'))
);
--> statement-breakpoint
CREATE INDEX `flow_events_communication_id_occurred_at_idx` ON `flow_events` (`communication_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `password_setup_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_setup_tokens_token_hash_key` ON `password_setup_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `password_setup_tokens_user_id_idx` ON `password_setup_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`default_approver_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`default_approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_key` ON `projects` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`password_hash` text,
	`invited_at` text,
	`project_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "users_role_check" CHECK(role in ('MEMBER', 'APPROVER', 'ADMIN'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_project_id_idx` ON `users` (`project_id`);--> statement-breakpoint
CREATE INDEX `users_active_role_idx` ON `users` (`active`,`role`);