/**
 * LocalStorage ユーティリティ関数
 *
 * ゲストユーザーのノートを安全に保存・取得するためのヘルパー関数群
 */

/**
 * localStorageからデータを安全に取得
 * @param key ストレージキー
 * @returns パース済みのデータ、エラー時はnull
 */
export function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to read from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * localStorageにデータを安全に保存
 * @param key ストレージキー
 * @param value 保存するデータ
 * @returns 成功時true、失敗時false
 */
export function setToStorage<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage (key: ${key}):`, error);

    // QuotaExceededErrorの場合は明示的にエラーメッセージを表示
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Please sign up to save more notes.');
    }

    return false;
  }
}

/**
 * localStorageから特定のキーを削除
 * @param key ストレージキー
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from localStorage (key: ${key}):`, error);
  }
}

/**
 * localStorageの利用可能容量をチェック
 * @returns 十分な容量がある場合true、不足している場合false
 */
export function checkStorageQuota(): boolean {
  try {
    // 1MBのテストデータで書き込み可能かチェック
    const testKey = '__storage_quota_test__';
    const testData = 'x'.repeat(1024 * 1024); // 1MB

    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);

    return true;
  } catch (error) {
    console.warn('LocalStorage quota check failed:', error);
    return false;
  }
}

/**
 * 指定したキーパターンに一致するすべてのデータをクリア
 * @param keyPattern クリアするキーのパターン（前方一致）
 */
export function clearStorageByPattern(keyPattern: string): void {
  try {
    const keysToRemove: string[] = [];

    // 削除対象のキーを収集
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(keyPattern)) {
        keysToRemove.push(key);
      }
    }

    // 収集したキーを削除
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log(`Cleared ${keysToRemove.length} items matching pattern: ${keyPattern}`);
  } catch (error) {
    console.error(`Failed to clear storage by pattern (${keyPattern}):`, error);
  }
}

/**
 * localStorageが利用可能かチェック
 * @returns localStorageが利用可能な場合true
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
