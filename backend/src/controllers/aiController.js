import { callOpenRouter, validateAIResponse } from "../services/aiService.js";
import { validateAndAnalyzeCron } from "../services/cronValidator.js";

const MAX_PROMPT_LENGTH = 500;
const MIN_PROMPT_LENGTH = 5;

const sanitizeInput = (prompt) => {
  if (typeof prompt !== "string") return "";
  return prompt.trim().slice(0, MAX_PROMPT_LENGTH);
};

export const generateCron = async (req, res) => {
  try {
    const { prompt, timezone } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const sanitizedPrompt = sanitizeInput(prompt);

    if (sanitizedPrompt.length < MIN_PROMPT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Prompt must be at least ${MIN_PROMPT_LENGTH} characters`,
      });
    }

    if (sanitizedPrompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Prompt must be less than ${MAX_PROMPT_LENGTH} characters`,
      });
    }

    const sanitizedTimezone =
      typeof timezone === "string" && timezone.trim() ? timezone.trim() : "UTC";

    const aiResult = await callOpenRouter(sanitizedPrompt, sanitizedTimezone);

    const validation = validateAIResponse(aiResult);
    if (!validation.isValid) {
      console.error("AI response validation failed:", validation.errors);
      return res.status(502).json({
        success: false,
        error: "AI service returned invalid response",
        details: validation.errors,
      });
    }

    const cronAnalysis = validateAndAnalyzeCron(aiResult.cronExpression);
    if (!cronAnalysis.valid) {
      console.error("Generated cron expression is invalid:", aiResult.cronExpression);
      return res.status(502).json({
        success: false,
        error: "AI generated an invalid cron expression",
      });
    }

    if (cronAnalysis.safetyRating === "unsafe") {
      return res.status(400).json({
        success: false,
        error: "AI generated an unsafe schedule",
        safetyWarning: cronAnalysis.safetyReason,
      });
    }

    const response = {
      success: true,
      data: {
        cronExpression: aiResult.cronExpression,
        explanation: aiResult.explanation,
        humanReadable: cronAnalysis.humanReadable,
        safetyRating: cronAnalysis.safetyRating,
        safetyWarning: cronAnalysis.safetyReason,
        frequencyCategory: cronAnalysis.frequencyCategory,
        nextRunTimes: cronAnalysis.nextRunTimes,
        confidence: aiResult.confidence,
        warnings:
          cronAnalysis.safetyRating === "caution"
            ? [cronAnalysis.safetyReason]
            : [],
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("AI cron generation error:", error.message);

    if (error.message.includes("not configured")) {
      return res.status(503).json({
        success: false,
        error: "AI service is not configured. Please contact administrator.",
      });
    }

    if (error.message.includes("timed out")) {
      return res.status(503).json({
        success: false,
        error: error.message,
        retryable: true,
      });
    }

    if (error.message.includes("rate limited")) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryable: true,
      });
    }

    if (error.message.includes("unavailable") || error.message.includes("502")) {
      return res.status(502).json({
        success: false,
        error: "AI service is temporarily unavailable. Please try again.",
        retryable: true,
      });
    }

    if (error.message.includes("authentication")) {
      return res.status(503).json({
        success: false,
        error: "AI service authentication failed. Please contact administrator.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to generate cron expression. Please try again.",
    });
  }
};

export default {
  generateCron,
};
