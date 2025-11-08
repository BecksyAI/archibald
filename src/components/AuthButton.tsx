/**
 * Simple authentication button component
 * Shows login button if not logged in, user menu if logged in
 */

"use client";

import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { UserMenu } from './UserMenu';

export function AuthButton() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500 dark:text-limestone">
        Loading...
      </div>
    );
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <>
      <button
        onClick={() => setShowLogin(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-dram text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
      >
        <LogIn className="h-4 w-4" />
        Login
      </button>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}

