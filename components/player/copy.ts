// Path: components/player/copy.ts

/**
 * Every word players see in the learning screens. To translate the player app,
 * translate this file; nothing else needs to change.
 */

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export const copy = {
  loading: "Loading…",
  retry: "Try again",
  loadError: (what: string) =>
    `Couldn't load ${what}. Check your connection and try again.`,

  status: {
    LOCKED: "Locked",
    OPEN: "Ready to learn",
    IN_PROGRESS: "Learning",
    MASTERED: "Mastered",
  } as Record<string, string>,

  assignment: {
    ASSIGNED: "To do",
    IN_PROGRESS: "In progress",
    PASSED: "Passed",
    NOT_YET: "Not yet",
    EXPIRED: "Missed the deadline",
  } as Record<string, string>,

  type: {
    PUZZLE: "Puzzle",
    FIELD_CHECK: "Field check",
    CHALLENGE: "Challenge",
  } as Record<string, string>,

  brain: {
    title: "My Brain",
    subtitle: "Every topic you open, learn and master lights up here.",
    treeView: "Tree",
    listView: "List",
    mastered: (done: number, total: number) => `${done} of ${total} mastered`,
    lockedHint:
      "This topic is still locked. Your coach will open it when it's time.",
    contextHint:
      "Faded topics belong to other positions. They're shown so the tree makes sense.",
    emptyModule: "Your coach is still building this module.",
    noModules: "Your coach hasn't published any modules yet. Check back soon.",
    badgesLink: "My badges",
    tasksLink: "My tasks",
  },

  topic: {
    back: "My Brain",
    learn: "Learn",
    watch: "Watch the lesson",
    diagram: "Diagram",
    keyPoints: "Remember",
    noLesson:
      "There's no lesson here yet. Ask your coach about this topic at training.",
    test: "Test yourself",
    noTasks: "No tasks for this topic yet. Your coach will add some.",
    prerequisites: "Good to master first",
    subtopics: "Inside this topic",
    badges: "Badges for this topic",
    earned: "Earned",
    lockedTitle: "This topic is locked",
    lockedBody: "Your coach will open it when it's time.",
    otherPosition:
      "This topic is mainly for other positions, but it's still good to know.",
  },

  tasks: {
    title: "My tasks",
    active: "To do",
    done: "Done",
    emptyActive: "Nothing to do right now. Nice work!",
    emptyDone: "Tasks you finish will show up here.",
    solve: "Solve",
    review: "See the answer",
    close: "Close",
    openTopic: "Open topic",
    fieldCheck: "Your coach checks this at training.",
    coachNote: "Coach's note",
    target: (done: number, target: number) => `${done} of ${target}`,
    attemptsLeft: (n: number) => `${plural(n, "attempt")} left`,
    xp: (n: number) => `+${n} XP`,
    hasBadge: "Badge",
  },

  due: (iso: string | null): string | null => {
    if (!iso) return null;
    const due = new Date(iso);
    const today = new Date();
    const startOf = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOf(due) - startOf(today)) / 86_400_000);
    if (days < 0) return "Deadline passed";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days < 7) return `Due in ${days} days`;
    return `Due ${due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  },

  puzzle: {
    choose: "Pick an answer",
    check: "Check answer",
    checking: "Checking…",
    correct: "Correct!",
    tryAgain: "Not quite. You have one more try.",
    notYet: "Not this time. Here's the right answer.",
    why: "Why",
    rightAnswer: "Right answer",
    continue: "Continue",
  },

  reward: {
    title: "Well done!",
    xp: (n: number) => `+${n} XP`,
    badge: (name: string) => `New badge: ${name}`,
  },

  badges: {
    title: "My badges",
    earned: "Earned",
    goals: "Up next",
    emptyEarned:
      "No badges yet. Pass tasks and master topics to earn your first one.",
    emptyGoals: "No badges to chase right now.",
    branchHow: (topic: string) => `Master everything in ${topic}`,
    taskHow: (task: string) => `Pass “${task}”`,
    fromCoach: "From your coach",
    progress: (done: number, total: number) => `${done} of ${total} topics`,
  },

  home: {
    title: "Today's tasks",
    seeAll: "See all tasks",
    none: "Nothing to do today. Enjoy training!",
    dailyQuest: "Daily quest",
  },
};
