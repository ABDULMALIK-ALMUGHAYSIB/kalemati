export const lessons = [
  {
    id: "do-does-did-negatives",
    title: "Do, Does, Did, Don't, Doesn't, Didn't",
    description: "Learn how to ask questions and make negative sentences in English.",
    category: "Grammar",
    duration: "6 min",
    level: "Beginner",
    tips: [
      "Use Are, Is, and Am for descriptions, feelings, and situations.",
      "Use Do and Does for present actions.",
      "Use Did for past actions, but keep the verb in base form.",
      "Use Don't, Doesn't, and Didn't when the sentence is negative."
    ],
    commonMistakes: [
      { wrong: "Did he worked?", correct: "Did he work?" },
      { wrong: "Does he works?", correct: "Does he work?" },
      { wrong: "He don't know.", correct: "He doesn't know." }
    ],
    sections: [
      {
        title: "1. Are / Is / Am",
        body: "Use Are, Is, and Am to describe a person, thing, or situation.",
        examples: ["Are you tired?", "Are you busy?", "Is he happy?", "Am I late?"],
        rule: "Use Are, Is, or Am when talking about a state, feeling, condition, or description."
      },
      {
        title: "2. Do / Does",
        body: "Use Do and Does to ask about actions in the present.",
        examples: ["Do you work here?", "Do you play football?", "Does he work here?", "Does she drive?"],
        rule: "Do = I, You, We, They. Does = He, She, It."
      },
      {
        title: "3. Did",
        body: "Use Did to ask about actions in the past.",
        examples: ["Did you call Ahmad?", "Did he work yesterday?", "Did she visit Riyadh?"],
        rule: "After Did, always use the base form of the verb.",
        correct: "Did he work?",
        wrong: "Did he worked?"
      },
      {
        title: "4. Don't",
        body: "Don't = Do Not",
        examples: ["I don't know.", "We don't have access.", "They don't like coffee."],
        rule: "Use Don't to make negative sentences in the present."
      },
      {
        title: "5. Doesn't",
        body: "Doesn't = Does Not",
        examples: ["He doesn't know.", "She doesn't work here.", "It doesn't matter."],
        rule: "Use Doesn't with He, She, and It."
      },
      {
        title: "6. Didn't",
        body: "Didn't = Did Not",
        examples: ["I didn't go.", "He didn't call me.", "They didn't arrive."],
        rule: "Use Didn't to make negative sentences in the past."
      }
    ],
    summary: [
      ["State or description?", "Are / Is / Am"],
      ["Present action?", "Do / Does"],
      ["Past action?", "Did"],
      ["Present negative?", "Don't / Doesn't"],
      ["Past negative?", "Didn't"]
    ],
    goldenRules: [
      { correct: "Did she go?", wrong: "Did she went?" },
      { correct: "Does he work?", wrong: "Does he works?" }
    ]
  }
];
