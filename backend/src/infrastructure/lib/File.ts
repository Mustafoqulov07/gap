import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, unlink, writeFile } from 'fs';
import { join } from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../../config';

export class File {
  static filePath = join(process.cwd(), env.FILE_PATH);

  static async create(file: Express.Multer.File): Promise<string> {
    try {
      if (!existsSync(File.filePath)) {
        mkdirSync(File.filePath, { recursive: true });
      }

      const detectedType = await fileTypeFromBuffer(file.buffer);

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
        throw new BadRequestException('Fayl formati notogri');
      }

      const fileName = `${Date.now()}_${file.originalname}`;

      await new Promise<void>((res, rej) => {
        writeFile(join(File.filePath, fileName), file.buffer, (err) => {
          if (err) rej(err);
          res();
        });
      });

      const cleanBaseUrl = env.BASE_URL.replace(/\/+$/, '').replace(/\/api\/v1\/uploads\/?$/, '');
      return `${cleanBaseUrl}/api/v1/uploads/${fileName}`;
    } catch (error) {
      throw new BadRequestException('Fayl yuklashda muammo');
    }
  }

  static async delete(fileName: string): Promise<void> {
    try {
      const file = fileName.split('/').pop();
      if (!file) {
        throw new BadRequestException('Fayl topilmadi');
      }
      const fileUrl = join(File.filePath, file);
      if (!existsSync(fileUrl)) {
        return;
      }
      await new Promise<void>((res, rej) => {
        unlink(fileUrl, (err: any) => {
          if (err) rej(err);
          res();
        });
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException("Faylni o'chirishda muammo");
    }
  }

  static async exist(fileName: string): Promise<boolean> {
    try {
      const file = fileName.split('/').pop();
      if (!file) {
        return false;
      }
      const fileUrl = join(File.filePath, file);

      return existsSync(fileUrl);
    } catch {
      throw new BadRequestException('Faylni tekshirishda muammo');
    }
  }
}

export const FILE_OPTIONS = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Faqat JPG, PNG yoki WebP rasmlarga ruxsat beriladi',
        ),
        false,
      );
    }

    callback(null, true);
  },
};
