CREATE TABLE `pinned_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`telegramGroup` varchar(200) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`receivedAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
	`note` text,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pinned_accounts_id` PRIMARY KEY(`id`)
);
