import React from 'react';
import { useNavigate } from 'react-router-dom';
import AssessmentPreview from './AssessmentPreview';
import {
  HERO,
  MORE_ROOM,
  SERVICES,
  ENGAGEMENT,
  WHY,
  HOW_WE_WORK,
  SOCIAL_PROOF,
  FINAL_CTA,
  TOOLS,
  IMAGES,
} from '../../constants/homepageContent';

const WhyIcon: React.FC<{ name: string }> = ({ name }) => {
  const common = 'w-6 h-6 text-brand-gold shrink-0';
  switch (name) {
    case 'Operational expertise':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'Specialist focus':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case 'UK-based professionals':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    case 'Flexibility as your business develops':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

/**
 * Homepage — Classic cream hierarchy + Focused conversion pace.
 * Cream over hero image; Classic service pillars; Editorial sand/navy engagement.
 */
const HybridHome: React.FC = () => {
  const navigate = useNavigate();
  const book = () => navigate('/contact');
  const marqueeTools = [...TOOLS, ...TOOLS];

  return (
    <div className="fade-in">
      {/* Hero — full-bleed image with cream layered over it */}
      <section className="relative min-h-[82vh] flex items-center overflow-hidden bg-brand-sand">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.hero}
            alt="Leadership team collaborating in a professional meeting"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Cream sits over the image so type stays on brand sand */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom right, rgba(245,242,237,0.94) 0%, rgba(245,242,237,0.9) 45%, rgba(245,242,237,0.82) 100%)',
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 py-16 md:py-24">
          <p className="text-brand-gold font-bold tracking-[0.35em] text-[10px] uppercase mb-6 fade-up">
            Tegemea
          </p>
          <h1 className="text-4xl md:text-6xl font-serif font-medium text-brand-navy leading-[1.12] max-w-4xl mb-6 fade-up fade-up-delay-1">
            Executive, project and operational support for{' '}
            <span className="italic text-brand-gold">professional service leaders.</span>
          </h1>
          <p className="text-xl md:text-2xl text-brand-charcoal/80 font-light leading-relaxed max-w-3xl mb-5 fade-up fade-up-delay-2">
            {HERO.supporting}
          </p>
          <p className="text-base text-brand-charcoal/70 font-light leading-relaxed max-w-2xl mb-10 fade-up fade-up-delay-3">
            {HERO.copy}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center fade-up fade-up-delay-4">
            <button
              onClick={book}
              className="px-8 py-4 bg-brand-navy text-white text-sm font-medium hover:bg-brand-charcoal transition-all active:scale-[0.98]"
            >
              {HERO.primaryCta}
            </button>
            <button
              onClick={() =>
                document.getElementById('services-hybrid')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-8 py-4 text-sm font-medium text-brand-navy border-b-2 border-brand-gold hover:text-brand-gold transition-colors"
            >
              {HERO.secondaryCta}
            </button>
          </div>
        </div>
      </section>

      {/* As featured in — early trust signal */}
      <section className="py-4 md:py-5 bg-white border-b border-brand-navy/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
            <span className="text-[9px] uppercase tracking-[0.4em] text-brand-stone font-bold opacity-60">
              As featured in
            </span>
            <a
              href="https://www.thetimes.com/static/startup-sme-legal-it-ip-eot-accountancy/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3"
            >
              <span className="text-xl md:text-2xl font-serif font-black tracking-tighter text-brand-navy border-b-2 border-transparent group-hover:border-brand-gold transition-all duration-500">
                THE TIMES
              </span>
              <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold bg-brand-sand px-3 py-1 border border-brand-gold/30">
                Online Edition
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* More room to lead — Classic two-column with image */}
      <section className="py-12 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight mb-5">
              {MORE_ROOM.headline}
            </h2>
            <div className="space-y-3 text-brand-charcoal/70 font-light leading-relaxed text-base md:text-lg">
              {MORE_ROOM.copy.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <div className="relative image-reveal">
            <div className="absolute inset-0 border-2 border-brand-gold/30 -m-4" />
            <img
              src={IMAGES.introduce}
              alt="Professionals collaborating in a meeting"
              className="relative w-full grayscale brightness-95 border border-brand-navy/10 shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Services — Classic three-pillar layout */}
      <section id="services-hybrid" className="py-12 md:py-14 bg-brand-sand/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mb-8">
            <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-3 block">
              Our support
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight">
              {SERVICES.headline}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-brand-navy/10 bg-white">
            {SERVICES.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-brand-navy/10 last:border-0 flex flex-col"
              >
                <h3 className="text-xl md:text-2xl font-serif text-brand-navy mb-2">{pillar.title}</h3>
                <p className="text-brand-gold text-sm italic mb-3">{pillar.tagline}</p>
                <p className="text-sm text-brand-charcoal/70 font-light leading-relaxed mb-4">
                  {pillar.description}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  {pillar.includes.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] text-brand-charcoal/70 leading-relaxed"
                    >
                      <span className="w-1 h-1 bg-brand-gold rounded-full mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={book}
                  className="text-[11px] uppercase tracking-widest font-bold text-brand-navy border-b-2 border-brand-gold pb-1 self-start hover:text-brand-gold transition-all"
                >
                  {pillar.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AssessmentPreview />

      {/* Flexible / Permanent — Editorial sand + navy split */}
      <section className="py-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <h2 className="text-3xl md:text-5xl font-serif text-brand-navy mb-12 leading-tight">
            {ENGAGEMENT.headline}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-brand-sand text-brand-navy px-8 md:px-12 lg:px-16 py-14 md:py-20">
            <p className="text-[10px] uppercase tracking-widest font-bold text-brand-gold mb-4">
              Flexible support
            </p>
            <h3 className="text-2xl md:text-3xl font-serif mb-6">{ENGAGEMENT.remote.title}</h3>
            <div className="space-y-4 text-brand-charcoal/70 font-light leading-relaxed">
              {ENGAGEMENT.remote.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <div className="bg-brand-navy text-white px-8 md:px-12 lg:px-16 py-14 md:py-20">
            <p className="text-[10px] uppercase tracking-widest font-bold text-brand-gold mb-4">
              Permanent solutions
            </p>
            <h3 className="text-2xl md:text-3xl font-serif mb-6">{ENGAGEMENT.permanent.title}</h3>
            <div className="space-y-4 text-white/65 font-light leading-relaxed mb-8">
              {ENGAGEMENT.permanent.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <button
              onClick={book}
              className="text-[11px] uppercase tracking-widest font-bold text-brand-gold border-b border-brand-gold pb-1 hover:text-white hover:border-white transition-all"
            >
              {ENGAGEMENT.cta}
            </button>
          </div>
        </div>
      </section>

      {/* Why — Focused two-column list */}
      <section className="py-16 md:py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-serif text-brand-navy mb-10">{WHY.headline}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {WHY.principles.map((p) => (
              <div key={p.title} className="flex gap-4">
                <WhyIcon name={p.title} />
                <div>
                  <h3 className="font-serif text-brand-navy mb-2">{p.title}</h3>
                  <p className="text-xs text-brand-charcoal/60 font-light leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work — Classic bordered cells + CTA */}
      <section className="py-12 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-serif text-brand-navy mb-8 leading-tight">
            {HOW_WE_WORK.headline}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-brand-navy/10 mb-8">
            {HOW_WE_WORK.steps.map((step) => (
              <div
                key={step.n}
                className="relative border-r border-b border-brand-navy/10 last:border-r-0 p-6 lg:p-8 hover:bg-brand-navy hover:text-white transition-all duration-500 group bg-white"
              >
                <span className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em] mb-4 block group-hover:text-white transition-colors">
                  0{step.n}
                </span>
                <h3 className="text-lg font-serif font-medium mb-3 text-brand-navy group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-charcoal/60 group-hover:text-white/60 transition-colors">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={book}
            className="px-8 py-3.5 bg-brand-navy text-white text-sm font-medium hover:bg-brand-charcoal transition-all active:scale-[0.98]"
          >
            {HOW_WE_WORK.cta}
          </button>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 md:py-14 bg-white border-t border-brand-navy/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-6">
            <h2 className="text-3xl font-serif text-brand-navy mb-2">
              {SOCIAL_PROOF.headline}
            </h2>
            <p className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">
              Placeholder — pending approved testimonials
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_PROOF.testimonials.map((t, i) => (
              <blockquote
                key={i}
                className="border border-dashed border-brand-gold/40 p-5 bg-brand-sand/30"
              >
                <p className="font-serif italic text-brand-navy/45 mb-3 text-sm">{t.quote}</p>
                <footer className="text-[9px] uppercase tracking-widest text-brand-stone">
                  {t.attribution}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Tools marquee — faded brand logos; extend via TOOLS in homepageContent */}
      <section className="py-8 bg-[#FAF9F6] border-y border-brand-navy/5" aria-label="Software we work with">
        <p className="text-center text-[9px] uppercase tracking-[0.35em] text-brand-stone font-bold mb-5">
          Tools we work with
        </p>
        <div className="tools-marquee">
          <div className="tools-marquee-track">
            {marqueeTools.map((tool, i) => (
              <img
                key={`${tool.name}-${i}`}
                src={tool.src}
                alt={tool.name}
                title={tool.name}
                width={36}
                height={36}
                className="h-9 w-9 object-contain opacity-40 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300 select-none"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-brand-navy text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-serif mb-6">{FINAL_CTA.headline}</h2>
          <p className="text-white/60 font-light text-sm mb-8">{FINAL_CTA.copy}</p>
          <button
            onClick={book}
            className="px-8 py-4 bg-brand-gold text-brand-navy text-sm font-medium hover:bg-white transition-all active:scale-[0.98]"
          >
            {FINAL_CTA.primaryCta}
          </button>
        </div>
      </section>
    </div>
  );
};

export default HybridHome;
