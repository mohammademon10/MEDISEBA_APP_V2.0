import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Mail, Lock, User, UserPlus, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setIsOperationNotAllowed(false);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user record already exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const displayName = user.displayName || fullName || 'User';
        await setDoc(userDocRef, {
          email: user.email || '',
          role: role,
          status: 'active',
          createdAt: serverTimestamp(),
          fullName: displayName,
          profilePhoto: user.photoURL || ''
        });

        if (role === 'doctor') {
          await setDoc(doc(db, 'doctors', user.uid), {
            fullName: displayName,
            specialty: 'General Medicine',
            qualification: 'MBBS',
            consultationFee: 500,
            bio: 'Healthcare professional specializing in virtual consultations.',
            clinicName: 'MediSeba Telehealth Center',
            clinicAddress: 'Dhaka, Bangladesh',
            profilePhoto: user.photoURL || '',
            isVerified: true,
            ratingAvg: 5.0,
            ratingCount: 1
          });
        } else {
          await setDoc(doc(db, 'patients', user.uid), {
            fullName: displayName,
            createdAt: serverTimestamp(),
            profilePhoto: user.photoURL || ''
          });
        }
      }

      await refreshUserData();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsOperationNotAllowed(false);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        // Create user doc in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email,
          role,
          status: 'active',
          createdAt: serverTimestamp(),
          fullName
        });

        // Create specific profile
        if (role === 'doctor') {
          await setDoc(doc(db, 'doctors', user.uid), {
            fullName,
            specialty: 'Pending Specialist',
            qualification: 'MBBS',
            consultationFee: 500,
            isVerified: false,
            ratingAvg: 0,
            ratingCount: 0
          });
        } else {
          await setDoc(doc(db, 'patients', user.uid), {
            fullName,
            createdAt: serverTimestamp()
          });
        }

        await refreshUserData();
        navigate('/dashboard');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await refreshUserData();
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setError('Email & Password sign-in is not enabled on this Firebase project. Please use "Continue with Google" below to authenticate instantly.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. If you haven\'t signed up yet, please register or use Google Sign-In.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in or use Google.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen flex items-center justify-center px-4 relative">
       {/* Background Decoration */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] -z-10" />
       
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-lg glass p-10 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl"
       >
         <div className="text-center mb-8">
           <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
             {mode === 'login' ? <LogIn size={32} /> : <UserPlus size={32} />}
           </div>
           <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
             {mode === 'login' ? 'Welcome Back' : 'Create Account'}
           </h1>
           <p className="text-brand-text-dim font-medium uppercase tracking-widest text-xs">
             {mode === 'login' ? 'Access your MediSeba healthcare portal' : 'Join the future of healthcare in Bangladesh'}
           </p>
         </div>

         {/* Role Selection for Registration */}
         {mode === 'register' && (
           <div className="space-y-2 mb-6">
             <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2">Select Your Role</label>
             <div className="grid grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={() => setRole('patient')}
                 className={`p-4 rounded-2xl border transition-all font-bold flex items-center justify-center gap-2 ${
                   role === 'patient' 
                    ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/10' 
                    : 'bg-white/5 border-white/10 text-brand-text-dim hover:bg-white/10'
                 }`}
               >
                 <User size={18} />
                 Patient
               </button>
               <button
                 type="button"
                 onClick={() => setRole('doctor')}
                 className={`p-4 rounded-2xl border transition-all font-bold flex items-center justify-center gap-2 ${
                   role === 'doctor' 
                    ? 'bg-brand-secondary/20 border-brand-secondary text-brand-secondary shadow-lg shadow-brand-secondary/10' 
                    : 'bg-white/5 border-white/10 text-brand-text-dim hover:bg-white/10'
                 }`}
               >
                 <ShieldCheck size={18} />
                 Doctor
               </button>
             </div>
           </div>
         )}

         {/* One-Click Google Authentication Button */}
         <div className="space-y-4 mb-8">
           <button
             type="button"
             onClick={handleGoogleSignIn}
             disabled={googleLoading}
             className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
           >
             {googleLoading ? (
               <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
             ) : (
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path
                   fill="#4285F4"
                   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                 />
                 <path
                   fill="#34A853"
                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                 />
                 <path
                   fill="#FBBC05"
                   d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                 />
                 <path
                   fill="#EA4335"
                   d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                 />
               </svg>
             )}
             <span>{mode === 'login' ? 'Continue with Google' : `Sign Up as ${role === 'doctor' ? 'Doctor' : 'Patient'} with Google`}</span>
           </button>

           <div className="relative flex py-2 items-center">
             <div className="flex-grow border-t border-white/10" />
             <span className="flex-shrink mx-4 text-xs font-bold text-brand-text-dim uppercase tracking-widest">or with email</span>
             <div className="flex-grow border-t border-white/10" />
           </div>
         </div>

         {error && (
           <div className={`mb-6 p-4 rounded-2xl text-sm font-medium border flex items-start gap-3 ${
             isOperationNotAllowed 
               ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
               : 'bg-red-500/10 border-red-500/20 text-red-400'
           }`}>
             <AlertCircle size={20} className="shrink-0 mt-0.5" />
             <div className="space-y-2">
               <p>{error}</p>
               {isOperationNotAllowed && (
                 <button
                   type="button"
                   onClick={handleGoogleSignIn}
                   className="text-xs font-bold text-white bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-all inline-block"
                 >
                   Click here to sign in with Google →
                 </button>
               )}
             </div>
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-5">
           {mode === 'register' && (
             <div className="space-y-2">
               <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2">Full Name</label>
               <div className="relative">
                 <User className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-dim" size={18} />
                 <input
                   type="text"
                   required
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="e.g. Dr. Ayesha Rahman or Kamal Hossain"
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-medium"
                 />
               </div>
             </div>
           )}

           <div className="space-y-2">
             <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2">Email Address</label>
             <div className="relative">
               <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-dim" size={18} />
               <input
                 type="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="name@example.com"
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-medium"
               />
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-2">Password</label>
             <div className="relative">
               <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-dim" size={18} />
               <input
                 type="password"
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-medium"
               />
             </div>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="btn btn-primary w-full !py-4 text-base font-bold shadow-2xl shadow-brand-primary/20 cursor-pointer"
           >
             {loading ? 'Processing...' : mode === 'login' ? 'Login with Email' : 'Register with Email'}
           </button>
         </form>

         <div className="mt-8 text-center">
            <p className="text-brand-text-dim font-medium text-sm">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <Link 
                to={mode === 'login' ? '/register' : '/login'} 
                className="text-brand-primary font-bold hover:underline"
              >
                {mode === 'login' ? 'Register here' : 'Login here'}
              </Link>
            </p>
         </div>
       </motion.div>
    </div>
  );
}
