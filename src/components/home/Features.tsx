import { UserCheck, Calendar, Ticket, FileSpreadsheet, History, Shield, Microchip, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const FEATURE_LIST = [
  {
    icon: Microchip,
    title: 'AI-Powered Insights',
    description: 'Google Gemini 1.5 Pro explains complex medical terms and summarizes your symptoms for doctors.',
    accent: 'bg-brand-primary/10 text-brand-primary',
    highlight: true
  },
  {
    icon: UserCheck,
    title: 'Verified Practitioners',
    description: 'Browse through our network of verified doctors across 20+ specialties.',
    accent: 'bg-slate-100 text-slate-600'
  },
  {
    icon: Calendar,
    title: 'Easy Scheduling',
    description: 'Book appointments 24/7 with real-time availability and instant confirmation.',
    accent: 'bg-slate-100 text-slate-600'
  },
  {
    icon: Ticket,
    title: 'Smart Token System',
    description: 'Get your token number automatically and know your exact appointment time.',
    accent: 'bg-slate-100 text-slate-600'
  },
  {
    icon: FileText,
    title: 'Digital Prescriptions',
    description: 'Access your prescriptions anytime, anywhere from your digital health record.',
    accent: 'bg-slate-100 text-slate-600'
  },
  {
    icon: History,
    title: 'Medical History',
    description: 'Keep track of all your visits, prescriptions, and health records in one place.',
    accent: 'bg-slate-100 text-slate-600'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your health data is encrypted and protected with industry-standard security.',
    accent: 'bg-slate-100 text-slate-600'
  },
  {
    icon: FileSpreadsheet,
    title: 'Zero-Dependency PDF',
    description: 'Instant PDF generation handles your medical reports without slowing you down.',
    accent: 'bg-emerald-100 text-emerald-600'
  }
];

export default function Features() {
  return (
    <section className="py-32 bg-brand-bg relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-brand-secondary font-bold uppercase tracking-[0.2em] text-xs mb-4 inline-block">Platform Highlights</span>
          <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tight">
            Healthcare Meets <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Intelligence</span>
          </h2>
          <p className="text-xl text-brand-text-dim leading-relaxed font-medium">
            Leveraging cutting-edge technology to simplify your medical journey, 
            making healthcare more accessible, understandable, and efficient.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURE_LIST.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-10 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden ${
                feature.highlight 
                  ? 'bg-brand-primary/10 border border-brand-primary/30 shadow-[0_0_40px_rgba(56,189,248,0.05)]' 
                  : 'bg-brand-surface/40 border border-white/5 hover:bg-brand-surface/60 hover:border-white/10'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${feature.accent.replace('bg-brand-primary/10', 'bg-brand-primary/20').replace('bg-slate-100', 'bg-white/5')}`}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-brand-text-dim leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
