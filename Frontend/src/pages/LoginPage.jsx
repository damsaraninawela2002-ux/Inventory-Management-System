import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../api/axios';
import { 
  Boxes, 
  Lock, 
  User, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle,
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Server health state
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [checkingServer, setCheckingServer] = useState(false);

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state?.from?.pathname && location.state.from.pathname !== '/login') 
    ? location.state.from.pathname 
    : '/dashboard';

  // Check server health probe on component mount
  const checkServerHealth = async () => {
    setCheckingServer(true);
    try {
      const res = await axiosInstance.get('/health', { timeout: 8000 });
      if (res.data?.status === 'ok') {
        setIsServerOffline(false);
      } else {
        setIsServerOffline(true);
      }
    } catch (err) {
      console.warn('[HealthCheck] Server health check failed:', err?.message || err);
      setIsServerOffline(true);
    } finally {
      setCheckingServer(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  const validate = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormErrors({});

    try {
      // Send exactly { username, password } to POST /auth/login.
      // Trim the username only. NEVER trim or alter the password.
      await login(username.trim(), password);
      success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      let msg = 'Login failed. Please check credentials.';
      
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        msg = 'Cannot reach the server. Is the API running?';
        setIsServerOffline(true);
      } else if (err.response?.status === 401) {
        msg = 'Invalid username or password.';
      } else if (err.response?.status === 500) {
        msg = 'Server error. Please try again later.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }

      toastError(msg);
      setFormErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    // Auto-fill must only set the same two state values
    setUsername('admin');
    setPassword('Admin@123');
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-4 transform hover:scale-105 transition-transform">
            <Boxes className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">InventoryPro</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise Inventory Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access the inventory dashboard</p>
          </div>

          {/* Offline Warning Banner with Check Server fallback */}
          {isServerOffline && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-xs font-medium text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>API is offline</span>
              </div>
              <button
                type="button"
                onClick={checkServerHealth}
                disabled={checkingServer}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${checkingServer ? 'animate-spin' : ''}`} />
                <span>Check server</span>
              </button>
            </div>
          )}

          {/* Form level error message */}
          {formErrors.general && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (formErrors.username || formErrors.general) {
                      setFormErrors((prev) => ({ ...prev, username: '', general: '' }));
                    }
                  }}
                  placeholder="admin"
                  autoComplete="username"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    formErrors.username
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
              </div>
              {formErrors.username && (
                <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password || formErrors.general) {
                      setFormErrors((prev) => ({ ...prev, password: '', general: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    formErrors.password
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean Default Admin Account card (No visible credentials text) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Default Admin Account</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 border border-blue-200/60 transition-colors shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Auto-fill</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; 2026 InventoryPro System. Built with ASP.NET Core 8 & React.
        </p>
      </div>
    </div>
  );
};
