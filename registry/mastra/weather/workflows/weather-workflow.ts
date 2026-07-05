import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const fetchWeather = createStep({
  id: 'fetch-weather',
  description: 'Fetches current weather for a given location',
  inputSchema: z.object({
    location: z.string(),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('weatherAgent')
    const response = await agent?.generate(
      `What is the current weather in ${inputData.location}? Use the get_weather tool.`,
    )
    const weatherData = JSON.parse(response?.text || '{}')
    return {
      temperature: weatherData.temperature ?? 0,
      feelsLike: weatherData.feelsLike ?? 0,
      humidity: weatherData.humidity ?? 0,
      windSpeed: weatherData.windSpeed ?? 0,
      windGust: weatherData.windGust ?? 0,
      conditions: weatherData.conditions ?? 'Unknown',
      location: weatherData.location ?? inputData.location,
    }
  },
})

const planActivities = createStep({
  id: 'plan-activities',
  description: 'Suggests activities based on weather conditions',
  inputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  outputSchema: z.object({
    location: z.string(),
    temperature: z.number(),
    conditions: z.string(),
    activities: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('weatherAgent')
    const response = await agent?.generate(
      `Suggest 3-5 outdoor and indoor activities for the following weather in ${inputData.location}: ${inputData.conditions}, ${inputData.temperature}°C (feels like ${inputData.feelsLike}°C), humidity ${inputData.humidity}%, wind ${inputData.windSpeed} km/h. Provide brief, practical suggestions.`,
    )
    return {
      location: inputData.location,
      temperature: inputData.temperature,
      conditions: inputData.conditions,
      activities: response?.text || 'No suggestions available.',
    }
  },
})

export const weatherWorkflow = createWorkflow({
  id: 'weather-workflow',
  inputSchema: z.object({
    location: z.string(),
  }),
  outputSchema: z.object({
    location: z.string(),
    temperature: z.number(),
    conditions: z.string(),
    activities: z.string(),
  }),
})
  .then(fetchWeather)
  .then(planActivities)

weatherWorkflow.commit()
