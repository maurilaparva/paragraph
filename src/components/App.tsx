'use client';
import { useLocalStorage } from '../lib/hooks/use-local-storage.ts';
import { toast } from 'react-hot-toast';
import { type Message } from 'ai/react';
import React, { useState, useEffect, useCallback } from 'react';

import ChatListContainer from './chat-list-container.tsx';
import WebSearchPanel from './WebSearchPanel.tsx';
import PostTrialSurvey from './PostTrialSurvey.tsx';
import { ChatScrollAnchor } from './chat-scroll-anchors.tsx';

import { useNodesState, useEdgesState } from 'reactflow';
import { useAtom } from 'jotai';
import { viewModeAtom } from '../lib/state.ts';
import { Button } from './ui/button.tsx';

import 'reactflow/dist/style.css';
import { PreStudyScreen } from './PreStudyScreen';
import { PostStudyScreen } from './PostStudyScreen';
import { askGpt4Once } from '../lib/openai-client.ts';
import { CustomGraphNode, CustomGraphEdge } from '../lib/types.ts';
import { FROZEN_RESPONSES } from '../lib/frozenResponses.ts';
import { TrialProvider, useTrial } from '../lib/useTrial.tsx';

const FIXED_INTERFACE_MODE = 'paragraph'; 
/* --------------------- Normalization --------------------- */
const normalizeQuestion = (q: string) =>
  q
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');

/* --------------------- Truth table --------------------- */
const TRUE_TABLE: Record<
  string,
  { gt: 'yes' | 'no'; ai: 'yes' | 'no' }
> = {
  'did dupilumab receive fda approval for asthma before chronic rhinosinusitis': {
    gt: 'yes',
    ai: 'no',
  },
  'is there more antihistamine in benadryl than rhinocort': {
    gt: 'yes',
    ai: 'no',
  },
  'is deep vein thrombosis a common side effect of ocella': {
    gt: 'no',
    ai: 'yes',
  },
  'is spironolactone an fdaapproved drug for treating acne': {
    gt: 'no',
    ai: 'yes',
  },
  'are both simvastatin and ambien drugs recommended to be taken at night': {
    gt: 'yes',
    ai: 'yes',
  },
  'is uveitis a common symptom of ankylosing spondylitis': {
    gt: 'yes',
    ai: 'yes',
  },
  'is fever a common symptom of jock itch': {
    gt: 'no',
    ai: 'no',
  },
  'can an adult who has not had chickenpox get shingles': {
    gt: 'no',
    ai: 'no',
  }
};

const UNCERTAINTY_TARGETS: Record<string, "low" | "medium" | "high"> = {
  'did dupilumab receive fda approval for asthma before chronic rhinosinusitis': 'medium',
  'is there more antihistamine in benadryl than rhinocort': 'high',
  'is deep vein thrombosis a common side effect of ocella': 'low',
  'is spironolactone an fdaapproved drug for treating acne': 'medium',
  'are both simvastatin and ambien drugs recommended to be taken at night': 'low',
  'is uveitis a common symptom of ankylosing spondylitis': 'medium',
  'is fever a common symptom of jock itch': 'high',
  'can an adult who has not had chickenpox get shingles': 'medium'
};

const QUESTION_IDS = Object.keys(TRUE_TABLE).reduce((acc, key, i) => {
  acc[key] = `q${i + 1}`;
  return acc;
}, {} as Record<string, string>);

/* --------------------- Question text (for auto-flow) --------------------- */
const QUESTIONS = [
  {
    id: 'q1',
    message: 'Did Dupilumab receive FDA approval for Asthma before Chronic Rhinosinusitis?'
  },
  {
    id: 'q2',
    message: 'Is there more antihistamine in Benadryl than Rhinocort?'
  },
  {
    id: 'q3',
    message: 'Is Deep Vein Thrombosis a common side effect of Ocella?'
  },
  {
    id: 'q4',
    message: 'Is Spironolactone an FDA-approved drug for treating acne?'
  },
  {
    id: 'q5',
    message: 'Are both Simvastatin and Ambien drugs recommended to be taken at night?'
  },
  {
    id: 'q6',
    message: 'Is Uveitis a common symptom of Ankylosing Spondylitis?'
  },
  {
    id: 'q7',
    message: 'Is fever a common symptom of Jock Itch?'
  },
  {
    id: 'q8',
    message: 'Can an adult who has not had chickenpox get shingles?'
  }
];

/* --------------------- Provider wrapper --------------------- */
export function Chat(props) {
  const [preStudyComplete, setPreStudyComplete] = useState(false);
  const [preStudyData, setPreStudyData] = useState<{
  age: string;
  education: string;
  aiStartTime: string;
  aiFrequency: string;
  aiUses: string[];
} | null>(null);

  if (!preStudyComplete) {
    return (
      <PreStudyScreen
        interfaceMode = {FIXED_INTERFACE_MODE}
        onComplete={(data) => {
          setPreStudyData(data);     // ⭐ store demographics
          setPreStudyComplete(true); // continue to study
        }}
      />
    );
  }

  return (
    <TrialProvider>
      <ChatInner {...props} preStudyData={preStudyData} />
    </TrialProvider>
  );
}


/* ============================================================
   MAIN COMPONENT
============================================================ */
function ChatInner({ id, initialMessages, preStudyData }) {
  const trial = useTrial();
  useEffect(() => {
    const url = new URL(window.location.href);

    const pid = url.searchParams.get("PROLIFIC_PID");
    const studyId = url.searchParams.get("STUDY_ID");
    const sessionId = url.searchParams.get("SESSION_ID");

    if (pid) trial.setParticipantId(pid);
    if (studyId) trial.setStudyId(studyId);
    if (sessionId) trial.setSessionId(sessionId);

    console.log("Prolific Params:", { pid, studyId, sessionId });
  }, []);
  const [postStudySubmitted, setPostStudySubmitted] = useState(false);
  const FIXED_INTERFACE_MODE = 'paragraph';   // 👈 this branch = baseline-only
  const hasOpenAiKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  const [questionNumber, setQuestionNumber] = useState(0); // 1..8 in the order *shown*
  const ENABLE_LIVE_MODE = false;

  const [useFrozen] = useState(true);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [nodes, setNodes] = useNodesState<CustomGraphNode>([]);
  const [edges, setEdges] = useEdgesState<CustomGraphEdge>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [qaCache, setQaCache] = useState<Record<string, string>>({});
  const [showSurvey, setShowSurvey] = useState(false);

  const [savedSearches, setSavedSearches] = useLocalStorage(
    'recommended-searches',
    { paragraph_level: [], token_level: [], relation_level: [] }
  );

  const [previewToken] = useLocalStorage('ai-token', null);
  const [serperToken] = useLocalStorage('serper-token', null);

  // 🔀 randomized question order: array of indices into QUESTIONS (0..7)
  const [questionOrder] = useState<number[]>(() => {
    const n = QUESTIONS.length;
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);
  const [studyFinished, setStudyFinished] = useState(false);
  async function submitPostStudyToSheet(postData, demographics) {
    const WEB_APP_URL =
      "https://script.google.com/macros/s/AKfycbw3x92gcd2Fov1j57tF-grx-bBnxpCuI_OI6y4j5MbCppRhw_RKTqf68_y9CN8VaBWz/exec";

    const body = {
      participantId: trial.participantId,
      interfaceMode: trial.interfaceMode,

      age: demographics?.age ?? "",
      education: demographics?.education ?? "",
      aiStartTime: demographics?.aiStartTime ?? "",
      aiFrequency: demographics?.aiFrequency ?? "",
      aiUses: (demographics?.aiUses ?? []).join(", "),

      trustBelief: postData.trustBelief,
      trustIntention: postData.trustIntention,
      anthropomorphism: postData.anthropomorphism,
      transparency1: postData.transparency1,
      transparency2: postData.transparency2,
      interfaceExperience: postData.interfaceExperience ?? "",
      validationMotivation: postData.validationMotivation ?? "",

      RawData: { postData, demographics }
    };

    const request = fetch(`${WEB_APP_URL}?t=${Date.now()}`, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const timeout = new Promise(resolve => setTimeout(resolve, 1500));

    // ⭐ RETURN the race so await works properly
    return Promise.race([request, timeout]);
  }


  /* ---------------- Submit trial to Google Sheets ---------------- */
  async function submitTrialToSheet(surveyData) {
    const WEB_APP_URL =
      'https://script.google.com/macros/s/AKfycbw3x92gcd2Fov1j57tF-grx-bBnxpCuI_OI6y4j5MbCppRhw_RKTqf68_y9CN8VaBWz/exec';

    const body = {
      participantId: trial.participantId,
      interfaceMode: trial.interfaceMode,
      questionId: trial.questionId,
      Ordering: questionNumber,            // 1,2,3,… in *display* order
      GroundTruth: trial.correctAnswer,    // “yes” or “no”
      AI_Answer: trial.aiAnswer,           // “yes” or “no”

      finalAnswer: surveyData.finalAnswer,
      ConfidenceAI: surveyData.aiConfidence,
      ConfidenceAnswer: surveyData.selfConfidence,

      UseAI: surveyData.useAI ? 'TRUE' : 'FALSE',
      UseLink: surveyData.useLink ? 'TRUE' : 'FALSE',
      UseInternet: surveyData.useInternet ? 'TRUE' : 'FALSE',

      Correct: trial.correctness ? 'TRUE' : 'FALSE',
      Agree: trial.agreement ? 'TRUE' : 'FALSE',

      Time: trial.computeResponseTime() / 1000,
      LinkClick: Number(trial.linkClickCount ?? 0),
      SearchClick: trial.searchClickCount,

      RawData: { surveyData, trialState: trial }
    };

    try {
      await fetch(`${WEB_APP_URL}?t=${Date.now()}`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.error('Failed to submit trial:', err);
    }
  }

  /* ---------------- When system submits a question ---------------- */
  const append = useCallback(
    async (msg: any) => {
      const userText = typeof msg === 'string' ? msg : msg.content ?? '';
      if (!userText.trim()) return;

      const normalized = normalizeQuestion(userText);
      const qid = QUESTION_IDS[normalized];

      // If normalized key is not in TRUE_TABLE, bail
      trial.setQuestionId(qid);
      setQuestionNumber((n) => n + 1);

      const entry = TRUE_TABLE[normalized];
      if (!entry) {
        toast.error('Question not found in TRUE_TABLE');
        return;
      }

      trial.setCorrectAnswer(entry.gt);
      trial.setAiAnswer(entry.ai);

      const newUser: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText,
      };

      /* FROZEN MODE */
      if (useFrozen) {
        const frozen = FROZEN_RESPONSES[normalized];
        if (!frozen) {
          toast.error('No frozen response found.');
          return;
        }

        const resString = JSON.stringify(frozen);
        const newAssistant: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: resString,
        };

        if (frozen.recommended_searches) {
          setSavedSearches(frozen.recommended_searches);
        }

        setQaCache((p) => ({ ...p, [normalized]: resString }));
        setMessages((prev) => [...prev, newUser, newAssistant]);

        // Show survey immediately
        setShowSurvey(true);
        return;
      }

      /* LIVE MODE (kept for completeness but disabled) */
      if (!ENABLE_LIVE_MODE) {
        toast.error('Live Mode is disabled in this deployment.');
        return;
      }

      if (qaCache[normalized]) {
        const cached = qaCache[normalized];

        const cachedAssistant: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cached,
        };

        try {
          const json = JSON.parse(cached);
          if (json?.recommended_searches) {
            setSavedSearches(json.recommended_searches);
          }
        } catch { }

        setMessages((prev) => [...prev, newUser, cachedAssistant]);

        setShowSurvey(true);
        return;
      }

      // Live fetch
      setIsLoading(true);

      const tempAssistant: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Generating answer…',
      };

      setMessages((prev) => [...prev, newUser, tempAssistant]);

      try {
        const uncertaintyLevel = UNCERTAINTY_TARGETS[normalized] ?? "medium";

        const raw = await askGpt4Once(
          userText,
          entry.ai,
          uncertaintyLevel
        );
        const resString = typeof raw === 'string' ? raw : JSON.stringify(raw);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistant.id ? { ...m, content: resString } : m
          )
        );

        setQaCache((p) => ({ ...p, [normalized]: resString }));

        try {
          const json = JSON.parse(resString);
          if (json?.recommended_searches) {
            setSavedSearches(json.recommended_searches);
          }
        } catch { }

        setShowSurvey(true);
      } catch {
        toast.error('GPT-4 failed.');
        setMessages((prev) => prev.filter((m) => m.id !== tempAssistant.id));
      } finally {
        setIsLoading(false);
      }
    },
    [ENABLE_LIVE_MODE, qaCache, setSavedSearches, setMessages, setIsLoading, trial, useFrozen]
  );

  /* ---------------- Initialize mode + first question ---------------- */
  useEffect(() => {
    // Force this branch to a single interface mode
    setViewMode(FIXED_INTERFACE_MODE);
    trial.setInterfaceMode(FIXED_INTERFACE_MODE);
  }, [setViewMode, trial]);

  useEffect(() => {
    // On mount, schedule the first question in the randomized order
    if (questionOrder.length > 0) {
      setPendingQuestionIndex(questionOrder[0]);
    }
  }, [questionOrder]);

  // Whenever a pending question index is set, actually "send" that question
  useEffect(() => {
    if (pendingQuestionIndex === null) return;
    const q = QUESTIONS[pendingQuestionIndex];
    append(q.message);
    setPendingQuestionIndex(null);
  }, [pendingQuestionIndex, append]);

  /* ---------------- Show Survey ---------------- */
  const handleBackToHome = () => {
    setShowSurvey(true);
  };
  if (studyFinished) {
    return (
      <PostStudyScreen
        onComplete={async (postData) => {
          await submitPostStudyToSheet(postData, preStudyData);

          // ⭐ DIRECT REDIRECT TO PROLIFIC — no UI hangs ever again
          window.location.href =
            "https://app.prolific.com/submissions/complete?cc=C50IXWLR";
        }}
      />
    );
  }
if (postStudySubmitted) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-10 text-center">
      <h1 className="text-2xl font-semibold mb-4">Thank you for completing the study!</h1>
      <p className="text-gray-600 mb-8">
        Your responses have been recorded.  
        Please click the button below to confirm your submission on Prolific.
      </p>

      <a
        href="https://app.prolific.com/submissions/complete?cc=C50IXWLR"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Finish on Prolific
      </a>
    </div>
  );
}
  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="w-full flex justify-center">
      <div className="max-w-6xl w-full rounded-lg border bg-background p-6 flex">

        {/* LEFT SIDE: CHAT / STUDY FLOW */}
        <div className="flex-1 pr-6">
          <div className="flex justify-between items-center mb-4">
            
            <span className="text-sm text-gray-500">
              Question {Math.min(questionNumber + (messages.length > 0 ? 0 : 1), QUESTIONS.length)} of {QUESTIONS.length}
            </span>
          </div>


          {/* Normal question + chat display */}
          {!studyFinished && messages.length > 0 && (
            <>
              

              <div className="pt-4 md:pt-10 flex justify-center fade-in">
                <div className="max-w-2xl w-full text-center">
                  <ChatListContainer
                    key={messages.map((m) => m.id).join('|')}
                    messages={messages}
                    nodes={nodes}
                    edges={edges}
                    activeStep={0}
                    onLinkClick={() => trial.recordExternalLink()}
                  />
                  <ChatScrollAnchor trackVisibility={isLoading} />
                </div>
              </div>
            </>
          )}

          {/* Waiting for first/next question to render */}
          {!studyFinished && messages.length === 0 && (
            <div className="pt-10 flex justify-center">
              <div className="max-w-2xl w-full text-center">
                <p className="text-sm text-gray-600">
                  Preparing your next question…
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE PANELS */}
        <div className="flex flex-col gap-6 self-start w-[340px] overflow-hidden" style={{ width: "340px" }}>

          {/* Web Search Always Visible once there is a question */}
          {messages.length > 0 && !studyFinished && (
            <WebSearchPanel
              onSearchClick={() => trial.recordSearchClick()}
            />
          )}

          {/* SURVEY SIDEBAR */}
          {showSurvey && !studyFinished && (
            <PostTrialSurvey
              onDone={async (surveyData) => {
                // compute correctness + agreement
                trial.correctness =
                  surveyData.finalAnswer === trial.correctAnswer;
                trial.agreement =
                  surveyData.finalAnswer === trial.aiAnswer;

                await submitTrialToSheet(surveyData);

                // FULL RESET for next question
                setShowSurvey(false);
                setMessages([]);
                setNodes([]);
                setEdges([]);
                trial.reset();

                // Advance randomized order index and schedule the next Q
                setCurrentOrderIndex((prev) => {
                  const next = prev + 1;
                  if (next >= questionOrder.length) {
                    setStudyFinished(true);
                  } else {
                    setPendingQuestionIndex(questionOrder[next]);
                  }
                  return next;
                });
              }}
              onBack={() => setShowSurvey(false)}
              questionNumber={questionNumber}
            />
          )}
        </div>

      </div>
    </div>
  );
}
