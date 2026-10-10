/**
 * My Path (مسیر من) — foundational data model.
 *
 * This file intentionally defines the new model without wiring it into App.tsx.
 * Keep the existing "kaenatchi-selected-growth-v2" data untouched until a
 * separate, reviewed migration is implemented.
 */

export const MY_PATH_SCHEMA_VERSION = 1 as const;
export const MY_PATH_STORAGE_KEY = "kaenatchi-my-path-v1";

export type MyPathStageId = 1 | 2 | 3 | 4;

export type MyPathStageStatus =
  | "locked"
  | "ready"
  | "in_progress"
  | "completed";

export type Stage1Answers = {
  currentTopic?: string;
  currentState?: string;
  initialGoal?: string;
  reflection?: string;
  firstStep?: string;
};

export type Stage2Answers = {
  questionnaireAnswers?: Record<string, string>;
  guidedExercise?: string;
  changeGoal?: string;
  actionPlan?: string;
  barriers?: string;
};

export type Stage3Answers = {
  plannedAction?: string;
  attemptedAt?: string;
  actionOutcome?: string;
  barrier?: string;
  revisedPlan?: string;
  reflection?: string;
};

export type Stage4Answers = {
  whatBecameClear?: string;
  helpfulOrDifficult?: string;
  nextStepChoice?: string;
};

export type AnswersByStage = {
  1: Stage1Answers;
  2: Stage2Answers;
  3: Stage3Answers;
  4: Stage4Answers;
};

export type StageRecord<TAnswers> = {
  status: MyPathStageStatus;
  answers: TAnswers;
  summary: string | null;
  summaryConfirmed: boolean;
  startedAt: string | null;
  completedAt: string | null;
  version: number;
  /** True when the user has reviewed this version after reopening it. */
  lastReviewedAt: string | null;
};

export type MyPathStageRecords = {
  1: StageRecord<Stage1Answers>;
  2: StageRecord<Stage2Answers>;
  3: StageRecord<Stage3Answers>;
  4: StageRecord<Stage4Answers>;
};

export type StageHistoryRecord = {
  stageId: MyPathStageId;
  version: number;
  savedAt: string;
  status: MyPathStageStatus;
  answers: AnswersByStage[MyPathStageId];
  summary: string | null;
  summaryConfirmed: boolean;
  completedAt: string | null;
  /** Explains why this snapshot was retained, e.g. an edit or replacement. */
  reason: "stage_edit" | "stage_recompletion" | "migration";
};

export type MyPath = {
  schemaVersion: typeof MY_PATH_SCHEMA_VERSION;
  personalTitle: string | null;
  createdAt: string;
  updatedAt: string;
  stages: MyPathStageRecords;
  /** Immutable snapshots of earlier saved versions; never auto-delete. */
  history: StageHistoryRecord[];
};

function createEmptyStage<TAnswers>(
  status: MyPathStageStatus,
  answers: TAnswers,
): StageRecord<TAnswers> {
  return {
    status,
    answers,
    summary: null,
    summaryConfirmed: false,
    startedAt: null,
    completedAt: null,
    version: 1,
    lastReviewedAt: null,
  };
}

/**
 * Creates a blank path. This does not grant VIP access or mark any stage
 * complete; authorization must be checked independently by the trusted system.
 */
export function createInitialMyPath(now = new Date().toISOString()): MyPath {
  return {
    schemaVersion: MY_PATH_SCHEMA_VERSION,
    personalTitle: null,
    createdAt: now,
    updatedAt: now,
    stages: {
      1: createEmptyStage("ready", {}),
      2: createEmptyStage("locked", {}),
      3: createEmptyStage("locked", {}),
      4: createEmptyStage("locked", {}),
    },
    history: [],
  };
}

/** Stage IDs in their intended user-facing order. */
export const MY_PATH_STAGE_ORDER: readonly MyPathStageId[] = [1, 2, 3, 4];

/**
 * Minimal structural check for data read from local storage. This deliberately
 * rejects unknown schema versions rather than silently rewriting user data.
 */
export function isMyPath(value: unknown): value is MyPath {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<MyPath>;
  const stages = candidate.stages;

  return (
    candidate.schemaVersion === MY_PATH_SCHEMA_VERSION &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    (candidate.personalTitle === null ||
      typeof candidate.personalTitle === "string") &&
    !!stages &&
    [1, 2, 3, 4].every((id) => {
      const stage = stages[id as MyPathStageId];
      return (
        !!stage &&
        ["locked", "ready", "in_progress", "completed"].includes(stage.status) &&
        !!stage.answers &&
        typeof stage.answers === "object" &&
        (typeof stage.version === "number" && stage.version >= 1) &&
        (stage.summary === null || typeof stage.summary === "string") &&
        typeof stage.summaryConfirmed === "boolean"
      );
    }) &&
    Array.isArray(candidate.history)
  );
}

/**
 * Safe storage helpers for later integration. They never remove or overwrite
 * the existing legacy key and return an explicit failure signal.
 */
export type MyPathReadResult =
  | { status: "missing" }
  | { status: "valid"; path: MyPath }
  | { status: "invalid" }
  | { status: "unavailable" };

function getBrowserStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Distinguishes a genuinely new path from unreadable or unknown stored data.
 * Callers must not treat "invalid" as an empty path or overwrite it silently.
 */
export function loadMyPath(
  storage?: Pick<Storage, "getItem">,
): MyPathReadResult {
  try {
    const target = storage ?? getBrowserStorage();
    if (!target) return { status: "unavailable" };

    const raw = target.getItem(MY_PATH_STORAGE_KEY);
    if (raw === null) return { status: "missing" };

    const parsed: unknown = JSON.parse(raw);
    return isMyPath(parsed)
      ? { status: "valid", path: parsed }
      : { status: "invalid" };
  } catch {
    return { status: "unavailable" };
  }
}

/** Convenience reader; use loadMyPath when missing and invalid must differ. */
export function readMyPath(
  storage?: Pick<Storage, "getItem">,
): MyPath | null {
  const result = loadMyPath(storage);
  return result.status === "valid" ? result.path : null;
}

/**
 * Writes only when storage is new or already contains a recognized schema.
 * Invalid/unknown data is preserved rather than overwritten.
 */
export function writeMyPath(
  path: MyPath,
  storage?: Pick<Storage, "getItem" | "setItem">,
): boolean {
  try {
    const target = storage ?? getBrowserStorage();
    if (!target) return false;

    const existing = target.getItem(MY_PATH_STORAGE_KEY);
    if (existing !== null) {
      const parsed: unknown = JSON.parse(existing);
      if (!isMyPath(parsed)) return false;
    }

    const updated: MyPath = {
      ...path,
      updatedAt: new Date().toISOString(),
    };
    target.setItem(MY_PATH_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}
