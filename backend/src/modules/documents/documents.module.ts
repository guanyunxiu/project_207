import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentView } from './entities/document-view.entity';
import { DocumentFavorite } from './entities/document-favorite.entity';
import { DocumentComment } from './entities/document-comment.entity';
import { DocumentLike } from './entities/document-like.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { User } from '../users/entities/user.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentView, DocumentFavorite, DocumentComment, DocumentLike, DocumentVersion, User]),
    NotificationsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
