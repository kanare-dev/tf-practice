/**
 * LocalStorage Notes Repository
 *
 * ゲストユーザーのノートをブラウザのlocalStorageに保存する実装
 */

import type { Note, NotesRepository } from './notes-repository';
import { getFromStorage, setToStorage } from '../storage';

const STORAGE_KEY = 'GUEST_NOTES_V1';

/**
 * LocalStorageを使用したノートリポジトリの実装
 */
export class LocalStorageNotesRepository implements NotesRepository {
  /**
   * すべてのノートを取得
   */
  async fetchNotes(): Promise<Note[]> {
    const notes = getFromStorage<Note[]>(STORAGE_KEY);
    return notes || [];
  }

  /**
   * 新しいノートを作成
   */
  async createNote(title: string, content: string): Promise<Note> {
    const notes = await this.fetchNotes();

    const now = new Date().toISOString();
    const newNote: Note = {
      noteId: crypto.randomUUID(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [...notes, newNote];
    const success = setToStorage(STORAGE_KEY, updatedNotes);

    if (!success) {
      throw new Error('Failed to save note to localStorage. Storage quota may be exceeded.');
    }

    return newNote;
  }

  /**
   * 既存のノートを更新
   */
  async updateNote(noteId: string, title: string, content: string): Promise<Note> {
    const notes = await this.fetchNotes();
    const noteIndex = notes.findIndex((n) => n.noteId === noteId);

    if (noteIndex === -1) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const updatedNote: Note = {
      ...notes[noteIndex],
      title,
      content,
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [
      ...notes.slice(0, noteIndex),
      updatedNote,
      ...notes.slice(noteIndex + 1),
    ];

    const success = setToStorage(STORAGE_KEY, updatedNotes);

    if (!success) {
      throw new Error('Failed to update note in localStorage');
    }

    return updatedNote;
  }

  /**
   * ノートを削除
   */
  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.fetchNotes();
    const filteredNotes = notes.filter((n) => n.noteId !== noteId);

    if (filteredNotes.length === notes.length) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const success = setToStorage(STORAGE_KEY, filteredNotes);

    if (!success) {
      throw new Error('Failed to delete note from localStorage');
    }
  }

  /**
   * すべてのゲストノートをクリア（移行完了後に使用）
   */
  async clearAllNotes(): Promise<void> {
    const success = setToStorage(STORAGE_KEY, []);
    if (!success) {
      console.warn('Failed to clear guest notes from localStorage');
    }
  }

  /**
   * ゲストノートが存在するかチェック
   */
  async hasNotes(): Promise<boolean> {
    const notes = await this.fetchNotes();
    return notes.length > 0;
  }
}
