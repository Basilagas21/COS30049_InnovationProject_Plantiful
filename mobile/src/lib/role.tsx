import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type Role = 'botanist' | 'conservation_officer' | 'admin';

export type RoleContextValue = {
  role: Role | null;
  loading: boolean;
  canCapture: boolean;
  isOfficer: boolean;
};

const RoleContext = createContext<RoleContextValue>({
  role: null,
  loading: false,
  canCapture: true,
  isOfficer: false,
});

function cacheKey(userId: string): string {
  return `plantiful.role.${userId}`;
}

// Caps the profile lookup so a stalled network can't keep the app on the
// splash screen; resolves null on timeout and falls back to the cached role.
function withTimeout<T>(request: PromiseLike<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([request, timeout]);
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    async function resolveRole(userId: string | null) {
      if (!userId) {
        if (active) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      const cached = await AsyncStorage.getItem(cacheKey(userId));
      if (!active) return;
      if (cached) setRole(cached as Role);

      const result = await withTimeout(
        client!
          .from('user_profiles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle(),
        5000,
      );
      if (!active) return;

      const fetched = (result?.data?.role ?? null) as Role | null;
      if (fetched) {
        setRole(fetched);
        AsyncStorage.setItem(cacheKey(userId), fetched).catch(() => {});
      }
      setLoading(false);
    }

    client.auth.getSession().then(({ data }) => {
      void resolveRole(data.session?.user.id ?? null);
    });

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setRole(null);
        setLoading(false);
        return;
      }
      if (event === 'SIGNED_IN') {
        void resolveRole(session?.user.id ?? null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<RoleContextValue>(() => {
    // Fail open when the role is unknown (offline or not yet fetched) so a
    // signed-in botanist is never locked out of field capture; the database's
    // row-level security remains the true access ceiling.
    const canCapture = !isSupabaseConfigured || role === null || role === 'botanist';
    return {
      role,
      loading,
      canCapture,
      isOfficer: role === 'conservation_officer' || role === 'admin',
    };
  }, [role, loading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}

export function roleLabel(role: Role | null): string {
  switch (role) {
    case 'botanist':
      return 'Botanist';
    case 'conservation_officer':
      return 'Conservation officer';
    case 'admin':
      return 'Administrator';
    default:
      return 'Viewer';
  }
}
