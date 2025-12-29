/**
 * Notes Repository Interface
 *
 * ノートのCRUD操作を抽象化したインターフェース
 * LocalStorage と API の両方の実装をサポート
 */

/**
 * ノート型定義
 */
export interface Note {
  noteId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ノートリポジトリインターフェース
 *
 * データソース（localStorage または API）に依存しない
 * 統一されたノート管理インターフェース
 */
export interface NotesRepository {
  /**
   * すべてのノートを取得
   * @returns ノートの配列
   */
  fetchNotes(): Promise<Note[]>;

  /**
   * 新しいノートを作成
   * @param title ノートのタイトル
   * @param content ノートの内容
   * @returns 作成されたノート
   */
  createNote(title: string, content: string): Promise<Note>;

  /**
   * 既存のノートを更新
   * @param noteId 更新するノートのID
   * @param title 新しいタイトル
   * @param content 新しい内容
   * @returns 更新されたノート
   */
  updateNote(noteId: string, title: string, content: string): Promise<Note>;

  /**
   * ノートを削除
   * @param noteId 削除するノートのID
   */
  deleteNote(noteId: string): Promise<void>;
}
