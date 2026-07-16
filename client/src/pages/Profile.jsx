import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/Badge';

const Profile = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm({ defaultValues: { name: user.name, email: user.email } });
  const passwordForm = useForm();

  const onProfileSubmit = async (values) => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/me', values);
      setUser(data.user);
      localStorage.setItem('dairy_user', JSON.stringify(data.user));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (values) => {
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', values);
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <div className="mt-1">
          <Badge>{user.role}</Badge>
        </div>
      </div>

      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="card p-6 space-y-4">
        <h3 className="font-semibold text-slate-700">Profile Information</h3>
        <div>
          <label className="label">Full Name</label>
          <input className="input" {...profileForm.register('name', { required: true })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" {...profileForm.register('email', { required: true })} />
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="card p-6 space-y-4">
        <h3 className="font-semibold text-slate-700">Change Password</h3>
        <div>
          <label className="label">Current Password</label>
          <input type="password" className="input" {...passwordForm.register('currentPassword', { required: true })} />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input"
            {...passwordForm.register('newPassword', { required: true, minLength: 6 })}
          />
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button type="submit" disabled={savingPassword} className="btn-primary">
            {savingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
