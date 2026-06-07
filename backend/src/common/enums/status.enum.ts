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
  HIGH_RISK_WARNING = 'high_risk_warning',
  COUNSELING_REMINDER = 'counseling_reminder',
  ASSESSMENT_COMPLETED = 'assessment_completed',
}

export enum ResultLevel {
  NORMAL = 'normal',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}
