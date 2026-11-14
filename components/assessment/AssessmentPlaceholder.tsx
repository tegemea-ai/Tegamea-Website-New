import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { openingNoteFromState, readOpeningNote, saveOpeningNote } from '../../assessment/openingNote';

/**
 * Branded holding page for /assessment.
 * The conversational interview is a later step. This page keeps the opening note.
 */
const AssessmentPlaceholder: React.FC = () => {
  const location = useLocation();
  const fromState = openingNoteFromState(location.state);
  const [openingNote] = useState(() => fromState ?? readOpeningNote());

  useEffect(() => {
    if (fromState !== null) saveOpeningNote(fromState);
  }, [fromState]);

  return (
    <div className="fade-in min-h-screen bg-[#FDFCFB]">
      <section className="pt-16 pb-12 bg-brand-navy text-white">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <p className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-4">
            Free operational support assessment
          </p>
          <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-4">Welcome</h1>
          <p className="text-white/70 font-light leading-relaxed text-lg max-w-2xl">
            Thank you for starting. The full conversational assessment, one question at a time, is coming next.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {openingNote ? (
            <div>
              <h2 className="text-2xl font-serif text-brand-navy mb-4">Where you started</h2>
              <blockquote className="border-l-2 border-brand-gold pl-5 text-brand-charcoal/80 font-light leading-relaxed whitespace-pre-wrap">
                {openingNote}
              </blockquote>
              <p className="mt-6 text-sm text-brand-stone font-light leading-relaxed">
                This note is saved in this browser tab, so it will still be here if you refresh. It will open the
                conversation when that step is ready.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-serif text-brand-navy mb-4">You can begin without a note</h2>
              <p className="text-brand-charcoal/75 font-light leading-relaxed">
                You did not need to write anything on the homepage. When the conversation is ready, it will start with
                a welcome and a first question.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AssessmentPlaceholder;
