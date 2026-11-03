import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Stethoscope, User, ShieldCheck, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import AuthPage from './Auth';

export default function Portal() {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (userData?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userData?.role === 'doctor') {
        if (userData.isVerified === false) {
          navigate('/doctor/pending-verification', { replace: true });
        } else {
          navigate('/doctor/dashboard', { replace: true });
        }
      } else if (userData?.role === 'patient') {
        navigate('/patient/dashboard', { replace: true });
      }
    }
  }, [user, userData, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-text-dim font-bold tracking-widest text-xs uppercase">
            Resolving MediSeba Portal Session...
          </p>
        </div>
      </div>
    );
  }

  // If already logged in, the useEffect redirects automatically.
  // If not logged in, render the Portal gateway for Doctor & Patient.
  return (
    <div className="pt-32 pb-24 min-h-screen bg-brand-bg flex items-center justify-center px-4 relative">
      <div className="w-full max-w-xl">
        {/* Render the standard secure login flow with portal context */}
        <AuthPage mode="login" />
      </div>
    </div>
  );
}
