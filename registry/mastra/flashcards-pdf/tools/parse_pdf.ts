import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import pdf from 'pdf-parse'

export default createTool({
  id: 'parse_pdf',
  description: 'Extract text content from a PDF file at the given URL',
  inputSchema: z.object({
    url: z.string().url().describe('URL of the PDF file to parse'),
  }),
  outputSchema: z.object({
    text: z.string().describe('Extracted text content from the PDF'),
    pageCount: z.number().describe('Number of pages in the PDF'),
  }),
  execute: async (inputData) => {
    const { url } = inputData

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const data = await pdf(buffer)

      return {
        text: data.text.substring(0, 10000),
        pageCount: data.numpages,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to parse PDF: ${errorMessage}`)
    }
  },
})