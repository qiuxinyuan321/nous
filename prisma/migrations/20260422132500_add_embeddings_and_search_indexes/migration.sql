-- ─────────────────────────────────────────────────────────────
-- Stage 0 · 为 Idea / Note / Message / Reflection 增加 embedding 字段
-- 并基于 pg_trgm 建立全文模糊搜索 GIN 索引（中英通吃、零外部依赖）
-- ─────────────────────────────────────────────────────────────

-- 启用 trigram 扩展（幂等）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1) Idea · embedding 字段 + 搜索 GIN 索引
ALTER TABLE "Idea" ADD COLUMN IF NOT EXISTS "embedding" JSONB;

CREATE INDEX IF NOT EXISTS "Idea_rawContent_trgm_idx"
  ON "Idea" USING GIN ("rawContent" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Idea_title_trgm_idx"
  ON "Idea" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Idea_refinedSummary_trgm_idx"
  ON "Idea" USING GIN ("refinedSummary" gin_trgm_ops);

-- 2) Message · embedding 字段 + content 模糊搜索
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "embedding" JSONB;

CREATE INDEX IF NOT EXISTS "Message_content_trgm_idx"
  ON "Message" USING GIN ("content" gin_trgm_ops);

-- 3) Reflection · embedding 字段 + content / aiInsight 模糊搜索
ALTER TABLE "Reflection" ADD COLUMN IF NOT EXISTS "embedding" JSONB;

CREATE INDEX IF NOT EXISTS "Reflection_content_trgm_idx"
  ON "Reflection" USING GIN ("content" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Reflection_aiInsight_trgm_idx"
  ON "Reflection" USING GIN ("aiInsight" gin_trgm_ops);

-- 4) Note · embedding 字段 + title / content 模糊搜索
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "embedding" JSONB;

CREATE INDEX IF NOT EXISTS "Note_title_trgm_idx"
  ON "Note" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Note_content_trgm_idx"
  ON "Note" USING GIN ("content" gin_trgm_ops);

-- 5) Memory · 增加 content 模糊搜索索引（embedding 已存在）
CREATE INDEX IF NOT EXISTS "Memory_content_trgm_idx"
  ON "Memory" USING GIN ("content" gin_trgm_ops);
