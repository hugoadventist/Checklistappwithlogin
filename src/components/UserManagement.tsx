import { useState, useEffect } from 'react';
import { Users, ArrowLeft, User, Shield, Briefcase, UserCircle } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

interface UserData {
  id: string;
  email: string;
  name: string;
  user_code: string;
  role: string;
  profile_picture: string | null;
  createdAt: string;
}

interface UserManagementProps {
  accessToken: string;
  currentUserRole: string;
  onBack: () => void;
}

export function UserManagement({ accessToken, currentUserRole, onBack }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/users/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setUsers(users.map(u => u.id === userId ? data.user : u));
      setEditingUserId(null);
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert(`Error updating role: ${error.message}`);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Administrator':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'Manager':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      default:
        return <UserCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-8 h-8 text-indigo-600" />
          <h1>User Management</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-600">User</th>
                  <th className="px-6 py-4 text-left text-gray-600">User Code</th>
                  <th className="px-6 py-4 text-left text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left text-gray-600">Created</th>
                  {currentUserRole === 'Administrator' && (
                    <th className="px-6 py-4 text-left text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-gray-600">{user.user_code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                          <button
                            onClick={() => handleRoleChange(user.id, selectedRole)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className={`px-3 py-1 rounded-full ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    {currentUserRole === 'Administrator' && (
                      <td className="px-6 py-4">
                        {editingUserId !== user.id && (
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setSelectedRole(user.role);
                            }}
                            className="text-indigo-600 hover:text-indigo-700"
                          >
                            Change Role
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              No users found
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 mb-2">Access Levels</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <strong>Administrator:</strong> Full system access, can manage users and assign roles
            </li>
            <li className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <strong>Manager:</strong> Can view users and manage checklists
            </li>
            <li className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              <strong>Employee:</strong> Can manage own checklists only
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
