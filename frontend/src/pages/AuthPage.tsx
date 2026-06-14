import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Eye } from 'lucide-react';

const DEMO_USERS = [
  { name: 'Aisha', email: 'aisha@demo.com', role: 'ADMIN', badge: 'ADMIN' },
  { name: 'Rohan', email: 'rohan@demo.com', role: 'MEMBER', badge: 'MEMBER' },
  { name: 'Priya', email: 'priya@demo.com', role: 'MEMBER', badge: 'MEMBER' },
  { name: 'Meera', email: 'meera@demo.com', role: 'DEPARTED', badge: 'DEPARTED' },
  { name: 'Dev', email: 'dev@demo.com', role: 'MEMBER', badge: 'MEMBER' },
  { name: 'Sam', email: 'sam@demo.com', role: 'NEW MEMBER', badge: 'NEW MEMBER' }
];

export const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setError('');
      if (isRegistering) {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/groups');
      } else {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/groups');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate');
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setIsRegistering(false);
    setEmail(demoEmail);
    setPassword('dummy'); // Using the seeded dummy password
    setTimeout(() => {
      // Simulate form submission
      const form = document.getElementById('auth-form') as HTMLFormElement;
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-['Inter'] px-4 py-12">
      
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl p-8 md:p-10">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8 justify-center">
          <div className="bg-[#4f46e5] w-6 h-6 flex-shrink-0"></div>
          <span className="font-bold text-gray-800 tracking-wider uppercase text-lg">Spreetail Split</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
            {isRegistering ? 'Create an Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isRegistering ? 'Sign up to start sharing expenses.' : 'Sign in to manage shared group expenses.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider border border-red-200 text-center">{error}</div>}

        {/* Form */}
        <form id="auth-form" onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-bold text-gray-900 mb-1.5 tracking-wider uppercase">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aisha Gupta"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-colors placeholder-gray-400"
                required={isRegistering}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-900 mb-1.5 tracking-wider uppercase">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aisha@example.com"
              className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-colors placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-900 mb-1.5 tracking-wider uppercase">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-colors placeholder-gray-400"
                required
              />
              <Eye className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#4f46e5] text-white font-bold uppercase tracking-wider text-xs py-3 mt-2 hover:bg-[#4338ca] transition-colors"
          >
            {isRegistering ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-[#4f46e5] font-bold uppercase tracking-wider ml-2 hover:underline focus:outline-none"
            >
              {isRegistering ? 'Login Here' : 'Register Here'}
            </button>
          </p>
        </div>

        <div className="my-8 border-t border-gray-200 relative">
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Or</span>
        </div>

        {/* Demo Section */}
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Quick Demo Login</h3>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider">pw: dummy</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DEMO_USERS.map((u) => (
              <button 
                key={u.email}
                onClick={() => handleDemoLogin(u.email)}
                className="text-left border border-gray-200 bg-gray-50 p-3 hover:border-[#4f46e5] transition-colors group relative"
              >
                <p className="font-bold text-gray-900 text-xs group-hover:text-[#4f46e5] transition-colors uppercase tracking-wider">{u.name}</p>
                <p className="text-[10px] text-gray-500 mb-2 truncate">{u.email.replace('@demo.com', '@example.com')}</p>
                <span className="text-[10px] font-bold text-[#4f46e5] uppercase tracking-wider">{u.badge}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
