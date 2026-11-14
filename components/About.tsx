import React from 'react';
import { Link } from 'react-router-dom';

type Principle = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const iconClass = 'w-6 h-6 text-brand-gold';

const principles: Principle[] = [
  {
    title: 'Understand the business.',
    description:
      'Get to know your goals, priorities and ways of working. Support only works when it reflects how your business actually operates.',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 21V8.25L12 3l7.5 5.25V21M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: 'Bring judgement and initiative.',
    description:
      'Ask the right questions, take ownership and recognise when something needs attention. We look for people who think ahead, not only those who wait to be told.',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 006-6c0-2.5-1.5-4.5-3-5.5V5a1 1 0 00-1-1h-4a1 1 0 00-1 1v1.5C7.5 7.5 6 9.5 6 12a6 6 0 006 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4M9.5 18h5" />
      </svg>
    ),
  },
  {
    title: 'Build trust through delivery.',
    description:
      'Communicate clearly and follow through consistently. Reliability is built in the details — updates kept, deadlines met and nothing left hanging.',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.5l7.5 3.75v5.25c0 4.142-3.022 7.875-7.5 9-4.478-1.125-7.5-4.858-7.5-9V6L12 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Find the right fit.',
    description:
      'Match professional capability with the needs of your team. Skills matter; so does someone who works well with you and your ways of working.',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

const About: React.FC = () => {
  return (
    <div className="fade-in">
      {/* About Tegemea — page introduction */}
      <section className="pt-10 md:pt-14 pb-8 md:pb-12 bg-brand-sand/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-gold" aria-hidden="true" />
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-gold/10 pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <p className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-3">
            About
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-navy leading-tight mb-4 max-w-4xl">
            About Tegemea
          </h1>
          <p className="text-2xl md:text-3xl font-serif text-brand-navy/85 leading-snug mb-3 max-w-3xl">
            Built around trust. Backed by experience.
          </p>
          <p className="text-brand-charcoal/70 font-light leading-relaxed text-lg max-w-2xl mb-8 md:mb-10">
            We help businesses find the people and operational support they need to work well and grow with confidence.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,240px)] gap-6 lg:gap-10 items-start">
            <div className="order-2 lg:order-1 space-y-4 text-brand-charcoal/75 font-light leading-relaxed max-w-xl">
              <p>
                Tegemea provides remote support and permanent recruitment for Executive Assistant, Project Support and Operations Coordinator roles.
              </p>
              <p className="bg-brand-navy text-white/90 p-5 md:p-6 leading-relaxed">
                Our name, pronounced <span className="text-brand-gold font-medium not-italic">Teh-geh-may-yah</span>, comes from Swahili and means to trust or depend upon. That meaning sits at the heart of our approach.
              </p>
              <p>
                We take time to understand your business, your priorities and how you work, connecting you with capable people who bring organisation, capacity and consistency to your operations.
              </p>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative w-full max-w-[220px] mx-auto lg:mx-0">
                <div className="absolute -inset-1.5 border border-brand-gold/40 pointer-events-none hidden sm:block" />
                <img
                  src="/images/tegemea-stand.jpg"
                  alt="Tegemea stand with branded cupcakes, brochures and business cards"
                  className="w-full h-auto object-cover image-reveal"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="py-8 md:py-12 bg-brand-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden="true">
          <div className="absolute top-8 right-12 w-48 h-48 border border-brand-gold rotate-12" />
          <div className="absolute bottom-6 left-10 w-32 h-32 bg-brand-gold/30" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-2xl mx-auto text-center mb-5 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-3">
              What we believe
            </h2>
            <p className="text-white/65 font-light leading-relaxed">
              Good support helps work move forward, brings structure to busy teams and gives leaders time to focus.
            </p>
            <p className="text-brand-gold text-[11px] mt-3 uppercase tracking-widest font-bold">
              Our approach rests on four principles
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="bg-white/95 p-5 border border-brand-gold/25 text-left"
              >
                <div className="mb-3 inline-flex items-center justify-center w-10 h-10 bg-brand-sand">
                  {principle.icon}
                </div>
                <h3 className="text-base font-serif text-brand-navy mb-2">
                  {principle.title}
                </h3>
                <p className="text-brand-charcoal/70 font-light leading-relaxed text-sm">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the founder */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-serif text-brand-navy mb-8 md:mb-10">
            Meet the founder
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
            <div className="order-1">
              <div className="relative max-w-sm mx-auto lg:mx-0">
                <div className="absolute -inset-2 border border-brand-gold/30 pointer-events-none hidden sm:block" />
                <img
                  src="/images/abisola-ifasawo.png"
                  alt="Abisola Ifasawo, founder of Tegemea"
                  className="w-full h-auto object-cover object-top image-reveal"
                />
              </div>
              <div className="mt-4 text-center lg:text-left">
                <p className="text-xl font-serif text-brand-navy">Abisola Ifasawo</p>
                <p className="text-brand-gold text-[11px] uppercase tracking-widest font-bold mt-1">
                  Founder
                </p>
              </div>
            </div>

            <div className="order-2 max-w-2xl space-y-4 text-brand-charcoal/75 font-light leading-relaxed">
              <p>
                Abisola founded Tegemea in 2020, bringing almost 20 years of experience in business strategy, programme management, operations and organisational transformation.
              </p>
              <p>
                An experienced business and transformation leader, she has led complex change programmes, established new services and delivered significant operational improvements. Her achievements include delivering £1.8 million in savings through departmental transformation, commissioning £4 million in services and overseeing operations with a £6 million budget.
              </p>
              <p>
                Her expertise spans business strategy, service redesign, digital transformation and programme delivery, with a focus on bringing people, processes and technology together to turn strategy into measurable results.
              </p>
              <p>
                Starting her career as an Executive Assistant, Abisola went on to manage teams of Executive Assistants, Project Support professionals and Operations Coordinators. This gave her first-hand insight into the value of effective operational support and the importance of building teams that leaders can depend on.
              </p>
              <p>
                She holds a BSc in Computer Science with Management from King’s College London and a Master’s in International Relations and Management, alongside practitioner qualifications in PRINCE2 and Management of Portfolios.
              </p>
              <p>
                With a passion for AI, technology and business innovation, Abisola brings her strategic and operational expertise to Tegemea, helping businesses build high-performing teams, strengthen their operations and create capacity for growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-14 bg-brand-navy text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border border-white rotate-12" />
        </div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">
            Find the support your business needs
          </h2>
          <p className="text-white/60 font-light mb-8 leading-relaxed">
            Whether you need flexible remote support or a permanent addition to your team, we’ll help you explore the right approach.
          </p>
          <Link
            to="/contact"
            className="inline-block px-12 py-5 bg-brand-gold text-brand-navy font-bold text-sm uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-brand-gold/10"
          >
            Talk to us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
