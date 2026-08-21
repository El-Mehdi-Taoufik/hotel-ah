"use client";

import { Pencil, ShieldCheck, Trash2, Plus, Power } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/utils";
import { userService } from "@/services/user.service";
import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

const roleColor: Record<string, string> = {
  Administrator: "#B38B59",
  Manager: "#2196F3",
  "Front Desk": "#4CAF50",
  Housekeeping: "#F4B400",
};

export default function UsersPage() {
  const { users: t, common, isLoaded } = useTranslation();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    checkUserPermission();
  }, []);

  const checkUserPermission = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      if (userData.role !== 'Administrator') {
        setAccessDenied(true);
        return;
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error checking user permission:', error);
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data.data || []);
    } catch (err) {
      setError(t('failedToLoad'));
      console.error("Users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      setProcessing(true);
      await userService.create(userData);
      await fetchUsers();
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add user:", err);
      setError(t('failedToAdd'));
    } finally {
      setProcessing(false);
    }
  };

  const handleEditUser = async (userData: any) => {
    try {
      setProcessing(true);
      await userService.update(selectedUser.id, userData);
      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(t('failedToUpdate'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setProcessing(true);
      const result = await userService.delete(selectedUser.id);
      
      if (!result.success) {
        setError(result.message || t('failedToDelete'));
        return;
      }
      
      await fetchUsers();
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      setError(null);
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = `fixed bottom-4 px-4 py-2 rounded-lg text-sm z-50 bg-green-500 text-white`;
      toast.style.right = '1rem';
      toast.style.left = 'auto';
      toast.textContent = t('userDeletedSuccessfully');
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError(t('failedToDelete'));
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      setProcessing(true);
      await userService.update(userId, { isActive: !currentStatus });
      await fetchUsers();
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      setError(t('failedToToggleStatus'));
    } finally {
      setProcessing(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" subtitle="You don't have permission to access this page" />
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
          <div className="text-center py-12">
            <ShieldCheck size={48} className="mx-auto text-[#9A9085] mb-4" />
            <h3 className="text-lg font-semibold text-[#2F2A25] mb-2">Access Denied</h3>
            <p className="text-sm text-[#6B6258] mb-6">You don't have permission to access the Users module. This feature is only available to administrators.</p>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !isLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title={isLoaded ? t('title') : 'Users'} subtitle={common('loading')} />
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
          <div className="h-64 animate-pulse bg-gray-200/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={fetchUsers}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} actions={<Button onClick={() => setShowAddModal(true)}><Plus size={16} className="mr-2" /> {t('inviteUser')}</Button>} />

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E7DFD4] text-left text-xs text-text-muted uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">{t('user')}</th>
              <th className="px-4 py-3 font-medium">{t('role')}</th>
              <th className="px-4 py-3 font-medium">{common('status')}</th>
              <th className="px-5 py-3 font-medium text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: u.avatarColor || "#A855F7" }}
                    >
                      {initials(`${u.firstName} ${u.lastName}`)}
                    </div>
                    <div>
                      <p className="text-[#2F2A25]">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-[#6B6258]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                    style={{ background: `${roleColor[u.role] || "#10B981"}1F`, color: roleColor[u.role] || "#10B981", borderColor: `${roleColor[u.role] || "#10B981"}4D` }}
                  >
                    <ShieldCheck size={12} /> {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${u.isActive ? "text-emerald-300" : "text-text-muted"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-400" : "bg-text-muted"}`} />
                    {u.isActive ? t('active') : t('disabled')}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1 text-text-muted">
                    <button 
                      className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#2F2A25]" 
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      disabled={processing}
                      title={u.isActive ? t('disableUser') : t('enableUser')}
                    >
                      <Power size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#2F2A25]" onClick={() => { setSelectedUser(u); setShowEditModal(true); }}><Pencil size={14} /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/15 hover:text-red-300" onClick={() => { setSelectedUser(u); setShowDeleteConfirm(true); }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-text-muted text-sm">
                  {t('noUsersFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('inviteNewUser')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddUser(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('firstName')}</label>
                <input name="firstName" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('lastName')}</label>
                <input name="lastName" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="Doe" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('email')}</label>
                <input name="email" type="email" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('password')}</label>
                <input name="password" type="password" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('phoneNumber')}</label>
                <input name="phoneNumber" type="tel" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="+1 234 567 890" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('role')}</label>
                <select name="role" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]">
                  <option value="Administrator">{t('administrator')}</option>
                  <option value="Manager">{t('manager')}</option>
                  <option value="Front Desk">{t('frontDesk')}</option>
                  <option value="Housekeeping">{t('housekeeping')}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('inviting') : t('sendInvitation')}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('editUser').replace('{name}', `${selectedUser.firstName} ${selectedUser.lastName}`)}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditUser(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('firstName')}</label>
                <input name="firstName" type="text" required defaultValue={selectedUser.firstName} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('lastName')}</label>
                <input name="lastName" type="text" required defaultValue={selectedUser.lastName} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('email')}</label>
                <input name="email" type="email" required defaultValue={selectedUser.email} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('phoneNumber')}</label>
                <input name="phoneNumber" type="tel" defaultValue={selectedUser.phoneNumber} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('role')}</label>
                <select name="role" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]">
                  <option value="Administrator" selected={selectedUser.role === "Administrator"}>{t('administrator')}</option>
                  <option value="Manager" selected={selectedUser.role === "Manager"}>{t('manager')}</option>
                  <option value="Front Desk" selected={selectedUser.role === "Front Desk"}>{t('frontDesk')}</option>
                  <option value="Housekeeping" selected={selectedUser.role === "Housekeeping"}>{t('housekeeping')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" id="isActive" className="rounded" defaultChecked={selectedUser.isActive} />
                <label htmlFor="isActive" className="text-sm text-[#6B6258]">{t('activeUser')}</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('updating') : t('updateUser')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('deleteUser').replace('{name}', `${selectedUser.firstName} ${selectedUser.lastName}`)}</h3>
            <p className="text-sm text-[#6B6258] mb-4">{t('confirmDelete')}</p>
            <div className="flex gap-2">
              <Button onClick={handleDeleteUser} disabled={processing} className="flex-1 bg-red-500 hover:bg-red-600">{processing ? t('deleting') : common('delete')}</Button>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setSelectedUser(null); }} disabled={processing}>{common('cancel')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
