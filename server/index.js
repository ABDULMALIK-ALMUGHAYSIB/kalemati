import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3001);
const categories = ["Work", "Daily", "Email", "Interview", "Grammar", "Other"];

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

const literalSystemPrompt = `You are an English vocabulary assistant for an Arabic speaker building a personal vocabulary card.

The input is the exact word or phrase to translate literally to English (or keep as-is if already English) — even if it is a full question or sentence, translate it exactly. Do not shorten it, answer a different question, or replace it with something else.

Generate a vocabulary card with:
- English word or phrase (the literal translation)
- Arabic translation
- Simple English meaning
- Natural example sentence in English
- When to use it
- Suggested category from: Work, Daily, Email, Interview, Grammar, Other

Rules:
- Always fill arabicTranslation with Arabic text only.
- Keep the meaning simple and beginner-friendly.
- Make the example practical.
- If the input is about English rules, sentence structure, or grammar words, choose Grammar.
- If the word is useful for workplace or interviews, choose Work or Interview.
- Return JSON only.`;

const inferSystemPrompt = `You are an English vocabulary assistant for an Arabic speaker building a personal vocabulary card.

The input may be:
1. A direct word or phrase (English or Arabic) they want translated and explained.
2. A description or question (English or Arabic) asking what word or phrase fits a situation or feeling — for example "وش الكلمة اللي اقولها اذا انا احب واحد" or "what do you call someone who never gives up".

Decide which kind of input this is:
- If it's direct, use it as-is (translate Arabic to English first if needed).
- If it's a description or question, infer the single best English word or phrase that answers it, and treat that as the word.

Generate a vocabulary card with:
- English word or phrase
- Arabic translation
- Simple English meaning
- Natural example sentence in English
- When to use it
- Suggested category from: Work, Daily, Email, Interview, Grammar, Other

Rules:
- englishWordOrPhrase must be a short, natural English word or phrase — never a full sentence restating the user's question.
- Always fill arabicTranslation with Arabic text only.
- Keep the meaning simple and beginner-friendly.
- Make the example practical and, when the input was a description, reflect that situation naturally.
- If the input is about English rules, sentence structure, or grammar words, choose Grammar.
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
  const mode = req.body?.mode === "literal" ? "literal" : "infer";

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
        { role: "system", content: mode === "literal" ? literalSystemPrompt : inferSystemPrompt },
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
