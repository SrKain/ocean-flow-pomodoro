import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

interface SpotifyContextType {
  isConnected: boolean;
  isLoading: boolean;
  currentTrack: SpotifyTrack | null;
  connect: () => void;
  disconnect: () => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

// Spotify Client ID - this is a public key, safe to include in frontend code
const SPOTIFY_CLIENT_ID = '2160e371390d4d28b0a9094d24365c84';
const REDIRECT_URI = window.location.origin;
const SCOPES = ['user-read-currently-playing', 'user-read-playback-state'];

// PKCE helpers
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(a)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens from database on mount or when user changes
  useEffect(() => {
    if (!user) {
      setAccessToken(null);
      setRefreshToken(null);
      setExpiresAt(null);
      setCurrentTrack(null);
      setIsLoading(false);
      return;
    }

    const loadTokensFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('spotify_connections')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading Spotify tokens:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const expiry = Number(data.expires_at);
          if (Date.now() < expiry) {
            setAccessToken(data.access_token);
            setRefreshToken(data.refresh_token);
            setExpiresAt(expiry);
          } else if (data.refresh_token) {
            await refreshAccessToken(data.refresh_token);
          }
        }
      } catch (error) {
        console.error('Error loading Spotify tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokensFromDb();
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('spotify_auth_state');

    if (!code) return;
    if (!user) return;

    if (state && storedState && state === storedState) {
      exchangeCodeForToken(code);
    } else {
      console.error('Spotify OAuth state mismatch. Please try connecting again.');
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem('spotify_auth_state');
  }, [user]);

  const saveTokensToDb = async (tokens: { accessToken: string; refreshToken: string | null; expiresAt: number }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('spotify_connections')
        .upsert({
          user_id: user.id,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: tokens.expiresAt,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving Spotify tokens:', error);
      }
    } catch (error) {
      console.error('Error saving Spotify tokens:', error);
    }
  };

  const exchangeCodeForToken = async (code: string) => {
    const verifier = localStorage.getItem('spotify_code_verifier');
    if (!verifier || !user) return;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Spotify token exchange failed:', data);
        return;
      }

      if (data.access_token) {
        const expiry = Date.now() + data.expires_in * 1000;
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setExpiresAt(expiry);

        await saveTokensToDb({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: expiry,
        });

        localStorage.removeItem('spotify_code_verifier');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

  const refreshAccessToken = async (token: string) => {
    if (!user) return;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: token,
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        const expiry = Date.now() + data.expires_in * 1000;
        const newRefreshToken = data.refresh_token || token;

        setAccessToken(data.access_token);
        setExpiresAt(expiry);
        setRefreshToken(newRefreshToken);

        await saveTokensToDb({
          accessToken: data.access_token,
          refreshToken: newRefreshToken,
          expiresAt: expiry,
        });
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      disconnect();
    }
  };

  const connect = useCallback(async () => {
    if (!SPOTIFY_CLIENT_ID) {
      console.error('Spotify Client ID not configured');
      return;
    }

    if (!user) {
      console.error('User must be logged in to connect Spotify');
      return;
    }

    const state = generateRandomString(16);
    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem('spotify_auth_state', state);
    localStorage.setItem('spotify_code_verifier', verifier);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      state,
      scope: SCOPES.join(' '),
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }, [user]);

  const disconnect = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    setCurrentTrack(null);

    if (user) {
      try {
        await supabase
          .from('spotify_connections')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error deleting Spotify connection:', error);
      }
    }
  }, [user]);

  // Fetch currently playing track
  const fetchCurrentTrack = useCallback(async () => {
    if (!accessToken || !user) return;

    // Check if token needs refresh
    if (expiresAt && Date.now() > expiresAt - 60000 && refreshToken) {
      await refreshAccessToken(refreshToken);
      return;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 204 || response.status === 404) {
        setCurrentTrack(null);
        return;
      }

      if (response.status === 401) {
        if (refreshToken) {
          await refreshAccessToken(refreshToken);
        } else {
          disconnect();
        }
        return;
      }

      const data = await response.json();
      if (data.item) {
        setCurrentTrack({
          name: data.item.name,
          artist: data.item.artists.map((a: { name: string }) => a.name).join(', '),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url || '',
          isPlaying: data.is_playing,
          progressMs: data.progress_ms || 0,
          durationMs: data.item.duration_ms || 0,
        });
      } else {
        setCurrentTrack(null);
      }
    } catch (error) {
      console.error('Error fetching current track:', error);
    }
  }, [accessToken, expiresAt, refreshToken, disconnect, user]);

  // Poll for current track every 5 seconds
  useEffect(() => {
    if (!accessToken || !user) return;

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000);
    return () => clearInterval(interval);
  }, [accessToken, fetchCurrentTrack, user]);

  return (
    <SpotifyContext.Provider
      value={{
        isConnected: !!accessToken,
        isLoading,
        currentTrack,
        connect,
        disconnect,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
}
