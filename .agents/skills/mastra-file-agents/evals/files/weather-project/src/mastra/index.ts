import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const getWeather = createTool({
  id: 'get_weather',
  description: 'Get the current weather for a city',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ context }) => ({ city: context.city, tempC: 21 }),
})

const getForecast = createTool({
  id: 'get_forecast',
  description: 'Get a multi-day forecast for a city',
  inputSchema: z.object({ city: z.string(), days: z.number() }),
  execute: async ({ context }) => ({
    city: context.city,
    days: context.days,
    highsC: [21, 22, 20],
  }),
})

const weatherAgent = new Agent({
  id: 'weather',
  name: 'weather',
  instructions:
    'You are a helpful weather assistant. Answer questions about current conditions and forecasts. Always be concise and report temperatures in Celsius.',
  model: 'openai/gpt-5.5',
  tools: { get_weather: getWeather, get_forecast: getForecast },
})

export const mastra = new Mastra({
  agents: { weather: weatherAgent },
})
