import { motion } from 'motion/react';
import { Search, UserPlus, Brain, CheckCircle, Star, Users, ClipboardCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(2,132,199,0.08)_0%,transparent_50%)]" />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary text-xs font-bold mb-6 uppercase tracking-wider">
              <Sparkles size={14} className="animate-pulse" />
              <span>AI-Powered Healthcare Intelligence</span>
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-extrabold text-white tracking-tighter leading-[0.95] mb-8">
              Your Health, <br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent italic">Our Priority.</span>
            </h1>
            
            <p className="text-xl text-brand-text-dim mb-10 max-w-xl leading-relaxed font-medium">
              Book appointments with top-tier verified doctors and receive intelligent AI-summarized prescriptions using Gemini 1.5 Pro technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link to="/doctors" className="btn btn-primary !px-8 !py-4 gap-2 text-base">
                <Search size={20} />
                Find a Doctor
              </Link>
              <Link to="/register" className="btn btn-secondary !px-8 !py-4 gap-2 text-base">
                <UserPlus size={20} />
                Learn More
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/5 pt-12">
              <div>
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">1,240+</div>
                <div className="text-xs text-brand-text-dim font-bold uppercase tracking-[0.2em]">Verified Doctors</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">15.8k</div>
                <div className="text-xs text-brand-text-dim font-bold uppercase tracking-[0.2em]">Appointments</div>
              </div>
              <div className="hidden md:block">
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">99.2%</div>
                <div className="text-xs text-brand-text-dim font-bold uppercase tracking-[0.2em]">Satisfaction</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">4.9/5</div>
                <div className="text-xs text-brand-text-dim font-bold uppercase tracking-[0.2em]">Avg. Rating</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden border border-white/10 bg-brand-surface p-2 shadow-inner">
              <div className="bg-gradient-to-br from-slate-800 to-brand-bg rounded-[2rem] overflow-hidden aspect-square flex items-center justify-center p-8 grayscale-[0.2] opacity-80">
                 <img 
                    src="https://picsum.photos/seed/mediseba-dark/1200/1200" 
                    alt="MediSeba holographic interface" 
                    className="rounded-2xl w-full h-full object-cover mix-blend-overlay"
                    referrerPolicy="no-referrer"
                  />
              </div>
            </div>
            
            {/* Floating Cards - "Immersive UI" Style */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 z-20 glass p-6 rounded-3xl shadow-2xl flex items-center gap-5 max-w-sm border border-white/20"
            >
              <div className="w-14 h-14 bg-brand-primary/20 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
                <ClipboardCheck size={28} />
              </div>
              <div>
                <div className="text-base font-extrabold text-white">Easy Booking</div>
                <div className="text-sm text-brand-text-dim">Book in 2 minutes</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/2 -right-16 z-20 glass p-6 rounded-3xl shadow-2xl flex flex-col gap-4 max-w-[300px] border border-brand-secondary/30"
            >
              <div className="flex items-center gap-3 text-brand-secondary font-extrabold text-xs uppercase tracking-widest">
                <Brain size={18} />
                Gemini AI Summary
              </div>
              <div className="text-sm text-brand-text leading-relaxed font-medium">
                "Patient displays mild acute rhinitis. Summary: Viral upper respiratory infection with zero critical complications..."
              </div>
            </motion.div>

            {/* Background elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(2,132,199,0.1)_0%,transparent_70%)] rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
