CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`title` text NOT NULL,
	`price` integer NOT NULL,
	`reservation` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_items_reservation_unique` ON `order_items` (`reservation`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`delivery` text NOT NULL,
	`notes` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`size` text NOT NULL,
	`condition` text NOT NULL,
	`price` integer NOT NULL,
	`images` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`created` text NOT NULL
);
