/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_transactionId_key" ON "Delivery"("transactionId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
