/**
 * 認証ユーティリティ
 * Web Crypto APIを使用してパスワードをハッシュ化
 */

/**
 * パスワードをSHA-256でハッシュ化
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * パスワードとハッシュを比較
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

/**
 * パスワードハッシュを生成するヘルパー（開発用）
 * 本番環境では削除すること
 */
export const generatePasswordHash = async (password: string): Promise<void> => {
  if (import.meta.env.DEV) {
    const hash = await hashPassword(password);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
  }
};
