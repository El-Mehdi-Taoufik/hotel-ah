"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Shield, Check, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { userService, ChangePasswordRequest } from "@/services/user.service";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ChangePasswordPage() {
  const { direction } = useTranslation();
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  const handleChange = (field: keyof ChangePasswordRequest, value: string) => {
    setFormData({ ...formData, [field]: value });
    setValidationErrors({ ...validationErrors, [field]: "" });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (passwordStrength.score < 2) {
      errors.newPassword = "Password is too weak";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await userService.changePassword(formData);
      if (response.success) {
        setSuccessMessage("Password changed successfully");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(response.message || "Failed to change password");
      }
    } catch (err) {
      setError("Failed to change password");
      console.error("Change password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Change Password" 
        subtitle="Update your password to keep your account secure"
      />

      <div className="max-w-2xl">
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Shield size={20} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#2F2A25]">Security Settings</h3>
              <p className="text-sm text-[#6B6258]">Choose a strong password to protect your account</p>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Current Password</Label>
              <div className="relative" dir={direction}>
                <Lock size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleChange("currentPassword", e.target.value)}
                  className={direction === 'rtl' ? 'pe-10 ps-10' : 'ps-10 pe-10'}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-[#2F2A25] transition-colors"
                  style={{ [direction === 'rtl' ? 'left' : 'right']: '0.875rem' }}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {validationErrors.currentPassword && (
                <p className="mt-1.5 text-xs text-red-400">{validationErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <Label>New Password</Label>
              <div className="relative" dir={direction}>
                <Lock size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  className={direction === 'rtl' ? 'pe-10 ps-10' : 'ps-10 pe-10'}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-[#2F2A25] transition-colors"
                  style={{ [direction === 'rtl' ? 'left' : 'right']: '0.875rem' }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {validationErrors.newPassword && (
                <p className="mt-1.5 text-xs text-red-400">{validationErrors.newPassword}</p>
              )}

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          passwordStrength.score === 0 && "bg-red-500 w-0",
                          passwordStrength.score === 1 && "bg-red-500 w-1/4",
                          passwordStrength.score === 2 && "bg-yellow-500 w-1/2",
                          passwordStrength.score === 3 && "bg-emerald-500 w-3/4",
                          passwordStrength.score === 4 && "bg-emerald-500 w-full"
                        )}
                      />
                    </div>
                    <span className="text-xs text-[#6B6258]">{passwordStrength.label}</span>
                  </div>
                  <div className="space-y-1">
                    {passwordStrength.requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <X size={12} className="text-text-muted" />
                        )}
                        <span className={cn(req.met ? "text-emerald-400" : "text-text-muted")}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <div className="relative" dir={direction}>
                <Lock size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={direction === 'rtl' ? 'pe-10 ps-10' : 'ps-10 pe-10'}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-[#2F2A25] transition-colors"
                  style={{ [direction === 'rtl' ? 'left' : 'right']: '0.875rem' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin ms-2" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Shield size={16} className="ms-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <p className="text-sm text-[#6B6258]">
              <strong className="text-[#2F2A25]">Security Tips:</strong> Use a combination of letters, numbers, and special characters. Avoid using personal information or common words.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculatePasswordStrength(password: string) {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) }
  ];

  const metCount = requirements.filter(req => req.met).length;
  let score = 0;
  let label = "Very Weak";

  if (metCount <= 1) {
    score = 1;
    label = "Very Weak";
  } else if (metCount === 2) {
    score = 2;
    label = "Weak";
  } else if (metCount === 3) {
    score = 3;
    label = "Medium";
  } else if (metCount === 4) {
    score = 4;
    label = "Strong";
  } else if (metCount === 5) {
    score = 5;
    label = "Very Strong";
  }

  return { score, label, requirements };
}