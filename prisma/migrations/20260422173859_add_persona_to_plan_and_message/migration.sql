-- DropIndex
DROP INDEX "Idea_rawContent_trgm_idx";

-- DropIndex
DROP INDEX "Idea_refinedSummary_trgm_idx";

-- DropIndex
DROP INDEX "Idea_title_trgm_idx";

-- DropIndex
DROP INDEX "Memory_content_trgm_idx";

-- DropIndex
DROP INDEX "Message_content_trgm_idx";

-- DropIndex
DROP INDEX "Note_content_trgm_idx";

-- DropIndex
DROP INDEX "Note_title_trgm_idx";

-- DropIndex
DROP INDEX "Reflection_aiInsight_trgm_idx";

-- DropIndex
DROP INDEX "Reflection_content_trgm_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "personaId" TEXT;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "generatedByPersonaId" TEXT;
