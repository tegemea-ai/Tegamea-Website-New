
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Trust from './components/Trust';
import Services from './components/Services';
import OperationalAssessment from './components/OperationalAssessment';
import JoinUs from './components/JoinUs';
import BookConsultation from './components/BookConsultation';
import Footer from './components/Footer';
import HowItWorks from './components/HowItWorks';
import Blog from './components/Blog';
import Testimonials from './components/Testimonials';

/**
 * Scroll to top on route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * SEO Utility Hook
 */
function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = `Tegemea | ${title}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  }, [title, description]);
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  useSEO(
    "Elite UK Virtual Assistant & Strategic Operational Support",
    "Premium, UK-based virtual assistant and operational management for elite founders and professional services."
  );

  return (
    <div className="fade-in">
      <Hero />
      <Trust />
      
      {/* Featured Section */}
      <section className="pt-2 pb-12 bg-white border-b border-brand-navy/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-[0.5em] text-brand-stone font-bold mb-8 opacity-60">As featured in</span>
            <a 
              href="https://www.thetimes.com/static/startup-sme-legal-it-ip-eot-accountancy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-12 grayscale hover:grayscale-0 transition-all duration-700"
            >
              <span className="text-2xl md:text-4xl font-serif font-black tracking-tighter text-brand-navy border-b-2 border-transparent group-hover:border-brand-gold transition-all duration-500">THE TIMES</span>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold bg-brand-sand px-4 py-1.5 border border-brand-gold/30 shadow-sm">Online Edition</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Strategic Content Section */}
      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif leading-tight">Operational Precision <br/><span className="italic text-brand-gold">for Professional Leaders.</span></h2>
            <p className="text-white/60 text-lg font-light leading-relaxed">
              Tegemea bridges the gap between high-level ambition and ground-level execution. We provide the infrastructure you need to scale without administrative friction.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => navigate('/services')} 
                className="group flex items-center space-x-3 text-brand-gold font-bold text-xs uppercase tracking-widest hover:text-white transition-all duration-300"
              >
                <span>Explore our support packages</span>
                <span className="transform group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 border-2 border-brand-gold/20 -m-4"></div>
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200" 
              alt="Business Architecture" 
              className="relative w-full grayscale brightness-90 border border-white/10 shadow-2xl" 
            />
          </div>
        </div>
      </section>

      <Testimonials />

      <HowItWorks />
      
      {/* Join Us CTA Section */}
      <section className="py-20 bg-white text-center border-t border-brand-navy/5">
        <div className="max-w-3xl mx-auto px-6">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-[10px] uppercase mb-6 block">Career Opportunities</span>
          <h2 className="text-3xl md:text-4xl font-serif text-brand-navy mb-6">Join our elite professional team.</h2>
          <p className="text-brand-charcoal/60 mb-10 font-light leading-relaxed">
            We are always seeking exceptional UK-based virtual assistants who value precision, discretion, and a higher standard of operational support.
          </p>
          <button 
            onClick={() => navigate('/join-us')}
            className="text-[11px] uppercase tracking-widest font-bold text-brand-navy border-b-2 border-brand-gold pb-1 hover:text-brand-gold transition-all"
          >
            View recruitment details
          </button>
        </div>
      </section>

      <OperationalAssessment onBook={() => navigate('/contact')} />
    </div>
  );
};

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  useSEO("Support Packages & Retainers", "Elite operational support structures tailored for high-growth founders and firms.");
  return (
    <div className="fade-in">
      <div className="py-20 bg-brand-navy text-white text-center">
        <h1 className="text-4xl md:text-6xl font-serif mb-4">Support Retainers</h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-bold">Strategic Operational Infrastructure</p>
      </div>
      <Services onBook={() => navigate('/contact')} />
    </div>
  );
};

const InsightsPage: React.FC = () => {
  useSEO("Executive Infrastructure Insights", "Strategic intelligence on delegation and operational mastery.");
  return <Blog />;
};

const JoinUsPage: React.FC = () => {
  useSEO("Join the Team | Careers", "Professional virtual assistant roles for individuals who value excellence.");
  return <JoinUs />;
};

const ContactPage: React.FC = () => {
  useSEO("Book a Consultation", "Schedule a discovery call with the Tegemea team.");
  return <BookConsultation />;
};

export default function App() {
  return (
    <div className="font-sans text-brand-navy antialiased bg-white selection:bg-brand-gold/20">
      <ScrollToTop />
      <Navbar />
      <main className="pt-20 min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/:slug" element={<InsightsPage />} />
          <Route path="/join-us" element={<JoinUsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
