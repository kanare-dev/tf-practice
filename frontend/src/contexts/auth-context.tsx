/**
 * Authentication Context
 *
 * 認証状態の管理とリポジトリの選択を提供するコンテキスト
 */

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import type { NotesRepository } from '@/lib/repositories';
import { LocalStorageNotesRepository, ApiNotesRepository } from '@/lib/repositories';

/**
 * 認証モード
 * - guest: ゲストユーザー（未認証）
 * - authenticated: 認証済みユーザー
 * - migrating: データ移行中
 */
export type AuthMode = 'guest' | 'authenticated' | 'migrating';

/**
 * 認証コンテキストの型
 */
export interface AuthContextType {
  authMode: AuthMode;
  repository: NotesRepository;
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  onAuthSuccess: () => void;
  logout: () => Promise<void>;
  setAuthMode: (mode: AuthMode) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('guest');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [repository, setRepository] = useState<NotesRepository>(
    () => new LocalStorageNotesRepository()
  );

  // 初期認証状態の検出
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 認証モードに応じてリポジトリを切り替え
  useEffect(() => {
    if (authMode === 'authenticated') {
      setRepository(new ApiNotesRepository());
    } else if (authMode === 'guest') {
      setRepository(new LocalStorageNotesRepository());
    }
    // migrating時は既存のリポジトリを維持
  }, [authMode]);

  /**
   * 認証状態をチェック
   */
  async function checkAuthStatus(): Promise<void> {
    try {
      await getCurrentUser();
      // ユーザーが認証されている
      setAuthMode('authenticated');
    } catch {
      // ユーザーが認証されていない（ゲストモード）
      setAuthMode('guest');
    }
  }

  /**
   * 認証モーダルを開く
   */
  function openAuthModal(): void {
    setShowAuthModal(true);
  }

  /**
   * 認証モーダルを閉じる
   */
  function closeAuthModal(): void {
    setShowAuthModal(false);
  }

  /**
   * 認証成功時のコールバック
   */
  function onAuthSuccess(): void {
    setShowAuthModal(false);
    // 認証成功後、移行が必要かチェック（App.tsxで処理）
    setAuthMode('authenticated');
  }

  /**
   * ログアウト
   */
  async function logout(): Promise<void> {
    try {
      await amplifySignOut();
      setAuthMode('guest');
      setRepository(new LocalStorageNotesRepository());
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }

  const value: AuthContextType = {
    authMode,
    repository,
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    onAuthSuccess,
    logout,
    setAuthMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
