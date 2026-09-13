import { z } from 'zod/v4';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b';
const NVIDIA_SCENE_MODEL = process.env.NVIDIA_SCENE_MODEL || 'nv-mistralai/mistral-nemo-12b-instruct';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export { NVIDIA_SCENE_MODEL };

export class AIClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIGenerateOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}

interface AIGenerateResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a completion from the NVIDIA AI API.
 * Uses the OpenAI-compatible endpoint.
 */
export async function generateCompletion(
  options: AIGenerateOptions
): Promise<AIGenerateResponse> {
  if (!NVIDIA_API_KEY) {
    throw new AIClientError(
      'NVIDIA_API_KEY is not configured. Please set it in your .env.local file.',
      500,
      false
    );
  }

  const { messages, temperature = 0.7, maxTokens = 4096, topP = 0.9, model = NVIDIA_MODEL } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new AIClientError(
      `NVIDIA API error (${response.status}): ${errorText}`,
      response.status,
      response.status >= 500 || response.status === 429
    );
  }

  const data = await response.json();

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIClientError('No content in AI response', 500, true);
  }

  return {
    content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Generate a structured JSON response from the AI, validated with Zod.
 * Retries on validation failures up to maxRetries times.
 */
export async function generateStructured<T>(
  options: AIGenerateOptions & {
    schema: z.ZodType<T>;
    maxRetries?: number;
  }
): Promise<{ data: T; usage?: AIGenerateResponse['usage'] }> {
  const { schema, maxRetries = 2, ...generateOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await generateCompletion(generateOptions);
      let content = response.content;

      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }

      // Try to parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Try to find JSON object/array in the content
        const objectMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (objectMatch) {
          parsed = JSON.parse(objectMatch[1]);
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      }

      // Validate with Zod
      const validated = schema.parse(parsed);

      return { data: validated, usage: response.usage };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If it's a non-retryable API error, don't retry
      if (error instanceof AIClientError && !error.retryable) {
        throw error;
      }

      // On validation failure, add correction context for retry
      if (attempt < maxRetries) {
        const correctionMessage: ChatMessage = {
          role: 'user',
          content: `Your previous response was not valid JSON or failed validation. Error: ${lastError.message}. Please try again and respond ONLY with valid JSON matching the requested format.`,
        };
        generateOptions.messages = [
          ...generateOptions.messages,
          correctionMessage,
        ];
      }
    }
  }

  throw new AIClientError(
    `AI generation failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
    500,
    false
  );
}

/**
 * Track AI usage for cost control (§45).
 * Simple in-memory counter; can be persisted to DB later.
 */
let usageCounter = {
  today: 0,
  month: 0,
  lastReset: new Date().toDateString(),
};

export function trackUsage(tokens: number): void {
  const today = new Date().toDateString();
  if (usageCounter.lastReset !== today) {
    usageCounter.today = 0;
    usageCounter.lastReset = today;
  }
  usageCounter.today += tokens;
  usageCounter.month += tokens;
}

export function getUsageStats() {
  return { ...usageCounter };
}
