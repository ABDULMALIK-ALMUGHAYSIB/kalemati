import React, { useState } from "react";
import { lessons } from "../data/lessons";

export function LessonsPage() {
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);

  if (selectedLesson) {
    return (
      <LessonDetails
        lesson={selectedLesson}
        onBack={() => setSelectedLessonId(null)}
      />
    );
  }

  return (
    <section className="page-stack lessons-page">
      <div className="lesson-list">
        {lessons.map((lesson) => (
          <button
            className="lesson-card"
            key={lesson.id}
            type="button"
            onClick={() => setSelectedLessonId(lesson.id)}
          >
            <span>{lesson.category}</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
            <div className="lesson-card-meta">
              <strong>{lesson.level}</strong>
              <strong>{lesson.duration}</strong>
              <strong>{lesson.sections.length} sections</strong>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function LessonDetails({ lesson, onBack }) {
  return (
    <section className="page-stack lessons-page">
      <button className="lesson-back-button" type="button" onClick={onBack}>
        Back to lessons
      </button>

      <article className="lesson-hero">
        <span>{lesson.category}</span>
        <h2>{lesson.title}</h2>
        <p>{lesson.description}</p>
        <div className="lesson-card-meta">
          <strong>{lesson.level}</strong>
          <strong>{lesson.duration}</strong>
          <strong>{lesson.sections.length} sections</strong>
        </div>
      </article>

      <article className="lesson-summary">
        <h3>Tips</h3>
        <div>
          {lesson.tips.map((tip) => (
            <p key={tip}>{tip}</p>
          ))}
        </div>
      </article>

      <div className="lesson-section-list">
        {lesson.sections.map((section) => (
          <article className="lesson-section" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>

            <div className="lesson-examples">
              {section.examples.map((example) => (
                <span key={example}>{example}</span>
              ))}
            </div>

            <p className="lesson-rule">{section.rule}</p>

            {section.correct && section.wrong ? (
              <div className="lesson-pair">
                <p><strong>Correct</strong> {section.correct}</p>
                <p><strong>Wrong</strong> {section.wrong}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <article className="lesson-summary">
        <h3>Common Mistakes</h3>
        <div className="lesson-pair">
          {lesson.commonMistakes.map((mistake) => (
            <React.Fragment key={mistake.wrong}>
              <p><strong>Wrong</strong> {mistake.wrong}</p>
              <p><strong>Correct</strong> {mistake.correct}</p>
            </React.Fragment>
          ))}
        </div>
      </article>

      <article className="lesson-summary">
        <h3>Quick Summary</h3>
        <div>
          {lesson.summary.map(([question, answer]) => (
            <p key={question}>
              <span>{question}</span>
              <strong>{answer}</strong>
            </p>
          ))}
        </div>
      </article>

      <article className="lesson-summary">
        <h3>Golden Rule</h3>
        <p className="lesson-rule">
          After Do, Does, Did, Don't, Doesn't, and Didn't, use the base form of the verb.
        </p>
        <div className="lesson-pair">
          {lesson.goldenRules.map((rule) => (
            <React.Fragment key={rule.correct}>
              <p><strong>Correct</strong> {rule.correct}</p>
              <p><strong>Wrong</strong> {rule.wrong}</p>
            </React.Fragment>
          ))}
        </div>
      </article>
    </section>
  );
}
