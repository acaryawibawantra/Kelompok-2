CREATE TABLE `attendance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`schedule_id` text,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`course` text NOT NULL,
	`room` text,
	`photo` text,
	`note` text,
	`checked_in_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`) REFERENCES `class_schedules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_attendance_user_date` ON `attendance_records` (`user_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_attendance_session` ON `attendance_records` (`user_id`,`schedule_id`,`date`);