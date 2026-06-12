export interface Department {
  id: string;
  name: string;
  manager: string;
  memberCount: number;
  focusArea: string;
}

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  departmentId: string;
  position: string;
  active: boolean;
}
