-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "focusedOn" DATE;

-- CreateIndex
CREATE INDEX "Task_focusedOn_idx" ON "Task"("focusedOn");
