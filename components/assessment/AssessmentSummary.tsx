import React from 'react';
import { clientResult } from '../../assessment/role/recommend';
import type { AssessmentRecord } from '../../assessment/types';

const AssessmentSummary: React.FC<{ record: AssessmentRecord }> = ({ record }) => {
  const result = clientResult(record);
  if (!result) return null;

  return (
    <section className="mt-8 border border-brand-navy/15 bg-[#FDFCFB] p-6 md:p-8" aria-labelledby="assessment-review-heading">
      <p className="text-[10px] uppercase tracking-[0.28em] text-brand-gold font-bold mb-2">Leading recommendation</p>
      <h2 id="assessment-review-heading" className="text-2xl md:text-3xl font-serif text-brand-navy mb-3">
        {result.headline}
      </h2>
      <p className="text-sm text-brand-charcoal/70 font-light leading-relaxed mb-6">{result.status}</p>
      <div className="space-y-6">
        {result.sections.map((section) => (
          <div key={section.title}>
            <h3 className="font-serif text-brand-navy mb-3">{section.title}</h3>
            {section.body.length > 1 ? (
              <ul className="space-y-2">
                {section.body.map((line) => (
                  <li key={line} className="border-l-2 border-brand-gold pl-4 py-1 text-sm text-brand-charcoal/80 font-light leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-charcoal/80 font-light leading-relaxed">{section.body[0]}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default AssessmentSummary;
