/**
 * API Notes Repository
 *
 * 認証済みユーザーのノートをバックエンドAPIに保存する実装
 */

import type { Note, NotesRepository } from './notes-repository';
import { authenticatedFetch } from '../api-client';

const API_ENDPOINT = '/notes';

/**
 * APIを使用したノートリポジトリの実装
 */
export class ApiNotesRepository implements NotesRepository {
  /**
   * すべてのノートを取得
   */
  async fetchNotes(): Promise<Note[]> {
    const res = await authenticatedFetch(API_ENDPOINT);

    if (!res.ok) {
      throw new Error('Failed to fetch notes from API');
    }

    const data = await res.json();
    return data.notes || [];
  }

  /**
   * 新しいノートを作成
   */
  async createNote(title: string, content: string): Promise<Note> {
    const res = await authenticatedFetch(API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      throw new Error('Failed to create note via API');
    }

    return res.json();
  }

  /**
   * 既存のノートを更新
   */
  async updateNote(noteId: string, title: string, content: string): Promise<Note> {
    const res = await authenticatedFetch(`${API_ENDPOINT}/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      throw new Error('Failed to update note via API');
    }

    return res.json();
  }

  /**
   * ノートを削除
   */
  async deleteNote(noteId: string): Promise<void> {
    const res = await authenticatedFetch(`${API_ENDPOINT}/${noteId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete note via API');
    }
  }
}
