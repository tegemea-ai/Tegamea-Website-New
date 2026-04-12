
import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Insights', path: '/insights' },
    { label: 'Join Us', path: '/join-us' }
  ];

  const activeLinkClass = "text-brand-gold";
  const baseLinkClass = "text-[11px] uppercase tracking-widest font-bold transition-colors duration-200 text-brand-navy/70 hover:text-brand-gold";

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          isScrolled || isMenuOpen 
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' 
            : 'bg-transparent py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link 
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl font-serif font-bold tracking-tight text-brand-navy uppercase relative z-[70]"
          >
            Tegemea
          </Link>
          
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path}
                className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
            <Link 
              to="/contact"
              className="px-6 py-2.5 bg-brand-navy text-white text-[10px] uppercase tracking-widest font-bold hover:bg-brand-charcoal transition-all duration-300"
            >
              Book a Consultation
            </Link>
          </div>

          <button 
            className="md:hidden text-brand-navy relative z-[70] p-2 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-white z-[55] transition-all duration-500 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-8 px-6 text-center">
          <nav className="flex flex-col items-center space-y-6">
            {navItems.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `text-2xl font-serif tracking-tight ${isActive ? 'text-brand-gold' : 'text-brand-navy'}`}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-6 w-full max-w-xs">
              <Link 
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full py-5 bg-brand-navy text-white text-xs uppercase tracking-widest font-bold shadow-xl"
              >
                Book a Consultation
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;
