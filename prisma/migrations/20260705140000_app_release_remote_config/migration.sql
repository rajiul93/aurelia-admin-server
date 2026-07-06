ALTER TABLE "AppReleaseConfig"
ADD COLUMN "remoteConfigVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maintenanceMessage" TEXT,
ADD COLUMN "enableOfflineChat" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "enableGpsNavigation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "enableVoiceGuidance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "maxDownloadSizeMb" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN "maxChatHistory" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "supportedLanguages" JSONB NOT NULL DEFAULT '["en","es","fr"]',
ADD COLUMN "emergencyAnnouncement" TEXT;
