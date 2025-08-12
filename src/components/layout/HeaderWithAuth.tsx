"use client";
import { DatingHeader } from './dating-header';
import { useAuth } from '@/lib/store';

export function HeaderWithAuth() {
  const { isAuthenticated, user, logout } = useAuth();
  return <DatingHeader isAuthenticated={isAuthenticated} user={user || undefined} onLogout={logout} />;
}