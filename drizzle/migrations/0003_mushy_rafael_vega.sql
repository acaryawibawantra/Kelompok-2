CREATE TABLE `attendance_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_shares_token_unique` ON `attendance_shares` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_share_user_week` ON `attendance_shares` (`user_id`,`week_start`);