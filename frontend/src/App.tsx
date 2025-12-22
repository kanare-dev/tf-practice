import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotesList } from "@/components/notes-list";
import { NoteForm, type Note } from "@/components/note-form";
import { SearchBar } from "@/components/search-bar";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

const endpoint = "https://api.note-app.kanare.dev/notes";

export default function App() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Fetch notes
  const { data, isLoading, error } = useQuery<{ notes: Note[] }>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
  });

  // Add note mutation
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
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({
        title: "✓ ノートを作成しました",
        description: "新しいノートが追加されました",
      });
    },
    onError: () => {
      toast({
        title: "エラーが発生しました",
        description: "ノートの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      noteId,
      title,
      content,
    }: {
      noteId: string;
      title: string;
      content: string;
    }) => {
      const res = await fetch(`${endpoint}/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setEditingNote(null);
      toast({
        title: "✓ ノートを更新しました",
        description: "変更が保存されました",
      });
    },
    onError: () => {
      toast({
        title: "エラーが発生しました",
        description: "ノートの更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`${endpoint}/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({
        title: "✓ ノートを削除しました",
        description: "ノートが削除されました",
      });
    },
    onError: () => {
      toast({
        title: "エラーが発生しました",
        description: "ノートの削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleAddNote = (title: string, content: string) => {
    addMutation.mutate({ title, content });
  };

  const handleUpdateNote = (title: string, content: string) => {
    if (editingNote) {
      updateMutation.mutate({ noteId: editingNote.noteId, title, content });
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  // Filter notes based on search query
  const filteredNotes = data?.notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-full bg-accent/10 px-4 py-1.5">
            <span className="text-sm font-medium text-accent">
              Productivity Tool
            </span>
          </div>
          <h1 className="mb-3 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            My Notes
          </h1>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
            シンプルで強力なノート管理システム。思考を整理し、アイデアを保存しましょう。
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            notesCount={data?.notes.length || 0}
            filteredCount={filteredNotes?.length || 0}
          />
        </div>

        {/* Note Form */}
        <div className="mb-12">
          <NoteForm
            onSubmit={editingNote ? handleUpdateNote : handleAddNote}
            onCancel={editingNote ? handleCancelEdit : undefined}
            isLoading={addMutation.isPending || updateMutation.isPending}
            editingNote={editingNote}
          />
        </div>

        {/* Notes List */}
        <NotesList
          notes={filteredNotes || []}
          isLoading={isLoading}
          error={error}
          onDelete={(noteId) => deleteMutation.mutate(noteId)}
          onEdit={setEditingNote}
          isDeletingId={deleteMutation.variables}
          searchQuery={searchQuery}
        />

        {/* Footer */}
        <footer className="mt-16 border-t border-border pt-8 text-center">
          <div className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground sm:flex-row">
            <a
              href="https://kanare.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <span>©</span>
              <span>Kanare Kodera</span>
            </a>
            <div className="hidden text-border sm:block">|</div>
            <a
              href="https://github.com/Canale0107/tf-practice"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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
      <Toaster />
    </div>
  );
}
