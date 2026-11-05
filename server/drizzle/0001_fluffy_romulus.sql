CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
ALTER TABLE `focus_sessions` ADD `user_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `habits` ADD `user_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `memos` ADD `user_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `pomodoros` ADD `user_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `todos` ADD `user_id` text DEFAULT '' NOT NULL;