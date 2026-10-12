import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, User, ClipboardCheck, AlertCircle, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { FEATURED_DOCTORS } from '../constants';


interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  timeSlotStart: string;
  tokenNumber: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctorId: string;
  patientId: string;
  doctorName?: string;
  patientName?: string;
  symptoms: string;
}

export default function Dashboard() {
  const { user, userData } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAppointments() {
      if (!user || !userData) return;
      
      try {
        const field = userData.role === 'doctor' ? 'doctorId' : 'patientId';
        const q = query(
          collection(db, 'appointments'),
          where(field, '==', user.uid)
        );
        
        const snapshot = await getDocs(q);
        const appts = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Appointment;
          
          // Hydrate names
          let name = 'Unknown';
          if (userData.role === 'patient') {
             try {
               const docRef = doc(db, 'doctors', data.doctorId);
               const docSnap = await getDoc(docRef);
               if (docSnap.exists()) {
                 name = docSnap.data().fullName;
               } else {
                 const feat = FEATURED_DOCTORS.find(doc => doc.id === data.doctorId);
                 name = feat ? feat.name : 'Specialist Doctor';
               }
             } catch {
               const feat = FEATURED_DOCTORS.find(doc => doc.id === data.doctorId);
               name = feat ? feat.name : 'Specialist Doctor';
             }
          } else {
             try {
               const docRef = doc(db, 'users', data.patientId);
               const docSnap = await getDoc(docRef);
               name = docSnap.exists() ? docSnap.data().fullName : 'Patient';
             } catch {
               name = 'Patient';
             }
          }
          
          return {
            id: d.id,
            ...data,
            doctorName: userData.role === 'patient' ? name : undefined,
            patientName: userData.role === 'doctor' ? name : undefined,
          };
        }));

        // Sort in memory by date descending
        appts.sort((a, b) => {
          const dateComp = (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
          if (dateComp !== 0) return dateComp;
          return (b.tokenNumber || 0) - (a.tokenNumber || 0);
        });

        setAppointments(appts as Appointment[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAppointments();
  }, [user, userData]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="pt-32 pb-24 bg-brand-bg min-h-screen">
       <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
             <div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tighter mb-4">
                  Welcome, <span className="text-brand-primary">{userData?.fullName?.split(' ')[0]}</span>
                </h1>
                <p className="text-brand-text-dim font-medium flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${userData?.role === 'doctor' ? 'bg-brand-secondary' : 'bg-emerald-400'}`} />
                   Logged in as {userData?.role?.toUpperCase()}
                </p>
             </div>
             
             <button 
               onClick={handleLogout}
               className="btn bg-white/5 border border-white/10 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 gap-3 font-bold !rounded-2xl"
             >
               <LogOut size={18} />
               Sign Out
             </button>
          </div>

          <div className="grid lg:grid-cols-4 gap-12">
             {/* Stats Cards */}
             <div className="lg:col-span-1 space-y-6">
                <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                   <div className="text-brand-text-dim text-xs font-black uppercase tracking-widest mb-2">Total Visits</div>
                   <div className="text-5xl font-black text-white">{appointments.length}</div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] border border-emerald-500/10">
                   <div className="text-brand-text-dim text-xs font-black uppercase tracking-widest mb-2">Upcoming</div>
                   <div className="text-5xl font-black text-emerald-400">
                     {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length}
                   </div>
                </div>
             </div>

             <div className="lg:col-span-3 space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-2">
                   <h2 className="text-2xl font-black text-white">Appointments</h2>
                   
                   <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                      {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveFilter(tab)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeFilter === tab 
                              ? 'bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20' 
                              : 'text-brand-text-dim hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                   </div>
                </div>
                
                <div className="space-y-6">
                   {loading ? (
                     [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />)
                   ) : appointments.filter(a => activeFilter === 'all' || a.status === activeFilter).length > 0 ? (
                     appointments
                       .filter(a => activeFilter === 'all' || a.status === activeFilter)
                       .map((appt, idx) => (
                       <motion.div
                         key={appt.id}
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.1 }}
                         className="glass p-8 rounded-[2.5rem] border border-white/5 group hover:border-brand-primary/20 transition-all flex flex-col md:flex-row gap-8 items-center"
                       >
                         <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-3xl flex items-center justify-center shrink-0">
                            <span className="text-3xl font-black">#{appt.tokenNumber}</span>
                         </div>
                         
                         <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-white mb-2">{appt.doctorName || appt.patientName}</h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-brand-text-dim font-bold">
                               <div className="flex items-center gap-2">
                                  <Calendar size={16} className="text-brand-primary" />
                                  {appt.appointmentDate}
                               </div>
                               <div className="flex items-center gap-2">
                                  <Clock size={16} className="text-brand-primary" />
                                  {appt.timeSlotStart}
                               </div>
                               <div className="flex items-center gap-2">
                                  <ClipboardCheck size={16} className="text-brand-primary" />
                                  {appt.appointmentNumber}
                               </div>
                            </div>
                         </div>

                         <div className="shrink-0 flex flex-col items-center md:items-end gap-4">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              appt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              appt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              appt.status === 'confirmed' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                               {appt.status}
                            </div>
                            
                            {userData?.role === 'doctor' && appt.status === 'pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => updateStatus(appt.id, 'confirmed')}
                                  className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500 transition-colors hover:text-white"
                                >
                                   <CheckCircle2 size={18} />
                                </button>
                                <button 
                                  onClick={() => updateStatus(appt.id, 'cancelled')}
                                  className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 transition-colors hover:text-white"
                                >
                                   <XCircle size={18} />
                                </button>
                              </div>
                            )}
                         </div>
                       </motion.div>
                     ))
                   ) : (
                     <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <AlertCircle size={48} className="text-brand-text-dim mx-auto mb-6" />
                        <h3 className="text-xl font-black text-white mb-2">No appointments yet</h3>
                        <p className="text-brand-text-dim font-medium">When you book sessions, they will appear here!</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
