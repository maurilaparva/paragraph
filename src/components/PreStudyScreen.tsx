'use client';

import React, { useMemo, useState } from 'react';

const ATTENTION_FAIL_LINK =
  'https://app.prolific.com/submissions/complete?cc=C100G96V';
const COMPREHENSION_FAIL_LINK =
  'https://app.prolific.com/submissions/complete?cc=C440E5TS';
const SCREENING_FAIL_LINK =
  'https://app.prolific.com/submissions/complete?cc=CFPS5XSX';

type ScreeningQ = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};
const TASK_DIRECTIONS = (interfaceMode: InterfaceMode) => (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
    <p className="text-sm font-semibold text-gray-900">Your Task:</p>

    <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
      <li>
        Answer <strong>8 yes/no questions</strong>, one at a time.
      </li>
      <li>
        Use any combination of the available resources to inform your decision. 
        There is no required approach.
      </li>
      <li>
        <strong>Important:</strong> If you use web search, use only the search panel 
        in the interface—do not open external browser tabs.
      </li>
      <li>
        After each answer, you'll briefly indicate your confidence and which 
        information sources you used.
      </li>
    </ul>
  </div>
);
const TOOL_OVERVIEW_BASELINE = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">Tool Overview</p>

    <p className="text-sm text-gray-700 leading-relaxed">
      You will be interacting with this interface to make a <strong>Yes/No decision</strong> for each question.
    </p>

    <p className="text-sm text-gray-700 leading-relaxed">
      The interface includes an <strong>AI-generated answer</strong>, <strong>linked sources</strong>,
      a <strong>web search panel</strong>, and an <strong>answer selection panel</strong>.
    </p>

    <p className="text-sm text-gray-700 leading-relaxed">
      The <strong>Sources</strong> section and <strong>Web Search</strong> panel may be used to gather
      additional non-AI information if you choose. If you use web search, please use the search
      panel provided in the interface rather than external websites.
    </p>

    <p className="text-sm text-gray-700 leading-relaxed">
      Participants may rely on different combinations of the AI answer, sources, or web search
      when making their decision. There is no single correct strategy for interacting with the interface.
    </p>
  </div>
);

const TOOL_OVERVIEW_UNCERTAINTY = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">Tool Overview</p>

    <p className="text-sm text-gray-700 leading-relaxed">
      You will be interacting with this interface to make a <strong>Yes/No decision</strong> for each question.
    </p>

    <p className="text-sm text-gray-700 leading-relaxed">
      In addition to the <strong>AI-generated answer</strong>, <strong>linked sources</strong>,
      <strong> web search panel</strong>, and <strong>answer selection panel</strong>, this interface
      also includes <strong>uncertainty scores</strong> that provide additional information
      about the AI-generated content.
    </p>

    <p className="text-sm text-gray-700 leading-relaxed">
      The <strong>Sources</strong> section and <strong>Web Search</strong> panel may be used to gather
      additional non-AI information if you choose. If you use web search, please use the search
      panel provided in the interface rather than external websites.
    </p>

    <p className="text-sm text-gray-700 leading-relaxed">
      Participants may rely on different combinations of the AI answer, uncertainty scores,
      sources, or web search when making their decision. There is no single correct strategy for
      interacting with the interface.
    </p>
  </div>
);

const UNCERTAINTY_EXPLANATION_PARAGRAPH = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Uncertainty Score Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li>
        The interface displays an <strong>Uncertainty Score (0–100)</strong> for each AI-generated answer.
      </li>
      <li>
        This score reflects how confident the AI model is in its response. Higher scores mean lower confidence.
      </li>
      <li>
        <strong>Important:</strong> The uncertainty score does not tell you whether the answer is correct or incorrect.
      </li>
      <li>
        Score ranges: <strong>0–25</strong> (low uncertainty), <strong>25–75</strong> (medium uncertainty), <strong>75–100</strong> (high uncertainty).
      </li>
    </ul>
  </div>
);

const UNCERTAINTY_EXPLANATION_TOKEN = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Uncertainty Score Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li>
        Each word in the AI-generated answer has an associated <strong>Uncertainty Score (0–100)</strong>.
        You can hover over a word to view its score, and words with uncertainty above the slider threshold
        are highlighted.
      </li>
      <li>
        This score reflects how confident the AI model is in that specific part of the response.
        Higher scores mean lower confidence.
      </li>
      <li>
        <strong>Important:</strong> Word-level uncertainty does not indicate whether a word or statement is correct or incorrect.
      </li>
      <li>
        Score ranges: <strong>0–25</strong> (low uncertainty), <strong>25–75</strong> (medium uncertainty), <strong>75–100</strong> (high uncertainty).
      </li>
    </ul>
  </div>
);

const UNCERTAINTY_EXPLANATION_RELATION = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Uncertainty Score Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li>
        The AI-generated output consists of a <strong>main claim</strong> with an associated
        <strong> Uncertainty Score (0–100)</strong>, along with <strong>supporting</strong> and
        <strong> attacking sub-arguments</strong> that aim to support or challenge the claim.
        Each sub-argument also has its own uncertainty score.
      </li>
      <li>
        These scores reflect how confident the AI model is in each claim or sub-argument.
        Higher scores mean lower confidence.
      </li>
      <li>
        <strong>Important:</strong> Higher uncertainty does not mean a claim or relationship is incorrect.
      </li>
      <li>
        Score ranges: <strong>0–25</strong> (low uncertainty), <strong>25–75</strong> (medium uncertainty), <strong>75–100</strong> (high uncertainty).
      </li>
    </ul>
  </div>
);

const FIGURE_OVERVIEW_BASELINE = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Figure Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li><strong>(1) AI Answer</strong> – displays the AI-generated answer to the question.</li>
      <li><strong>(2) Sources Section</strong> – lists references associated with the AI-generated answer.</li>
      <li><strong>(3) Web Search Panel</strong> – allows searching for related information within the interface.</li>
      <li><strong>(4) Answer Selection Panel</strong> – allows you to select your final Yes/No answer and respond to follow-up questions about confidence and information sources used.</li>
    </ul>
  </div>
);

const FIGURE_OVERVIEW_PARAGRAPH = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Figure Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li><strong>(1) AI Answer</strong> – displays the AI-generated answer to the question.</li>
      <li><strong>(2) Sources Section</strong> – lists references associated with the AI-generated answer.</li>
      <li><strong>(3) Web Search Panel</strong> – allows searching for related information within the interface.</li>
      <li><strong>(4) Answer Selection Panel</strong> – allows you to select your final Yes/No answer and respond to follow-up questions about confidence and information sources used.</li>
      <li><strong>(5) Uncertainty Score</strong> – displays a single uncertainty score (0-100%) for the AI-generated answer as a whole.</li>
    </ul>
  </div>
);

const FIGURE_OVERVIEW_TOKEN = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Figure Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li><strong>(1) AI Answer</strong> – displays the AI-generated answer to the question.</li>
      <li><strong>(2) Sources Section</strong> – lists references associated with the AI-generated answer.</li>
      <li><strong>(3) Web Search Panel</strong> – allows searching for related information within the interface.</li>
      <li><strong>(4) Answer Selection Panel</strong> – allows you to select your final Yes/No answer and respond to follow-up questions about confidence and information sources used.</li>
      <li><strong>(5) Uncertainty Score</strong> – displays uncertainty for each individual word (0-100%) using colored highlights within the AI-generated answer.</li>
    </ul>
  </div>
);

const FIGURE_OVERVIEW_RELATION = (
  <div className="bg-gray-50 border rounded-md p-4 space-y-2">
    <p className="text-sm font-medium text-gray-800">
      Figure Overview
    </p>
    <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
      <li><strong>(1) AI Answer</strong> – displays the AI-generated answer, organized into a central claim and multiple attacking or supporting sub-arguments.</li>
      <li><strong>(2) Sources Section</strong> – lists references associated with the AI-generated answer.</li>
      <li><strong>(3) Web Search Panel</strong> – allows searching for related information within the interface.</li>
      <li><strong>(4) Answer Selection Panel</strong> – allows you to select your final Yes/No answer and respond to follow-up questions about confidence and information sources used.</li>
      <li><strong>(5) Uncertainty Score</strong> – displays uncertainty scores (0-100%) for the central claim of the output and each attacking or supporting sub-argument.</li>
    </ul>
  </div>
);

const SCREENING_QUESTIONS: ScreeningQ[] = [
  {
    id: 's1',
    prompt: 'Which feature would be least relevant for predicting income?',
    options: [
      'Years of education',
      'Job industry',
      'Annual working hours',
      'Favorite color'
    ],
    correctIndex: 3,
  },
  {
    id: 's2',
    prompt: 'Which indicates poor data quality?',
    options: [
      'Variables with different units',
      'Missing or inconsistent values',
      'A large number of rows',
      'Both numerical and categorical data'
    ],
    correctIndex: 1,
  },
  {
    id: 's3',
    prompt: 'According to the table below, what were sales in 2022?',
    options: ['120,000', '150,000', '180,000', '610'],
    correctIndex: 1,
  },
  {
    id: 's4',
    prompt: 'According to the line chart, what was the value in 2022?',
    options: ['15', '18', '20', 'Not shown'],
    correctIndex: 1,
  },
  {
    id: 's5',
    prompt:
      'Suppose data show that crime rates tend to be higher on hotter days. What conclusion is most appropriate?',
    options: [
      'Temperature causes crime',
      'Crime causes temperature',
      'They may be correlated, but causation is unclear',
      'They are unrelated'
    ],
    correctIndex: 2,
  },
];

type PreStudyScreenProps = {
  interfaceMode: 'baseline' | 'paragraph' | 'relation' | 'token';
  onComplete: (data: {
    age: string;
    education: string;
    aiStartTime: string;
    aiFrequency: string;
    aiUses: string[];
  }) => void;
};

type Step =
  | 'screening'
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
      id: 'b-q2',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
    {
      id: 'b-q3',
      prompt: 'Is the AI answer always guaranteed to be correct?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
  ],
  paragraph: [
    {
      id: 'p-q1',
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
      id: 'p-q2',
      prompt: 'What is your task for each question?',
      options: [
        'Rate paragraphs',
        'Summarize paragraphs',
        'Read the answer + uncertainty value, then choose your own Yes/No answer',
      ],
      correctIndex: 2,
    },
    {
      id: 'p-q3',
      prompt:
        'Does a higher uncertainty value guarantee the paragraph is incorrect?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
    {
      id: 'p-q4',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
  ],
  relation: [
    {
      id: 'r-q1',
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
      id: 'r-q2',
      prompt: 'What is your task for each question?',
      options: [
        'Describe the diagram',
        'Choose the most uncertain edge',
        'Read the answer + sub-arguments + their uncertainties, then choose your own Yes/No answer',
      ],
      correctIndex: 2,
    },
    {
      id: 'r-q3',
      prompt:
        'Do higher uncertainty values mean the relationship is incorrect?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
    {
      id: 'r-q4',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
  ],
  token: [
    {
      id: 't-q1',
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
      id: 't-q2',
      prompt: 'What is your task for each question?',
      options: [
        'Identify uncertain words',
        'Rate the highlight colors',
        'Read the highlighted answer, then choose your own Yes/No answer',
      ],
      correctIndex: 2,
    },
    {
      id: 't-q3',
      prompt:
        'Do red-highlighted words mean the statement is incorrect?',
      options: ['Yes', 'No'],
      correctIndex: 1,
    },
    {
      id: 't-q4',
      prompt:
        'Can you use the sources provided in the answer or the web search panel?',
      options: ['No', 'Yes'],
      correctIndex: 1,
    },
  ],
};
function ScreeningTable() {
  return (
    <table className="border text-sm mt-2">
      <thead>
        <tr>
          <th className="border px-2">Year</th>
          <th className="border px-2">Sales</th>
          <th className="border px-2">Customers</th>
        </tr>
      </thead>
      <tbody>
        <tr><td className="border px-2">2021</td><td className="border px-2">120,000</td><td className="border px-2">450</td></tr>
        <tr><td className="border px-2">2022</td><td className="border px-2">150,000</td><td className="border px-2">520</td></tr>
        <tr><td className="border px-2">2023</td><td className="border px-2">180,000</td><td className="border px-2">610</td></tr>
      </tbody>
    </table>
  );
}
function ScreeningLineChart() {
  return (
    <svg width="260" height="170" className="mt-2">
      {/* Y-axis */}
      <line x1="40" y1="20" x2="40" y2="120" stroke="black" />
      <text x="10" y="95" fontSize="10">15</text>
      <text x="10" y="65" fontSize="10">18</text>
      <text x="10" y="35" fontSize="10">20</text>

      {/* Y-axis label */}
      <text
        x="-50"
        y="12"
        fontSize="10"
        transform="rotate(-90 10,15)"
      >
        Value
      </text>

      {/* X-axis */}
      <line x1="40" y1="120" x2="230" y2="120" stroke="black" />
      <text x="90" y="140" fontSize="10">2021</text>
      <text x="140" y="140" fontSize="10">2022</text>
      <text x="190" y="140" fontSize="10">2023</text>

      {/* X-axis label */}
      <text x="120" y="160" fontSize="10">
        Year
      </text>

      {/* Line */}
      <polyline
        points="40,95 140,65 230,45"
        fill="none"
        stroke="black"
        strokeWidth="2"
      />

      {/* Point highlight for 2022 */}
      <circle cx="140" cy="65" r="3" fill="black" />
    </svg>
  );
}

export function PreStudyScreen({ interfaceMode, onComplete }: PreStudyScreenProps) {
  const [step, setStep] = useState<Step>('screening');
const [age, setAge] = useState("");
const [education, setEducation] = useState("");
const [aiStartTime, setAiStartTime] = useState("");

const [aiFrequency, setAiFrequency] = useState("");
const [aiUses, setAiUses] = useState<string[]>([]);
  const [screeningAnswers, setScreeningAnswers] =
  useState<Record<string, number>>({});
  const [screeningAttempts, setScreeningAttempts] = useState(0);
const [screeningError, setScreeningError] = useState('');
  const [attention1Passed, setAttention1Passed] = useState<boolean | null>(null);
  const [attention2Passed, setAttention2Passed] = useState<boolean | null>(null);

  const [attn1Answer, setAttn1Answer] = useState('');
  const [attn2Answer, setAttn2Answer] = useState('');

  const [compAttempts, setCompAttempts] = useState(0);
  const [compAnswers, setCompAnswers] = useState<Record<string, number>>({});
  const [compError, setCompError] = useState('');
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
        {step === 'screening' && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Eligibility Check</h2>
            <p className="text-sm text-gray-700">
              Please answer the following questions.
            </p>

            {SCREENING_QUESTIONS.map(q => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium">{q.prompt}</p>

                {q.id === 's3' && <ScreeningTable />}
                {q.id === 's4' && <ScreeningLineChart />}

                {q.options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={screeningAnswers[q.id] === idx}
                      onChange={() =>
                        setScreeningAnswers(prev => ({ ...prev, [q.id]: idx }))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            {screeningError && (
              <p className="text-sm text-red-600">{screeningError}</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const correct = SCREENING_QUESTIONS.filter(
                    q => screeningAnswers[q.id] === q.correctIndex
                  ).length;

                  if (correct >= 4) {
                    setStep('demographics1');
                  } else if (screeningAttempts === 0) {
                    setScreeningAttempts(1);
                    setScreeningError(
                      'Some answer/s were incorrect. Please review and try once more.'
                    );
                  } else {
                    window.location.href = SCREENING_FAIL_LINK;
                  }
                }}
                className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm"
              >
                Continue
              </button>
            </div>
          </section>
        )}

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

          <p className="text-sm text-gray-700">
            <strong>Please read the following information carefully before continuing.</strong>
          </p>


          <div className="border rounded-md overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}images/${interfaceMode}.jpg`}
              alt={`${interfaceMode} interface screenshot`}
              className="w-full"
            />
          </div>
        

            {interfaceMode === 'baseline' && FIGURE_OVERVIEW_BASELINE}
            {interfaceMode === 'paragraph' && FIGURE_OVERVIEW_PARAGRAPH}
            {interfaceMode === 'token' && FIGURE_OVERVIEW_TOKEN}
            {interfaceMode === 'relation' && FIGURE_OVERVIEW_RELATION}


            {interfaceMode === 'paragraph' && UNCERTAINTY_EXPLANATION_PARAGRAPH}
            {interfaceMode === 'token' && UNCERTAINTY_EXPLANATION_TOKEN}
            {interfaceMode === 'relation' && UNCERTAINTY_EXPLANATION_RELATION}

            {TASK_DIRECTIONS(interfaceMode)}
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
