CREATE TABLE `account_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`orderAmount` decimal(15,2) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`telegramGroup` varchar(200),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL,
	`riskType` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`isRead` enum('yes','no') NOT NULL DEFAULT 'no',
	`telegramSent` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_alerts_id` PRIMARY KEY(`id`)
);
