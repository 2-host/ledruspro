-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_providers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "city" TEXT,
    "priceFrom" INTEGER,
    "rating" REAL DEFAULT 0,
    "reviewsCount" INTEGER DEFAULT 0,
    "isVerified" BOOLEAN DEFAULT false,
    "passportVerified" BOOLEAN NOT NULL DEFAULT false,
    "worksByContract" BOOLEAN NOT NULL DEFAULT false,
    "experienceYears" INTEGER NOT NULL DEFAULT 1,
    "website" TEXT,
    "phone" TEXT,
    "about" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_providers" ("about", "avatarUrl", "city", "createdAt", "id", "isVerified", "name", "passportVerified", "phone", "priceFrom", "rating", "reviewsCount", "slug", "title", "updatedAt", "website", "worksByContract") SELECT "about", "avatarUrl", "city", "createdAt", "id", "isVerified", "name", "passportVerified", "phone", "priceFrom", "rating", "reviewsCount", "slug", "title", "updatedAt", "website", "worksByContract" FROM "providers";
DROP TABLE "providers";
ALTER TABLE "new_providers" RENAME TO "providers";
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
