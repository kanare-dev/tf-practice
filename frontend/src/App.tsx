import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    }
  });

  // ノート追加
  const addMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("failed add");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  // ノート削除
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await fetch(`${endpoint}/${noteId}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  return (
    <main className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">ノート一覧</h1>
      <form
        className="mb-6 border p-4 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          addMutation.mutate({ title, content });
          setTitle("");
          setContent("");
        }}
      >
        <input
          className="border px-2 py-1 flex-1"
          placeholder="タイトル"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="border px-2 py-1 flex-1"
          placeholder="内容"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" type="submit">
          追加
        </button>
      </form>
      {isLoading ? (
        <div>読み込み中...</div>
      ) : error ? (
        <div>エラー: {String(error)}</div>
      ) : (
        <ul className="space-y-2">
          {data?.notes.map(note => (
            <li key={note.noteId} className="border p-3 flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <div className="font-semibold">{note.title}</div>
                <div className="text-gray-700 text-sm">{note.content}</div>
                <div className="text-gray-400 text-xs">{note.createdAt}</div>
              </div>
              <button
                className="bg-red-400 text-white px-2 py-1 rounded mt-2 sm:mt-0 ml-auto"
                onClick={() => deleteMutation.mutate(note.noteId)}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
