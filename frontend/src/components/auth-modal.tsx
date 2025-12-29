/**
 * Auth Modal Component
 *
 * AWS Amplify Authenticatorをモーダルで表示
 */

import { useEffect } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useAuth } from "@/hooks/use-auth";

export function AuthModal() {
  const { showAuthModal, closeAuthModal, onAuthSuccess } = useAuth();

  // モーダルが開いている間、bodyのスクロールを無効化
  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAuthModal]);

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeAuthModal}
      />

      {/* Modal Content */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          aria-label="閉じる"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Authenticator */}
        <Authenticator signUpAttributes={["email"]} loginMechanisms={["email"]}>
          {() => {
            // 認証成功時のコールバック
            onAuthSuccess();
            return <div className="hidden" />;
          }}
        </Authenticator>
      </div>
    </div>
  );
}
