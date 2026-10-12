import { FEATURED_DOCTORS } from '../../constants';
import { Star, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function FeaturedDoctors() {
  return (
    <section className="py-32 bg-brand-bg relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <span className="text-brand-secondary font-bold uppercase tracking-[0.2em] text-xs mb-4 inline-block">Highly Rated</span>
            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Featured <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Experts</span>
            </h2>
            <p className="text-xl text-brand-text-dim mt-6 leading-relaxed font-medium">
              Highly rated doctors recommended by our community and verified by our board-certified team.
            </p>
          </div>
          <Link to="/doctors" className="btn btn-secondary gap-3 group !px-8">
            View All Doctors
            <CheckCircle size={18} className="text-brand-primary" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {FEATURED_DOCTORS.map((doctor, idx) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-brand-surface border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-brand-primary/20 transition-all duration-500 shadow-2xl hover:shadow-brand-primary/5"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={doctor.image} 
                  alt={doctor.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                {doctor.available && (
                  <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md text-emerald-400 text-xs font-extrabold flex items-center gap-2 border border-emerald-500/20 shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE NOW
                  </div>
                )}
              </div>
              
              <div className="p-10">
                <div className="flex items-center gap-1.5 text-amber-500 mb-4">
                  <Star size={18} fill="currentColor" />
                  <span className="text-base font-extrabold">{doctor.rating}</span>
                  <span className="text-brand-text-dim text-sm font-medium ml-1">({doctor.reviews} feedback)</span>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{doctor.name}</h3>
                <p className="text-brand-primary font-bold text-sm mb-6 uppercase tracking-wider">{doctor.specialty}</p>
                
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-4 text-brand-text-dim text-sm font-medium">
                    <MapPin size={18} className="text-brand-primary/60" />
                    <span>{doctor.hospital}</span>
                  </div>
                  <div className="flex items-center gap-4 text-brand-text-dim text-sm font-medium">
                    <Calendar size={18} className="text-brand-primary/60" />
                    <span>Next: Today, 4:00 PM</span>
                  </div>
                </div>
                
                <Link to={`/doctor/${doctor.id}`} className="btn btn-primary w-full !rounded-2xl !py-4 text-base tracking-wide">
                  Book Virtual Visit
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
