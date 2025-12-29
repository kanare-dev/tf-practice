/**
 * Migration Modal Component
 *
 * データ移行中の進捗とステータスを表示
 */

import type { MigrationResult } from '@/lib/migration-service';

interface MigrationModalProps {
  isOpen: boolean;
  progress: { current: number; total: number } | null;
  result: MigrationResult | null;
  onRetry?: () => void;
  onClose?: () => void;
}

export function MigrationModal({
  isOpen,
  progress,
  result,
  onRetry,
  onClose,
}: MigrationModalProps) {
  if (!isOpen) return null;

  const isMigrating = progress !== null && result === null;
  const isComplete = result !== null;
  const hasErrors = result && result.failedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        {/* Migrating State */}
        {isMigrating && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <svg
                className="h-12 w-12 animate-spin text-accent"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">ノートを移行中...</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {progress.current} / {progress.total} 件のノートを移行しました
            </p>
            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent/20">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Success State */}
        {isComplete && !hasErrors && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold">移行完了!</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {result.migratedCount} 件のノートがアカウントに保存されました
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                閉じる
              </button>
            )}
          </div>
        )}

        {/* Error State */}
        {isComplete && hasErrors && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
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
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold">一部のノートを移行できませんでした</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {result.migratedCount} 件成功、{result.failedCount} 件失敗
            </p>

            {/* Failed Notes List */}
            {result.errors.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto rounded-md bg-red-50 p-3 text-left">
                <p className="mb-2 text-xs font-medium text-red-900">
                  失敗したノート:
                </p>
                <ul className="space-y-1 text-xs text-red-700">
                  {result.errors.map((error, index) => (
                    <li key={index} className="truncate">
                      • {error.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  再試行
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/10"
                >
                  閉じる
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
