import { useState } from "react";
import { Eraser, LoaderCircle, Save, Sparkles } from "lucide-react";
import { CATEGORIES, STATUSES, emptyForm } from "../constants";
import { Field, TextArea, TextInput } from "../components/FormFields";
import { SegmentedControl } from "../components/SegmentedControl";
import { SpeakerButton } from "../components/SpeakerButton";
import { containsArabic } from "../utils/helpers";

export function AddWordPage({ accent, onSave }) {
  const [mode, setMode] = useState("AI Assist");
  const [translateMode, setTranslateMode] = useState("Literal");
  const [form, setForm] = useState(emptyForm);
  const [generated, setGenerated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleClear() {
    setForm(emptyForm);
    setGenerated(false);
    setAiError("");
    setSaveError("");
  }

  function handleTranslateModeChange(nextTranslateMode) {
    setTranslateMode(nextTranslateMode);
    handleClear();
  }

  async function handleAiGenerate() {
    const word = form.english.trim();

    if (!word) {
      setAiError("Type an English or Arabic word first.");
      setGenerated(false);
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/generate-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word,
          mode: translateMode === "Literal" ? "literal" : "infer"
        })
      });

      const data = await response.json().catch(() => ({
        error: "AI endpoint is not returning JSON. Check the deployment API route."
      }));

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed. Please try again.");
      }

      setForm((current) => ({
        ...current,
        english: data.englishWordOrPhrase || word,
        arabic: data.arabicTranslation || (containsArabic(word) ? word : ""),
        meaning: data.simpleMeaning || "",
        example: data.exampleSentence || "",
        usage: data.whenToUse || "",
        category: CATEGORIES.includes(data.category) ? data.category : "Other"
      }));
      setGenerated(true);
    } catch (error) {
      setAiError(error.message || "AI generation failed. Please try again.");
      setGenerated(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.english.trim() || !form.arabic.trim()) return;
    setSaveLoading(true);
    setSaveError("");

    try {
      await onSave({
        ...form,
        english: form.english.trim(),
        arabic: form.arabic.trim(),
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        usage: form.usage.trim()
      });
      setForm(emptyForm);
      setGenerated(false);
      setAiError("");
    } catch (error) {
      setSaveError(error.message || "Could not save this word.");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <SegmentedControl
        label="Add mode"
        options={["Quick Add", "AI Assist"]}
        value={mode}
        onChange={setMode}
      />

      <form className="word-form" onSubmit={handleSubmit}>
        <Field label="English or Arabic word / phrase">
          <TextInput
            arabic={containsArabic(form.english)}
            value={form.english}
            onChange={(event) => updateField("english", event.target.value)}
            placeholder="e.g. follow up / سمعة"
          />
        </Field>

        {mode === "AI Assist" ? (
          <>
            <SegmentedControl
              label="Translate mode"
              options={["Auto", "Literal"]}
              value={translateMode}
              onChange={handleTranslateModeChange}
            />
            <p className="inline-note">
              {translateMode === "Literal"
                ? "Translates exactly what you typed, even if it looks like a question."
                : "If you type a question or description, AI infers the word it's asking about."}
            </p>
            <button
              className="secondary-button"
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading}
            >
              {aiLoading ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
              {aiLoading ? "Generating..." : "Generate with AI"}
            </button>
          </>
        ) : null}

        {mode === "AI Assist" && generated ? (
          <div className="generated-audio">
            <p className="inline-note">Generated details are ready to edit before saving.</p>
            <SpeakerButton text={form.english} accent={accent} />
          </div>
        ) : null}

        {mode === "AI Assist" && aiError ? (
          <p className="error-note" role="alert">{aiError}</p>
        ) : null}

        <Field label="Arabic translation">
          <TextInput
            arabic
            value={form.arabic}
            onChange={(event) => updateField("arabic", event.target.value)}
            placeholder="اكتب الترجمة"
          />
        </Field>

        <Field label="Simple English meaning">
          <TextArea
            value={form.meaning}
            onChange={(event) => updateField("meaning", event.target.value)}
            placeholder="Short, simple meaning"
          />
        </Field>

        <Field label="Example sentence">
          <TextArea
            value={form.example}
            onChange={(event) => updateField("example", event.target.value)}
            placeholder="Use it in a sentence"
          />
        </Field>

        <Field label="Notes / when to use it">
          <TextArea
            value={form.usage}
            onChange={(event) => updateField("usage", event.target.value)}
            placeholder="Work, daily conversation, email..."
          />
        </Field>

        <div className="two-column">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
        </div>

        {saveError ? <p className="error-note" role="alert">{saveError}</p> : null}

        <div className="two-column">
          <button
            className="secondary-button"
            type="button"
            onClick={handleClear}
            disabled={saveLoading}
          >
            <Eraser size={18} />
            Clear
          </button>
          <button className="primary-button" type="submit" disabled={saveLoading}>
            {saveLoading ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
            {saveLoading ? "Saving..." : "Save Word"}
          </button>
        </div>
      </form>
    </section>
  );
}
