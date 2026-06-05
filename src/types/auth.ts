export type AuthMode = "dev" | "supabase";

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  authProvider: "dev" | "supabase";
}

export interface UserSession {
  user: AuthUser;
  authenticatedAt: string;
  authMode: AuthMode;
}
