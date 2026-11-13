import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Services from './components/Services';
import JoinUs from './components/JoinUs';
import BookConsultation from './components/BookConsultation';
import Footer from './components/Footer';
import Blog from './components/Blog';
import Recruitment from './components/Recruitment';
import Consulting from './components/Consulting';
import About from './components/About';
import HybridHome from './components/home/HybridHome';

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
  useSEO(
    'Executive, Project & Operational Support',
    'Experienced UK-based Executive Assistants, Project Support professionals and Operational Coordinators — through flexible remote support or permanent recruitment.'
  );
  return <HybridHome />;
};

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  useSEO("Virtual Assistant Support Packages & Retainers", "Elite operational support structures tailored for high-growth founders and firms.");
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

const RecruitmentPage: React.FC = () => {
  useSEO("Recruitment", "Discreet, standards-led hiring support for exceptional operational talent.");
  return <Recruitment />;
};

const ConsultingPage: React.FC = () => {
  useSEO("Consulting", "Strategic operational consulting for clarity, structure, and sustainable systems.");
  return <Consulting />;
};

const AboutPage: React.FC = () => {
  useSEO(
    'About',
    'Tegemea provides remote support and permanent recruitment for Executive Assistant, Project Support and Operations Coordinator roles. Built around trust. Backed by experience.'
  );
  return <About />;
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
          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route path="/consulting" element={<ConsultingPage />} />
          <Route path="/about" element={<AboutPage />} />
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
