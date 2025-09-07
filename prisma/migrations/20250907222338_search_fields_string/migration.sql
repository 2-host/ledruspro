-- AlterTable
ALTER TABLE "Service" ADD COLUMN "descriptionSearch" TEXT;
ALTER TABLE "Service" ADD COLUMN "nameSearch" TEXT;

-- AlterTable
ALTER TABLE "providers" ADD COLUMN "nameSearch" TEXT;
ALTER TABLE "providers" ADD COLUMN "titleSearch" TEXT;

-- CreateIndex
CREATE INDEX "Service_nameSearch_idx" ON "Service"("nameSearch");

-- CreateIndex
CREATE INDEX "Service_descriptionSearch_idx" ON "Service"("descriptionSearch");

-- CreateIndex
CREATE INDEX "providers_nameSearch_idx" ON "providers"("nameSearch");

-- CreateIndex
CREATE INDEX "providers_titleSearch_idx" ON "providers"("titleSearch");
