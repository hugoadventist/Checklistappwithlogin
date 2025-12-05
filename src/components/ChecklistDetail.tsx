import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Camera, Download, LogOut, X } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import type { Checklist, ChecklistItem } from '../App';

interface ChecklistDetailProps {
  checklistId: string;
  accessToken: string;
  onBack: () => void;
  onLogout: () => void;
}

export function ChecklistDetail({
  checklistId,
  accessToken,
  onBack,
  onLogout,
}: ChecklistDetailProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, [checklistId]);

  const fetchChecklist = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/checklists`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch checklist');
      }

      const found = data.checklists.find((c: Checklist) => c.id === checklistId);
      setChecklist(found || null);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = async (updates: Partial<Checklist>) => {
    if (!checklist) return;

    const updatedChecklist = { ...checklist, ...updates };
    setChecklist(updatedChecklist);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/checklists/${checklistId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update checklist');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      // Revert on error
      setChecklist(checklist);
    }
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !checklist) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText,
      completed: false,
    };

    updateChecklist({ items: [...checklist.items, newItem] });
    setNewItemText('');
  };

  const toggleItem = (itemId: string) => {
    if (!checklist) return;

    const updatedItems = checklist.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    updateChecklist({ items: updatedItems });
  };

  const deleteItem = (itemId: string) => {
    if (!checklist) return;

    const updatedItems = checklist.items.filter((item) => item.id !== itemId);
    updateChecklist({ items: updatedItems });
  };

  const uploadPhoto = async (itemId: string, file: File) => {
    setUploadingPhoto(itemId);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/photos/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      // Update item with photo URL
      if (!checklist) return;

      const updatedItems = checklist.items.map((item) =>
        item.id === itemId
          ? { ...item, photoUrl: data.photoUrl, photoPath: data.path }
          : item
      );

      updateChecklist({ items: updatedItems });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const removePhoto = (itemId: string) => {
    if (!checklist) return;

    const updatedItems = checklist.items.map((item) =>
      item.id === itemId
        ? { ...item, photoUrl: undefined, photoPath: undefined }
        : item
    );

    updateChecklist({ items: updatedItems });
  };

  const exportReport = () => {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/checklists/${checklistId}/export`;
    window.open(url + `?auth=${accessToken}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 mb-4">Checklist not found</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const completed = checklist.items.filter((item) => item.completed).length;
  const total = checklist.items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2">{checklist.title}</h1>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Progress: {completed}/{total} completed</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={addItem} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add a new item..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {checklist.items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No items yet. Add your first item above.
            </div>
          ) : (
            checklist.items.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg p-4 border-2 transition-colors ${
                  item.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p
                      className={`mb-2 ${
                        item.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {item.text}
                    </p>
                    
                    {item.photoUrl && (
                      <div className="relative inline-block">
                        <img
                          src={item.photoUrl}
                          alt="Attached"
                          className="rounded-lg max-w-xs w-full h-auto"
                        />
                        <button
                          onClick={() => removePhoto(item.id)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {!item.photoUrl && (
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-indigo-600 cursor-pointer border border-gray-300 rounded-lg hover:border-indigo-500 transition-colors">
                        <Camera className="w-4 h-4" />
                        {uploadingPhoto === item.id ? 'Uploading...' : 'Add Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPhoto(item.id, file);
                          }}
                          className="hidden"
                          disabled={uploadingPhoto === item.id}
                        />
                      </label>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
