import React from 'react';
import { Link } from 'react-router-dom';

const principles = [
  {
    title: 'Understand the business.',
    description: 'Get to know your goals, priorities and ways of working.',
  },
  {
    title: 'Bring judgement and initiative.',
    description:
      'Ask the right questions, take ownership and recognise when something needs attention.',
  },
  {
    title: 'Build trust through delivery.',
    description: 'Communicate clearly and follow through consistently.',
  },
  {
    title: 'Find the right fit.',
    description: 'Match professional capability with the needs of your team.',
  },
];

const About: React.FC = () => {
  return (
    <div className="fade-in">
      {/* About Tegemea — page introduction */}
      <section className="pt-10 md:pt-14 pb-8 md:pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
            {/* Image first on mobile */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-2 border border-brand-gold/30 pointer-events-none hidden sm:block" />
              <img
                src="/images/tegemea-stand.png"
                alt="Tegemea exhibition stand — Giving you the gift of time"
                className="w-full h-auto object-cover image-reveal"
              />
            </div>

            <div className="order-2 lg:order-1 space-y-4 text-brand-charcoal/75 font-light leading-relaxed max-w-xl">
              <p>
                Tegemea provides remote support and permanent recruitment for Executive Assistant, Project Support and Operations Coordinator roles.
              </p>
              <p className="border-l-2 border-brand-gold pl-5 py-1 text-brand-navy/90 italic">
                Our name, pronounced <span className="not-italic font-medium text-brand-navy">Teh-geh-may-yah</span>, comes from Swahili and means to trust or depend upon. That meaning sits at the heart of our approach.
              </p>
              <p>
                We take time to understand your business, your priorities and how you work, connecting you with capable people who bring organisation, capacity and consistency to your operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="py-8 md:py-12 bg-brand-sand/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl mb-5 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-serif text-brand-navy mb-3">
              What we believe
            </h2>
            <p className="text-brand-charcoal/70 font-light leading-relaxed">
              Good support helps work move forward, brings structure to busy teams and gives leaders time to focus.
            </p>
            <p className="text-brand-navy/60 text-[11px] mt-3 uppercase tracking-widest font-bold">
              Our approach rests on four principles
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {principles.map((principle, i) => (
              <div
                key={principle.title}
                className="bg-white p-5 md:p-6 border border-brand-navy/5"
              >
                <span className="text-brand-gold font-bold text-xs tracking-widest block mb-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-base md:text-lg font-serif text-brand-navy mb-1.5">
                  {principle.title}
                </h3>
                <p className="text-brand-charcoal/65 font-light leading-relaxed text-sm">
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
