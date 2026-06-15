CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankCode` varchar(20) NOT NULL,
	`bankName` varchar(100) NOT NULL,
	`accountName` varchar(200) NOT NULL,
	`accountNumber` varchar(50) NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`note` text,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`phone` varchar(20),
	`lineId` varchar(100),
	`note` text,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int,
	`agentId` int,
	`title` varchar(300) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`category` varchar(100),
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`proofUrl` text,
	`proofKey` text,
	`dueDate` timestamp,
	`paidAt` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`telegramBotToken` text,
	`telegramChatId` varchar(100),
	`telegramEnabled` enum('yes','no') NOT NULL DEFAULT 'no',
	`notifyThreshold` decimal(5,2) DEFAULT '5.00',
	`soundEnabled` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `usdt_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`buyAmountThb` decimal(15,2) NOT NULL,
	`usdtReceived` decimal(15,4) NOT NULL,
	`sellRate` decimal(10,4) NOT NULL,
	`costPerUsdt` decimal(10,4) NOT NULL,
	`sellAmountThb` decimal(15,2) NOT NULL,
	`profitThb` decimal(15,2) NOT NULL,
	`profitPercent` decimal(8,4) NOT NULL,
	`isProfit` enum('yes','no') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usdt_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
