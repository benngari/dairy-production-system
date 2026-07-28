import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const ROLES = ['Manager', 'Production Operator', 'Store Keeper'];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Production Operator');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password, role);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded mb-4" required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded mb-4" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded mb-4" required />
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded mb-4">
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Register</button>
        </form>
        <p className="mt-4 text-center text-sm">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
        <p className="text-xs text-gray-500 mt-2 text-center">First user becomes Administrator. Administrator role must be assigned manually afterward.</p>
      </div>
    </div>
  );
};

export default Register;