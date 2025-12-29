/**
 * Guest Banner Component
 *
 * ゲストユーザーに表示されるCTAバナー
 */

import { useAuth } from '@/hooks/use-auth';

export function GuestBanner() {
  const { openAuthModal } = useAuth();

  return (
    <div className="mb-8 rounded-lg border border-accent/30 bg-accent/5 p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            ゲストモードで利用中
          </h3>
          <p className="text-sm text-muted-foreground">
            サインアップしてノートをクラウドに保存しましょう。複数のデバイスからアクセスでき、データも安全に保管されます。
          </p>
        </div>
        <button
          onClick={openAuthModal}
          className="whitespace-nowrap rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          ログイン / サインアップ
        </button>
      </div>
    </div>
  );
}
