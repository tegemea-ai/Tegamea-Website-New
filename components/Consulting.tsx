import React from 'react';
import { Link } from 'react-router-dom';

const Consulting: React.FC = () => {
  return (
    <div className="fade-in">
      <section className="pt-24 pb-12 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-6 block">Services</span>
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">Consulting</h1>
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            Strategic operational consulting for leaders who need clarity, structure, and sustainable systems.
          </p>
        </div>
      </section>

      <section className="pt-12 pb-4 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-brand-charcoal/80 font-light leading-relaxed mb-10">
              Growth often exposes operational friction — unclear ownership, overloaded calendars, fragmented handovers, and systems that no longer match the business.
            </p>
            <p className="text-brand-charcoal/70 leading-relaxed mb-0">
              Tegemea’s consulting work helps founders and professional service leaders diagnose those issues and put practical infrastructure in place so execution becomes reliable again.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-brand-sand/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h2 className="text-3xl font-serif text-brand-navy mb-8">Where We Help</h2>
              <p className="text-brand-charcoal/70 mb-8 leading-relaxed font-light">
                Our consulting engagements focus on the operational layer that sits between strategy and delivery — the systems, rhythms, and roles that keep high-trust businesses moving.
              </p>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Focus Areas</h4>
                <ul className="space-y-4">
                  {[
                    'Operational assessments and priority mapping',
                    'Delegation frameworks and role design',
                    'Workflow, inbox, and diary architecture',
                    'Team onboarding and working standards',
                    'Support model design for scaling firms'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-brand-navy text-sm border-b border-brand-navy/5 pb-4">
                      <span className="w-1.5 h-1.5 bg-brand-gold rounded-full shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-brand-navy text-white p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rotate-45"></div>
              <h3 className="text-2xl font-serif mb-6 relative z-10">Why Leaders Engage Us</h3>
              <p className="text-white/80 mb-10 leading-relaxed italic font-light relative z-10">
                “Consulting should leave you with clearer systems — not just clearer slides.”
              </p>
              <div className="space-y-8 relative z-10">
                <div>
                  <h4 className="text-brand-gold font-bold text-[10px] uppercase tracking-widest mb-4">Engagement Style</h4>
                  <ul className="space-y-3 text-sm text-white/70 font-light">
                    {[
                      'Practical recommendations grounded in real operations',
                      'Clear prioritisation rather than exhaustive documentation',
                      'Confidential support for senior decision-makers',
                      'Pathways into ongoing retainer support where useful'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <span className="text-brand-gold font-bold text-lg leading-none shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-navy text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border border-white rotate-12"></div>
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif mb-4">How Engagements Run</h2>
            <p className="text-white/50 font-light">A focused process designed to create operational clarity quickly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { s: '01', t: 'Diagnose', d: 'We review how work currently moves — where time is lost, ownership is unclear, and friction builds.' },
              { s: '02', t: 'Design', d: 'We define practical structures, rhythms, and role expectations that fit how your business actually operates.' },
              { s: '03', t: 'Implement', d: 'You receive a clear action plan, with optional Tegemea support to put the recommendations into practice.' }
            ].map((step, i) => (
              <div key={i} className="p-8 border border-white/10 bg-white/5 backdrop-blur-sm">
                <span className="text-brand-gold font-bold text-xs mb-4 block tracking-widest">{step.s}</span>
                <h4 className="text-xl font-serif mb-4">{step.t}</h4>
                <p className="text-sm text-white/50 leading-relaxed font-light">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-serif text-brand-navy mb-8">Need Operational Clarity?</h2>
          <p className="text-lg text-brand-charcoal/70 font-light mb-12 leading-relaxed">
            If your business has outgrown its current systems, a focused consulting conversation is often the right first step.
          </p>
          <Link
            to="/contact"
            className="inline-block px-12 py-5 bg-brand-gold text-brand-navy font-bold text-sm uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-brand-gold/10"
          >
            Book a Consultation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Consulting;
