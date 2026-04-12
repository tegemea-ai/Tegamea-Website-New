import React, { useEffect } from 'react';

declare global {
  interface Window {
    Bookings?: {
      inlineEmbed: (options: { url: string; parent: string; height: string }) => void;
    };
  }
}

const BOOKINGS_EMBED_SCRIPT_SRC = 'https://bookings.nimbuspop.com/assets/embed.js';
const BOOKINGS_EMBED_SCRIPT_ID = 'tegemea-bookings-nimbuspop-embed';
const INLINE_CONTAINER_ID = 'inline-container';

const BookConsultation: React.FC = () => {
  useEffect(() => {
    let cancelled = false;

    const initEmbed = () => {
      if (cancelled || !window.Bookings?.inlineEmbed) return;
      window.Bookings.inlineEmbed({
        url: 'https://abisola-tegemea.zohobookings.eu/portal-embed#/Virtual_Assistant_Consultation_Call',
        parent: `#${INLINE_CONTAINER_ID}`,
        height: '600px',
      });
    };

    const existing = document.getElementById(BOOKINGS_EMBED_SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      if (window.Bookings?.inlineEmbed) {
        initEmbed();
      } else {
        existing.addEventListener('load', initEmbed, { once: true });
      }
    } else {
      const script = document.createElement('script');
      script.id = BOOKINGS_EMBED_SCRIPT_ID;
      script.src = BOOKINGS_EMBED_SCRIPT_SRC;
      script.async = true;
      script.onload = () => initEmbed();
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      document.getElementById(INLINE_CONTAINER_ID)?.replaceChildren();
    };
  }, []);
  return (
    <div className="fade-in min-h-screen bg-white">
      {/* Header */}
      <section className="pt-24 pb-12 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-6 block">Strategic Alignment</span>
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">Book a Consultation</h1>
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            A structured conversation to assess fit and support needs.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-brand-charcoal/80 font-light leading-relaxed mb-8">
              Tegemea works with leaders and professional service businesses who value clarity, discretion, and dependable delivery. This free consultation is designed to determine whether our retainer-based support is the right fit for your business.
            </p>
            <div className="p-8 bg-brand-sand/40 border-l-4 border-brand-gold italic text-brand-navy">
              <p className="m-0 font-medium">This is not a sales call. It is a focused discussion grounded in your workload, priorities, and expectations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mb-16">
            <div>
              <h2 className="text-2xl font-serif text-brand-navy mb-8">What to Expect</h2>
              <ul className="space-y-6">
                {[
                  'Discuss your current operational challenges',
                  'Explore the type and volume of support required',
                  'Explain how Tegemea works and our retainer model',
                  'Recommend a suitable next step if there is alignment'
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-4 text-brand-charcoal/70 text-sm leading-relaxed">
                    <span className="text-brand-gold font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-xs text-brand-stone italic font-light">There is no obligation to proceed.</p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-brand-navy mb-8">Who This Is For</h2>
              <ul className="space-y-6">
                {[
                  'Directors',
                  'Founders',
                  'Consultants',
                  'HR/Ops Managers'
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-4 text-brand-charcoal/70 text-sm leading-relaxed">
                    <svg className="w-5 h-5 text-brand-gold/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-xs text-brand-navy font-bold uppercase tracking-widest">
                Not designed for ad-hoc or short-term task support.
              </p>
            </div>
          </div>

          <div className="mt-12 border border-brand-sand/60 rounded-sm overflow-hidden bg-white shadow-sm">
            <div id={INLINE_CONTAINER_ID} className="w-full min-h-[600px]" />
          </div>

          <div className="mt-12 text-center">
            <p className="text-brand-stone text-xs font-light">
              Prefer email? Contact us at{' '}
              <a href="mailto:info@tegemea.com" className="text-brand-gold font-medium hover:underline">
                info@tegemea.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookConsultation;
