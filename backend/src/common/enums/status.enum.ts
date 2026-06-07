export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

export enum DocumentPermission {
  PUBLIC = 'public',
  DEPARTMENT = 'department',
  PRIVATE = 'private',
}

export enum NotificationType {
  COMMENT = 'comment',
  MENTION = 'mention',
  LIKE = 'like',
  REVIEW = 'review',
  SYSTEM = 'system',
}
