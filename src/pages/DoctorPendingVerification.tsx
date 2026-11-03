import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock, Phone, ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function DoctorPendingVerification() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (logout) {
      await logout();
    }
    navigate('/portal');
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="max-w-xl w-full glass p-10 md:p-12 rounded-[3rem] border border-amber-500/20 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />

        <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
          <Clock size={40} />
        </div>

        <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block mb-4">
          BMDC Verification In Progress
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
          Doctor Profile Under Review
        </h1>

        <p className="text-brand-text-dim text-base font-medium leading-relaxed mb-8">
          Welcome, <span className="text-white font-bold">{userData?.fullName || user?.displayName || 'Doctor'}</span>. 
          To protect patient safety under national health standards, all medical practitioners must have their credentials and BMDC registration verified by a MediSeba Platform Administrator before accessing the clinical consultation queue.
        </p>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-left space-y-3 mb-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-white">
            <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            <span>Review SLA: Typically verified within 24 business hours.</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-white">
            <Phone size={18} className="text-brand-primary shrink-0" />
            <span>Need urgent verification? Call verification desk: +880 1893 672505</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn bg-white/5 border border-white/10 text-white hover:bg-white/10 !py-3 !px-6 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <button
            onClick={handleSignOut}
            className="btn bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 !py-3 !px-6 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
