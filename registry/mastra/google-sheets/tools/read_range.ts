import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

export default createTool({
  id: 'read_range',
  description:
    'Reads a range of cells from a Google Sheet using A1 notation (e.g. "Sheet1!A1:F100").',
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string(),
  }),
  execute: async (inputData) => {
    const { spreadsheetId, range } = inputData
    const res = await fetch(
      `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN ?? ''}`,
        },
      }
    )
    return res.json()
  },
})
