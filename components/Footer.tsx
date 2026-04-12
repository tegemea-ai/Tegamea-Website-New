
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-navy text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link 
              to="/"
              className="text-3xl font-serif font-bold mb-8 block"
            >
              TEGEMEA
            </Link>
            <p className="text-white/60 max-w-sm font-light leading-relaxed">
              Elite virtual assistant and operational management for leaders scaling high-trust professional service businesses across the UK.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-6 uppercase tracking-widest text-xs text-brand-gold">Navigation</h4>
            <ul className="space-y-4 text-white/50 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/insights" className="hover:text-white transition-colors">Insights</Link></li>
              <li><Link to="/join-us" className="hover:text-white transition-colors">Join Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Book a Consultation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-6 uppercase tracking-widest text-xs text-brand-gold">Contact</h4>
            <ul className="space-y-4 text-white/50 text-sm font-light">
              <li>London, United Kingdom</li>
              <li><a href="mailto:info@tegemea.com" className="hover:text-white transition-colors">info@tegemea.com</a></li>
              <li>+44 (0)203 576 2006</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-white/30 tracking-widest uppercase">
          <p>© 2026 Tegemea Operations Ltd. All Rights Reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Engagement</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
