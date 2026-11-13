import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

type NavChild = { label: string; path: string };
type NavItem = { label: string; path?: string; children?: NavChild[] };

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsServicesOpen(false);
    setIsMobileServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Home', path: '/' },
    {
      label: 'Services',
      children: [
        { label: 'Virtual Assistant', path: '/services' },
        { label: 'Recruitment', path: '/recruitment' },
        { label: 'Consulting', path: '/consulting' }
      ]
    },
    { label: 'About', path: '/about' },
    { label: 'Insights', path: '/insights' },
    { label: 'Join Us', path: '/join-us' }
  ];

  const servicePaths = ['/services', '/recruitment', '/consulting'];
  const isServicesActive = servicePaths.includes(location.pathname);

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
            {navItems.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  ref={servicesRef}
                  className="relative"
                  onMouseEnter={() => setIsServicesOpen(true)}
                  onMouseLeave={() => setIsServicesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setIsServicesOpen((open) => !open)}
                    className={`${baseLinkClass} inline-flex items-center gap-1.5 ${isServicesActive ? activeLinkClass : ''}`}
                    aria-expanded={isServicesOpen}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                      isServicesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                    }`}
                  >
                    <div className="min-w-[220px] bg-white border border-brand-navy/5 shadow-lg py-3">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsServicesOpen(false)}
                          className={({ isActive }) =>
                            `block px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold transition-colors duration-200 ${
                              isActive ? 'text-brand-gold bg-brand-sand/40' : 'text-brand-navy/70 hover:text-brand-gold hover:bg-brand-sand/30'
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink 
                  key={item.path}
                  to={item.path!}
                  className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
                >
                  {item.label}
                </NavLink>
              )
            )}
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
        <div className="flex flex-col items-center justify-center h-full space-y-8 px-6 text-center overflow-y-auto">
          <nav className="flex flex-col items-center space-y-6 py-24">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="flex flex-col items-center space-y-4">
                  <button
                    type="button"
                    onClick={() => setIsMobileServicesOpen((open) => !open)}
                    className={`text-2xl font-serif tracking-tight inline-flex items-center gap-2 ${
                      isServicesActive ? 'text-brand-gold' : 'text-brand-navy'
                    }`}
                    aria-expanded={isMobileServicesOpen}
                  >
                    {item.label}
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isMobileServicesOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isMobileServicesOpen && (
                    <div className="flex flex-col items-center space-y-3">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={({ isActive }) =>
                            `text-lg font-serif tracking-tight ${isActive ? 'text-brand-gold' : 'text-brand-navy/70'}`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink 
                  key={item.path}
                  to={item.path!}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) => `text-2xl font-serif tracking-tight ${isActive ? 'text-brand-gold' : 'text-brand-navy'}`}
                >
                  {item.label}
                </NavLink>
              )
            )}
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
