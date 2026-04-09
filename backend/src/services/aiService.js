import axios from "axios";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || "10000", 10);
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || "2", 10);
const AI_BASE_DELAY_MS = parseInt(process.env.AI_BASE_DELAY_MS || "1000", 10);

const SYSTEM_PROMPT = `You are a cron expression expert assistant. Your task is to convert natural language descriptions of schedules into valid cron expressions.

RULES:
1. Return ONLY a valid JSON object with this exact structure (no additional text, no markdown):
{
  "cronExpression": "<5-field cron expression>",
  "explanation": "<clear human-readable explanation of when this runs>",
  "humanReadable": "<short 3-6 word description>",
  "frequencyCategory": "<one of: minute|hourly|daily|weekly|monthly|yearly>",
  "confidence": <number between 0.0 and 1.0>
}

2. Use standard 5-field cron format: minute hour day-of-month month day-of-week
   - minute: 0-59
   - hour: 0-23
   - day-of-month: 1-31
   - month: 1-12 or JAN-DEC
   - day-of-week: 0-6 (0=Sunday) or SUN-SAT

3. SAFETY RULES:
   - NEVER generate schedules that run more than once per minute
   - If asked for extremely frequent schedules, return the minimum safe alternative
   - Prefer clear, common schedules over complex expressions

4. If the request is ambiguous, choose the most common/reasonable interpretation.

5. The confidence score should reflect:
   - 0.9-1.0: Clear, unambiguous request
   - 0.7-0.89: Mostly clear, minor ambiguity
   - 0.5-0.69: Somewhat ambiguous, reasonable interpretation chosen
   - Below 0.5: Very ambiguous, best effort

FREQUENCY CATEGORIES:
- minute: Multiple times per hour (e.g., every 5 minutes)
- hourly: Once per hour or specific hours
- daily: Once or specific times per day
- weekly: Specific days of the week
- monthly: Specific days of the month
- yearly: Specific months and days

EXAMPLES:
Input: "run every day at 3am"
Output: {"cronExpression":"0 3 * * *","explanation":"Runs every day at 3:00 AM UTC","humanReadable":"Daily at 3:00 AM","frequencyCategory":"daily","confidence":0.98}

Input: "execute every Monday and Friday at 9:30 AM"
Output: {"cronExpression":"30 9 * * 1,5","explanation":"Runs every Monday and Friday at 9:30 AM UTC","humanReadable":"Mon & Fri at 9:30 AM","frequencyCategory":"weekly","confidence":0.97}

Input: "run at midnight on the first of every month"
Output: {"cronExpression":"0 0 1 * *","explanation":"Runs at midnight (00:00) on the 1st day of every month","humanReadable":"Monthly on 1st at midnight","frequencyCategory":"monthly","confidence":0.96}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (error.code === "ECONNABORTED") return true;
  if (error.code === "ETIMEDOUT") return true;
  if (!error.response) return true;
  const status = error.response?.status;
  return status >= 500 || status === 429;
};

const buildPrompt = (userPrompt, timezone = "UTC") => {
  return `Generate a cron expression for the following schedule:

User request: "${userPrompt}"
Timezone: ${timezone}

Return ONLY the JSON object as specified in the system instructions.`;
};

export const callOpenRouter = async (userPrompt, timezone = "UTC", attempt = 0) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const payload = {
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(userPrompt, timezone) },
    ],
    temperature: 0.1,
    max_tokens: 500,
  };

  try {
    const response = await axios.post(OPENROUTER_API_URL, payload, {
      timeout: AI_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cronie.app",
        "X-Title": "Cronie",
      },
    });

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI model");
    }

    return parseAIResponse(content);
  } catch (error) {
    if (attempt < AI_MAX_RETRIES && isRetryableError(error)) {
      const delay = AI_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `AI request failed (attempt ${attempt + 1}/${AI_MAX_RETRIES}), retrying in ${delay}ms...`
      );
      await sleep(delay);
      return callOpenRouter(userPrompt, timezone, attempt + 1);
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw new Error("AI request timed out. Please try again.");
    }

    if (error.response?.status === 401) {
      throw new Error("AI service authentication failed");
    }

    if (error.response?.status === 429) {
      throw new Error("AI service rate limited. Please try again in a minute.");
    }

    if (error.response?.status >= 500) {
      throw new Error("AI service is temporarily unavailable. Please try again.");
    }

    throw new Error(`AI request failed: ${error.message}`);
  }
};

const parseAIResponse = (content) => {
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("AI returned malformed JSON");
      }
    } else {
      throw new Error("AI response did not contain a valid JSON object");
    }
  }

  const {
    cronExpression,
    explanation,
    humanReadable,
    frequencyCategory,
    confidence,
  } = parsed;

  if (!cronExpression || typeof cronExpression !== "string") {
    throw new Error("AI response missing valid cronExpression");
  }

  if (!explanation || typeof explanation !== "string") {
    throw new Error("AI response missing valid explanation");
  }

  return {
    cronExpression,
    explanation,
    humanReadable: humanReadable || explanation,
    frequencyCategory: frequencyCategory || "daily",
    confidence: typeof confidence === "number" ? confidence : 0.7,
  };
};

export const validateAIResponse = (aiResult) => {
  const errors = [];

  if (!aiResult.cronExpression) {
    errors.push("Missing cron expression");
  }

  if (!aiResult.explanation) {
    errors.push("Missing explanation");
  }

  if (aiResult.confidence < 0 || aiResult.confidence > 1) {
    errors.push("Confidence must be between 0 and 1");
  }

  const validFrequencies = [
    "minute",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
  ];
  if (
    aiResult.frequencyCategory &&
    !validFrequencies.includes(aiResult.frequencyCategory)
  ) {
    errors.push(`Invalid frequency category: ${aiResult.frequencyCategory}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  callOpenRouter,
  validateAIResponse,
};
