import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, LogOut, Camera, FileText, CheckCircle2, XCircle, MinusCircle, Clock, AlertTriangle, Save } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import type { Checklist, ChecklistItem, ChecklistChapter } from '../App';

interface ChecklistDetailProps {
  checklistId: string;
  accessToken: string;
  onBack: () => void;
  onLogout: () => void;
}

export function ChecklistDetail({ checklistId, accessToken, onBack, onLogout }: ChecklistDetailProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, []);

  useEffect(() => {
    // Expand all chapters by default
    if (checklist?.chapters) {
      setExpandedChapters(new Set(checklist.chapters.map(ch => ch.id)));
    }
  }, [checklist?.id]);

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
      if (found) {
        setChecklist(found);
        setLastSaveTime(found.lastSaved ? new Date(found.lastSaved) : null);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
      alert(`Error loading checklist: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = useCallback(async (updatedChecklist: Checklist) => {
    setSavingStatus('saving');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/checklists/${checklistId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...updatedChecklist,
            lastSaved: new Date().toISOString()
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save checklist');
      }

      setLastSaveTime(new Date());
      setSavingStatus('saved');
    } catch (error) {
      console.error('Error saving checklist:', error);
      setSavingStatus('error');
    }
  }, [checklistId, accessToken]);

  const updateItemStatus = (chapterId: string, itemId: string, status: ChecklistItem['status']) => {
    if (!checklist) return;

    const updatedChecklist = {
      ...checklist,
      chapters: checklist.chapters.map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              items: ch.items.map(item =>
                item.id === itemId ? { ...item, status } : item
              ),
            }
          : ch
      ),
    };

    setChecklist(updatedChecklist);
    autoSave(updatedChecklist);
  };

  const updateItemObservations = (chapterId: string, itemId: string, observations: string) => {
    if (!checklist) return;

    const updatedChecklist = {
      ...checklist,
      chapters: checklist.chapters.map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              items: ch.items.map(item =>
                item.id === itemId ? { ...item, observations } : item
              ),
            }
          : ch
      ),
    };

    setChecklist(updatedChecklist);
    autoSave(updatedChecklist);
  };

  const uploadPhoto = async (chapterId: string, itemId: string, file: File) => {
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

      const updatedChecklist = {
        ...checklist!,
        chapters: checklist!.chapters.map(ch =>
          ch.id === chapterId
            ? {
                ...ch,
                items: ch.items.map(item =>
                  item.id === itemId
                    ? { ...item, photoUrl: data.photoUrl, photoPath: data.path }
                    : item
                ),
              }
            : ch
        ),
      };

      setChecklist(updatedChecklist);
      autoSave(updatedChecklist);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(`Error uploading photo: ${error.message}`);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'non-compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'na':
        return <MinusCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 border-green-200';
      case 'non-compliant':
        return 'bg-red-50 border-red-200';
      case 'na':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const validateMandatoryItems = () => {
    if (!checklist) return { total: 0, completed: 0, missing: [] };

    const mandatoryItems: Array<{ chapter: string; item: string }> = [];
    let completedMandatory = 0;
    let totalMandatory = 0;

    checklist.chapters.forEach(chapter => {
      chapter.items.forEach(item => {
        if (item.mandatory) {
          totalMandatory++;
          if (item.status === 'compliant' || item.status === 'na') {
            completedMandatory++;
          } else {
            mandatoryItems.push({ chapter: chapter.title, item: item.text });
          }
        }
      });
    });

    return { total: totalMandatory, completed: completedMandatory, missing: mandatoryItems };
  };

  const exportReport = () => {
    window.open(
      `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/checklists/${checklistId}/export`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading checklist...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Checklist not found</div>
      </div>
    );
  }

  const validation = validateMandatoryItems();
  const allMandatoryComplete = validation.missing.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1>{checklist.title}</h1>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {savingStatus === 'saving' && (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">Saving...</span>
                  </>
                )}
                {savingStatus === 'saved' && lastSaveTime && (
                  <>
                    <Save className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">
                      Saved at {lastSaveTime.toLocaleTimeString()}
                    </span>
                  </>
                )}
                {savingStatus === 'error' && (
                  <span className="text-red-600">Error saving</span>
                )}
              </div>
            </div>

            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Validation Summary */}
        <div className={`mb-6 p-4 rounded-lg border ${allMandatoryComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {allMandatoryComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-900">All mandatory items completed!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-900">
                  {validation.missing.length} mandatory item(s) pending ({validation.completed}/{validation.total} completed)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-4">
          {checklist.chapters.map((chapter) => {
            const chapterCompleted = chapter.items.filter(i => i.status === 'compliant' || i.status === 'na').length;
            const chapterTotal = chapter.items.length;
            const isExpanded = expandedChapters.has(chapter.id);

            return (
              <div key={chapter.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h2>{chapter.title}</h2>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
                      {chapterCompleted}/{chapterTotal}
                    </span>
                  </div>
                  <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {chapter.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-6 border-b border-gray-100 last:border-0 ${getStatusColor(item.status)}`}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <p className="flex-1">
                                {item.text}
                                {item.mandatory && (
                                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded">
                                    Mandatory
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex gap-2 mb-4">
                              <button
                                onClick={() => updateItemStatus(chapter.id, item.id, 'compliant')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  item.status === 'compliant'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white border border-green-600 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                Compliant
                              </button>
                              <button
                                onClick={() => updateItemStatus(chapter.id, item.id, 'non-compliant')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  item.status === 'non-compliant'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white border border-red-600 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                Non-Compliant
                              </button>
                              <button
                                onClick={() => updateItemStatus(chapter.id, item.id, 'na')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  item.status === 'na'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-white border border-gray-600 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                N/A
                              </button>
                            </div>

                            {/* Observations */}
                            <div className="mb-4">
                              <label className="block text-gray-700 mb-2">
                                Observations / Markings:
                              </label>
                              <textarea
                                value={item.observations}
                                onChange={(e) => updateItemObservations(chapter.id, item.id, e.target.value)}
                                placeholder="Add observations, notes, or markings..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows={3}
                              />
                            </div>

                            {/* Photo Upload */}
                            <div>
                              {item.photoUrl ? (
                                <div className="relative inline-block">
                                  <img
                                    src={item.photoUrl}
                                    alt="Item photo"
                                    className="max-w-xs rounded-lg border border-gray-300"
                                  />
                                  <label
                                    htmlFor={`photo-${item.id}`}
                                    className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors"
                                  >
                                    <Camera className="w-4 h-4" />
                                  </label>
                                </div>
                              ) : (
                                <label
                                  htmlFor={`photo-${item.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                  <Camera className="w-4 h-4" />
                                  Add Photo
                                </label>
                              )}
                              <input
                                id={`photo-${item.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadPhoto(chapter.id, item.id, file);
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
