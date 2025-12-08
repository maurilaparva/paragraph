'use client';

import React, { useMemo, useState } from 'react';

const ATTENTION_FAIL_LINK =
  'https://app.prolific.com/submissions/complete?cc=C100G96V';
const COMPREHENSION_FAIL_LINK =
  'https://app.prolific.com/submissions/complete?cc=C440E5TS';

type PreStudyScreenProps = {
  onComplete: (data: {
    age: string;
    education: string;
    aiStartTime: string;
    aiFrequency: string;
    aiUses: string[];
  }) => void;
};

type Step =
  | 'demographics1'
  | 'attention1'
  | 'demographics2'
  | 'attention2'
  | 'tutorial'
  | 'comprehension'
  | 'done';

type InterfaceMode = 'baseline' | 'paragraph' | 'relation' | 'token';

function getInterfaceModeFromUrl(): InterfaceMode {
  if (typeof window === 'undefined') return 'baseline';
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (
    mode === 'baseline' ||
    mode === 'paragraph' ||
    mode === 'relation' ||
    mode === 'token'
  ) {
    return mode;
  }
  return 'baseline';
}

/* ---------------- Comprehension config per mode ---------------- */

type CompQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

const COMPREHENSION_BY_MODE: Record<InterfaceMode, CompQuestion[]> = {
  baseline: [
    {
      id: 'b-q1',
      prompt: 'How many questions will you answer?',
      options: ['4', '6', '8', '12'],
      correctIndex: 2,
    },
    {
      id: 'b-q2',
      prompt: 'What is your task for each question?',
      options: [
        'Ignore the AI',
        'Rewrite the AI answer',
        'Read the question + AI answer, then choose your own Yes/No answer',
        'Rate the readability',
      ],
      correctIndex: 2,
    },
    {
      id: 'b-q3',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
    {
      id: 'b-q4',
      prompt: 'Is the AI answer always guaranteed to be correct?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
  ],
  paragraph: [
    {
      id: 'p-q1',
      prompt: 'How many questions will you answer?',
      options: ['4', '6', '8', '12'],
      correctIndex: 2,
    },
    {
      id: 'p-q2',
      prompt: 'What additional information does this interface show?',
      options: [
        'Token highlights',
        'A graph',
        'An uncertainty value (0–100) for the answer',
        'None',
      ],
      correctIndex: 2,
    },
    {
      id: 'p-q3',
      prompt: 'What is your task for each question?',
      options: [
        'Rate paragraphs',
        'Summarize paragraphs',
        'Read the answer + uncertainty value, then choose your own Yes/No answer',
      ],
      correctIndex: 2,
    },
    {
      id: 'p-q4',
      prompt:
        'Does a higher uncertainty value guarantee the paragraph is incorrect?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
    {
      id: 'p-q5',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
  ],
  relation: [
    {
      id: 'r-q1',
      prompt: 'How many questions will you answer?',
      options: ['4', '6', '8', '12'],
      correctIndex: 2,
    },
    {
      id: 'r-q2',
      prompt: 'What visualization appears in this interface?',
      options: [
        'Token highlights',
        'Paragraph uncertainty',
        'A diagram with uncertainty values (0–100) on sub-arguments',
        'None',
      ],
      correctIndex: 2,
    },
    {
      id: 'r-q3',
      prompt: 'What is your task for each question?',
      options: [
        'Describe the diagram',
        'Choose the most uncertain edge',
        'Read the answer + sub-arguments + their uncertainties, then choose your own Yes/No answer',
      ],
      correctIndex: 2,
    },
    {
      id: 'r-q4',
      prompt:
        'Do higher uncertainty values mean the relationship is incorrect?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
    {
      id: 'r-q5',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
  ],
  token: [
    {
      id: 't-q1',
      prompt: 'How many questions will you answer?',
      options: ['4', '6', '8', '12'],
      correctIndex: 2,
    },
    {
      id: 't-q2',
      prompt: 'What additional information does this interface show?',
      options: [
        'Paragraph labels',
        'A relationship diagram',
        'Word-level uncertainty highlighting',
        'None',
      ],
      correctIndex: 2,
    },
    {
      id: 't-q3',
      prompt: 'What is your task for each question?',
      options: [
        'Identify uncertain words',
        'Rate the highlight colors',
        'Read the highlighted answer, then choose your own Yes/No answer',
      ],
      correctIndex: 2,
    },
    {
      id: 't-q4',
      prompt:
        'Do red-highlighted words mean the statement is incorrect?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
    {
      id: 't-q5',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
  ],
};

export function PreStudyScreen({ children, onComplete }: PreStudyScreenProps) {
  const [step, setStep] = useState<Step>('demographics1');
const [age, setAge] = useState("");
const [education, setEducation] = useState("");
const [aiStartTime, setAiStartTime] = useState("");

const [aiFrequency, setAiFrequency] = useState("");
const [aiUses, setAiUses] = useState<string[]>([]);
  const [attention1Passed, setAttention1Passed] = useState<boolean | null>(null);
  const [attention2Passed, setAttention2Passed] = useState<boolean | null>(null);

  const [attn1Answer, setAttn1Answer] = useState('');
  const [attn2Answer, setAttn2Answer] = useState('');

  const [compAttempts, setCompAttempts] = useState(0);
  const [compAnswers, setCompAnswers] = useState<Record<string, number>>({});
  const [compError, setCompError] = useState('');

  const interfaceMode = useMemo(() => getInterfaceModeFromUrl(), []);
  const compQuestions = useMemo(() => COMPREHENSION_BY_MODE[interfaceMode], [interfaceMode]);

  /* ---------------------- Logic unchanged ---------------------- */

  function handleAttention1Next() {
    if (!attn1Answer) return;
    const passed = attn1Answer === '2';
    setAttention1Passed(passed);
    setStep('demographics2');
  }

  function handleAttention2Next() {
    if (!attn2Answer) return;
    const passed = attn2Answer === 'strongly_disagree' || attn2Answer === 'disagree';
    setAttention2Passed(passed);

    const failBoth = attention1Passed === false && passed === false;
    if (failBoth) {
      window.location.href = ATTENTION_FAIL_LINK;
      return;
    }

    setStep('tutorial');
  }

  const allCompAnswered = compQuestions.every(q => typeof compAnswers[q.id] === 'number');

  function handleComprehensionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allCompAnswered) {
      setCompError('Please answer all comprehension questions.');
      return;
    }

    const allCorrect = compQuestions.every(q => compAnswers[q.id] === q.correctIndex);
    if (allCorrect) {
      setStep('done');
      return;
    }

    if (compAttempts === 0) {
      setCompAttempts(1);
      setCompError("That's incorrect. Please try again.");
      return;
    }

    window.location.href = COMPREHENSION_FAIL_LINK;
  }

  if (step === 'done') {
    onComplete({
      age,
      education,
      aiStartTime,
      aiFrequency,
      aiUses
    });  // ⭐ tell App.tsx that the prestudy is finished
    return null;   // rendering nothing is fine because App will switch view
    }

  /* ----------------------------------------------------------
     PROFESSIONAL UI WRAPPER (new)
  ---------------------------------------------------------- */
  return (
    <div
            className="w-full flex justify-center py-10 px-4"
            style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            letterSpacing: '-0.01em'
            }}
        >
      <div className="max-w-2xl w-full bg-white border rounded-xl shadow-sm p-8 space-y-8">

        {/* HEADER */}
        <header className="border-b pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome to Our Study</h1>
          <p className="text-sm text-gray-600 mt-1">
            Please complete the following short questionnaire before beginning the main task.
          </p>
        </header>

        {/* ---------------- STEP 1 ---------------- */}
        {step === 'demographics1' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Demographics</h2>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Age *</label>
                <select
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm focus:ring-1"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    >
                  <option value="">Select your age range</option>
                  <option>18–24</option><option>25–34</option><option>35–44</option>
                  <option>45–54</option><option>55–64</option><option>65+</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Highest education level *</label>
                <select
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    >
                  <option value="">Select your highest education level</option>
                  <option>High school</option><option>Some college</option>
                  <option>Associate’s degree</option><option>Bachelor’s degree</option>
                  <option>Master’s degree</option><option>Doctoral degree</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">When did you start using AI tools?</label>
                <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                value={aiStartTime}
                onChange={(e) => setAiStartTime(e.target.value)}
                >
                  <option value="">Select one</option>
                  <option>Within the last 6 months</option>
                  <option>6–12 months ago</option>
                  <option>1–2 years ago</option>
                  <option>More than 2 years ago</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep('attention1')}
                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-black transition"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* ---------------- STEP 2 (Attention 1) ---------------- */}
        {step === 'attention1' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Response Task 1</h2>
            <p className="text-sm text-gray-700">Please select the option "2" below.</p>

            <div className="space-y-2">
              {['1','2','3','4','5'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="attention1"
                    value={opt}
                    checked={attn1Answer === opt}
                    onChange={(e) => setAttn1Answer(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('demographics1')}
                className="px-4 py-2 border rounded-md text-sm"
              >
                Back
              </button>
              <button
                onClick={handleAttention1Next}
                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-black"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* ---------------- STEP 3 (Demographics 2) ---------------- */}
        {step === 'demographics2' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Demographics (continued)</h2>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">How often do you use AI tools?</label>
                <select
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                    value={aiFrequency}
                    onChange={(e) => setAiFrequency(e.target.value)}
                    >
                  <option value="">Select one</option>
                  <option>Never</option>
                  <option>A few times a month</option>
                  <option>A few times a week</option>
                  <option>Daily</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  What do you primarily use AI tools for? (Select all that apply)
                </label>
                <div className="mt-2 space-y-1">
                  {[
                    'Searching for information',
                    'Writing or editing text',
                    'Coding / technical work',
                    'Studying or learning',
                    'Creative tasks',
                    'Data analysis / research'
                  ].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={aiUses.includes(opt)}
                        onChange={(e) => {
                            if (e.target.checked) {
                            setAiUses((prev) => [...prev, opt]);
                            } else {
                            setAiUses((prev) => prev.filter((x) => x !== opt));
                            }                   
                        }}
                        />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep('attention2')}
                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-black"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* ---------------- STEP 4 (Attention 2) ---------------- */}
        {step === 'attention2' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Response Task 2</h2>

            <p className="text-sm text-gray-700">
              Indicate your agreement with the statement below:
            </p>
            <blockquote className="text-sm italic text-gray-800 border-l-4 border-gray-300 pl-3">
              “I swim across the Atlantic Ocean to get to work every day.”
            </blockquote>

            <div className="space-y-2 mt-3">
              {[
                { value: 'strongly_disagree', label: 'Strongly disagree' },
                { value: 'disagree', label: 'Disagree' },
                { value: 'agree', label: 'Agree' },
                { value: 'strongly_agree', label: 'Strongly agree' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="attention2"
                    value={opt.value}
                    checked={attn2Answer === opt.value}
                    onChange={(e) => setAttn2Answer(e.target.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('demographics2')}
                className="px-4 py-2 border rounded-md text-sm"
              >
                Back
              </button>
              <button
                onClick={handleAttention2Next}
                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-black"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* ---------------- STEP 5 (Tutorial) ---------------- */}
        {step === 'tutorial' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Tutorial</h2>

            <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
                {interfaceMode === 'baseline' && (
                    <>
                    <p>You will answer 8 questions, one at a time.</p>

                    <p>For each question, you will see:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>A medical yes/no question</li>
                        <li>An AI-generated answer</li>
                        <li>Sources provided in the answer</li>
                    </ul>

                    <p>You may use:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>The sources provided in the answer</li>
                        <li>The web search panel</li>
                    </ul>

                    <p>
                        Your task is to read the information and choose your own Yes/No answer.
                        After deciding, use the panel on the right to select your Yes/No
                        answer and respond to the additional questions.
                    </p>
                    </>
                )}

                {interfaceMode === 'paragraph' && (
                    <>
                    <p>You will answer 8 questions, one at a time.</p>

                    <p>For each question, you will see:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>A medical yes/no question</li>
                        <li>An AI answer divided into paragraphs</li>
                        <li>An uncertainty value (0–100) for each paragraph</li>
                        <li>Sources provided in the answer</li>
                    </ul>

                    <p>Uncertainty clarification:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>A lower value (near 0) means the model shows low uncertainty.</li>
                        <li>A higher value (near 100) means the model shows greater uncertainty.</li>
                        <li>These values do NOT indicate correctness or incorrectness.</li>
                    </ul>

                    <p>You may use the provided sources and web search panel.</p>
                    <p>
                        Your task is to read the answer and uncertainty values, then choose
                        your own Yes/No answer.
                    </p>
                    </>
                )}

                {interfaceMode === 'relation' && (
                    <>
                    <p>You will answer 8 questions, one at a time.</p>

                    <p>For each question, you will see:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>A medical yes/no question</li>
                        <li>An AI-generated answer</li>
                        <li>A diagram showing how sub-arguments support or attack the answer</li>
                        <li>An uncertainty value (0–100) for each sub-argument</li>
                        <li>Sources provided in the answer</li>
                    </ul>

                    <p>Uncertainty clarification:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>A lower value (near 0) means low uncertainty about that sub-argument.</li>
                        <li>A higher value (near 100) means higher uncertainty.</li>
                        <li>These values do NOT indicate correctness or incorrectness.</li>
                    </ul>

                    <p>
                        You may use the provided sources and the web search panel. Your task is
                        to read the AI answer + diagram + uncertainty values, then choose your
                        own Yes/No answer.
                    </p>
                    </>
                )}

                {interfaceMode === 'token' && (
                    <>
                    <p>You will answer 8 questions, one at a time.</p>

                    <p>For each question, you will see:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>A medical yes/no question</li>
                        <li>An AI-generated answer</li>
                        <li>Words highlighted with colors representing uncertainty</li>
                        <li>Sources provided in the answer</li>
                    </ul>

                    <p>Uncertainty clarification:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Lighter/white words → low uncertainty (near 0)</li>
                        <li>Darker/red-tinted words → higher uncertainty (near 100)</li>
                        <li>Highlights do NOT indicate correctness or incorrectness</li>
                    </ul>

                    <p>
                        You may use the provided sources and the web search panel. Your task is
                        to read the highlighted answer, then choose your own Yes/No answer.
                    </p>
                    </>
                )}
                </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep('comprehension')}
                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-black"
              >
                Continue to Readiness Check
              </button>
            </div>
          </section>
        )}

        {/* ---------------- STEP 6 (Comprehension) ---------------- */}
        {step === 'comprehension' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Readiness Check</h2>

            <form onSubmit={handleComprehensionSubmit} className="space-y-6">
              {compQuestions.map(q => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">{q.prompt}</p>

                  <div className="space-y-1">
                    {q.options.map((opt, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={q.id}
                          value={idx}
                          checked={compAnswers[q.id] === idx}
                          onChange={() =>
                            setCompAnswers(prev => ({ ...prev, [q.id]: idx }))
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {compError && (
                <p className="text-sm text-red-600">{compError}</p>
              )}

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('tutorial')}
                  className="px-4 py-2 border rounded-md text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-black"
                >
                  Continue
                </button>
              </div>
            </form>
          </section>
        )}

      </div>
    </div>
  );
}
