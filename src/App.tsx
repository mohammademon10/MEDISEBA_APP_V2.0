import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Hero from './components/home/Hero';
import Features from './components/home/Features';
import Specialties from './components/home/Specialties';
import FeaturedDoctors from './components/home/FeaturedDoctors';
import HowItWorks from './components/home/HowItWorks';
import AIAnalysisDemo from './components/home/AIAnalysisDemo';
import { Mail, Phone, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import DoctorsPage from './pages/Doctors';
import DoctorDetailPage from './pages/DoctorDetail';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && userData?.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
}

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <AIAnalysisDemo />
      <Specialties />
      <FeaturedDoctors />
      
      {/* CTA Section */}
      <section className="py-24 bg-brand-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-brand-secondary/20 rounded-full blur-[120px] -translate-x-1/2" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-white/80 mb-12">
              Join thousands of patients who trust MediSeba for their healthcare needs.
              Smarter appointments, clearer prescriptions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn bg-white text-brand-primary hover:bg-slate-50 btn-lg !px-10 py-4 font-bold shadow-xl shadow-blue-900/10">
                Get Started Now
              </Link>
              <a href="tel:+8801893672505" className="btn bg-transparent border-2 border-white/30 text-white hover:bg-white/10 btn-lg gap-2">
                <Phone size={20} />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="pt-48 pb-32 text-center container mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-slate-900">{title}</h1>
      <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
        This platform is designed to revolutionize healthcare in Bangladesh. 
        We are working hard to bring you the best experience in medical consultation.
      </p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctor/:id" element={<DoctorDetailPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/how-it-works" element={<PagePlaceholder title="How MediSeba Works" />} />
            <Route path="/about" element={<PagePlaceholder title="About MediSeba" />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
