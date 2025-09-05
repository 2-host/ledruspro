-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "text" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
