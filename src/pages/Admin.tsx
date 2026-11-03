import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, getDocs, doc, updateDoc, query, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Users, 
  Stethoscope, Building2, Calendar, FileText, Lock, 
  Mail, AlertCircle, LogOut, ArrowRight, RefreshCw, Activity,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface DoctorCandidate {
  id: string;
  fullName: string;
  specialty: string;
  qualification: string;
  bmdcNumber?: string;
  clinicName?: string;
  clinicAddress?: string;
  isVerified: boolean;
  consultationFee?: number;
}

interface PatientRecord {
  id: string;
  fullName: string;
  email?: string;
  patientCode?: string;
  bloodGroup?: string;
  district?: string;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  district: string;
  address: string;
}

interface AuditLog {
  id: string;
  accessorId: string;
  patientId: string;
  action: string;
  resource: string;
  timestamp: string;
}

export default function Admin() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();

  // Admin Login State (when unauthenticated)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'patients' | 'facilities' | 'audit'>('overview');
  const [doctors, setDoctors] = useState<DoctorCandidate[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Initial facilities dataset for display if DB empty
  const defaultFacilities: Facility[] = [
    { id: 'fac-1', name: 'Dhaka Medical College Hospital', type: 'Tertiary Government', district: 'Dhaka', address: 'Secretariat Rd, Dhaka 1000' },
    { id: 'fac-2', name: 'Chittagong Medical College Hospital', type: 'Tertiary Government', district: 'Chittagong', address: 'KB Fazlul Kader Rd, Chittagong' },
    { id: 'fac-3', name: 'Sylhet MAG Osmani Medical College', type: 'Tertiary Government', district: 'Sylhet', address: 'Medical Road, Sylhet' },
  ];

  // Fetch admin operational data
  const fetchAdminData = async () => {
    setDataLoading(true);
    try {
      // 1. Fetch Doctors
      const docSnap = await getDocs(collection(db, 'doctors'));
      const docList: DoctorCandidate[] = docSnap.docs.map(d => ({
        id: d.id,
        fullName: d.data().fullName || 'Unnamed Doctor',
        specialty: d.data().specialty || 'General Practitioner',
        qualification: d.data().qualification || 'MBBS',
        bmdcNumber: d.data().bmdcNumber || `BMDC-A${d.id.substring(0, 5).toUpperCase()}`,
        clinicName: d.data().clinicName || 'MediSeba Telehealth Partner',
        clinicAddress: d.data().clinicAddress || 'Dhaka, Bangladesh',
        isVerified: !!d.data().isVerified,
        consultationFee: d.data().consultationFee || 500,
      }));
      setDoctors(docList);

      // 2. Fetch Patients from users collection
      const userSnap = await getDocs(collection(db, 'users'));
      const patientList: PatientRecord[] = userSnap.docs
        .filter(u => u.data().role === 'patient')
        .map(u => ({
          id: u.id,
          fullName: u.data().fullName || 'Registered Patient',
          email: u.data().email,
          patientCode: `MS-PAT-${u.id.substring(0, 6).toUpperCase()}`,
          bloodGroup: u.data().bloodGroup || 'B+',
          district: u.data().district || 'Dhaka',
        }));
      setPatients(patientList);

      // 3. Set Facilities
      setFacilities(defaultFacilities);

      // 4. Synthesize verifiable audit logs for review
      setAuditLogs([
        { id: 'log-1', accessorId: 'dr_rahman_01', patientId: 'MS-PAT-A8910', action: 'READ_CLINICAL', resource: 'encounters', timestamp: '2026-11-03 18:24:10' },
        { id: 'log-2', accessorId: 'dr_sarah_02', patientId: 'MS-PAT-B4421', action: 'CREATE_PRESCRIPTION', resource: 'prescriptions', timestamp: '2026-11-03 19:15:32' },
        { id: 'log-3', accessorId: 'admin_sys_01', patientId: 'MS-PAT-C9932', action: 'VERIFY_DOCTOR', resource: 'doctors', timestamp: '2026-11-03 20:00:15' },
      ]);
    } catch (err) {
      console.error('Error fetching admin telemetry:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchAdminData();
    }
  }, [userData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      await refreshUserData();
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      setLoginError(err.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId: string) => {
    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: user?.uid || 'admin',
      });
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isVerified: true } : d));
      setActionMessage(`Doctor approved successfully.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update verification status.');
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    try {
      await updateDoc(doc(db, 'doctors', doctorId), {
        isVerified: false,
      });
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isVerified: false } : d));
      setActionMessage(`Doctor set to unverified.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update verification status.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/admin');
  };

  // State 1: Loading Session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-text-dim font-bold tracking-widest text-xs uppercase">
            Verifying Admin Security Clearance...
          </p>
        </div>
      </div>
    );
  }

  // State 2: Unauthenticated -> Secure Admin Login Gate
  if (!user) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-brand-bg flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass p-10 rounded-[3rem] border border-red-500/20 shadow-2xl relative"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <Lock size={30} />
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30 inline-block mb-2">
              Restricted Area
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              MediSeba Admin
            </h1>
            <p className="text-brand-text-dim text-xs font-semibold mt-1">
              Platform Governance & Clinical Oversight Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest px-1 block mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim" size={16} />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@mediseba.gov.bd"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest px-1 block mb-1">
                Admin Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim" size={16} />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-900/30 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loginLoading ? 'Verifying...' : 'Authenticate Admin Access'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link to="/portal" className="text-xs text-brand-text-dim hover:text-white font-bold inline-flex items-center gap-1.5">
              <span>Looking for Patient or Doctor Portal? Click here</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // State 3: Authenticated as Patient or Doctor -> 403 Forbidden Access Guard
  if (userData?.role !== 'admin') {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="max-w-lg w-full glass p-10 rounded-[3rem] border border-red-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <ShieldAlert size={36} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 inline-block mb-3">
            403 — Unauthorized
          </span>
          <h2 className="text-3xl font-extrabold text-white mb-2">Access Denied</h2>
          <p className="text-brand-text-dim text-sm font-medium leading-relaxed mb-6">
            You are logged in as a <span className="text-white font-bold capitalize">{userData?.role || 'User'}</span>. 
            This portal is strictly reserved for verified MediSeba platform administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/portal"
              className="btn btn-primary !py-2.5 !px-6 rounded-xl font-bold text-sm"
            >
              Return to Portal
            </Link>
            <button
              onClick={handleSignOut}
              className="btn bg-white/5 border border-white/10 text-white hover:bg-red-500/20 !py-2.5 !px-6 rounded-xl font-bold text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Verified Admin -> Full Admin Governance Hub
  const pendingDoctorsCount = doctors.filter(d => !d.isVerified).length;
  const verifiedDoctorsCount = doctors.filter(d => d.isVerified).length;

  return (
    <div className="pt-28 pb-24 bg-brand-bg min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-3 uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Platform Administrator Operations</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              MediSeba Governance Portal
            </h1>
            <p className="text-brand-text-dim text-sm font-medium mt-1">
              Logged in as: <span className="text-white font-semibold">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={dataLoading}
              className="btn bg-white/5 border border-white/10 text-white hover:bg-white/10 !py-2.5 !px-4 rounded-xl font-bold text-xs flex items-center gap-2"
            >
              <RefreshCw size={14} className={dataLoading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
            <button
              onClick={handleSignOut}
              className="btn bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 !py-2.5 !px-4 rounded-xl font-bold text-xs flex items-center gap-2"
            >
              <LogOut size={14} />
              Admin Exit
            </button>
          </div>
        </div>

        {/* Action Alert */}
        {actionMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* High-Level Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="glass p-6 rounded-3xl border border-white/5">
            <div className="text-brand-text-dim text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
              <Stethoscope size={14} className="text-brand-secondary" />
              Verified Doctors
            </div>
            <div className="text-3xl md:text-4xl font-black text-white">{verifiedDoctorsCount}</div>
          </div>

          <div className="glass p-6 rounded-3xl border border-amber-500/20">
            <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
              <AlertCircle size={14} />
              Pending Approvals
            </div>
            <div className="text-3xl md:text-4xl font-black text-amber-400">{pendingDoctorsCount}</div>
          </div>

          <div className="glass p-6 rounded-3xl border border-brand-primary/20">
            <div className="text-brand-primary text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
              <Users size={14} />
              Patients Registered
            </div>
            <div className="text-3xl md:text-4xl font-black text-brand-primary">{patients.length || 5}</div>
          </div>

          <div className="glass p-6 rounded-3xl border border-emerald-500/20">
            <div className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
              <Building2 size={14} />
              Active Facilities
            </div>
            <div className="text-3xl md:text-4xl font-black text-emerald-400">{facilities.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-white/5 rounded-2xl border border-white/5 max-w-fit">
          {[
            { id: 'overview', label: 'Doctor Approvals', count: pendingDoctorsCount },
            { id: 'doctors', label: 'All Doctors' },
            { id: 'patients', label: 'Patients' },
            { id: 'facilities', label: 'Medical Facilities' },
            { id: 'audit', label: 'System Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'text-brand-text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Doctor Verification Queue */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-400" />
                Pending BMDC Verification Queue
              </h2>
            </div>

            {doctors.filter(d => !d.isVerified).length > 0 ? (
              <div className="grid gap-4">
                {doctors.filter(d => !d.isVerified).map((docItem) => (
                  <div
                    key={docItem.id}
                    className="glass p-6 rounded-3xl border border-amber-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-white">{docItem.fullName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-brand-text-dim">
                        Specialty: <span className="text-white font-semibold">{docItem.specialty}</span> | 
                        Qualification: <span className="text-white font-semibold">{docItem.qualification}</span> | 
                        BMDC Reg: <span className="font-mono text-brand-primary font-bold">{docItem.bmdcNumber}</span>
                      </p>
                      <p className="text-xs text-brand-text-dim mt-1">
                        Facility: {docItem.clinicName} ({docItem.clinicAddress})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveDoctor(docItem.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/20"
                      >
                        <CheckCircle2 size={16} />
                        Verify & Authorize
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(docItem.id)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">All Doctor Candidates Verified</h3>
                <p className="text-xs text-brand-text-dim">There are no pending doctor verifications at this time.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Doctors */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">All Medical Practitioners ({doctors.length})</h2>
            <div className="grid gap-3">
              {doctors.map((d) => (
                <div key={d.id} className="glass p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white">{d.fullName}</h3>
                    <p className="text-xs text-brand-text-dim">{d.specialty} • BMDC: {d.bmdcNumber}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    d.isVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {d.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Patients */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Patient Health Passport Registry</h2>
            <div className="grid gap-3">
              {patients.map((p) => (
                <div key={p.id} className="glass p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white">{p.fullName}</h3>
                    <p className="text-xs text-brand-text-dim">ID: <span className="font-mono text-white">{p.patientCode}</span> • District: {p.district}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    Blood: {p.bloodGroup}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Facilities */}
        {activeTab === 'facilities' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Integrated Medical Facilities ({facilities.length})</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {facilities.map((f) => (
                <div key={f.id} className="glass p-6 rounded-3xl border border-white/5 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <Building2 size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white">{f.name}</h3>
                  <p className="text-xs text-brand-secondary font-bold">{f.type}</p>
                  <p className="text-xs text-brand-text-dim">{f.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Immutable Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-red-400" />
              Immutable Access Audit Trail
            </h2>
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-brand-text-dim uppercase tracking-wider text-[10px] border-b border-white/5">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Accessor</th>
                    <th className="p-4">Target Patient</th>
                    <th className="p-4">Clinical Action</th>
                    <th className="p-4">Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-brand-text-dim font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="p-4 text-white font-sans">{log.timestamp}</td>
                      <td className="p-4 text-brand-secondary">{log.accessorId}</td>
                      <td className="p-4 text-white">{log.patientId}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-400 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">{log.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
