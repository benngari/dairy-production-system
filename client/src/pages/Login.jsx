import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

//cow image 
const FARM_IMAGE_URL = 'https://res.cloudinary.com/dd4b2ssdy/image/upload/v1785281237/agro1_d5fnzf.jpg';
//karlo logo
const LOGO_URL = 'https://res.cloudinary.com/dd4b2ssdy/image/upload/v1785325104/c3f881d8-9577-42c8-a9e3-6deaa4561b4b_fq4ouo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — farm image, hidden on small screens */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${FARM_IMAGE_URL})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/75 via-green-900/25 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Dairy Production System</h1>
          <p className="text-green-50/90 text-sm max-w-md leading-relaxed">
            Manage yoghurt and mala production, inventory, packaging, and reports — all in one place.
          </p>
        </div>
        {/* Soft fade where the photo blends into the cream panel — no hard edge */}
        <div
          className="hidden lg:block absolute top-0 right-0 h-full w-40 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, #fffbeb)' }}
        />
      </div>

      {/* Right panel — dairy-themed background */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-green-50 px-6 py-12 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-green-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={LOGO_URL} alt="KALRO" className="h-16 w-auto mx-auto mb-3 drop-shadow-sm" />
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-stone-500 mt-1">Log in to your Dairy Pro account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg shadow-green-900/5 border border-stone-100">
            <div className="mb-4">
              <label className="label-field">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="mb-6">
              <label className="label-field">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center shadow-sm"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Don't have an account? <Link to="/register" className="text-green-700 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;