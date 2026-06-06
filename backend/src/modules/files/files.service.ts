import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { File } from './entities/file.entity';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class FilesService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('minio.endPoint'),
      port: this.configService.get('minio.port'),
      accessKey: this.configService.get('minio.accessKey'),
      secretKey: this.configService.get('minio.secretKey'),
      useSSL: this.configService.get('minio.useSSL'),
    });
    this.bucket = this.configService.get('minio.bucket', 'knowledge-base');
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
      }
    } catch (error) {
      console.error('MinIO bucket initialization failed:', error);
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小不能超过10MB');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalName.split('.').pop();
    return `${timestamp}-${random}.${ext}`;
  }

  private getFileUrl(objectName: string): string {
    const endPoint = this.configService.get('minio.endPoint');
    const port = this.configService.get('minio.port');
    const useSSL = this.configService.get('minio.useSSL');
    const protocol = useSSL ? 'https' : 'http';
    return `${protocol}://${endPoint}:${port}/${this.bucket}/${objectName}`;
  }

  async upload(file: Express.Multer.File, userId: number) {
    this.validateFile(file);

    const fileName = this.generateFileName(file.originalname);

    try {
      await this.minioClient.putObject(
        this.bucket,
        fileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      const fileUrl = this.getFileUrl(fileName);

      const fileRecord = this.filesRepository.create({
        originalName: file.originalname,
        fileName,
        path: fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        storage: 'minio',
        uploaderId: userId,
      });

      const savedFile = await this.filesRepository.save(fileRecord);

      return {
        id: savedFile.id,
        name: file.originalname,
        url: fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        createdAt: savedFile.createdAt,
      };
    } catch (error) {
      throw new InternalServerErrorException('文件上传失败: ' + error.message);
    }
  }

  async delete(filename: string) {
    const fileRecord = await this.filesRepository.findOne({
      where: { fileName: filename },
    });

    if (!fileRecord) {
      throw new NotFoundException('文件不存在');
    }

    try {
      await this.minioClient.removeObject(this.bucket, filename);
      await this.filesRepository.delete(fileRecord.id);
      return { message: '删除成功' };
    } catch (error) {
      throw new InternalServerErrorException('文件删除失败: ' + error.message);
    }
  }

  async getPresignedUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
    try {
      const exists = await this.minioClient.statObject(this.bucket, objectName);
      if (!exists) {
        throw new NotFoundException('文件不存在');
      }
      return await this.minioClient.presignedGetObject(this.bucket, objectName, expirySeconds);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取预签名URL失败: ' + error.message);
    }
  }
}
