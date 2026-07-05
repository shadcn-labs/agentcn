import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export default createTool({
  id: 'generate_image',
  description: 'Generate an educational image for a flash card concept using DALL-E 3. Saves the image locally.',
  inputSchema: z.object({
    concept: z.string().describe('The concept to visualize'),
    subjectArea: z.string().describe('The subject area (e.g., biology, physics, history)'),
  }),
  outputSchema: z.object({
    imagePath: z.string().describe('Local file path to the generated image'),
    revisedPrompt: z.string().describe('The prompt DALL-E actually used'),
  }),
  execute: async (inputData) => {
    const { concept, subjectArea } = inputData
    const prompt = `Create a clear, educational diagram or illustration about "${concept}" in the subject of ${subjectArea}. The image should be suitable for a study flash card. Use clean visuals, labels where helpful, and no walls of text. Style: educational, clean, minimal.`

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size: '1024x1024',
      }),
    })

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as { data?: { url?: string; revised_prompt?: string }[] }

    return {
      imagePath: data.data?.[0]?.url ?? '',
      revisedPrompt: data.data?.[0]?.revised_prompt ?? prompt,
    }
  },
})