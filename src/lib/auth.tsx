import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AuthState = { session: Session | null; user: User | null; ready: boolean };

const AuthContext = createContext<AuthState>({ session: null, user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, user: null, ready: false });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, user: session?.user ?? null, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, ready: true });
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export type Profile = Tables<"profiles">;
export type Product = Tables<"products">;

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      if (data) return data;
      // Safety net if the signup trigger didn't create a profile
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: user!.id, full_name: (user!.user_metadata?.["full_name"] as string) ?? "" })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return created;
    },
  });
}

export function useMyProducts(profileId: string | undefined) {
  return useQuery({
    queryKey: ["my-products", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("artisan_id", profileId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
