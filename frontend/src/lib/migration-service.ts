/**
 * Migration Service
 *
 * ゲストユーザーのノートを認証済みアカウントに移行するサービス
 */

import type { Note } from './repositories';
import type { ApiNotesRepository } from './repositories/api-repository';
import { LocalStorageNotesRepository } from './repositories/local-storage-repository';

/**
 * 移行結果
 */
export interface MigrationResult {
  success: boolean;
  totalNotes: number;
  migratedCount: number;
  failedCount: number;
  errors: Array<{ noteId: string; title: string; error: string }>;
}

/**
 * 進捗コールバック
 */
export type ProgressCallback = (current: number, total: number) => void;

/**
 * Migration Service
 */
export class MigrationService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * ゲストノートを移行
   * @param apiRepository 移行先のAPIリポジトリ
   * @param onProgress 進捗コールバック
   * @returns 移行結果
   */
  async migrateNotes(
    apiRepository: ApiNotesRepository,
    onProgress?: ProgressCallback
  ): Promise<MigrationResult> {
    const guestRepository = new LocalStorageNotesRepository();

    try {
      // ゲストノートを取得
      const guestNotes = await guestRepository.fetchNotes();

      if (guestNotes.length === 0) {
        return {
          success: true,
          totalNotes: 0,
          migratedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      let migratedCount = 0;
      const errors: Array<{ noteId: string; title: string; error: string }> = [];

      // 各ノートを順次移行
      for (let i = 0; i < guestNotes.length; i++) {
        const note = guestNotes[i];

        try {
          await this.migrateNote(note, apiRepository);
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate note ${note.noteId}:`, error);
          errors.push({
            noteId: note.noteId,
            title: note.title,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // 進捗を報告
        if (onProgress) {
          onProgress(i + 1, guestNotes.length);
        }
      }

      // 全ノートが成功した場合のみlocalStorageをクリア
      if (errors.length === 0) {
        await guestRepository.clearAllNotes();
      }

      return {
        success: errors.length === 0,
        totalNotes: guestNotes.length,
        migratedCount,
        failedCount: errors.length,
        errors,
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * 単一ノートを移行（リトライ機能付き）
   * @param note 移行するノート
   * @param apiRepository 移行先のAPIリポジトリ
   */
  private async migrateNote(
    note: Note,
    apiRepository: ApiNotesRepository
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await apiRepository.createNote(note.title, note.content);
        return; // 成功
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(
          `Retry ${attempt + 1}/${this.MAX_RETRIES} failed for note ${note.noteId}:`,
          lastError
        );

        // 最後のリトライでない場合は待機
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAY_MS * (attempt + 1)); // 指数バックオフ
        }
      }
    }

    // すべてのリトライが失敗
    throw lastError || new Error('Migration failed after retries');
  }

  /**
   * 指定ミリ秒待機
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * ゲストノートが存在するかチェック
   */
  async hasGuestNotes(): Promise<boolean> {
    const guestRepository = new LocalStorageNotesRepository();
    return guestRepository.hasNotes();
  }
}
