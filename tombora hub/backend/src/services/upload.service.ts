import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { Errors } from '../shared/errors';

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const ALLOWED = { ...IMAGE_TYPES, ...VIDEO_TYPES };

export function uploadsDir() {
  const dir = path.resolve(env.STORAGE_LOCAL_PATH);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function publicUrl(filename: string) {
  return `${env.API_URL.replace(/\/$/, '')}/uploads/${filename}`;
}

export const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir()),
    filename: (req, file, cb) => {
      const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase();
      const user = req.user?.id?.slice(0, 8) || 'anon';
      cb(null, `${user}-${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 40 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      cb(new Error('Only JPG, PNG, WEBP, GIF photos or MP4 / MOV / WEBM videos are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function mapUploadedFiles(files: Express.Multer.File[]) {
  if (!files.length) throw Errors.validation('Choose at least one photo or video');
  return files.map((file) => {
    const kind = file.mimetype.startsWith('video/') ? 'video' : 'image';
    if (kind === 'image' && file.size > 12 * 1024 * 1024) {
      fs.unlink(file.path, () => undefined);
      throw Errors.validation(`${file.originalname} is too large. Photos must be 12MB or less.`);
    }
    return {
      url: publicUrl(file.filename),
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      kind,
    };
  });
}
