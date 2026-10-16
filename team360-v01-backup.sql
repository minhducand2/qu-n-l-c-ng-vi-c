PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE `records` (
	`key` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
CREATE INDEX `owner_kind_idx` ON `records` (`owner`,`kind`);