import { defineTool } from 'eve/tools'

export default defineTool({
  name: 'run_pagespeed',
  description: 'Run PageSpeed Insights on a URL',
  parameters: {
    url: { type: 'string', description: 'URL to test' }
  },
  execute: async (params) => {
    const { url } = params
    const response = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}`)
    const data = await response.json()
    return data
  }
})