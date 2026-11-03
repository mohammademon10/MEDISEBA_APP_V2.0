import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  Calendar, Clock, User, ClipboardCheck, AlertCircle, 
  CheckCircle2, XCircle, LogOut, Stethoscope, ShieldCheck, 
  Search, FileText, CheckCircle
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  timeSlotStart: string;
  tokenNumber: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctorId: string;
  patientId: string;
  patientName?: string;
  symptoms: string;
}

export default function DoctorDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const navigate = useNavigate();

  // Role Protection
  if (!authLoading) {
    if (!user) return <Navigate to="/portal" replace />;
    if (userData?.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    if (userData?.role === 'admin') return <Navigate to="/admin" replace />;
    if (userData?.role === 'doctor' && userData.isVerified === false) {
      return <Navigate to="/doctor/pending-verification" replace />;
    }
  }

  useEffect(() => {
    async function fetchDoctorAppointments() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'appointments'),
          where('doctorId', '==', user.uid)
        );

        const snapshot = await getDocs(q);
        const appts = await Promise.all(
          snapshot.docs.map(async (d) => {
            const data = d.data() as Appointment;
            let patientName = 'Patient';
            try {
              const pRef = doc(db, 'users', data.patientId);
              const pSnap = await getDoc(pRef);
              if (pSnap.exists()) {
                patientName = pSnap.data().fullName || 'Registered Patient';
              }
            } catch {
              patientName = 'Registered Patient';
            }

            return {
              id: d.id,
              ...data,
              patientName,
            };
          })
        );

        // Sort descending
        appts.sort((a, b) => {
          const c = (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
          if (c !== 0) return c;
          return (b.tokenNumber || 0) - (a.tokenNumber || 0);
        });

        setAppointments(appts);
      } catch (err) {
        console.error('Error fetching doctor appointments:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDoctorAppointments();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/portal');
  };

  const updateStatus = async (id: string, newStatus: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const filtered = appointments.filter(
    (a) => activeFilter === 'all' || a.status === activeFilter
  );

  return (
    <div className="pt-32 pb-24 bg-brand-bg min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary text-xs font-bold mb-3 uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Verified Medical Practitioner</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
              Dr. <span className="text-brand-secondary">{userData?.fullName || user?.displayName || 'Physician'}</span>
            </h1>
            <p className="text-brand-text-dim font-medium">
              Clinical Consultation Queue & Patient Management
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass p-6 rounded-[2rem] border border-white/5">
            <div className="text-brand-text-dim text-xs font-black uppercase tracking-widest mb-1">
              Total Queue
            </div>
            <div className="text-4xl font-black text-white">{appointments.length}</div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-amber-500/20">
            <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
              Pending Confirmation
            </div>
            <div className="text-4xl font-black text-amber-400">
              {appointments.filter((a) => a.status === 'pending').length}
            </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-brand-primary/20">
            <div className="text-brand-primary text-xs font-black uppercase tracking-widest mb-1">
              Confirmed Today
            </div>
            <div className="text-4xl font-black text-brand-primary">
              {appointments.filter((a) => a.status === 'confirmed').length}
            </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-emerald-500/20">
            <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
              Completed
            </div>
            <div className="text-4xl font-black text-emerald-400">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Consultation Queue Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Stethoscope size={24} className="text-brand-secondary" />
              Patient Consultation Queue
            </h2>

            <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeFilter === tab
                      ? 'bg-brand-secondary text-slate-900 shadow-lg shadow-brand-secondary/20'
                      : 'text-brand-text-dim hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />
              ))
            ) : filtered.length > 0 ? (
              filtered.map((appt, idx) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 hover:border-brand-secondary/30 transition-all flex flex-col md:flex-row gap-6 items-center"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-secondary/10 text-brand-secondary rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 border border-brand-secondary/20">
                    <span className="text-2xl md:text-3xl font-black">#{appt.tokenNumber}</span>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h3 className="text-xl font-black text-white">{appt.patientName}</h3>
                      <span className="text-xs text-brand-text-dim font-bold">
                        ({appt.appointmentNumber})
                      </span>
                    </div>

                    <p className="text-sm text-brand-text-dim font-medium">
                      <span className="text-white/60 font-semibold">Symptoms:</span> {appt.symptoms || 'General Checkup'}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-brand-text-dim font-bold pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-brand-secondary" />
                        {appt.appointmentDate}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-secondary" />
                        {appt.timeSlotStart}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col md:flex-row items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        appt.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : appt.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : appt.status === 'confirmed'
                          ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {appt.status}
                    </span>

                    <div className="flex items-center gap-2">
                      {appt.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'confirmed')}
                          className="px-3 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Confirm Appointment"
                        >
                          <CheckCircle2 size={16} />
                          Confirm
                        </button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'completed')}
                          className="px-3 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Mark Consultation Complete"
                        >
                          <CheckCircle size={16} />
                          Complete
                        </button>
                      )}
                      {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'cancelled')}
                          className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Cancel Appointment"
                        >
                          <XCircle size={16} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <AlertCircle size={40} className="text-brand-text-dim mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">No appointments found</h3>
                <p className="text-brand-text-dim text-sm">
                  {activeFilter === 'all'
                    ? 'Your queue is currently clear.'
                    : `No appointments with status "${activeFilter}".`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
