import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

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

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/`;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('spotify_access_token');
    const storedRefresh = localStorage.getItem('spotify_refresh_token');
    const storedExpiry = localStorage.getItem('spotify_expires_at');
    
    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry);
      if (Date.now() < expiry) {
        setAccessToken(storedToken);
        setRefreshToken(storedRefresh);
        setExpiresAt(expiry);
      } else if (storedRefresh) {
        refreshAccessToken(storedRefresh);
      }
    }
    setIsLoading(false);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('spotify_auth_state');
    
    if (code && state === storedState) {
      exchangeCodeForToken(code);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('spotify_auth_state');
    }
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    const verifier = localStorage.getItem('spotify_code_verifier');
    if (!verifier) return;

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
      if (data.access_token) {
        const expiry = Date.now() + data.expires_in * 1000;
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setExpiresAt(expiry);
        
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
        localStorage.setItem('spotify_expires_at', expiry.toString());
        localStorage.removeItem('spotify_code_verifier');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

  const refreshAccessToken = async (token: string) => {
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
        setAccessToken(data.access_token);
        setExpiresAt(expiry);
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token);
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_expires_at', expiry.toString());
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
  }, []);

  const disconnect = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    setCurrentTrack(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
  }, []);

  // Fetch currently playing track
  const fetchCurrentTrack = useCallback(async () => {
    if (!accessToken) return;

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
  }, [accessToken, expiresAt, refreshToken, disconnect]);

  // Poll for current track every 5 seconds
  useEffect(() => {
    if (!accessToken) return;

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000);
    return () => clearInterval(interval);
  }, [accessToken, fetchCurrentTrack]);

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