import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signInAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createMockUser(email: string, displayName?: string): User {
  return {
    id: 'local-' + (btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'guest'),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { display_name: displayName || email.split('@')[0] },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: '',
    email_change_sent_at: '',
    new_email: '',
    invited_at: '',
    action_link: '',
    email,
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: '',
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    is_anonymous: false,
    factors: [],
  };
}

function createMockSession(user: User): Session {
  return {
    access_token: 'local-token',
    token_type: 'bearer',
    expires_in: 86400,
    refresh_token: 'local-refresh-token',
    user,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('ocean_flow_local_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          setSession(createMockSession(parsed));
        } catch {
          localStorage.removeItem('ocean_flow_local_user');
        }
      }
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // Fallback if supabase network fails
      const stored = localStorage.getItem('ocean_flow_local_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          setSession(createMockSession(parsed));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAsGuest = () => {
    const guest = createMockUser('convidado@oceanflow.app', 'Mergulhador');
    setUser(guest);
    setSession(createMockSession(guest));
    localStorage.setItem('ocean_flow_local_user', JSON.stringify(guest));
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!isSupabaseConfigured) {
      const newUser = createMockUser(email, displayName);
      setUser(newUser);
      setSession(createMockSession(newUser));
      localStorage.setItem('ocean_flow_local_user', JSON.stringify(newUser));
      return { error: null };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      return { error: error as Error | null };
    } catch (e: any) {
      // Fallback to local
      const newUser = createMockUser(email, displayName);
      setUser(newUser);
      setSession(createMockSession(newUser));
      localStorage.setItem('ocean_flow_local_user', JSON.stringify(newUser));
      return { error: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const localUser = createMockUser(email);
      setUser(localUser);
      setSession(createMockSession(localUser));
      localStorage.setItem('ocean_flow_local_user', JSON.stringify(localUser));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error: error as Error | null };
    } catch (e: any) {
      const localUser = createMockUser(email);
      setUser(localUser);
      setSession(createMockSession(localUser));
      localStorage.setItem('ocean_flow_local_user', JSON.stringify(localUser));
      return { error: null };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('ocean_flow_local_user');
    setUser(null);
    setSession(null);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      return { error: error as Error | null };
    } catch (e: any) {
      return { error: null };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
