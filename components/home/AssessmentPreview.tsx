import React, { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOpeningNote } from '../../assessment/openingNote';

const HOW_IT_WORKS = [
  'You answer one question at a time, in your own words.',
  'It takes approximately 10–15 minutes to complete.',
  'You receive a free recommendation on screen. No email is required to start, or to see that result.',
  'There is no obligation to use Tegemea’s services.',
];

/**
 * Homepage entry to the operational support assessment.
 * The opening note is carried in navigation state and sessionStorage, never the URL.
 */
const AssessmentPreview: React.FC = () => {
  const navigate = useNavigate();
  const fieldId = useId();
  const howItWorksId = useId();
  const startLock = useRef(false);
  const [response, setResponse] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const startAssessment = () => {
    if (startLock.current) return;
    startLock.current = true;
    setIsStarting(true);
    const openingNote = response.trim();
    saveOpeningNote(openingNote);
    navigate('/assessment', { state: { openingNote } });
  };

  return (
    <section className="py-12 md:py-14 bg-brand-sand" aria-labelledby="assessment-preview-heading">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <p className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-3">
          Free operational support assessment
        </p>

        <div className="bg-[#FDFCFB] border-2 border-brand-navy/30 p-6 md:p-8">
          <h2
            id="assessment-preview-heading"
            className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight mb-4"
          >
            Not sure what operational support your business needs?
          </h2>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-8">
            Tell us what&apos;s taking up your time. Our free assessment will help you understand the support your
            business needs, how much time it may require, and whether outsourcing or recruitment could be the right fit.
          </p>

          <label htmlFor={fieldId} className="sr-only">
            Describe what is taking up your time
          </label>
          <textarea
            id={fieldId}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            rows={4}
            placeholder="For example, I'm spending too much time managing emails, coordinating projects and chasing tasks..."
            className="w-full bg-white border border-brand-navy/15 px-4 py-3 text-base text-brand-navy font-light leading-relaxed placeholder:text-brand-stone/80 focus:outline-none focus:border-brand-gold resize-y min-h-[8rem]"
          />

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={startAssessment}
              disabled={isStarting}
              className="px-8 py-4 bg-brand-navy text-white text-sm font-medium hover:bg-brand-charcoal transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {isStarting ? 'Starting…' : 'Start my free assessment'}
            </button>
            <p className="text-xs text-brand-stone font-light leading-relaxed">
              Takes approximately 10–15 minutes to complete
            </p>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setHowItWorksOpen((open) => !open)}
            aria-expanded={howItWorksOpen}
            aria-controls={howItWorksId}
            className="text-[11px] uppercase tracking-widest font-bold text-brand-navy/70 border-b border-brand-gold/70 pb-0.5 hover:text-brand-gold transition-colors"
          >
            How the assessment works
          </button>
          {howItWorksOpen && (
            <div id={howItWorksId} className="mt-4 border-l-2 border-brand-gold pl-5">
              <ul className="space-y-2 text-sm text-brand-charcoal/75 font-light leading-relaxed">
                {HOW_IT_WORKS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AssessmentPreview;
