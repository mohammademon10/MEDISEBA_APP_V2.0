import { Search, CalendarCheck, Hospital, ClipboardCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const STEPS = [
  {
    icon: Search,
    title: 'Search Doctors',
    description: 'Find doctors by specialty, location, or name',
    color: 'bg-brand-primary text-white'
  },
  {
    icon: CalendarCheck,
    title: 'Book Appointment',
    description: 'Select date & time, get instant token',
    color: 'bg-brand-primary text-white'
  },
  {
    icon: Hospital,
    title: 'Consultation',
    description: 'Visit clinic or attend virtual session',
    color: 'bg-brand-primary text-white'
  },
  {
    icon: ClipboardCheck,
    title: 'Digital Prescription',
    description: 'Receive AI-summarized prescription instantly',
    color: 'bg-emerald-500 text-white'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-32 bg-brand-surface/30 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <span className="text-brand-primary font-bold uppercase tracking-[0.2em] text-xs mb-4 inline-block">Platform Process</span>
          <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tight">
            Seamless <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent italic">Consultation</span>
          </h2>
          <p className="text-xl text-brand-text-dim leading-relaxed font-medium">
            Experience the future of healthcare with our streamlined end-to-end process.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[28%] left-[10%] right-[10%] h-0.5 border-t border-dashed border-white/10 -z-0" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-10">
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full glass shadow-2xl flex items-center justify-center text-sm font-black text-brand-primary border border-white/10">
                    0{idx + 1}
                  </div>
                  <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${step.color.replace('bg-brand-primary', 'bg-brand-primary/10 border border-brand-primary/30 text-brand-primary')}`}>
                    <step.icon size={44} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{step.title}</h3>
                <p className="text-brand-text-dim leading-relaxed max-w-[16rem] font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Video / Transcript Section */}
        <div className="mt-32 grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative aspect-video rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(3,7,18,0.5)] bg-slate-900 border border-white/10 group"
          >
            <div className="absolute inset-0 bg-brand-primary/5 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
            <iframe
              src="https://www.youtube-nocookie.com/embed/zNHq9gD2uqc?rel=0"
              title="MediSeba overview video"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-none relative z-0"
            ></iframe>
          </motion.div>
          
          <div className="glass p-16 rounded-[3.5rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -z-10 group-hover:bg-brand-primary/10 transition-colors" />
            <span className="text-brand-secondary font-bold uppercase tracking-[0.2em] text-xs mb-4 inline-block">Transcript View</span>
            <h3 className="text-3xl font-black text-white mb-8 tracking-tight">MediSeba Platform Journey</h3>
            <ul className="space-y-8">
              {[
                'Search for doctors by specialty or name and compare verified profiles.',
                'Select a convenient time slot and confirm your smart digital token.',
                'Attend your consultation and use our encrypted follow-up chat system.',
                'Access your AI-summarized health insights and prescriptions on-demand.'
              ].map((item, idx) => (
                <li key={idx} className="flex gap-5 items-start text-brand-text-dim">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5 border border-brand-primary/20">
                    <CheckCircle size={18} />
                  </div>
                  <span className="leading-relaxed font-semibold text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
