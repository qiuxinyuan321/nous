/*
  Warnings:

  - Added the required column `userId` to the `Reflection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reflection" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "ideaId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Reflection_userId_kind_createdAt_idx" ON "Reflection"("userId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
