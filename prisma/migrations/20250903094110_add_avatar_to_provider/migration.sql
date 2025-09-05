/*
  Warnings:

  - You are about to drop the `Provider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Provider";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "providers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "city" TEXT,
    "priceFrom" INTEGER,
    "rating" REAL DEFAULT 0,
    "reviewsCount" INTEGER DEFAULT 0,
    "isVerified" BOOLEAN DEFAULT false,
    "website" TEXT,
    "phone" TEXT,
    "about" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("contact", "createdAt", "id", "message", "name", "providerId", "status") SELECT "contact", "createdAt", "id", "message", "name", "providerId", "status" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    CONSTRAINT "Project_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("id", "imageUrl", "providerId", "title") SELECT "id", "imageUrl", "providerId", "title" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_ProviderCategory" (
    "providerId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    PRIMARY KEY ("providerId", "categoryId"),
    CONSTRAINT "ProviderCategory_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProviderCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProviderCategory" ("categoryId", "providerId") SELECT "categoryId", "providerId" FROM "ProviderCategory";
DROP TABLE "ProviderCategory";
ALTER TABLE "new_ProviderCategory" RENAME TO "ProviderCategory";
CREATE INDEX "ProviderCategory_categoryId_idx" ON "ProviderCategory"("categoryId");
CREATE TABLE "new_Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "priceFrom" INTEGER,
    "description" TEXT,
    CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("description", "id", "name", "priceFrom", "providerId", "unit") SELECT "description", "id", "name", "priceFrom", "providerId", "unit" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
