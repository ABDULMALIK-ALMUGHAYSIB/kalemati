import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3001);
const categories = ["Work", "Daily", "Email", "Interview", "Other"];

app.use(express.json({ limit: "32kb" }));

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    arabicTranslation: { type: "string" },
    simpleMeaning: { type: "string" },
    exampleSentence: { type: "string" },
    whenToUse: { type: "string" },
    category: { type: "string", enum: categories }
  },
  required: [
    "arabicTranslation",
    "simpleMeaning",
    "exampleSentence",
    "whenToUse",
    "category"
  ]
};

const systemPrompt = `You are an English vocabulary assistant for an Arabic speaker.
Given one English word or phrase, generate:
1. Arabic translation
2. Simple English meaning
3. Natural example sentence
4. When to use it
5. Suggested category from: Work, Daily, Email, Interview, Other

Rules:
- Keep the meaning simple and beginner-friendly.
- Make the example practical.
- If the word is useful for workplace or interviews, choose Work or Interview.
- Return JSON only.`;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

app.post("/api/generate-word", async (req, res) => {
  const word = typeof req.body?.word === "string" ? req.body.word.trim() : "";

  if (!word) {
    return res.status(400).json({ error: "Word is required." });
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured on the backend."
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `English word or phrase: ${word}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "word_vault_generation",
          strict: true,
          schema: responseSchema
        }
      }
    });

    const rawContent = completion.choices[0]?.message?.content;
    const generated = JSON.parse(rawContent || "{}");

    return res.json({
      arabicTranslation: generated.arabicTranslation,
      simpleMeaning: generated.simpleMeaning,
      exampleSentence: generated.exampleSentence,
      whenToUse: generated.whenToUse,
      category: categories.includes(generated.category) ? generated.category : "Other"
    });
  } catch (error) {
    console.error("AI generation failed:", error);
    const message =
      error?.code === "insufficient_quota" || error?.status === 429
        ? "OpenAI quota exceeded. Check your billing or try another API key."
        : "AI generation failed. Please try again.";

    return res.status(500).json({
      error: message
    });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`WordVault API running at http://127.0.0.1:${port}`);
});
