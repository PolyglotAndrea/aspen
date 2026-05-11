/**
 * Admin Login Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getDefaultRedirect } from '../../lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const admin = await login(username, password);
      navigate(getDefaultRedirect(admin.role));
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">ASPEN</h1>
          <p className="text-sm text-zinc-500 mt-1">管理后台</p>
        </div>

        {/* Login Form */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 backdrop-blur-xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-zinc-100 text-zinc-900 font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/60 text-center">
            <p className="text-xs text-zinc-500">
              默认账号: admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
