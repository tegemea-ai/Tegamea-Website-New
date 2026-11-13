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
      {/* Hero */}
      <section className="pt-16 pb-12 bg-brand-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 border border-white rotate-12" />
          <div className="absolute bottom-10 left-10 w-48 h-48 border border-white -rotate-6" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-4 block fade-up">
            About
          </span>
          <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight fade-up fade-up-delay-1">
            Built around trust. Backed by experience.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto font-light leading-relaxed fade-up fade-up-delay-2">
            We help businesses find the people and operational support they need to work well and grow with confidence.
          </p>
        </div>
      </section>

      {/* About Tegemea */}
      <section className="py-10 bg-white">
        <div className="max-w-2xl mx-auto px-8 md:px-12">
          <h2 className="text-3xl font-serif text-brand-navy mb-5">About Tegemea</h2>

          <figure className="sm:float-left sm:w-[36%] sm:max-w-[240px] sm:mr-7 sm:mb-3 mb-5 w-full">
            <div className="relative">
              <div className="absolute -inset-2 border border-brand-gold/30 pointer-events-none" />
              <img
                src="/images/tegemea-stand.png"
                alt="Tegemea exhibition stand — Giving you the gift of time"
                className="w-full aspect-[4/5] object-cover object-center image-reveal"
              />
            </div>
          </figure>

          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-4">
            Tegemea provides remote support and permanent recruitment for Executive Assistant, Project Support and Operations Coordinator roles.
          </p>
          <p className="border-l-2 border-brand-gold pl-5 py-1 text-brand-navy/90 italic font-light leading-relaxed mb-4">
            Our name, pronounced <span className="not-italic font-medium text-brand-navy">Teh-geh-may-yah</span>, comes from Swahili and means to trust or depend upon. That meaning sits at the heart of our approach.
          </p>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-0">
            We take time to understand your business, your priorities and how you work, connecting you with capable people who bring organisation, capacity and consistency to your operations.
          </p>
          <div className="clear-both" />
        </div>
      </section>

      {/* What we believe */}
      <section className="py-10 bg-brand-sand/40">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mb-6">
            <h2 className="text-3xl font-serif text-brand-navy mb-3">What we believe</h2>
            <p className="text-brand-charcoal/70 font-light leading-relaxed">
              Good support helps work move forward, brings structure to busy teams and gives leaders time to focus.
            </p>
            <p className="text-brand-navy/60 text-[11px] mt-4 uppercase tracking-widest font-bold">
              Our approach rests on four principles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
            {principles.map((principle, i) => (
              <div
                key={principle.title}
                className="bg-white p-6 border border-brand-navy/5"
              >
                <span className="text-brand-gold font-bold text-xs tracking-widest block mb-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-serif text-brand-navy mb-2">{principle.title}</h3>
                <p className="text-brand-charcoal/65 font-light leading-relaxed text-sm">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the founder — text wraps around portrait */}
      <section className="pt-10 pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-2 block">
            Leadership
          </span>
          <h2 className="text-3xl font-serif text-brand-navy mb-5 leading-tight">
            Meet the founder, Abisola Ifasawo
          </h2>

          <figure className="sm:float-left sm:w-[34%] sm:max-w-[300px] sm:mr-8 sm:mb-3 mb-5 w-full">
            <div className="relative">
              <div className="absolute -inset-2 border border-brand-gold/30 pointer-events-none" />
              <img
                src="/images/abisola-ifasawo.png"
                alt="Abisola Ifasawo, founder of Tegemea"
                className="w-full aspect-[4/5] object-cover object-top image-reveal"
              />
            </div>
          </figure>

          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-4">
            Abisola founded Tegemea in 2020, bringing almost 20 years of experience in business strategy, programme management, operations and organisational transformation.
          </p>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-4">
            An experienced business and transformation leader, she has led complex change programmes, established new services and delivered significant operational improvements. Her achievements include delivering £1.8 million in savings through departmental transformation, commissioning £4 million in services and overseeing operations with a £6 million budget.
          </p>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-4">
            Her expertise spans business strategy, service redesign, digital transformation and programme delivery, with a focus on bringing people, processes and technology together to turn strategy into measurable results.
          </p>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-4">
            Starting her career as an Executive Assistant, Abisola went on to manage teams of Executive Assistants, Project Support professionals and Operations Coordinators. This gave her first-hand insight into the value of effective operational support and the importance of building teams that leaders can depend on.
          </p>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-4">
            She holds a BSc in Computer Science with Management from King’s College London and a Master’s in International Relations and Management, alongside practitioner qualifications in PRINCE2 and Management of Portfolios.
          </p>
          <p className="text-brand-charcoal/75 font-light leading-relaxed mb-0">
            With a passion for AI, technology and business innovation, Abisola brings her strategic and operational expertise to Tegemea, helping businesses build high-performing teams, strengthen their operations and create capacity for growth.
          </p>
          <div className="clear-both" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-navy text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border border-white rotate-12" />
        </div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-serif mb-4">
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
