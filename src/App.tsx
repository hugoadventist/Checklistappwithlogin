import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { LoginScreen } from './components/LoginScreen';
import { ChecklistDashboard } from './components/ChecklistDashboard';
import { ChecklistDetail } from './components/ChecklistDetail';
import { UserProfile } from './components/UserProfile';
import { UserManagement } from './components/UserManagement';
import { redirectIfInvalid } from './utils/auth-interceptor';

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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setAccessToken(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          // We don't rely solely on this for React state because we want to use HttpOnly cookies,
          // but if Supabase triggers a SIGNED_IN, we can attempt to re-validate via our endpoint.
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Validate session via secure cookie endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/api-server/validate-session`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok && data.valid && data.user) {
        setAccessToken("cookie-auth");
        setUser(data.user);
        setUserRole(data.user.user_metadata?.role || 'Employee');
      } else {
        // If not valid, but we thought we were authenticated, trigger redirect.
        // On initial load, we just show LoginScreen, but if there's a reason, we handle it in LoginScreen.
        setAccessToken(null);
      }
    } catch (error) {
      console.log('Session check error:', error);
      setAccessToken(null);
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

    if (data.session) {
      // Call edge function to set HttpOnly cookie
      const sessionResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/api-server/auth-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ access_token: data.session.access_token })
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to establish secure session');
      }
    }

    setAccessToken("cookie-auth");
    setUser(data.user);
    setUserRole(data.user.user_metadata?.role || 'Employee');
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/api-server/signup`,
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
    // Optional: Call endpoint to clear HttpOnly cookie
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