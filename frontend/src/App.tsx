import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "./App.css";

const endpoint = "https://api.note-app.kanare.dev/notes";

type Note = {
  noteId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function App() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // ノート一覧取得
  const { data, isLoading, error } = useQuery<{ notes: Note[] }>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("failed fetch");
      return res.json();
    },
  });

  // ノート追加
  const addMutation = useMutation({
    mutationFn: async ({
      title,
      content,
    }: {
      title: string;
      content: string;
    }) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("failed add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setTitle("");
      setContent("");
    },
  });

  // ノート削除
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await fetch(`${endpoint}/${noteId}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Notes</h1>
          <p className="text-gray-600 text-sm">
            シンプルで使いやすいノート管理
          </p>
        </header>

        {/* Create Note Form */}
        <div className="card-light rounded-xl p-5 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新しいノートを作成
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim() && content.trim()) {
                addMutation.mutate({ title, content });
              }
            }}
            className="space-y-3"
          >
            <div>
              <input
                type="text"
                className="input-modern w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-400 text-sm transition-all"
                placeholder="タイトルを入力..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <textarea
                className="input-modern w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-400 resize-none h-24 text-sm transition-all"
                placeholder="内容を入力..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-primary w-full px-4 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  作成中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  ノートを追加
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Notes List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            すべてのノート
            {data?.notes && (
              <span className="text-sm font-normal text-gray-500">
                ({data.notes.length}件)
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="card-light rounded-xl p-12 flex flex-col items-center justify-center animate-fade-in">
              <div className="spinner mb-4"></div>
              <p className="text-gray-600 text-sm">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="card-light rounded-xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 text-red-600">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">
                  エラーが発生しました: {String(error)}
                </span>
              </div>
            </div>
          ) : data?.notes.length === 0 ? (
            <div className="card-light rounded-xl p-12 text-center animate-fade-in">
              <svg
                className="w-16 h-16 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 text-base font-medium">
                まだノートがありません
              </p>
              <p className="text-gray-500 mt-1 text-sm">
                上のフォームから最初のノートを作成しましょう
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.notes.map((note, index) => (
                <div
                  key={note.noteId}
                  className="note-card note-item card-light rounded-lg p-4"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1.5 break-words">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2 break-words">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(note.noteId)}
                      disabled={deleteMutation.isPending}
                      className="btn-delete px-3 py-1.5 rounded-md text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-all"
                      title="削除"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-10 py-6 border-t border-gray-200 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <span>©</span>
              <span>Kanare Kodera</span>
            </div>
            <div className="hidden sm:block text-gray-300">|</div>
            <a
              href="https://github.com/Canale0107/tf-practice"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Source on GitHub</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
