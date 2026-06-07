export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum QuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum ScaleType {
  ANXIETY = 'anxiety',
  STRESS = 'stress',
  SLEEP = 'sleep',
  EMOTION = 'emotion',
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
