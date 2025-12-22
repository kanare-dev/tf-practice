import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.note-app.kanare.dev";

/**
 * 認証トークンを自動付与するfetchラッパー
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Cognitoセッションからトークンを取得
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    // リクエストヘッダーにトークンを追加
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
