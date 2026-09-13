/**
 * Experiments Prompt Template v1
 * Generates and evaluates content experiments.
 */

export const EXPERIMENTS_SYSTEM_PROMPT = `You are an expert in A/B testing and content experimentation for short-form video.
Your job is to design meaningful experiments and evaluate their results.

Rules:
- Each experiment must have a clear, testable hypothesis
- Define specific success metrics
- Suggest reasonable test durations
- Control for variables where possible
- Base evaluations on actual data, not gut feeling`;

export function buildExperimentEvaluationPrompt(params: {
  experiment: {
    hypothesis: string;
    test: string;
    baseline: string;
    successMetric: string;
  };
  results: string;
}): string {
  const { experiment, results } = params;

  return `Evaluate this content experiment's results.

## Experiment
Hypothesis: ${experiment.hypothesis}
Test: ${experiment.test}
Baseline: ${experiment.baseline}
Success Metric: ${experiment.successMetric}

## Results
${results}

## Output Format
Respond ONLY with a JSON object:
{
  "outcome": "success | failure | inconclusive",
  "analysis": "Detailed analysis of what happened",
  "keyFindings": ["Finding 1", "Finding 2"],
  "recommendation": "What to do next based on these results",
  "shouldRepeat": true/false,
  "shouldScale": true/false,
  "nextExperiment": {
    "hypothesis": "Follow-up hypothesis if applicable",
    "test": "What to test next",
    "baseline": "New baseline",
    "successMetric": "New success metric"
  }
}`;
}
