-- DropIndex
DROP INDEX "Transaction_wompiId_key";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "providerResponse" TEXT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "quantity" DROP DEFAULT;
