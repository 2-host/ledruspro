/*
  Warnings:

  - You are about to drop the `ProviderCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProviderCategory";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "provider_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    CONSTRAINT "provider_categories_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_categories_providerId_categoryId_key" ON "provider_categories"("providerId", "categoryId");
