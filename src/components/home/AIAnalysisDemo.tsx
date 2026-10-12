import { useState } from 'react';
import { Brain, Sparkles, Send, Stethoscope, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AIAnalysisDemo() {
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeSymptom = async () => {
    if (!symptom.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptom }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResult(data.result || 'Could not reach AI services. Please try again later.');
    } catch (error) {
       console.error(error);
       setResult('An error occurred during AI analysis. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto rounded-[3rem] bg-brand-primary p-0.5 shadow-2xl shadow-blue-900/40 relative">
          {/* Animated Background Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-secondary/30 rounded-full blur-3xl -z-0" />

          <div className="bg-brand-surface rounded-[2.9rem] p-12 overflow-hidden relative z-10 border border-white/10 shadow-inner">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="md:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary text-xs font-bold mb-6 uppercase tracking-widest">
                  <Sparkles size={12} />
                  <span>Interactive Intelligence</span>
                </div>
                <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                  Experience Our <br />
                  <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent italic">AI Insight</span> Technology
                </h2>
                <p className="text-brand-text-dim mb-8 leading-relaxed font-medium">
                  Enter your current health concern to see how MediSeba uses Gemini 1.5 Pro to explain your symptoms and help you prepare for your next consultation.
                </p>
                
                <div className="relative">
                  <textarea 
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                    placeholder="Describe your symptoms (e.g., 'Persistent headache for 3 days with light sensitivity')..."
                    className="w-full h-44 bg-white/5 border border-white/10 rounded-3xl p-8 text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-300 resize-none font-medium"
                  />
                  <button 
                    onClick={analyzeSymptom}
                    disabled={loading || !symptom.trim()}
                    className="absolute bottom-5 right-5 btn btn-primary !rounded-2xl !p-4 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none transition-transform active:scale-95"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                    ) : (
                      <Send size={24} />
                    )}
                  </button>
                </div>
              </div>

              <div className="md:w-1/2 w-full h-[400px] bg-brand-bg/50 rounded-[3rem] border border-white/5 p-10 flex flex-col items-center justify-center text-center group relative shadow-inner overflow-hidden">
                {/* Visual Glow for the Result Area */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[60px]" />
                
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-left h-full flex flex-col w-full"
                    >
                      <div className="flex justify-between items-center mb-8 shrink-0">
                         <div className="flex items-center gap-2 text-brand-primary font-extrabold text-xs tracking-[0.2em] uppercase">
                           <Brain size={20} />
                           Gemini AI Insight
                         </div>
                         <button 
                           onClick={copyToClipboard}
                           className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-brand-text-dim hover:text-white transition-all hover:bg-white/10"
                         >
                            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                         </button>
                      </div>
                      <div className="text-brand-text leading-relaxed overflow-y-auto max-h-[250px] pr-4 scrollbar-thin scrollbar-thumb-white/10 font-medium">
                        {result}
                      </div>
                      <div className="mt-auto pt-6">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                          <p className="text-xs text-brand-text-dim italic font-medium leading-relaxed">
                            Disclaimer: This is an AI-generated explanation for informational purposes only. This system cannot provide a diagnosis or prescription.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-8">
                      <div className="w-24 h-24 bg-brand-primary/10 text-brand-primary rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 border border-brand-primary/20">
                        {loading ? (
                          <Brain size={48} className="animate-pulse" />
                        ) : (
                          <Stethoscope size={48} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">Awaiting Description</h4>
                        <p className="text-brand-text-dim max-w-xs text-sm font-medium">
                          {loading ? 'AI is processing your query with specialized medical knowledge...' : 'Your analysis report will appear here instantly after describing your symptoms.'}
                        </p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
