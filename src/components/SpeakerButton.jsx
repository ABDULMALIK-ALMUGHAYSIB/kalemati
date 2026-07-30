import { useState } from "react";

export function SpeakerButton({ text, accent = "en-US", align = "start" }) {
  const [audioError, setAudioError] = useState("");

  function speak(rate) {
    const phrase = text.trim();

    if (!phrase) return;

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setAudioError("Audio is not supported on this device.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    const voices = window.speechSynthesis.getVoices();
    const normalizedAccent = accent.toLowerCase();
    const englishVoice =
      voices.find((voice) => voice.lang.toLowerCase() === normalizedAccent) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.lang = accent;
    utterance.rate = rate;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setAudioError("");
  }

  return (
    <span className={`speaker-wrap ${align}`}>
      <span className="pronunciation-speed-buttons" aria-label="Pronunciation speed buttons">
        <button type="button" aria-label={`Pronounce ${text} normally in ${accent}`} onClick={() => speak(1)}>
          🔊 Normal
        </button>
        <button type="button" aria-label={`Pronounce ${text} slowly in ${accent}`} onClick={() => speak(0.65)}>
          🐢 Slow
        </button>
      </span>
      {audioError ? <small className="audio-error">{audioError}</small> : null}
    </span>
  );
}
