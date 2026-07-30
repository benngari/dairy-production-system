import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const ROLES = ['Manager', 'Production Operator', 'Store Keeper'];

// Cloudinary image URL (same as Login.jsx)
const FARM_IMAGE_URL = 'https://res.cloudinary.com/dd4b2ssdy/image/upload/v1785281237/agro1_d5fnzf.jpg';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Production Operator');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(name, email, password, role);
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
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 via-green-900/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h1 className="text-3xl font-bold mb-2">Dairy Production System</h1>
          <p className="text-green-50 text-sm max-w-md">
            Manage your dairy production, inventory, packaging, and reports - all in one place.
          </p>
        </div>
      </div>

      {/* Right panel — dairy-themed background: warm cream fading into soft pasture green */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-green-50 px-6 py-12 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="https://res.cloudinary.com/dd4b2ssdy/image/upload/v1785325104/c3f881d8-9577-42c8-a9e3-6deaa4561b4b_fq4ouo.png" alt="KALRO" className="h-16 w-auto mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-500 mt-1">Join Dairy Pro to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-green-100">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Jane Wanjiru"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white p-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-green-700 font-medium hover:underline">Login</Link>
          </p>
          <p className="text-xs text-gray-400 mt-2 text-center">
            First user becomes Administrator. Administrator role must be assigned manually afterward.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;