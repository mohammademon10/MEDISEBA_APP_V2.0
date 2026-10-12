import { Link } from 'react-router-dom';
import { PlusCircle, Facebook, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-bg text-brand-text-dim pt-32 pb-16 relative overflow-hidden">
      {/* Visual background details for footer */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-brand-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-8 group">
              <div className="w-12 h-12 bg-brand-primary rounded-[1rem] flex items-center justify-center text-brand-bg shadow-lg shadow-brand-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                <PlusCircle size={28} />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white">
                Medi<span className="text-brand-primary">Seba</span>
              </span>
            </Link>
            <p className="max-w-xs mb-10 text-brand-text-dim text-base leading-relaxed font-semibold">
              The AI-powered healthcare intelligence platform for the future. Book, manage, and track your medical journey.
            </p>
            <div className="flex gap-5">
              {[Facebook, Github, Linkedin].map((Icon, idx) => (
                <a key={idx} href="#" className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-brand-primary hover:border-brand-primary hover:text-brand-bg transition-all duration-300 shadow-md">
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-5">
              <li><Link to="/" className="hover:text-brand-primary transition-colors font-bold">Home</Link></li>
              <li><Link to="/doctors" className="hover:text-brand-primary transition-colors font-bold">Find Doctors</Link></li>
              <li><Link to="/how-it-works" className="hover:text-brand-primary transition-colors font-bold">How It Works</Link></li>
              <li><Link to="/about" className="hover:text-brand-primary transition-colors font-bold">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 uppercase tracking-widest text-xs">For Patients</h4>
            <ul className="space-y-5">
              <li><Link to="/login" className="hover:text-brand-primary transition-colors font-bold">Login</Link></li>
              <li><Link to="/register" className="hover:text-brand-primary transition-colors font-bold">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-brand-primary transition-colors font-bold">My Dashboard</Link></li>
              <li><Link to="/appointments" className="hover:text-brand-primary transition-colors font-bold">My Appointments</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 uppercase tracking-widest text-xs">Contact Us</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <MapPin className="text-brand-primary shrink-0 mt-0.5" size={20} />
                <span className="text-sm font-semibold leading-relaxed">123 Healthcare Ave, Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="text-brand-primary shrink-0" size={20} />
                <a href="tel:+8801893672505" className="text-sm font-semibold hover:text-brand-primary transition-colors">+8801893672505</a>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="text-brand-primary shrink-0" size={20} />
                <a href="mailto:mediseba@gmail.com" className="text-sm font-semibold hover:text-brand-primary transition-colors">mediseba@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-brand-text-dim font-bold">
          <p>&copy; {currentYear} MediSeba. Built with AI Intelligence.</p>
          <div className="flex gap-10">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
