import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { stageForRecord } from '../../assessment/coverage';
import { createConversation } from '../../assessment/conversation';
import { openingNoteFromState, readOpeningNote, saveOpeningNote } from '../../assessment/openingNote';
import { clearSession, loadSession, saveSession } from '../../assessment/storage';
import { requestAssessmentTurn } from '../../assessment/turnClient';
import type { AssessmentSession } from '../../assessment/types';
import AssessmentProgress from './AssessmentProgress';
import AssessmentSummary from './AssessmentSummary';
import Conversation from './Conversation';
import MessageInput from './MessageInput';

const openingClaims = new Set<string>();

function beginSession(navigationState: unknown): AssessmentSession {
  const fromNavigation = openingNoteFromState(navigationState);
  const existing = loadSession();

  if (fromNavigation !== null) {
    if (existing && existing.openingNote === fromNavigation) return existing;
    if (fromNavigation) saveOpeningNote(fromNavigation);
    else saveOpeningNote('');
    const created = createConversation(fromNavigation || null);
    saveSession(created);
    return created;
  }

  if (existing) return existing;

  const stored = readOpeningNote();
  const created = createConversation(stored || null);
  saveSession(created);
  return created;
}

const AssessmentPage: React.FC = () => {
  const location = useLocation();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  useEffect(() => {
    setSession(beginSession(location.state));
    setError(null);
    setBusy(false);
  }, [location.state]);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const runTurn = async (current: AssessmentSession) => {
    if (sending.current || current.complete) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    const result = await requestAssessmentTurn({
      messages: current.messages.map(({ role, text }) => ({ role, text })),
      record: current.record,
      asked: current.asked,
    });
    sending.current = false;
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSession((existing) => {
      if (!existing) return existing;
      return {
        ...existing,
        messages: [
          ...existing.messages,
          { id: `m${existing.messages.length + 1}`, role: 'assistant', text: result.assistantMessage },
        ],
        record: result.record,
        asked: result.asked,
        pending: result.pending,
        complete: result.complete,
      };
    });
  };

  useEffect(() => {
    if (!session || sending.current) return;
    const last = session.messages[session.messages.length - 1];
    const hasAssistant = session.messages.some((message) => message.role === 'assistant');
    if (!last || last.role !== 'visitor' || hasAssistant) return;
    if (openingClaims.has(last.text)) return;
    openingClaims.add(last.text);
    void runTurn(session);
  }, [session]);

  const restart = () => {
    clearSession();
    saveOpeningNote('');
    const fresh = createConversation(null);
    saveSession(fresh);
    setSession(fresh);
    setError(null);
    setConfirmRestart(false);
  };

  const send = (text: string) => {
    if (!session || sending.current || session.complete) return;
    const withVisitor: AssessmentSession = {
      ...session,
      messages: [...session.messages, { id: `m${session.messages.length + 1}`, role: 'visitor', text }],
    };
    setSession(withVisitor);
    void runTurn(withVisitor);
  };

  if (!session) {
    return <div className="min-h-[50vh] bg-[#FDFCFB]" />;
  }

  const stage = stageForRecord(session.record, session.asked, session.complete);
  const lastMessage = session.messages[session.messages.length - 1];
  const replyIsWaiting =
    !busy && lastMessage?.role === 'visitor' && session.messages.some((message) => message.role === 'assistant');

  return (
    <div className="fade-in bg-[#FDFCFB] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <p className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-3">
          Free operational support assessment
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <h1 className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight">Operational support assessment</h1>
          <AssessmentProgress stage={stage} />
        </div>
        <p className="text-sm md:text-base text-brand-charcoal/70 font-light leading-relaxed mb-6 max-w-2xl">
          A guided conversation about the support your business needs. Answer in your own words, with as much or as
          little as you know. This stage records what you say. It does not recommend a role, estimate a workload figure
          you did not give, or calculate a cost.
        </p>

        <div className="border-2 border-brand-navy/20 bg-white p-4 sm:p-6">
          <Conversation messages={session.messages} />
          {busy && <p className="mt-4 text-sm text-brand-stone font-light">Reading that…</p>}
          <MessageInput disabled={session.complete} busy={busy} onSend={send} />
          {(error || replyIsWaiting) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm text-brand-charcoal/70 font-light">
                {error ?? 'This reply has not had a response yet.'}
              </p>
              <button
                type="button"
                onClick={() => void runTurn(session)}
                className="text-[11px] uppercase tracking-widest font-bold text-brand-navy border-b border-brand-gold pb-0.5"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {confirmRestart ? (
            <>
              <p className="text-sm text-brand-charcoal/70 font-light">This clears the conversation.</p>
              <button type="button" onClick={restart} className="text-[11px] uppercase tracking-widest font-bold text-brand-navy border-b border-brand-gold pb-0.5">
                Clear it
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestart(false)}
                className="text-[11px] uppercase tracking-widest font-bold text-brand-stone"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRestart(true)}
              className="text-[11px] uppercase tracking-widest font-bold text-brand-navy/60 border-b border-brand-navy/20 pb-0.5 hover:text-brand-gold hover:border-brand-gold"
            >
              Start again
            </button>
          )}
        </div>

        {session.complete && <AssessmentSummary record={session.record} />}
      </div>
    </div>
  );
};

export default AssessmentPage;
