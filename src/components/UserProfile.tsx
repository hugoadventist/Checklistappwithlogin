import { useState, useEffect } from 'react';
import { User, Camera, ArrowLeft, Save } from 'lucide-react';
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

interface UserProfileProps {
  accessToken: string;
  onBack: () => void;
}

export function UserProfile({ accessToken, onBack }: UserProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      setUserData(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email || '');
    } catch (error) {
      console.error('Error fetching user data:', error);
      alert(`Error loading profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/users/${userData?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name, email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUserData(data.user);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/users/${userData?.id}/profile-picture`,
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
        throw new Error(data.error || 'Failed to upload profile picture');
      }

      setUserData(prev => prev ? { ...prev, profile_picture: data.profile_picture } : null);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(`Error uploading profile picture: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1>My Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {userData?.profile_picture ? (
                <img
                  src={userData.profile_picture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-3 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">User Code</label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-800">
                  {userData?.user_code}
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Role</label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full ${
                    userData?.role === 'Administrator' ? 'bg-purple-100 text-purple-800' :
                    userData?.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {userData?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave}>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
