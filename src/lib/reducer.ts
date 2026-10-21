import type { AppState, Project, Task, TaskStatus } from '../types'
import { applyStatus } from './logic'
import { createDemoState, isDemoId } from './demo'
import { hasStoredData, loadState, saveState } from './storage'
import type { StorageLike } from './storage'

export type Action =
  | { type: 'project/create'; project: Project }
  | { type: 'project/update'; id: string; name: string; description: string; updatedAt: string }
  | { type: 'project/delete'; id: string }
  | { type: 'task/create'; task: Task }
  | { type: 'task/update'; id: string; patch: Partial<Task> }
  | { type: 'task/status'; id: string; status: TaskStatus }
  | { type: 'task/delete'; id: string }
  | { type: 'data/seed-demo' }
  | { type: 'data/clear-demo' }

export function initialState(storage?: StorageLike | null): AppState {
  const stored = loadState(storage)
  if (stored) return stored
  // Данные были записаны, но прочитать их не удалось (порча, чужой формат).
  // Не подсовываем демо-набор — начинаем с пустого состояния.
  if (hasStoredData(storage)) return { projects: [], tasks: [], demoSeeded: false }
  return createDemoState()
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'project/create':
      return { ...state, projects: [action.project, ...state.projects] }

    case 'project/update':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id
            ? { ...p, name: action.name, description: action.description, updatedAt: action.updatedAt }
            : p,
        ),
      }

    case 'project/delete':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        // Удаляем и связанные задачи, чтобы не оставалось осиротевших записей.
        tasks: state.tasks.filter((t) => t.projectId !== action.id),
      }

    case 'task/create':
      return { ...state, tasks: [action.task, ...state.tasks] }

    case 'task/update':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      }

    case 'task/status':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? applyStatus(t, action.status) : t)),
      }

    case 'task/delete':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }

    case 'data/seed-demo':
      if (state.projects.length > 0 || state.tasks.length > 0) return state
      return createDemoState()

    case 'data/clear-demo':
      return {
        projects: state.projects.filter((p) => !isDemoId(p.id)),
        tasks: state.tasks.filter(
          (t) => !isDemoId(t.id) && state.projects.some((p) => p.id === t.projectId && !isDemoId(p.id)),
        ),
        demoSeeded: false,
      }

    default:
      return state
  }
}

export { saveState }
