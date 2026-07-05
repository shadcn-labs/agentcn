import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const questionSchema = z.object({
  question: z.string(),
  answer_hint: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

export default createTool({
  id: 'generate_questions',
  description: 'Uses an AI agent to generate quiz questions from CSV data',
  inputSchema: z.object({
    csv_text: z.string().describe('The raw CSV text to generate questions from'),
    num_questions: z.number().optional().default(5).describe('Number of questions to generate (5-10)'),
  }),
  outputSchema: z.object({
    questions: z.array(questionSchema),
  }),
  execute: async (inputData) => {
    const { csv_text, num_questions = 5 } = inputData
    const count = Math.max(5, Math.min(10, num_questions))

    const { mastra } = await import('@mastra/core')
    const agent = (mastra as any)?.getAgent('csvAgent')

    if (!agent) {
      throw new Error('Agent not available in Mastra context')
    }

    const response = await agent.generate(
      `Given the following CSV data, generate exactly ${count} quiz questions with varying difficulty levels.

CSV Data:
${csv_text.substring(0, 4000)}

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {
    "question": "Your question here",
    "answer_hint": "Brief hint about the answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]

Include a mix of difficulties: some easy, some medium, some hard.`,
    )

    const text = response?.text || '[]'

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse questions from agent response')
    }

    const questions = JSON.parse(jsonMatch[0])

    return {
      questions: questions.map((q: any) => ({
        question: q.question || '',
        answer_hint: q.answer_hint || '',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      })),
    }
  },
})
