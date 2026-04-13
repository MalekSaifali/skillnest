'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return { score: 0, label: '', color: '#334155' };
    if (p.length < 6) return { score: 1, label: 'Too short', color: '#ef4444' };
    if (p.length < 8) return { score: 2, label: 'Weak', color: '#f97316' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { score: 3, label: 'Medium', color: '#f59e0b' };
    return { score: 4, label: 'Strong 💪', color: '#22c55e' };
  };
  const strength = passwordStrength();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:4000/api/auth/signup', form);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .su-input { width: 100%; padding: 14px 16px; background: #1e293b; border: 1.5px solid #334155; border-radius: 12px; color: white; font-size: 15px; outline: none; box-sizing: border-box; transition: all 0.2s; }
        .su-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .su-input::placeholder { color: #475569; }
        .su-btn { width: 100%; padding: 15px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .su-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
        .su-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      {/* Left Panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0c1a3a 0%, #1a1a4e 50%, #0c1a3a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', textAlign: 'center', animation: 'fadeUp 0.6s ease', width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🪺</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'white', margin: '0 0 10px' }}>Join SkillNest</h1>
          <p style={{ color: '#7c87c4', fontSize: 16, marginBottom: 48, lineHeight: 1.6 }}>Build your skill profile and connect with talented professionals.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '✍️', title: 'Create your profile', desc: 'Add your skills, bio, and experience' },
              { icon: '🔍', title: 'Discover people', desc: 'Find professionals who match your skills' },
              { icon: '🤝', title: 'Connect & grow', desc: 'Chat, collaborate, and exchange skills' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', textAlign: 'left' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{step.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#0f172a', borderLeft: '1px solid #1e293b' }}>
        <div style={{ width: '100%', animation: 'fadeUp 0.5s ease' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>Account Created!</h2>
              <p style={{ color: '#64748b' }}>Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Create your account ✨</h2>
                <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>It's free and takes less than a minute</p>
              </div>

              {error && (
                <div style={{ background: '#3f1a1a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: 14 }}>⚠️ {error}</div>
              )}

              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Full Name</label>
                  <input className="su-input" type="text" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Email Address</label>
                  <input className="su-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="su-input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters, 1 uppercase, 1 number" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: 0 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {form.password.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.score ? strength.color : '#1e293b', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>{strength.label}</div>
                  </div>
                )}
                {form.password.length === 0 && <div style={{ marginBottom: 24 }} />}

                <button className="su-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <span style={{ color: '#475569', fontSize: 14 }}>Already have an account? </span>
                <a href="/login" style={{ color: '#818cf8', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in →</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
