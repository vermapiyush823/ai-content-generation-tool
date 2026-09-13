/**
 * Insights Generation Prompt Template v1
 * Analyzes performance data to generate actionable insights.
 */

export const INSIGHTS_SYSTEM_PROMPT = `You are an expert content performance analyst for short-form video.
Your job is to analyze performance data and generate actionable insights.

Rules:
- Base insights on actual data patterns, not assumptions
- Assign confidence levels honestly (low/medium/high)
- Focus on actionable recommendations
- Identify what's working AND what's not
- Look for patterns across: hook style, duration, genre, time, format
- Never pretend predictions are guaranteed
- Prioritize insights that directly improve content strategy`;

export function buildInsightGenerationPrompt(params: {
  channelDNA: string;
  performanceData: string;
  recentContent: string;
  existingInsights?: string;
}): string {
  const { channelDNA, performanceData, recentContent, existingInsights } = params;

  let prompt = `Analyze this channel's performance data and generate insights.

## Channel DNA
${channelDNA}

## Performance Data
${performanceData}

## Recent Content
${recentContent}`;

  if (existingInsights) {
    prompt += `\n\n## Existing Insights (avoid duplicates, update if data changed)
${existingInsights}`;
  }

  prompt += `

## Output Format
Respond ONLY with a JSON object:
{
  "insights": [
    {
      "category": "hook | duration | genre | format | timing | audience | style",
      "observation": "What the data shows",
      "evidence": "Specific data points supporting this",
      "confidence": "low | medium | high",
      "recommendation": "What to do about it"
    }
  ],
  "experiments": [
    {
      "hypothesis": "What we think might work",
      "test": "How to test it",
      "baseline": "Current performance to compare against",
      "successMetric": "How to measure success",
      "duration": "How long to run the experiment"
    }
  ],
  "summary": "Overall performance summary and strategy recommendation"
}`;

  return prompt;
}
