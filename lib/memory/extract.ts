import { generateObject } from 'ai'
import { z } from 'zod'
import { buildModel } from '@/lib/ai/model'
import type { ResolvedProvider } from '@/lib/ai/types'
import { createMemory, MEMORY_KINDS, type MemoryKind } from '@/lib/memory/store'

/**
 * 从苏格拉底对话中抽取「关于用户」的稳定事实,而非想法本身。
 * 返回 0 条也正常——大部分对话没新稳定信息。
 */
const extractionSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(MEMORY_KINDS),
        content: z
          .string()
          .min(4)
          .max(220)
          .describe('一句话,用第三人称描述用户,不引号包裹,不含"我"字'),
        importance: z.number().int().min(1).max(5),
      }),
    )
    .max(4),
})

interface ExtractInput {
  provider: ResolvedProvider
  locale: 'zh-CN' | 'en-US'
  userMessage: string
  assistantMessage: string
  recentContext: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * 返回新抽取的 Memory 数量。静默失败不抛。
 */
export async function extractMemories(
  userId: string,
  ideaId: string,
  input: ExtractInput,
): Promise<number> {
  const systemZh = `
你是「Nous」的长期记忆抽取器。从用户的最新发言中,识别出**关于用户自身**的稳定事实(不是关于这个想法的事实)。

可抽取的类型(kind):
- preference: 用户的偏好/厌恶 (例:"讨厌鸡汤式回应"、"喜欢清晨写作")
- habit: 用户的习惯/日常 (例:"周日晚上复盘"、"碎片时间在通勤")
- goal: 用户的长期目标 (例:"明年开源一个产品"、"在 30 岁前实现财富自由")
- blindspot: 用户的常见卡点 (例:"总卡在第一步"、"容易在细节里内耗")
- fact: 用户身份/背景事实 (例:"INTP"、"全栈开发者"、"三猫主人")

铁律:
1. **只抽稳定事实**。临时情绪、当下动作、想法内容本身 → 不抽。
2. 一句话用**第三人称**描述用户,不含"我"字。例: ✗"我喜欢清晨写作" ✓"喜欢清晨写作"
3. 没有稳定新事实时返回空数组,不要硬凑。
4. importance: 1=边角,3=典型,5=核心画像。
5. 每次最多抽 4 条。
`.trim()

  const systemEn = `
You are the long-term memory extractor for "Nous". From the user's latest message, identify **stable facts about the user themselves** (not about the idea they're discussing).

Kinds:
- preference · user's likes/dislikes (e.g. "dislikes motivational platitudes")
- habit · routines (e.g. "reviews on Sunday evenings")
- goal · long-term goals
- blindspot · recurring stuck points (e.g. "tends to get blocked at step one")
- fact · identity/background (e.g. "INTP", "full-stack dev")

Rules:
1. Extract ONLY stable facts. Skip transient emotion, current action, or idea content.
2. Write each in **third person**, no "I".
3. Return empty array if no new stable facts — don't fabricate.
4. importance: 1=minor, 3=typical, 5=core profile.
5. Up to 4 items.
`.trim()

  try {
    const result = await generateObject({
      model: buildModel(input.provider),
      schema: extractionSchema,
      system: input.locale === 'en-US' ? systemEn : systemZh,
      prompt: [
        input.locale === 'en-US' ? '## Context (recent turns)' : '## 近期对话上下文',
        ...input.recentContext.slice(-4).map((m) => `${m.role}: ${m.content}`),
        '',
        input.locale === 'en-US' ? '## Latest user message' : '## 最新用户发言',
        input.userMessage,
        '',
        input.locale === 'en-US' ? '## Your reply' : '## 你的回复',
        input.assistantMessage,
      ].join('\n'),
      maxRetries: 1,
    })

    const items = result.object.items
    if (items.length === 0) return 0

    // 存入 (embed 在 createMemory 内做)
    let count = 0
    for (const item of items) {
      try {
        await createMemory(userId, {
          kind: item.kind as MemoryKind,
          content: item.content,
          importance: item.importance,
          source: 'extracted-refine',
          sourceRef: ideaId,
        })
        count++
      } catch (e) {
        console.warn('[extractMemories] insert failed:', e)
      }
    }
    return count
  } catch (err) {
    console.warn('[extractMemories] generateObject failed:', err)
    return 0
  }
}
