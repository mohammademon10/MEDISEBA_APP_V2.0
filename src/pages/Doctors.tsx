import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Search, Star, MapPin, Calendar, CheckCircle, SlidersHorizontal, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FEATURED_DOCTORS } from '../constants';

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  qualification: string;
  consultationFee: number;
  ratingAvg: number;
  ratingCount: number;
  profilePhoto?: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const q = query(collection(db, 'doctors'));
        const querySnapshot = await getDocs(q);
        const docsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Doctor[];

        if (docsData.length > 0) {
          setDoctors(docsData);
        } else {
          const initialList: Doctor[] = FEATURED_DOCTORS.map(d => ({
            id: d.id,
            fullName: d.name,
            specialty: d.specialty,
            qualification: 'MBBS, FCPS',
            consultationFee: 800,
            ratingAvg: d.rating,
            ratingCount: d.reviews,
            profilePhoto: d.image
          }));
          setDoctors(initialList);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
        const initialList: Doctor[] = FEATURED_DOCTORS.map(d => ({
          id: d.id,
          fullName: d.name,
          specialty: d.specialty,
          qualification: 'MBBS, FCPS',
          consultationFee: 800,
          ratingAvg: d.rating,
          ratingCount: d.reviews,
          profilePhoto: d.image
        }));
        setDoctors(initialList);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const seedSampleDoctors = async () => {
    setLoading(true);
    try {
      const sampleDoctors = [
        {
          fullName: 'Dr. Md. Rahman',
          specialty: 'Cardiology',
          qualification: 'MBBS, MD (Cardiology)',
          experienceYears: 12,
          consultationFee: 800,
          bio: 'Experienced cardiologist specializing in heart disease prevention.',
          clinicName: 'Heart Care Center',
          clinicAddress: '123 Dhaka Ave, Dhaka',
          ratingAvg: 4.8,
          ratingCount: 156,
          isVerified: true
        },
        {
          fullName: 'Dr. Sarah Ishrat',
          specialty: 'Neurology',
          qualification: 'MBBS, FCPS (Neurology)',
          experienceYears: 8,
          consultationFee: 1000,
          bio: 'Specialist in neurological disorders and complex brain diagnostics.',
          clinicName: 'Neuro Neuro Hospital',
          clinicAddress: '45 Banani, Dhaka',
          ratingAvg: 4.9,
          ratingCount: 89,
          isVerified: true
        }
      ];

      for (const docData of sampleDoctors) {
        const docRef = doc(collection(db, 'doctors'));
        await setDoc(docRef, docData);

        // Also add a sample schedule
        await addDoc(collection(db, 'doctors', docRef.id, 'schedules'), {
          dayOfWeek: 'Monday - Thursday',
          startTime: '09:00',
          endTime: '17:00',
          maxPatients: 20,
          isActive: true
        });
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const specialties = ['All', 'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'General Medicine'];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = (doctor.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (doctor.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="pt-32 pb-24 min-h-screen bg-brand-bg">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-8 tracking-tighter">
            Find Your <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Specialist</span>
          </h1>
          <p className="text-xl text-brand-text-dim mb-12 font-medium">
            Browse through our network of verified healthcare professionals and book your visit instantly.
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-10 pr-20 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-2xl"
            />
            <div className="absolute right-4 top-4 w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-brand-bg shadow-lg shadow-brand-primary/20">
              <Search size={28} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <aside className="lg:w-1/4 space-y-10">
             <div className="glass p-8 rounded-[2rem] border border-white/5 shadow-xl">
               <div className="flex items-center gap-3 text-white font-black mb-8 border-b border-white/5 pb-4">
                 <SlidersHorizontal size={20} className="text-brand-primary" />
                 Specialties
               </div>
               <div className="space-y-4">
                  {specialties.map(spec => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`w-full text-left px-5 py-3 rounded-xl font-bold transition-all ${
                        selectedSpecialty === spec 
                          ? 'bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20' 
                          : 'text-brand-text-dim hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
               </div>
             </div>
          </aside>
          
          {/* Doctors Grid */}
          <main className="lg:w-3/4">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-10">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-[500px] bg-white/5 rounded-[2.5rem] animate-pulse" />
                ))}
              </div>
            ) : filteredDoctors.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-10">
                {filteredDoctors.map((doctor, idx) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-brand-primary/20 transition-all duration-500 shadow-2xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img 
                        src={doctor.profilePhoto || `https://picsum.photos/seed/${doctor.id}/800/600`} 
                        alt={doctor.fullName} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-bg to-transparent opacity-60" />
                      <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md text-emerald-400 text-xs font-black border border-emerald-500/20">
                        VERIFIED
                      </div>
                    </div>
                    
                    <div className="p-10 relative">
                      <div className="flex items-center gap-1.5 text-amber-500 mb-4">
                        <Star size={18} fill="currentColor" />
                        <span className="text-base font-black">{doctor.ratingAvg || 0}</span>
                        <span className="text-brand-text-dim text-sm font-bold ml-1">({doctor.ratingCount || 0} reviews)</span>
                      </div>
                      
                      <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{doctor.fullName}</h3>
                      <p className="text-brand-primary font-black text-sm mb-6 uppercase tracking-widest">{doctor.specialty}</p>
                      
                      <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-4 text-brand-text-dim text-sm font-bold">
                          <MapPin size={18} className="text-brand-primary/60" />
                          <span>{doctor.qualification}</span>
                        </div>
                        <div className="flex items-center gap-4 text-brand-text-dim text-sm font-bold">
                          <Calendar size={18} className="text-brand-primary/60" />
                          <span>Fee: ৳{doctor.consultationFee}</span>
                        </div>
                      </div>
                      
                      <Link to={`/doctor/${doctor.id}`} className="btn btn-primary w-full !rounded-2xl !py-4 text-base font-black tracking-wide flex items-center justify-center gap-3">
                        Book Visit
                        <CheckCircle size={20} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 glass rounded-[3rem] border border-dashed border-white/10">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-text-dim">
                  <Database size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Welcome to MediSeba</h3>
                <p className="text-brand-text-dim font-medium mb-10">The doctor database is currently empty. Initialize with sample experts to test the platform.</p>
                <button 
                  onClick={seedSampleDoctors}
                  className="btn btn-primary gap-3 !px-10"
                >
                  <Database size={20} />
                  Seed Sample Doctors
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
