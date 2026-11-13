import React from 'react';
import { Link } from 'react-router-dom';

const Recruitment: React.FC = () => {
  return (
    <div className="fade-in">
      <section className="pt-24 pb-12 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-6 block">Services</span>
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">Recruitment</h1>
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
            Discreet, standards-led hiring support for leaders who need exceptional operational talent.
          </p>
        </div>
      </section>

      <section className="pt-12 pb-4 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-brand-charcoal/80 font-light leading-relaxed mb-10">
              Finding the right virtual assistant or operational support professional is rarely just a matter of skills. Fit, judgement, discretion, and working style matter just as much.
            </p>
            <p className="text-brand-charcoal/70 leading-relaxed mb-0">
              Tegemea’s recruitment service helps founders and professional service leaders identify, assess, and engage high-calibre support talent — with the same care and standards we apply to our own team.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-brand-sand/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h2 className="text-3xl font-serif text-brand-navy mb-8">What We Support</h2>
              <p className="text-brand-charcoal/70 mb-8 leading-relaxed font-light">
                Whether you need a dedicated virtual assistant, an operations lead, or specialist administrative support, we help you hire with clarity and confidence.
              </p>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Typical Engagements</h4>
                <ul className="space-y-4">
                  {[
                    'Virtual assistant and executive support roles',
                    'Operational and coordination positions',
                    'Role scoping and candidate brief development',
                    'Structured screening and skills assessment',
                    'Interview support and final shortlist recommendations'
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
              <h3 className="text-2xl font-serif mb-6 relative z-10">Our Approach</h3>
              <p className="text-white/80 mb-10 leading-relaxed italic font-light relative z-10">
                “We recruit for capability and character — not just availability.”
              </p>
              <div className="space-y-8 relative z-10">
                <div>
                  <h4 className="text-brand-gold font-bold text-[10px] uppercase tracking-widest mb-4">What You Can Expect</h4>
                  <ul className="space-y-3 text-sm text-white/70 font-light">
                    {[
                      'A clear role definition before outreach begins',
                      'Candidates assessed against real working standards',
                      'Discreet handling throughout the process',
                      'Practical recommendations you can act on'
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
            <h2 className="text-4xl font-serif mb-4">How It Works</h2>
            <p className="text-white/50 font-light">A structured process designed to protect your time and raise the quality of hire.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { s: '01', t: 'Define the Brief', d: 'We clarify the role, working style, and standards required for a successful hire.' },
              { s: '02', t: 'Assess Candidates', d: 'We screen and evaluate talent against practical capability, discretion, and cultural fit.' },
              { s: '03', t: 'Support the Decision', d: 'You receive a shortlist with clear recommendations so you can hire with confidence.' }
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
          <h2 className="text-4xl font-serif text-brand-navy mb-8">Looking to Hire?</h2>
          <p className="text-lg text-brand-charcoal/70 font-light mb-12 leading-relaxed">
            If you need exceptional operational talent without the noise of open-market hiring, we would be glad to discuss your brief.
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

export default Recruitment;
