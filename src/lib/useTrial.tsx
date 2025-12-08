// lib/useTrial.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import { useTrialState } from './hooks/useTrialState';
import { useLocalStorage } from './hooks/use-local-storage';

interface TrialContextType {
  participantId: string;
  setParticipantId: (id: string) => void;

  studyId: string | null;
  setStudyId: (x: string | null) => void;

  sessionId: string | null;
  setSessionId: (x: string | null) => void;

  interfaceMode: string;
  setInterfaceMode: (mode: string) => void;

  questionId: string;
  setQuestionId: (id: string) => void;

  aiAnswer: "yes" | "no" | null;
  correctAnswer: "yes" | "no" | null;
  setAiAnswer: (x: "yes" | "no") => void;
  setCorrectAnswer: (x: "yes" | "no") => void;

  finalAnswer: "yes" | "no" | null;
  correctness: boolean | null;
  agreement: boolean | null;

  confidenceAI: number | null;
  confidenceSelf: number | null;

  searchUsed: boolean;
  searchClickCount: number;
  searchFirstTime: number | null;

  linkClickCount: number;
  recordExternalLink: () => void;

  markAnswerDisplayFinished: () => void;
  answerDisplayedAt: number | null;

  setFinalAnswer: (x: any) => void;
  setCorrectness: (x: any) => void;
  setAgreement: (x: any) => void;

  setConfidenceAI: (x: any) => void;
  setConfidenceSelf: (x: any) => void;

  recordSearchClick: () => void;

  computeResponseTime: () => number;
  computeCorrectness: (fa: "yes" | "no") => boolean;
  computeAgreement: (fa: "yes" | "no") => boolean;

  reset: () => void;
}

const TrialContext = createContext<TrialContextType | null>(null);

// =============================================================
// PROVIDER
// =============================================================
export function TrialProvider({ children }) {
  /** -------------------------------
   * PARTICIPANT ID (LOCAL STORAGE)
   * -------------------------------- */
  const [participantIdStored, setParticipantIdStored] = useLocalStorage(
    'participant-id',
    crypto.randomUUID()
  );

  function setParticipantId(id: string) {
    setParticipantIdStored(id);
  }

  /** -------------------------------
   * Prolific Parameters
   * -------------------------------- */
  const [studyId, setStudyId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  /** -------------------------------
   * Interface mode
   * -------------------------------- */
  const [interfaceMode, setInterfaceMode] = useState("baseline");

  /** -------------------------------
   * Question ID
   * -------------------------------- */
  const [questionId, setQuestionId] = useState("");

  /** -------------------------------
   * AI answer + Correct answer
   * -------------------------------- */
  const [aiAnswer, setAiAnswer] = useState<"yes" | "no" | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<"yes" | "no" | null>(null);

  /** -------------------------------
   * Search tracking
   * -------------------------------- */
  const [searchClickCount, setSearchClickCount] = useState(0);

  const trialState = useTrialState();

  function recordSearchClick() {
    setSearchClickCount((x) => x + 1);

    if (!trialState.searchUsed) {
      trialState.setSearchUsed(true);
      trialState.setSearchFirstTime(Date.now());
    }
  }

  /** -------------------------------
   * Reset between questions
   * -------------------------------- */
  const reset = () => {
    trialState.reset();
    setSearchClickCount(0);
  };

  /** -------------------------------
   * CONTEXT VALUE
   * -------------------------------- */
  const value: TrialContextType = {
    participantId: participantIdStored,
    setParticipantId,

    studyId,
    setStudyId,

    sessionId,
    setSessionId,

    interfaceMode,
    setInterfaceMode,

    questionId,
    setQuestionId,

    aiAnswer,
    correctAnswer,
    setAiAnswer,
    setCorrectAnswer,

    ...trialState, // timing, link clicks, correctness, etc.

    recordSearchClick,
    searchClickCount,

    reset,
  };

  return (
    <TrialContext.Provider value={value}>
      {children}
    </TrialContext.Provider>
  );
}

// =============================================================
// Hook
// =============================================================
export function useTrial() {
  const ctx = useContext(TrialContext);
  if (!ctx) throw new Error("useTrial must be used inside <TrialProvider>");
  return ctx;
}
