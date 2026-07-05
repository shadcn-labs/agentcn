import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const downloadCsv = createStep({
  id: 'download-csv',
  description: 'Fetches CSV content from a URL',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    url: z.string(),
    csvText: z.string(),
    rowCount: z.number(),
    columnCount: z.number(),
  }),
  execute: async ({ inputData }) => {
    const response = await fetch(inputData.url)
    if (!response.ok) {
      throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`)
    }
    const csvText = await response.text()
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('CSV file is empty')
    }
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean)
    const rowCount = lines.length
    const columnCount = rowCount > 0 ? lines[0].split(',').length : 0
    return { url: inputData.url, csvText, rowCount, columnCount }
  },
})

const summarizeCsv = createStep({
  id: 'summarize-csv',
  description: 'Uses agent to summarize CSV data within token limits',
  inputSchema: z.object({
    url: z.string(),
    csvText: z.string(),
    rowCount: z.number(),
    columnCount: z.number(),
  }),
  outputSchema: z.object({
    url: z.string(),
    csvText: z.string(),
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('csvAgent')
    const response = await agent?.generate(
      `Summarize the following CSV data (rows: ${inputData.rowCount}, columns: ${inputData.columnCount}).

CSV:
${inputData.csvText.substring(0, 4000)}

Provide a concise summary of the data structure, key columns, and notable patterns.`,
    )
    return {
      url: inputData.url,
      csvText: inputData.csvText,
      summary: response?.text ?? '',
    }
  },
})

const generateQuestions = createStep({
  id: 'generate-questions',
  description: 'Uses agent to generate analytical questions from CSV data',
  inputSchema: z.object({
    url: z.string(),
    csvText: z.string(),
    summary: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    summary: z.string(),
    questions: z.array(
      z.object({
        question: z.string(),
        answer_hint: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      }),
    ),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('csvAgent')
    const response = await agent?.generate(
      `Given the following CSV summary and data, generate 5 analytical questions with varying difficulty.

Summary:
${inputData.summary}

CSV Data (first rows):
${inputData.csvText.substring(0, 4000)}

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {
    "question": "Your question here",
    "answer_hint": "Brief hint about the answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]`,
    )

    const text = response?.text || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return {
      url: inputData.url,
      summary: inputData.summary,
      questions: questions.map((q: any) => ({
        question: q.question || '',
        answer_hint: q.answer_hint || '',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      })),
    }
  },
})

export const csvToQuestionsWorkflow = createWorkflow({
  id: 'csv-to-questions-workflow',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    url: z.string(),
    summary: z.string(),
    questions: z.array(
      z.object({
        question: z.string(),
        answer_hint: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      }),
    ),
  }),
})
  .then(downloadCsv)
  .then(summarizeCsv)
  .then(generateQuestions)

csvToQuestionsWorkflow.commit()
