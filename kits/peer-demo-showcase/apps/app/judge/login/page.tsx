'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { judgeLogin } from '../../../actions/auth';
import { toast } from 'sonner';

export default function JudgeLoginPage() {
  const [judgeName, setJudgeName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim()) {
      toast.error('Please enter your Judge Name');
      return;
    }
    if (!password) {
      toast.error('Please enter the access code');
      return;
    }

    try {
      setLoading(true);
      const result = await judgeLogin(password, judgeName.trim());
      if (result.success) {
        toast.success(`Welcome, ${judgeName.trim()}! Access granted.`);
        router.push('/judge');
      } else {
        toast.error('Invalid access code.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 mb-6 w-fit backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Hub
        </Link>

        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/10 pb-5">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Judge Portal Login</h1>
              <p className="text-xs text-gray-400">Authenticated access for hackathon judges</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Judge Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                  placeholder="e.g. Judge Sarah"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Judge Access Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter judge access code"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Judge Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
