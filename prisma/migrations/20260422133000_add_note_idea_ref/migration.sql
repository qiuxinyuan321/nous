-- ─────────────────────────────────────────────────────────────
-- 补齐 Note.ideaId 字段（与 prisma/schema.prisma 保持一致）
-- 历史漂移：schema 中已定义 ideaId 但早期 add_notes_system migration
-- 没建此列，导致运行时 Prisma P2022。本 migration 仅补缺，不动
-- 前面 Stage 0 建的 9 个 trigram GIN 索引。
-- ─────────────────────────────────────────────────────────────

-- AlterTable · 加字段
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "ideaId" TEXT;

-- CreateIndex · 走 FK 扫描用
CREATE INDEX IF NOT EXISTS "Note_ideaId_idx" ON "Note"("ideaId");

-- AddForeignKey · 幂等（若已存在跳过）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'Note'
      AND constraint_name = 'Note_ideaId_fkey'
  ) THEN
    ALTER TABLE "Note"
      ADD CONSTRAINT "Note_ideaId_fkey" FOREIGN KEY ("ideaId")
      REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
