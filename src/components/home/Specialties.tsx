import { SPECIALTIES } from '../../constants';
import * as LucideIcons from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Specialties() {
  return (
    <section className="py-32 bg-brand-bg relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <span className="text-brand-primary font-bold uppercase tracking-[0.2em] text-xs mb-4 inline-block">Specialized Care</span>
            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Find Doctors By <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Specialty</span>
            </h2>
            <p className="text-xl text-brand-text-dim mt-6 font-medium">
              Choose from a wide range of medical specialties and find the right expert for your needs.
            </p>
          </div>
          <Link to="/doctors" className="btn btn-secondary group gap-2 !px-8">
            View All Specialties
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {SPECIALTIES.map((specialty, idx) => {
            // @ts-ignore
            const IconComponent = LucideIcons[specialty.icon] || LucideIcons.Activity;
            
            return (
              <motion.div
                key={specialty.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-brand-surface border border-white/5 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-brand-surface/80 hover:border-brand-primary/30 transition-all duration-500 shadow-xl hover:shadow-brand-primary/5"
              >
                <div className="w-20 h-20 bg-white/5 text-brand-primary rounded-3xl flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-brand-bg transition-all duration-500 shadow-inner">
                  <IconComponent size={36} />
                </div>
                <h3 className="font-extrabold text-white mb-2 truncate w-full tracking-tight">{specialty.name}</h3>
                <p className="text-xs text-brand-text-dim font-bold uppercase tracking-widest">{specialty.count}+ Experts</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
