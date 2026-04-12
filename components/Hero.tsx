import React from 'react';

interface HeroProps {
  onBook?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBook }) => {
  return (
    <section id="home" className="relative min-h-[70vh] flex items-center pt-4">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
          alt="Premium UK Executive Virtual Assistant Office Space"
          className="w-full h-full object-cover opacity-10"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-sand/50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-serif font-medium text-brand-navy leading-[1.1] mb-8 fade-in">
            UK-based <span className="italic text-brand-gold">Virtual Assistant</span> support for <span className="italic text-brand-gold">Professional Service Leaders</span>.
          </h1>
          <p className="text-xl md:text-2xl text-brand-charcoal/80 font-light leading-relaxed mb-12 fade-in delay-200">
            Tegemea provides elite executive, project and operational assistance for founders who require complete professionalism and <span className="text-brand-navy font-medium underline decoration-brand-gold decoration-2 underline-offset-8">flawless execution</span>.
          </p>
          {onBook && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 fade-in delay-300">
              <button 
                onClick={onBook}
                className="w-full sm:w-auto px-8 py-4 bg-brand-navy text-white text-base font-medium hover:bg-brand-charcoal transition-all duration-300 shadow-lg shadow-brand-navy/10 text-center"
              >
                Book a Free Consultation
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;