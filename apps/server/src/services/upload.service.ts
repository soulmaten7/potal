import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getImageUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export function deleteFile(filename: string): void {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

ensureUploadsDir();
