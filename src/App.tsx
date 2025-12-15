import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { LoginScreen } from './components/LoginScreen';
import { ChecklistDashboard } from './components/ChecklistDashboard';
import { ChecklistDetail } from './components/ChecklistDetail';
import { UserProfile } from './components/UserProfile';
import { UserManagement } from './components/UserManagement';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface ChecklistItem {
  id: string;
  text: string;
  status: 'pending' | 'compliant' | 'non-compliant' | 'na';
  mandatory: boolean;
  observations: string;
  photoUrl?: string;
  photoPath?: string;
}

export interface ChecklistChapter {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Checklist {
  id: string;
  userId: string;
  title: string;
  chapters: ChecklistChapter[];
  createdAt: string;
  lastSaved?: string;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'user-management'>('dashboard');
  const [userRole, setUserRole] = useState<string>('Employee');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        console.log('Session found, access token set');
        setAccessToken(data.session.access_token);
        setUser(data.session.user);
        setUserRole(data.session.user.user_metadata?.role || 'Employee');
      } else {
        console.log('No session found:', error);
      }
    } catch (error) {
      console.log('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setAccessToken(data.session.access_token);
    setUser(data.user);
    setUserRole(data.user.user_metadata?.role || 'Employee');
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-c4e14817/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, isFirstAdmin: true }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // Auto-login after signup
    await handleLogin(email, password);
  };

  const handleForgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://${projectId}.supabase.co`,
    });

    if (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUser(null);
    setSelectedChecklist(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!accessToken) {
    return <LoginScreen onLogin={handleLogin} onSignup={handleSignup} onForgotPassword={handleForgotPassword} />;
  }

  if (selectedChecklist) {
    return (
      <ChecklistDetail
        checklistId={selectedChecklist}
        accessToken={accessToken}
        onBack={() => setSelectedChecklist(null)}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'profile') {
    return (
      <UserProfile
        accessToken={accessToken}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'user-management') {
    return (
      <UserManagement
        accessToken={accessToken}
        currentUserRole={userRole}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <ChecklistDashboard
      accessToken={accessToken}
      user={user}
      onSelectChecklist={setSelectedChecklist}
      onLogout={handleLogout}
      onNavigateToProfile={() => setCurrentView('profile')}
      onNavigateToUserManagement={() => setCurrentView('user-management')}
      userRole={userRole}
    />
  );
}