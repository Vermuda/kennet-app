import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'admin';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'password';

function checkBasicAuth(authHeader: string | undefined): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  return username === BASIC_AUTH_USER && password === BASIC_AUTH_PASSWORD;
}

function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;

  // Basic認証チェック
  if (!checkBasicAuth(authHeader)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required');
  }

  // リクエストされたパスを取得
  let requestPath = (req.url || '/').replace(/^\/api\/proxy/, '');
  if (requestPath === '' || requestPath === '/') {
    requestPath = '/index.html';
  }

  // ファイルパスを構築
  const filePath = join(process.cwd(), 'dist', requestPath);

  try {
    // ファイルが存在するか確認
    if (existsSync(filePath)) {
      const content = readFileSync(filePath);
      const contentType = getContentType(filePath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(content);
    } else {
      // ファイルが存在しない場合はindex.htmlを返す（SPA対応）
      const indexPath = join(process.cwd(), 'dist', 'index.html');
      const html = readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ 
      message: 'Error loading page', 
      error: String(error),
      path: requestPath 
    });
  }
}

