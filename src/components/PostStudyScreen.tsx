'use client';

import React, { useState } from 'react';

const STUDY_FINISH_LINK =
  'https://app.prolific.com/submissions/complete?cc=C50IXWLR';

type LikertValue = 1 | 2 | 3 | 4 | 5;

type PostStudyResponses = {
  trustBelief?: LikertValue;          // perceived competence
  trustIntention?: LikertValue;       // willingness to reuse
  anthropomorphism?: LikertValue;     // human-likeness
  transparency1?: LikertValue;        // understanding basis
  transparency2?: LikertValue;        // understanding wrongness
   interfaceExperience?: string;     // Q6
  validationMotivation?: string;   // Q7
};

export function PostStudyScreen({ onComplete }: { onComplete: (data: PostStudyResponses) => void }) {
  const [responses, setResponses] = useState<PostStudyResponses>({});
  const [error, setError] = useState<string>('');

  const allAnswered =
    responses.trustBelief &&
    responses.trustIntention &&
    responses.anthropomorphism &&
    responses.transparency1 &&
    responses.transparency2 &&
    responses.interfaceExperience?.trim() &&
    responses.validationMotivation?.trim();

  function handleChange(field: keyof PostStudyResponses, value: LikertValue) {
    setResponses((prev) => ({ ...prev, [field]: value }));
  }
  function handleTextChange(
    field: 'interfaceExperience' | 'validationMotivation',
    value: string
  ) {
    setResponses((prev) => ({ ...prev, [field]: value }));
}

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!allAnswered) {
      setError('Please answer all questions before continuing.');
      return;
    }

    // TODO: Google Sheets logging here
    onComplete(responses);
  }

  const likertOptions: { value: LikertValue; label: string }[] = [
    { value: 1, label: 'Strongly disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neither agree nor disagree' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly agree' },
  ];

  return (
    <div
      className="w-full flex justify-center py-10 px-4"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        letterSpacing: '-0.01em',
      }}
    >
      <div className="max-w-3xl w-full rounded-lg border bg-background p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Post-Study Survey</h2>
          <p className="text-sm text-gray-600">
            Please indicate how much you agree with the following statements.
            (1 = Strongly disagree, 5 = Strongly agree)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TrustBelief */}
          <LikertQuestion
            label="The interface seemed competent at answering the medical questions."
            name="trustBelief"
            value={responses.trustBelief}
            onChange={(v) => handleChange('trustBelief', v)}
            options={likertOptions}
          />

          {/* TrustIntention */}
          <LikertQuestion
            label="I would be willing to use this interface again for similar medical questions."
            name="trustIntention"
            value={responses.trustIntention}
            onChange={(v) => handleChange('trustIntention', v)}
            options={likertOptions}
          />

          {/* Anthropomorphism */}
          <LikertQuestion
            label="The AI system felt human-like."
            name="anthropomorphism"
            value={responses.anthropomorphism}
            onChange={(v) => handleChange('anthropomorphism', v)}
            options={likertOptions}
          />

          {/* Transparency1 */}
          <LikertQuestion
            label="I felt I had a good understanding of what the AI system’s answers were based on."
            name="transparency1"
            value={responses.transparency1}
            onChange={(v) => handleChange('transparency1', v)}
            options={likertOptions}
          />

          {/* Transparency2 */}
          <LikertQuestion
            label="I felt I had a good understanding of when the AI system’s answers might be wrong."
            name="transparency2"
            value={responses.transparency2}
            onChange={(v) => handleChange('transparency2', v)}
            options={likertOptions}
          />
          {/* Q6: Interface Experience */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">
              6. Please describe your experience using this interface.
            </label>
            <p className="text-xs text-gray-600">
              You may comment on anything you found helpful, confusing, surprising,
              frustrating, or interesting.
            </p>
            <textarea
              value={responses.interfaceExperience ?? ''}
              onChange={(e) =>
                handleTextChange('interfaceExperience', e.target.value)
              }
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Your response..."
            />
          </div>

          {/* Q7: Validation Motivation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">
              7. If you used the validation tools (links or search), what motivated you to do so? If you did not, why not?
            </label>
            <textarea
              value={responses.validationMotivation ?? ''}
              onChange={(e) =>
                handleTextChange('validationMotivation', e.target.value)
              }
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Your response..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-gray-900 text-white"
            >
              Submit and complete study
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type LikertProps = {
  label: string;
  name: string;
  value?: LikertValue;
  options: { value: LikertValue; label: string }[];
  onChange: (v: LikertValue) => void;
};

function LikertQuestion({
  label,
  name,
  value,
  options,
  onChange,
}: LikertProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="flex flex-col gap-1 text-sm">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {opt.label} ({opt.value})
          </label>
        ))}
      </div>
    </div>
  );
}
