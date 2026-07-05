import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const feedbackItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: z.string(),
  date: z.string(),
  customer_tier: z.string(),
})

export default createTool({
  id: 'get_feedback',
  description:
    'Retrieves customer feedback from the database. Can filter by source, customer tier, or date range. Supports pagination via limit and offset. Use these to batch through large result sets without overwhelming the context window.',
  inputSchema: z.object({
    source: z
      .enum(['support_ticket', 'app_review', 'survey', 'social_media'])
      .optional()
      .describe('Filter by feedback source'),
    customer_tier: z.enum(['free', 'pro', 'enterprise']).optional().describe('Filter by customer tier'),
    start_date: z.string().optional().describe('Filter feedback from this date onwards (YYYY-MM-DD)'),
    end_date: z.string().optional().describe('Filter feedback up to this date (YYYY-MM-DD)'),
    limit: z.number().optional().default(40).describe('Maximum number of items to return (default: 40)'),
    offset: z.number().optional().default(0).describe('Number of items to skip for pagination (default: 0)'),
  }),
  outputSchema: z.object({
    feedback: z.array(feedbackItemSchema),
    total: z.number().describe('Total matching items (before pagination)'),
    returned: z.number().describe('Number of items in this page'),
    limit: z.number(),
    offset: z.number(),
    has_more: z.boolean().describe('Whether more items are available'),
    filters_applied: z.record(z.string(), z.string()),
  }),
  execute: async (inputData) => {
    const { source, customer_tier, start_date, end_date, limit = 40, offset = 0 } = inputData

    // In a real implementation, this would query a database
    // For now, we'll return a mock response structure
    const filtersApplied: Record<string, string> = {}

    if (source) {
      filtersApplied.source = source
    }

    if (customer_tier) {
      filtersApplied.customer_tier = customer_tier
    }

    if (start_date) {
      filtersApplied.start_date = start_date
    }

    if (end_date) {
      filtersApplied.end_date = end_date
    }

    const allFeedback = [
      { id: 'fb-001', text: 'The new dashboard loads much faster, great improvement!', source: 'app_review', date: '2025-06-15', customer_tier: 'pro' },
      { id: 'fb-002', text: 'Mobile app crashes every time I try to upload a file larger than 5MB.', source: 'support_ticket', date: '2025-06-16', customer_tier: 'enterprise' },
      { id: 'fb-003', text: 'Love the dark mode feature, please add more theme options.', source: 'survey', date: '2025-06-17', customer_tier: 'free' },
      { id: 'fb-004', text: 'The API response times have degraded significantly in the last week.', source: 'support_ticket', date: '2025-06-18', customer_tier: 'enterprise' },
      { id: 'fb-005', text: 'Your product is overpriced compared to competitors. Considering alternatives.', source: 'social_media', date: '2025-06-19', customer_tier: 'pro' },
      { id: 'fb-006', text: 'The onboarding tutorial was confusing, took me 2 hours to set up.', source: 'app_review', date: '2025-06-20', customer_tier: 'free' },
      { id: 'fb-007', text: 'Fantastic customer support team! Resolved my issue within minutes.', source: 'social_media', date: '2025-06-21', customer_tier: 'pro' },
      { id: 'fb-008', text: 'The CSV export feature keeps failing with large datasets.', source: 'support_ticket', date: '2025-06-22', customer_tier: 'pro' },
      { id: 'fb-009', text: 'Would be great to have Slack integration for team notifications.', source: 'survey', date: '2025-06-23', customer_tier: 'enterprise' },
      { id: 'fb-010', text: 'The search functionality is slow and returns irrelevant results.', source: 'app_review', date: '2025-06-24', customer_tier: 'free' },
      { id: 'fb-011', text: 'Billing page is confusing, I was charged twice for my subscription.', source: 'support_ticket', date: '2025-06-25', customer_tier: 'pro' },
      { id: 'fb-012', text: 'Great product overall, been using it daily for 6 months.', source: 'social_media', date: '2025-06-26', customer_tier: 'enterprise' },
      { id: 'fb-013', text: 'The keyboard shortcuts don\'t work on Firefox, only Chrome.', source: 'app_review', date: '2025-06-27', customer_tier: 'free' },
      { id: 'fb-014', text: 'Need better data export options, CSV alone is not enough.', source: 'survey', date: '2025-06-28', customer_tier: 'pro' },
      { id: 'fb-015', text: 'The real-time collaboration feature is a game changer for our team!', source: 'social_media', date: '2025-06-29', customer_tier: 'enterprise' },
    ]

    let filtered = [...allFeedback]

    if (source) {
      filtered = filtered.filter(f => f.source === source)
    }
    if (customer_tier) {
      filtered = filtered.filter(f => f.customer_tier === customer_tier)
    }
    if (start_date) {
      filtered = filtered.filter(f => f.date >= start_date)
    }
    if (end_date) {
      filtered = filtered.filter(f => f.date <= end_date)
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return {
      feedback: paginated,
      total,
      returned: paginated.length,
      limit,
      offset,
      has_more: offset + limit < total,
      filters_applied: filtersApplied,
    }
  },
})