export interface Note {
  id: string;
  title: string;
  content: string;
  tag?: string;
  createdAt: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface FocusSession {
  id: string;
  title: string;
  minutes: number;
  date: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}
