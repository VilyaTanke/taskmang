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
  plainPassword?: string; // Added for admin password viewing
  role: Role;
  positionIds: string[]; // Changed from positionId to positionIds array
  positions?: Position[]; // Changed from position to positions array
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
  shift: Shift;
  completedById?: string;
  completedLate?: boolean; // New field to track if task was completed after due date
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
  completedLate?: boolean;
}

export interface TaskFilters {
  positionId: string;
  status: string;
  shift: string;
  date?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  plainPassword?: string; // Added for admin password viewing
  role: Role;
  positionIds: string[]; // Changed from positionId to positionIds array
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  plainPassword?: string; // Added for admin password viewing
  role?: Role;
  positionIds?: string[]; // Changed from positionId to positionIds array
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