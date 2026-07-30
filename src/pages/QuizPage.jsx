import { useEffect, useMemo, useState } from "react";
import { Brain, Check } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { Field, TextInput } from "../components/FormFields";
import { LoadingState } from "../components/LoadingState";
import { SpeakerButton } from "../components/SpeakerButton";
import { normalizeArabic, shuffle } from "../utils/helpers";

export function QuizPage({ accent, entries }) {
  const entryIdsKey = useMemo(() => entries.map((entry) => entry.id).sort().join("|"), [entries]);
  const [quizIds, setQuizIds] = useState([]);
  const [quizState, setQuizState] = useState({
    index: 0,
    answer: "",
    submittedQuestionId: null,
    score: { correct: 0, total: 0 }
  });
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const quizItems = useMemo(
    () => quizIds.map((id) => entriesById.get(id)).filter(Boolean),
    [entriesById, quizIds]
  );
  const current = quizItems[quizState.index];
  const isSubmitted = Boolean(current && quizState.submittedQuestionId === current.id);

  useEffect(() => {
    setQuizIds(shuffle(entries).map((entry) => entry.id));
    setQuizState({
      index: 0,
      answer: "",
      submittedQuestionId: null,
      score: { correct: 0, total: 0 }
    });
  }, [entryIdsKey]);

  function submitAnswer(event) {
    event.preventDefault();
    if (!current || isSubmitted) return;
    const isCorrect = normalizeArabic(quizState.answer) === normalizeArabic(current.arabic);
    setQuizState((value) => ({
      ...value,
      submittedQuestionId: current.id,
      score: {
        correct: value.score.correct + (isCorrect ? 1 : 0),
        total: value.score.total + 1
      }
    }));
  }

  function nextQuestion() {
    setQuizState((value) => ({
      ...value,
      index: value.index + 1 >= quizItems.length ? 0 : value.index + 1,
      answer: "",
      submittedQuestionId: null
    }));
  }

  if (!entries.length) {
    return (
      <EmptyState
        icon={<Brain size={32} />}
        title="Quiz is empty"
        text="Add words to start a quiz."
      />
    );
  }

  if (!quizIds.length || !current) {
    return <LoadingState text="Preparing your quiz..." />;
  }

  return (
    <section className="page-stack quiz-page">
      <div className="score-bar">
        <span>Score</span>
        <strong>
          {quizState.score.correct}/{quizState.score.total}
        </strong>
      </div>

      <article className="quiz-card">
        <span>Translate to Arabic</span>
        <div className="center-title-row">
          <h2>{current.english}</h2>
          <SpeakerButton
            text={current.english}
            accent={accent}
            align="center"
          />
        </div>
      </article>

      <form className="word-form" onSubmit={submitAnswer} key={current.id}>
        <Field label="Arabic translation">
          <TextInput
            arabic
            value={quizState.answer}
            onChange={(event) =>
              setQuizState((value) => ({ ...value, answer: event.target.value }))
            }
            placeholder="اكتب المعنى"
          />
        </Field>

        {isSubmitted ? (
          <div className="answer-panel">
            <span>Correct answer</span>
            <strong dir="rtl" lang="ar">{current.arabic}</strong>
          </div>
        ) : null}

        {!isSubmitted ? (
          <button className="primary-button" type="submit">
            <Check size={18} />
            Submit
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={nextQuestion}>
            Next
          </button>
        )}
      </form>
    </section>
  );
}
