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
    englishWordOrPhrase: { type: "string" },
    arabicTranslation: { type: "string" },
    simpleMeaning: { type: "string" },
    exampleSentence: { type: "string" },
    whenToUse: { type: "string" },
    category: { type: "string", enum: categories }
  },
  required: [
    "englishWordOrPhrase",
    "arabicTranslation",
    "simpleMeaning",
    "exampleSentence",
    "whenToUse",
    "category"
  ]
};

const systemPrompt = `You are an English vocabulary assistant for an Arabic speaker.
Given one English or Arabic word/phrase, generate a vocabulary card with:
1. English word or phrase
2. Arabic translation
3. Simple English meaning
4. Natural example sentence in English
5. When to use it
6. Suggested category from: Work, Daily, Email, Interview, Other

Rules:
- If the input is Arabic, translate it to the most natural English word or phrase.
- If the input is English, keep the English word or phrase natural and clean.
- Always fill englishWordOrPhrase with English text only.
- Always fill arabicTranslation with Arabic text only.
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
  const inputLanguage = /[\u0600-\u06FF]/.test(word) ? "Arabic" : "English";

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
        {
          role: "user",
          content: `Input language: ${inputLanguage}\nInput word or phrase: ${word}`
        }
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
      englishWordOrPhrase: generated.englishWordOrPhrase,
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
