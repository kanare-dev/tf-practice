/**
 * Guest Banner Component
 *
 * ゲストユーザーに表示されるCTAバナー
 * v0でデザイン改善 - 洗練された招待カード形式
 */

import { useAuth } from "@/hooks/use-auth";

export function GuestBanner() {
  const { openAuthModal } = useAuth();

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Subtle accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/60 via-accent to-accent/60" />

      <div className="p-8">
        <div className="mx-auto max-w-2xl text-center">
          {/* Icon or badge */}
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-accent/10 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 text-accent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
          </div>

          {/* Heading */}
          <h3 className="mb-2 text-balance text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            あなたのノートを、どこからでも
          </h3>

          {/* Description */}
          <p className="mb-6 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            アカウントを作成して、ノートをクラウドに安全に保存。
            <br className="hidden sm:inline" />
            複数のデバイスから、いつでもアクセスできます。
          </p>

          {/* CTA Button */}
          <button
            onClick={openAuthModal}
            className="group inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md"
          >
            <span>ログイン/サインアップ</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>

          {/* Subtle feature hints */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 text-accent"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>無料で始める</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 text-accent"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>安全なクラウド保存</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 text-accent"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>マルチデバイス対応</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
