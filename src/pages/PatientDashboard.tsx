import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  Calendar, Clock, User, ClipboardCheck, AlertCircle, 
  LogOut, HeartPulse, FileText, ArrowRight, Stethoscope, 
  PlusCircle, ShieldCheck
} from 'lucide-react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
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
  doctorName?: string;
  doctorSpecialty?: string;
  symptoms: string;
}

export default function PatientDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const navigate = useNavigate();

  // Role Protection
  if (!authLoading) {
    if (!user) return <Navigate to="/portal" replace />;
    if (userData?.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (userData?.role === 'admin') return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    async function fetchPatientAppointments() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'appointments'),
          where('patientId', '==', user.uid)
        );

        const snapshot = await getDocs(q);
        const appts = await Promise.all(
          snapshot.docs.map(async (d) => {
            const data = d.data() as Appointment;
            let doctorName = 'Specialist Doctor';
            let doctorSpecialty = 'General Medicine';

            try {
              const docRef = doc(db, 'doctors', data.doctorId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                doctorName = docSnap.data().fullName || 'Specialist Doctor';
                doctorSpecialty = docSnap.data().specialty || 'General Medicine';
              } else {
                const feat = FEATURED_DOCTORS.find((f) => f.id === data.doctorId);
                if (feat) {
                  doctorName = feat.name;
                  doctorSpecialty = feat.specialty;
                }
              }
            } catch {
              const feat = FEATURED_DOCTORS.find((f) => f.id === data.doctorId);
              if (feat) {
                doctorName = feat.name;
                doctorSpecialty = feat.specialty;
              }
            }

            return {
              id: d.id,
              ...data,
              doctorName,
              doctorSpecialty,
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
        console.error('Error fetching patient appointments:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchPatientAppointments();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/portal');
  };

  const filtered = appointments.filter(
    (a) => activeFilter === 'all' || a.status === activeFilter
  );

  const patientCode = user ? `MS-PAT-${user.uid.substring(0, 6).toUpperCase()}` : 'MS-PAT-000000';

  return (
    <div className="pt-32 pb-24 bg-brand-bg min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3 uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Unified Health Passport Active</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
              Welcome, <span className="text-brand-primary">{userData?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Patient'}</span>
            </h1>
            <p className="text-brand-text-dim font-medium">
              Health Passport ID: <span className="font-mono text-white font-bold">{patientCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/doctors"
              className="btn btn-primary !py-3 !px-6 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              <PlusCircle size={18} />
              Book Appointment
            </Link>
            <button
              onClick={handleLogout}
              className="btn bg-white/5 border border-white/10 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 gap-3 font-bold !rounded-2xl !py-3"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass p-6 rounded-[2rem] border border-white/5">
            <div className="text-brand-text-dim text-xs font-black uppercase tracking-widest mb-1">
              Total Consultations
            </div>
            <div className="text-4xl font-black text-white">{appointments.length}</div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-emerald-500/20">
            <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
              Active Upcoming Visits
            </div>
            <div className="text-4xl font-black text-emerald-400">
              {appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending').length}
            </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-brand-primary/20">
            <div className="text-brand-primary text-xs font-black uppercase tracking-widest mb-1">
              Prescription Records
            </div>
            <div className="text-4xl font-black text-brand-primary">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Calendar size={24} className="text-brand-primary" />
              My Appointments & Consultations
            </h2>

            <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              {(['all', 'pending', 'confirmed', 'completed'] as const).map((tab) => (
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
                  className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 hover:border-brand-primary/30 transition-all flex flex-col md:flex-row gap-6 items-center"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-primary/10 text-brand-primary rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 border border-brand-primary/20">
                    <span className="text-2xl md:text-3xl font-black">#{appt.tokenNumber}</span>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h3 className="text-xl font-black text-white">{appt.doctorName}</h3>
                      <span className="text-xs text-brand-secondary font-bold">
                        {appt.doctorSpecialty}
                      </span>
                    </div>

                    <p className="text-sm text-brand-text-dim font-medium">
                      <span className="text-white/60 font-semibold">Reported Issue:</span> {appt.symptoms || 'General Checkup'}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-brand-text-dim font-bold pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-brand-primary" />
                        {appt.appointmentDate}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-primary" />
                        {appt.timeSlotStart}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClipboardCheck size={14} className="text-brand-primary" />
                        {appt.appointmentNumber}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
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
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                <AlertCircle size={40} className="text-brand-text-dim mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">No appointments found</h3>
                <p className="text-brand-text-dim text-sm mb-6">
                  {activeFilter === 'all'
                    ? "You haven't scheduled any consultations yet."
                    : `No appointments with status "${activeFilter}".`}
                </p>
                <Link
                  to="/doctors"
                  className="btn btn-primary !py-2.5 !px-6 rounded-xl font-bold inline-flex items-center gap-2"
                >
                  <PlusCircle size={16} />
                  Find a Doctor
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
