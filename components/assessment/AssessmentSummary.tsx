import React from 'react';
import { buildReview } from '../../assessment/coverage';
import type { AssessmentRecord, ReviewItem } from '../../assessment/types';

const kindStyle: Record<ReviewItem['kind'], string> = {
  confirmed: 'border-brand-gold bg-white',
  derived: 'border-brand-gold/50 bg-white',
  words: 'border-brand-navy/10 bg-white',
  unknown: 'border-dashed border-brand-navy/20 bg-transparent',
  skipped: 'border-dashed border-brand-navy/20 bg-transparent',
};

const AssessmentSummary: React.FC<{ record: AssessmentRecord }> = ({ record }) => {
  const sections = buildReview(record);

  return (
    <section className="mt-8 border border-brand-navy/15 bg-[#FDFCFB] p-6 md:p-8" aria-labelledby="assessment-review-heading">
      <p className="text-[10px] uppercase tracking-[0.28em] text-brand-gold font-bold mb-2">What we recorded</p>
      <h2 id="assessment-review-heading" className="text-2xl md:text-3xl font-serif text-brand-navy mb-3">
        Your requirements so far
      </h2>
      <p className="text-sm text-brand-charcoal/70 font-light leading-relaxed mb-6">
        This is a record of what you said. It is not a staffing recommendation or a price. A weekly total is shown
        only when you gave one, or when you gave both a daily figure and the number of days. Anything not stated is
        marked as not confirmed.
      </p>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="font-serif text-brand-navy mb-3">{section.title}</h3>
            <ul className="space-y-2">
              {section.items.map((item, index) => (
                <li key={`${section.title}-${item.label}-${index}`} className={`border-l-2 pl-4 py-2 ${kindStyle[item.kind]}`}>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-stone mb-1">{item.label}</p>
                  <p className="text-sm text-brand-charcoal/80 font-light leading-relaxed whitespace-pre-wrap">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AssessmentSummary;
