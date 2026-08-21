"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Building2, Calendar, Shield, Edit2, Save, X, Camera, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { userService, Profile, UpdateProfileRequest } from "@/services/user.service";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ProfilePage() {
  const { direction, profile: p, common } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatarColor: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
        setFormData({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phoneNumber: response.data.phoneNumber,
          avatarColor: response.data.avatarColor || ""
        });
      }
    } catch (err) {
      setError("Failed to load profile");
      console.error("Profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await userService.updateProfile(formData);
      if (response.success) {
        setProfile(response.data);
        setEditing(false);
        setSuccessMessage(p('profileUpdated'));
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Update localStorage with new user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phoneNumber: response.data.phoneNumber,
          avatarColor: response.data.avatarColor
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('userUpdated'));
      } else {
        setError(response.message || p('failedToUpdate'));
      }
    } catch (err) {
      setError(p('failedToUpdate'));
      console.error("Update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        avatarColor: profile.avatarColor || ""
      });
    }
    setEditing(false);
    setError(null);
  };

  const generateAvatarColor = () => {
    const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setFormData({ ...formData, avatarColor: randomColor });
  };

  const removeAvatarColor = () => {
    setFormData({ ...formData, avatarColor: "" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={p('title')} subtitle={p('loading')} />
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
          <div className="h-64 animate-pulse bg-gray-200/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title={p('title')} subtitle={error} />
        <Button onClick={loadProfile}>{p('retry')}</Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title={p('title')} subtitle={p('noProfileData')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={p('title')} 
        subtitle={p('subtitle')}
        actions={
          !editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Edit2 size={16} />
              {p('editProfile')}
            </Button>
          )
        }
      />

      {successMessage && (
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 text-center">
            <div className="relative inline-block mb-4">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: profile.avatarColor || "#8B5CF6" }}
              >
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              {editing && (
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <button
                    onClick={generateAvatarColor}
                    className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                    title="Change avatar color"
                  >
                    <Camera size={14} />
                  </button>
                  {formData.avatarColor && (
                    <button
                      onClick={removeAvatarColor}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove avatar color"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-[#2F2A25] mb-1">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-[#6B6258] mb-4">{profile.email}</p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
              <Shield size={12} />
              {profile.role}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-sm font-medium text-[#6B6258] mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-text-muted" />
                <span className="text-[#6B6258]">Joined:</span>
                <span className="text-[#2F2A25] ms-auto">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              {profile.lastLogin && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-text-muted" />
                  <span className="text-[#6B6258]">Last Login:</span>
                  <span className="text-[#2F2A25] ms-auto">
                    {new Date(profile.lastLogin).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#2F2A25]">Personal Information</h3>
              {editing && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                    <X size={16} />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>First Name</Label>
                <Input
                  value={editing ? formData.firstName : profile.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!editing}
                  placeholder="First name"
                />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input
                  value={editing ? formData.lastName : profile.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!editing}
                  placeholder="Last name"
                />
              </div>

              <div>
                <Label>Email</Label>
                <div className="relative" dir={direction}>
                  <Mail size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
                  <Input
                    value={profile.email}
                    disabled
                    className={direction === 'rtl' ? 'pe-10 bg-white/[0.03]' : 'ps-10 bg-white/[0.03]'}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <Label>Phone Number</Label>
                <div className="relative" dir={direction}>
                  <Phone size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
                  <Input
                    value={editing ? formData.phoneNumber : profile.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!editing}
                    className={direction === 'rtl' ? 'pe-10' : 'ps-10'}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <Label>Role</Label>
                <div className="relative" dir={direction}>
                  <Building2 size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
                  <Input
                    value={profile.role}
                    disabled
                    className={direction === 'rtl' ? 'pe-10 bg-white/[0.03]' : 'ps-10 bg-white/[0.03]'}
                    placeholder="Role"
                  />
                </div>
              </div>

              <div>
                <Label>Username</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={profile.email.split('@')[0]}
                    disabled
                    className="pl-10 bg-white/[0.03]"
                    placeholder="Username"
                  />
                </div>
              </div>
            </div>

            {editing && (
              <div className="mt-6 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <p className="text-sm text-[#6B6258]">
                  <strong className="text-[#2F2A25]">Note:</strong> Changes will be saved immediately. Your email and role cannot be changed here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}