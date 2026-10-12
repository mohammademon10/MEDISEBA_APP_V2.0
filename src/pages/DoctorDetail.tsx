import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Star, MapPin, CheckCircle, Info, Stethoscope, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { FEATURED_DOCTORS } from '../constants';

interface Doctor {
  fullName: string;
  specialty: string;
  qualification: string;
  consultationFee: number;
  bio: string;
  clinicName: string;
  clinicAddress: string;
  ratingAvg: number;
  ratingCount: number;
  profilePhoto?: string;
}

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
}

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessToken, setBookingSuccessToken] = useState<number | null>(null);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [symptoms, setSymptoms] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const docRef = doc(db, 'doctors', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setDoctor(docSnap.data() as Doctor);
        } else {
          // Check featured doctors
          const feat = FEATURED_DOCTORS.find(d => d.id === id);
          if (feat) {
            setDoctor({
              fullName: feat.name,
              specialty: feat.specialty,
              qualification: 'MBBS, FCPS',
              consultationFee: 700,
              bio: `${feat.name} is a senior healthcare specialist at ${feat.hospital}. Committed to personalized patient diagnosis and digital care.`,
              clinicName: feat.hospital,
              clinicAddress: 'Dhaka, Bangladesh',
              ratingAvg: feat.rating,
              ratingCount: feat.reviews,
              profilePhoto: feat.image
            });
          }
        }

        const schedSnap = await getDocs(collection(db, 'doctors', id, 'schedules'));
        if (!schedSnap.empty) {
          setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Schedule[]);
        } else {
          // Provide standard schedules
          setSchedules([
            { id: 'sch-1', dayOfWeek: 'Sunday - Thursday', startTime: '10:00 AM', endTime: '01:00 PM', maxPatients: 20 },
            { id: 'sch-2', dayOfWeek: 'Sunday - Thursday', startTime: '04:00 PM', endTime: '08:00 PM', maxPatients: 25 },
            { id: 'sch-3', dayOfWeek: 'Friday', startTime: '05:00 PM', endTime: '09:00 PM', maxPatients: 15 },
          ]);
        }
      } catch (err) {
        console.error("Error fetching doctor data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedDate || !selectedSchedule || !id) return;

    setBooking(true);
    setBookingError(null);

    try {
      const tokenNumber = await runTransaction(db, async (transaction) => {
        const statsRef = doc(db, 'doctors', id, 'daily_stats', selectedDate);
        const statsSnap = await transaction.get(statsRef);
        
        let nextToken = 1;
        if (statsSnap.exists()) {
          nextToken = (statsSnap.data().tokenCount || 0) + 1;
        }

        if (nextToken > selectedSchedule.maxPatients) {
          throw new Error('All consultation tokens for this schedule slot are fully booked.');
        }

        const newApptRef = doc(collection(db, 'appointments'));
        const appointmentNumber = `APT-${Date.now().toString().slice(-6)}-${nextToken}`;

        transaction.set(newApptRef, {
          appointmentNumber,
          patientId: user.uid,
          doctorId: id,
          scheduleId: selectedSchedule.id,
          appointmentDate: selectedDate,
          timeSlotStart: selectedSchedule.startTime,
          timeSlotEnd: selectedSchedule.endTime,
          tokenNumber: nextToken,
          status: 'pending',
          symptoms: symptoms || 'General consultation request',
          createdAt: serverTimestamp()
        });

        transaction.set(statsRef, { tokenCount: nextToken }, { merge: true });

        return nextToken;
      });

      setBookingSuccessToken(tokenNumber);
    } catch (err: any) {
      console.error('Booking Error:', err);
      setBookingError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="pt-48 text-center text-white font-bold text-lg">Loading specialist profile...</div>;
  if (!doctor) return <div className="pt-48 text-center text-white font-bold text-lg">Specialist not found.</div>;

  return (
    <div className="pt-32 pb-24 bg-brand-bg min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="glass p-10 md:p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden shadow-2xl"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px]" />
                
                <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                   <div className="w-44 h-44 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl shrink-0">
                     <img 
                       src={doctor.profilePhoto || `https://picsum.photos/seed/${id}/600/600`} 
                       alt={doctor.fullName} 
                       className="w-full h-full object-cover"
                       referrerPolicy="no-referrer"
                     />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 w-fit">
                        <ShieldCheck size={14} />
                        Verified Expert
                      </div>
                      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{doctor.fullName}</h1>
                      <p className="text-lg text-brand-primary font-black uppercase tracking-[0.2em] mb-6">{doctor.specialty}</p>
                      
                      <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                              <Star size={24} fill="currentColor" />
                           </div>
                           <div>
                              <div className="text-2xl font-black text-white">{doctor.ratingAvg}</div>
                              <div className="text-xs text-brand-text-dim font-bold uppercase tracking-widest">{doctor.ratingCount} Reviews</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                              <Stethoscope size={24} />
                           </div>
                           <div>
                              <div className="text-2xl font-black text-white">Verified</div>
                              <div className="text-xs text-brand-text-dim font-bold uppercase tracking-widest">Digital Care</div>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="mt-12 space-y-8">
                   <div>
                     <h3 className="text-xl font-black text-white mb-3 flex items-center gap-3">
                       <Info size={22} className="text-brand-primary" />
                       About Doctor
                     </h3>
                     <p className="text-brand-text-dim leading-relaxed font-medium text-base md:text-lg">
                       {doctor.bio}
                     </p>
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <h4 className="text-white font-black mb-2 flex items-center gap-2">
                          <MapPin size={18} className="text-brand-secondary" />
                          Clinic / Chamber
                        </h4>
                        <p className="text-white font-bold mb-1">{doctor.clinicName}</p>
                        <p className="text-sm text-brand-text-dim font-medium">{doctor.clinicAddress}</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <h4 className="text-white font-black mb-2 flex items-center gap-2">
                          <CheckCircle size={18} className="text-brand-primary" />
                          Qualifications
                        </h4>
                        <p className="text-white font-bold">{doctor.qualification}</p>
                     </div>
                   </div>
                </div>
             </motion.div>
          </div>

          {/* Booking Panel */}
          <div className="space-y-8">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="glass p-8 md:p-10 rounded-[3rem] border border-brand-primary/20 sticky top-28 shadow-2xl overflow-hidden"
             >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
                
                <h3 className="text-2xl font-black text-white mb-6 border-b border-white/5 pb-4">Book Consultation</h3>

                {bookingError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2 flex items-center gap-2">
                        <Calendar size={14} className="text-brand-primary" />
                        Select Date
                      </label>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-bold"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2 flex items-center gap-2">
                        <Clock size={14} className="text-brand-primary" />
                        Available Slot
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {schedules.map(sched => (
                          <button
                            key={sched.id}
                            type="button"
                            onClick={() => setSelectedSchedule(sched)}
                            className={`p-3.5 rounded-2xl border transition-all text-left ${
                              selectedSchedule?.id === sched.id 
                                ? 'bg-brand-primary/20 border-brand-primary text-white shadow-lg shadow-brand-primary/10' 
                                : 'bg-white/5 border-white/10 hover:border-white/30 text-brand-text-dim'
                            }`}
                          >
                            <div className="font-extrabold text-sm text-white mb-0.5">
                              {sched.dayOfWeek}
                            </div>
                            <div className="text-xs font-medium">
                              {sched.startTime} - {sched.endTime} ({sched.maxPatients} max tokens)
                            </div>
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2">
                        Brief Symptoms
                      </label>
                      <textarea 
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="e.g. Fever for 3 days, headaches..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white h-20 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-medium resize-none text-sm"
                      />
                   </div>

                   <div className="pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-brand-text-dim font-bold text-sm">Consultation Fee</span>
                        <span className="text-3xl font-black text-white">৳{doctor.consultationFee}</span>
                      </div>
                      <button 
                        onClick={handleBook}
                        disabled={booking || !selectedDate || !selectedSchedule}
                        className="btn btn-primary w-full !rounded-2xl !py-4 text-base font-black tracking-wide shadow-2xl shadow-brand-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {booking ? (
                          <div className="w-5 h-5 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                        ) : (
                          <>
                            Confirm Booking
                            <CheckCircle size={20} />
                          </>
                        )}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </div>

      {/* In-App Confirmation Modal */}
      <AnimatePresence>
        {bookingSuccessToken !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-10 rounded-[3rem] border border-brand-primary/30 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Check size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white mb-2">Booking Confirmed!</h3>
                <p className="text-brand-text-dim text-sm font-medium">Your consultation appointment has been created.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <span className="text-xs uppercase tracking-widest text-brand-text-dim font-bold block mb-1">Queue Token Number</span>
                <span className="text-5xl font-black text-brand-primary">#{bookingSuccessToken}</span>
              </div>
              <p className="text-xs text-brand-text-dim">
                Appointment date: <strong className="text-white">{selectedDate}</strong> at <strong className="text-white">{selectedSchedule?.startTime}</strong>
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary w-full !py-4 font-black"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
