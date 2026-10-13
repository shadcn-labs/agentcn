export default async (inputData: { readonly url: string }) => {
  const { url } = inputData;

  // Simulated PageSpeed Insights API response
  // In production, this would call the actual PageSpeed Insights API
  const performanceMetrics = {
    url,
    performanceScore: 85,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2500,
    totalBlockingTime: 150,
    cumulativeLayoutShift: 0.1,
    speedIndex: 3000,
    interactive: 3500,
    timestamp: new Date().toISOString(),
  };

  return performanceMetrics;
};
