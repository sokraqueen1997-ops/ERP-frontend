import { useEffect, useState, type FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { BranchFormModal } from '../components/BranchFormModal';
import { UserFormModal } from '../components/UserFormModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { RoleFormModal } from '../components/RoleFormModal';
import { RolePermissionsModal } from '../components/RolePermissionsModal';
import { fetchCompanySettings, updateCompanySettings, type CompanySettings } from '../api/companySettings';
import { fetchBranches, type Branch } from '../api/branches';
import { fetchUsers, type User } from '../api/users';
import { fetchRoles, type Role } from '../api/roles';
import { ApiError } from '../api/client';

const emptyCompanyForm = {
  legalNameAr: '',
  legalNameEn: '',
  vatNumber: '',
  crNumber: '',
  buildingNumber: '',
  streetName: '',
  district: '',
  city: '',
  postalCode: '',
  additionalNumber: '',
};

export function SettingsPage() {
  const [tab, setTab] = useState<'company' | 'branches' | 'users' | 'roles'>('company');

  // Company settings
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [notConfiguredYet, setNotConfiguredYet] = useState(false);

  // Branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  // Roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchCompanySettings()
      .then((cs: CompanySettings | null) => {
        if (cs) {
          setCompanyForm({
            legalNameAr: cs.legalNameAr,
            legalNameEn: cs.legalNameEn ?? '',
            vatNumber: cs.vatNumber,
            crNumber: cs.crNumber ?? '',
            buildingNumber: cs.buildingNumber ?? '',
            streetName: cs.streetName ?? '',
            district: cs.district ?? '',
            city: cs.city ?? '',
            postalCode: cs.postalCode ?? '',
            additionalNumber: cs.additionalNumber ?? '',
          });
        } else {
          setNotConfiguredYet(true);
        }
      })
      .catch(() => setCompanyError('تعذّر تحميل بيانات الشركة'))
      .finally(() => setCompanyLoading(false));
  }, []);

  function loadBranches() {
    setBranchesLoading(true);
    fetchBranches()
      .then(setBranches)
      .finally(() => setBranchesLoading(false));
  }

  useEffect(loadBranches, []);

  function loadUsers() {
    setUsersLoading(true);
    fetchUsers()
      .then(setUsers)
      .finally(() => setUsersLoading(false));
  }

  useEffect(loadUsers, []);

  function loadRoles() {
    setRolesLoading(true);
    fetchRoles()
      .then(setRoles)
      .finally(() => setRolesLoading(false));
  }

  useEffect(loadRoles, []);

  function updateCompanyField<K extends keyof typeof companyForm>(key: K, value: string) {
    setCompanyForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCompanySubmit(e: FormEvent) {
    e.preventDefault();
    setCompanyError(null);
    setCompanySaved(false);
    setCompanySaving(true);
    try {
      await updateCompanySettings({
        legalNameAr: companyForm.legalNameAr,
        legalNameEn: companyForm.legalNameEn || undefined,
        vatNumber: companyForm.vatNumber,
        crNumber: companyForm.crNumber || undefined,
        buildingNumber: companyForm.buildingNumber || undefined,
        streetName: companyForm.streetName || undefined,
        district: companyForm.district || undefined,
        city: companyForm.city || undefined,
        postalCode: companyForm.postalCode || undefined,
        additionalNumber: companyForm.additionalNumber || undefined,
      });
      setNotConfiguredYet(false);
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (err) {
      setCompanyError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setCompanySaving(false);
    }
  }

  function openCreateBranch() {
    setEditingBranch(null);
    setBranchFormOpen(true);
  }

  function openEditBranch(branch: Branch) {
    setEditingBranch(branch);
    setBranchFormOpen(true);
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <Layout>
      <h1 className="mb-6 text-xl font-bold text-gray-800">الإعدادات</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('company')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'company' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          بيانات الشركة
        </button>
        <button
          onClick={() => setTab('branches')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'branches' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          الفروع
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'users' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          المستخدمون
        </button>
        <button
          onClick={() => setTab('roles')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'roles' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500'
          }`}
        >
          الأدوار والصلاحيات
        </button>
      </div>

      {tab === 'company' && (
        <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
          {companyLoading && <p className="text-gray-400">جارِ التحميل...</p>}

          {!companyLoading && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              {notConfiguredYet && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  لم يتم تسجيل بيانات الشركة الضريبية بعد — عبّي البيانات وأول حفظ ينشئها.
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>الاسم القانوني (عربي) *</label>
                  <input
                    className={inputClass}
                    value={companyForm.legalNameAr}
                    onChange={(e) => updateCompanyField('legalNameAr', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>الاسم القانوني (إنجليزي)</label>
                  <input
                    className={inputClass}
                    value={companyForm.legalNameEn}
                    onChange={(e) => updateCompanyField('legalNameEn', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>الرقم الضريبي (١٥ رقم) *</label>
                  <input
                    className={inputClass}
                    value={companyForm.vatNumber}
                    onChange={(e) => updateCompanyField('vatNumber', e.target.value)}
                    required
                    pattern="\d{15}"
                    title="يجب أن يتكون من ١٥ رقمًا"
                  />
                </div>
                <div>
                  <label className={labelClass}>رقم السجل التجاري</label>
                  <input
                    className={inputClass}
                    value={companyForm.crNumber}
                    onChange={(e) => updateCompanyField('crNumber', e.target.value)}
                  />
                </div>
              </div>

              <p className="pt-2 text-sm font-medium text-gray-700">العنوان الوطني</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>رقم المبنى</label>
                  <input
                    className={inputClass}
                    value={companyForm.buildingNumber}
                    onChange={(e) => updateCompanyField('buildingNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>الشارع</label>
                  <input
                    className={inputClass}
                    value={companyForm.streetName}
                    onChange={(e) => updateCompanyField('streetName', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>الحي</label>
                  <input
                    className={inputClass}
                    value={companyForm.district}
                    onChange={(e) => updateCompanyField('district', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>المدينة</label>
                  <input
                    className={inputClass}
                    value={companyForm.city}
                    onChange={(e) => updateCompanyField('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>الرمز البريدي</label>
                  <input
                    className={inputClass}
                    value={companyForm.postalCode}
                    onChange={(e) => updateCompanyField('postalCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>الرقم الإضافي</label>
                  <input
                    className={inputClass}
                    value={companyForm.additionalNumber}
                    onChange={(e) => updateCompanyField('additionalNumber', e.target.value)}
                  />
                </div>
              </div>

              {companyError && <p className="text-sm text-red-600">{companyError}</p>}
              {companySaved && <p className="text-sm text-green-600">تم الحفظ بنجاح ✓</p>}

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="submit"
                  disabled={companySaving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {companySaving ? 'جارِ الحفظ...' : 'حفظ بيانات الشركة'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === 'branches' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={openCreateBranch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + فرع جديد
            </button>
          </div>

          {branchesLoading && <p className="text-gray-400">جارِ التحميل...</p>}

          {!branchesLoading && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">الفرع</th>
                    <th className="px-4 py-3 text-start font-medium">الرمز</th>
                    <th className="px-4 py-3 text-start font-medium">الجوال</th>
                    <th className="px-4 py-3 text-start font-medium">الحالة</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branches.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.code}</td>
                      <td className="px-4 py-3 text-gray-600">{b.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            b.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {b.isActive ? 'نشط' : 'معطّل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button onClick={() => openEditBranch(b)} className="text-sm text-blue-600 hover:underline">
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        لا توجد فروع
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + مستخدم جديد
            </button>
          </div>

          {usersLoading && <p className="text-gray-400">جارِ التحميل...</p>}

          {!usersLoading && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">المستخدم</th>
                    <th className="px-4 py-3 text-start font-medium">الدور</th>
                    <th className="px-4 py-3 text-start font-medium">الفرع</th>
                    <th className="px-4 py-3 text-start font-medium">الحالة</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{u.fullName}</p>
                        <p className="text-xs text-gray-400">{u.username} — {u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.role?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{u.branch?.name ?? 'كل الفروع'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {u.isActive ? 'نشط' : 'معطّل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => setResetPasswordUser(u)}
                          className="text-sm text-gray-600 hover:underline"
                        >
                          إعادة تعيين كلمة المرور
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserFormOpen(true);
                          }}
                          className="ms-3 text-sm text-blue-600 hover:underline"
                        >
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        لا يوجد مستخدمون
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'roles' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleFormOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + دور جديد
            </button>
          </div>

          {rolesLoading && <p className="text-gray-400">جارِ التحميل...</p>}

          {!rolesLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <p className="font-bold text-gray-800">{r.name}</p>
                    {r.isSystem && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">نظامي</span>
                    )}
                  </div>
                  {r.description && <p className="mb-4 text-sm text-gray-500">{r.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setPermissionsRole(r)}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100"
                    >
                      تعديل الصلاحيات
                    </button>
                    <button
                      onClick={() => {
                        setEditingRole(r);
                        setRoleFormOpen(true);
                      }}
                      className="rounded-lg bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                    >
                      تعديل الاسم
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <BranchFormModal
        open={branchFormOpen}
        branch={editingBranch}
        onClose={() => setBranchFormOpen(false)}
        onSaved={loadBranches}
      />
      <UserFormModal
        open={userFormOpen}
        user={editingUser}
        onClose={() => setUserFormOpen(false)}
        onSaved={loadUsers}
      />
      <ResetPasswordModal
        open={resetPasswordUser !== null}
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
      />
      <RoleFormModal
        open={roleFormOpen}
        role={editingRole}
        onClose={() => setRoleFormOpen(false)}
        onSaved={loadRoles}
      />
      <RolePermissionsModal
        open={permissionsRole !== null}
        role={permissionsRole}
        onClose={() => setPermissionsRole(null)}
        onSaved={loadRoles}
      />
    </Layout>
  );
}
