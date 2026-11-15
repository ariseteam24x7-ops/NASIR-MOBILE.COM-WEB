import { db, createPool, setDbAvailable } from './index.ts';

export async function initDatabase() {
  const pool = createPool();

  try {
    await pool.query('SELECT 1');
    setDbAvailable(true);
    console.log('MySQL database connected and verified successfully');
  } catch (err: any) {
    setDbAvailable(false);
    console.warn('[WARN] MySQL offline on startup; API endpoints will return HTTP 503 until connected:', err?.message || 'Connection unavailable');
    return;
  }

  // Auto-restore any images stored in MySQL to public/uploads on startup
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { images } = await import('./schema.ts');
    const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const dbImgs = await db.select().from(images);
    for (const img of dbImgs) {
      if (!img.data || !img.fileName) continue;
      const safeFileName = path.basename(String(img.fileName));
      if (!safeFileName || safeFileName === '.' || safeFileName === '..') continue;
      const targetPath = path.resolve(uploadsDir, safeFileName);
      if (!targetPath.startsWith(uploadsDir + path.sep)) continue;

      if (!fs.existsSync(targetPath)) {
        let buffer: Buffer;
        if (img.data.startsWith('data:')) {
          const match = img.data.match(/^data:[^;]+;base64,(.+)$/);
          buffer = Buffer.from(match ? match[1] : img.data, 'base64');
        } else {
          buffer = Buffer.from(img.data, 'base64');
        }
        if (buffer.length > 0) {
          fs.writeFileSync(targetPath, buffer);
        }
      }
    }
  } catch (imgErr) {
    console.warn('Note: Startup image cache check:', (imgErr as any)?.message);
  }

  setDbAvailable(true);
}
