import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;

  if (!checkBasicAuth(authHeader)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).json({ message: 'Authentication required' });
  }

  // 認証成功 - index.htmlを返す
  try {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    const html = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ message: 'Error loading page', error: String(error) });
  }
}

