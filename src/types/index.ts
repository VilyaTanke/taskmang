export enum Role {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  EMPLOYEE = 'EMPLOYEE'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export enum Shift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  positionId: string;
  position?: Position;
  tasksDone?: Task[];
}

export interface Position {
  id: string;
  name: string;
  users?: User[];
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  positionId: string;
  position?: Position;
  shift: Shift;
  completedById?: string;
  completedBy?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  dueDate: Date;
  positionId: string;
  shift: Shift;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date;
  positionId?: string;
  shift?: Shift;
  completedById?: string;
}

export interface TaskFilters {
  positionId?: string;
  status?: TaskStatus;
  shift?: Shift;
  startDate?: Date;
  endDate?: Date;
}

export interface EmployeeRanking {
  id: string;
  name: string;
  position: string;
  shift: Shift;
  tasksCompleted: number;
  totalTasks: number;
}

export enum CardType {
  MASTERCARD_MOEVE_GOW_BANKINTER = 'MASTERCARD_MOEVE_GOW_BANKINTER',
  MOEVE_PRO = 'MOEVE_PRO',
  MOEVE_GOW = 'MOEVE_GOW'
}

export interface CardRecord {
  id: string;
  userId: string;
  positionId: string;
  cardType: CardType;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}