export type TaskStatus = 'todo' | 'in_progress' | 'done'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Выполнена',
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
  /** Дата в формате YYYY-MM-DD либо null, если срок не задан. */
  dueDate: string | null
  completedAt: string | null
}

export interface AppState {
  projects: Project[]
  tasks: Task[]
  /** Демо-набор данных был загружен и ещё не удалён пользователем. */
  demoSeeded: boolean
}

export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'none'
export type TaskSort = 'due_asc' | 'due_desc' | 'title'

export interface TaskQuery {
  search: string
  projectId: string | 'all'
  status: TaskStatus | 'all'
  due: DueFilter
  sort: TaskSort
}

export const EMPTY_QUERY: TaskQuery = {
  search: '',
  projectId: 'all',
  status: 'all',
  due: 'all',
  sort: 'due_asc',
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'in_progress' || value === 'done'
}
