import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Note } from "@/components/note-form";

interface NotesListProps {
  notes: Note[];
  isLoading: boolean;
  error: Error | null;
  onDelete: (noteId: string) => void;
  onEdit: (note: Note) => void;
  isDeletingId?: string;
  searchQuery: string;
}

export function NotesList({
  notes,
  isLoading,
  error,
  onDelete,
  onEdit,
  isDeletingId,
  searchQuery,
}: NotesListProps) {
  const formatDate = (dateString: string) => {
    const dateStr = dateString.endsWith("Z") ? dateString : dateString + "Z";
    const date = new Date(dateStr);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-accent/30 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <svg
            className="h-5 w-5 text-muted-foreground"
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
        </h2>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-accent"></div>
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <svg
            className="h-5 w-5 text-muted-foreground"
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
        </h2>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 text-destructive">
              <svg
                className="h-5 w-5 flex-shrink-0"
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notes.length === 0 && !searchQuery) {
    return (
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <svg
            className="h-5 w-5 text-muted-foreground"
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
        </h2>
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30"
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
            <p className="mb-1 text-base font-medium">まだノートがありません</p>
            <p className="text-sm text-muted-foreground">
              上のフォームから最初のノートを作成しましょう
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
        <svg
          className="h-5 w-5 text-muted-foreground"
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
        <span className="text-sm font-normal text-muted-foreground">
          ({notes.length}件)
        </span>
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {sortedNotes.map((note, index) => (
          <Card
            key={note.noteId}
            className="group border-border/50 transition-all hover:border-accent/50 hover:shadow-md"
            style={{
              animation: "fadeIn 0.3s ease-out",
              animationDelay: `${index * 0.05}s`,
              animationFillMode: "both",
            }}
          >
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="flex-1 break-words text-base font-semibold leading-tight">
                  {highlightText(note.title, searchQuery)}
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(note)}
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    title="編集"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(note.noteId)}
                    disabled={isDeletingId === note.noteId}
                    className="h-8 w-8 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                    title="削除"
                  >
                    {isDeletingId === note.noteId ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                    ) : (
                      <svg
                        className="h-4 w-4"
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
                    )}
                  </Button>
                </div>
              </div>
              <p className="mb-3 break-words text-sm leading-relaxed text-muted-foreground">
                {highlightText(note.content, searchQuery)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <svg
                  className="h-3.5 w-3.5"
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

