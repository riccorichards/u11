// Path: components/player/types.ts

export type AssignmentStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PASSED"
  | "NOT_YET"
  | "EXPIRED";
export type ProgressStatus = "LOCKED" | "OPEN" | "IN_PROGRESS" | "MASTERED";
export type TaskType = "PUZZLE" | "FIELD_CHECK" | "CHALLENGE";

export interface Rewards {
  xp: number;
  badge: { title: string } | null;
}

/** One item from GET /api/tasks/mine. */
export interface FeedItem {
  assignmentId: string;
  status: AssignmentStatus;
  isActive: boolean;
  dueDate: string | null;
  completedAt: string | null;
  progress: {
    attemptsUsed?: number;
    attemptsLeft?: number;
    progressCount?: number;
    targetCount?: number;
    gradeNote?: string | null;
  };
  task: {
    _id: string;
    type: TaskType;
    title: string;
    description: string;
    xpReward: number;
    isDailyQuest: boolean;
    skillNodeId: string;
    hasBadge: boolean;
    puzzle?: {
      question: string;
      diagramUrl: string;
      options: { id: string; text: string }[];
      correctOptionId?: string;
      explanation?: string;
    };
    challenge?: { targetCount: number; attemptCount: number };
    fieldCheck?: { criteria: string };
  };
  topic: {
    id: string;
    title: string;
    titleEn: string;
    moduleId: string | null;
  } | null;
}

export interface AnswerResult {
  status: AssignmentStatus;
  isCorrect: boolean;
  attemptsUsed: number;
  attemptsLeft: number;
  correctOptionId: string | null;
  explanation: string | null;
  rewards: Rewards | null;
}

export interface TopicRef {
  id: string;
  title: string;
  titleEn: string;
  status: ProgressStatus;
}

/** GET /api/topics/[id] */
export interface TopicPageData {
  topic: {
    id: string;
    title: string;
    titleEn: string;
    description: string;
    forMyPosition: boolean;
  };
  module: { id: string; slug: string; title: { ka: string; en?: string } };
  path: { id: string; title: string }[];
  status: ProgressStatus;
  locked: boolean;
  lesson: { videoUrl: string; diagramUrl: string; keyPoints: string[] } | null;
  prerequisites: TopicRef[];
  subtopics: TopicRef[];
  tasks: FeedItem[];
  badges: {
    _id: string;
    title: string;
    description: string;
    iconUrl: string | null;
    xpReward: number;
    source: string;
    earned: boolean;
  }[];
}

export interface BadgeInfo {
  _id: string;
  title: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  source: "TASK" | "BRANCH" | "MANUAL";
  skillNodeId: string | null;
}

/** GET /api/badges/mine */
export interface MyBadges {
  earned: (BadgeInfo & {
    earnedAt: string;
    awardSource: "AUTO" | "COACH";
    note: string;
  })[];
  goals: (BadgeInfo & {
    kind: "BRANCH" | "TASK";
    how: {
      topicId?: string;
      topicTitle?: string;
      taskId?: string;
      taskTitle?: string;
    };
    progress: { done: number; total: number } | null;
  })[];
}
