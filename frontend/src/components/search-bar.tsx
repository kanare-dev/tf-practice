import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  notesCount: number;
  filteredCount: number;
}

export function SearchBar({
  value,
  onChange,
  notesCount,
  filteredCount,
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Input
          type="text"
          placeholder="ノートを検索..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-border/50 pl-10 pr-24"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {value && (
        <p className="mt-2 text-sm text-muted-foreground">
          {filteredCount === 0 ? (
            "検索結果が見つかりませんでした"
          ) : (
            <>
              {notesCount}件中 {filteredCount}件のノートを表示
            </>
          )}
        </p>
      )}
    </div>
  );
}

