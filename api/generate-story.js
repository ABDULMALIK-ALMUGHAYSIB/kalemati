import OpenAI from "openai";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    story: { type: "string" },
    storyArabic: { type: "string" }
  },
  required: ["story", "storyArabic"]
};

const systemPrompt = `You are an English tutor helping an Arabic speaker remember vocabulary through storytelling.

You will receive a list of English words or phrases the learner is trying to remember. Write one short, simple, coherent passage (6-10 sentences) in English that naturally uses every single word or phrase from the list at least once.

Set the passage in a concrete, relatable scenario from the learner's own life, so it is easy for them to picture and understand:
- Prefer their workday as an engineer at Huawei (a tech company) — standups, emails, meetings, deadlines, teammates, daily tasks.
- Only use a non-work everyday scenario (family, home, errands, commute) if it clearly fits the words better than a work scenario.

Rules:
- Wrap every target word or phrase in the story with double asterisks, e.g. **follow up**, exactly matching how it is used in the sentence (natural inflection is fine, e.g. **followed up**).
- Do not wrap any other word in double asterisks — only the exact words from the given list.
- Use every word from the list. Do not skip any.
- Keep grammar and vocabulary simple (intermediate English level).
- Make the story coherent and easy to follow, not just a list of sentences.
- Then provide a natural Arabic translation of the same passage in storyArabic (no bold markers needed there).
- Return JSON only.`;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

function buildWordList(words) {
  return words
    .map((word) => `- ${word.english}${word.arabic ? ` (${word.arabic})` : ""}`)
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const words = Array.isArray(req.body?.words) ? req.body.words : [];
  const cleanWords = words
    .map((word) => ({
      english: typeof word?.english === "string" ? word.english.trim() : "",
      arabic: typeof word?.arabic === "string" ? word.arabic.trim() : ""
    }))
    .filter((word) => word.english);

  if (!cleanWords.length) {
    return res.status(400).json({ error: "At least one word is required." });
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured on Vercel."
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Words:\n${buildWordList(cleanWords)}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "kalemati_story_generation",
          strict: true,
          schema: responseSchema
        }
      }
    });

    const rawContent = completion.choices[0]?.message?.content;
    const generated = JSON.parse(rawContent || "{}");

    return res.status(200).json({
      story: generated.story || "",
      storyArabic: generated.storyArabic || ""
    });
  } catch (error) {
    console.error("Story generation failed:", error);
    const message =
      error?.code === "insufficient_quota" || error?.status === 429
        ? "OpenAI quota exceeded. Check your billing or try another API key."
        : "Story generation failed. Please try again.";

    return res.status(500).json({ error: message });
  }
}
