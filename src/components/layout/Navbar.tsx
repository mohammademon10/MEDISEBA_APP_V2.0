import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PlusCircle, Activity, LayoutDashboard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, userData } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Find Doctors', path: '/doctors' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-brand-bg/80 backdrop-blur-lg border-b border-white/5 py-3 shadow-sm' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-brand-bg rotate-3 group-hover:rotate-0 transition-transform">
              <PlusCircle size={24} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-brand-primary">Medi</span>
              <span className="text-white">Seba</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`text-sm font-semibold transition-colors hover:text-brand-primary ${
                  location.pathname === link.path ? 'text-brand-primary' : 'text-brand-text-dim'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              {user ? (
                <Link to="/dashboard" className="flex items-center gap-2 px-5 py-2.5 text-sm font-black text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full hover:bg-brand-primary/20 transition-all uppercase tracking-widest">
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-bold text-brand-primary border border-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary !py-2.5 !px-6 text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-bg border-b border-white/5 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-bold ${
                    location.pathname === link.path ? 'text-brand-primary' : 'text-brand-text-dim'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-white/5" />
              <div className="flex flex-col gap-3">
                {user ? (
                   <Link 
                    to="/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-4 font-black text-brand-primary bg-brand-primary/10 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                   >
                    <LayoutDashboard size={20} />
                    Dashboard
                   </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center py-4 font-bold text-brand-text-dim">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary w-full !py-4">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
