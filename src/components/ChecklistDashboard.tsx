import { useState, useEffect } from 'react';
import { Plus, LogOut, CheckSquare, Trash2 } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import type { Checklist } from '../App';
import { createNR12Checklist } from '../utils/nr12-template';

interface ChecklistDashboardProps {
  accessToken: string;
  user: any;
  onSelectChecklist: (id: string) => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToUserManagement: () => void;
  userRole: string;
}

export function ChecklistDashboard({
  accessToken,
  user,
  onSelectChecklist,
  onLogout,
  onNavigateToProfile,
  onNavigateToUserManagement,
  userRole,
}: ChecklistDashboardProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/api-server/checklists`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      
      console.log('Fetch checklists response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch checklists');
      }

      setChecklists(data.checklists || []);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      alert(`Error loading checklists: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/api-server/checklists`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ title: newTitle }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checklist');
      }

      setChecklists([...checklists, data.checklist]);
      setNewTitle('');
      setShowNewDialog(false);
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  const deleteChecklist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/api-server/checklists/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete checklist');
      }

      setChecklists(checklists.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-indigo-600" />
            <h1>My Checklists</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToProfile}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              My Profile
            </button>
            {(userRole === 'Administrator' || userRole === 'Manager') && (
              <button
                onClick={onNavigateToUserManagement}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                User Management
              </button>
            )}
            <span className="text-gray-600 border-l border-gray-300 pl-4">
              {user?.user_metadata?.name || user?.email}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2>All Checklists</h2>
          <button
            onClick={() => setShowNewDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Checklist
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No checklists yet</p>
            <button
              onClick={() => setShowNewDialog(true)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Create your first checklist
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {checklists.map((checklist) => {
              // Calculate total items across all chapters
              const allItems = checklist.chapters?.flatMap(ch => ch.items) || checklist.items || [];
              const completed = allItems.filter((item) => 
                item.status === 'compliant' || item.status === 'na'
              ).length;
              const total = allItems.length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div
                  key={checklist.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group relative"
                  onClick={() => onSelectChecklist(checklist.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChecklist(checklist.id);
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <h3 className="mb-4 pr-8">{checklist.title}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Progress</span>
                      <span>{completed}/{total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-gray-500 mt-4">
                    Created {new Date(checklist.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showNewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="mb-4">New Checklist</h2>
            <form onSubmit={createChecklist}>
              <label htmlFor="title" className="block text-gray-700 mb-2">
                Checklist Title
              </label>
              <input
                id="title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter a title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewDialog(false);
                    setNewTitle('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}