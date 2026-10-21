import { createContext, useContext } from 'react'
import type { AppState, Project, Task, TaskStatus } from '../types'

export interface ProjectInput {
  name: string
  description: string
}

export interface TaskInput {
  title: string
  description: string
  projectId: string
  status: TaskStatus
  dueDate: string | null
}

export interface AppContextValue {
  state: AppState
  createProject: (input: ProjectInput) => Project
  updateProject: (id: string, input: ProjectInput) => void
  deleteProject: (id: string) => void
  createTask: (input: TaskInput) => Task
  updateTask: (id: string, input: TaskInput) => void
  setTaskStatus: (id: string, status: TaskStatus) => void
  deleteTask: (id: string) => void
  clearDemoData: () => void
  seedDemoData: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp должен использоваться внутри AppProvider')
  return ctx
}
