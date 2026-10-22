export interface Note {
  id: string;
  title: string;
  content: string;
  tag?: string;
  createdAt: string;
}

export interface DailyGoal {
  id: string;
  organizationId?: string;
  userId?: string;
  title: string;
  date: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FocusSession {
  id: string;
  title: string;
  minutes: number;
  date: string;
}

/** A badge earned from the person's own records; its words come from `badges.items.<id>`. */
export interface Badge {
  id: string;
  title?: string;
  description?: string;
  earned: boolean;
  current?: number;
  target?: number;
}
