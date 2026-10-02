CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`minutes` integer NOT NULL,
	`date` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`freq` text NOT NULL,
	`records` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pomodoros` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`minutes` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`done` integer DEFAULT 0 NOT NULL
);
