CREATE TABLE `gameSessions` (
	`id` varchar(64) NOT NULL,
	`creatorId` int NOT NULL,
	`gameMode` enum('1v1','2v2','freeplay') NOT NULL DEFAULT 'freeplay',
	`viewMode` enum('normal','noMoving','noZoom') NOT NULL DEFAULT 'normal',
	`maxPlayers` int NOT NULL DEFAULT 2,
	`currentPlayers` int NOT NULL DEFAULT 1,
	`status` enum('waiting','playing','finished') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`finishedAt` timestamp,
	CONSTRAINT `gameSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roundResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`roundNumber` int NOT NULL,
	`guessLat` varchar(32),
	`guessLng` varchar(32),
	`actualLat` varchar(32) NOT NULL,
	`actualLng` varchar(32) NOT NULL,
	`distanceKm` int,
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roundResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionPlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`team` enum('team1','team2','solo') NOT NULL DEFAULT 'solo',
	`score` int NOT NULL DEFAULT 0,
	`roundsCompleted` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessionPlayers_id` PRIMARY KEY(`id`)
);
