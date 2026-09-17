export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  theme: string;
  lang: string;
  currency: string;
  pomo_work_min: number;
  pomo_break_min: number;
  daily_quote: boolean;
  notif_due_tasks: boolean;
  notif_habits: boolean;
  notif_goal_deadlines: boolean;
  habit_reminder_time: string;
  created_at: string;
  last_seen_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  priority: "high" | "medium" | "low" | null;
  category: string | null;
  due: string | null;
  due_time: string | null;
  done: boolean;
  created_at: string;
};

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  goal_hours: number;
};

export type StudySession = {
  id: string;
  user_id: string;
  subject_id: string | null;
  date: string;
  minutes: number;
  notes: string | null;
};

export type Workout = {
  id: string;
  user_id: string;
  name: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  position: number;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  workout_id: string | null;
  date: string;
  notes: string | null;
};

export type WorkoutSet = { reps: number; weight: number };

export type WorkoutLogEntry = {
  id: string;
  log_id: string;
  user_id: string;
  exercise_name: string;
  sets: WorkoutSet[];
};

export type BodyWeight = {
  id: string;
  user_id: string;
  date: string;
  weight: number;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  deadline: string | null;
  progress: number;
  notes: string | null;
  status: "active" | "done";
};

export type Transaction = {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string | null;
  notes: string | null;
};

export type SleepEntry = {
  id: string;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  notes: string | null;
};

export type Note = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  pinned: boolean;
  updated_at: string;
};
