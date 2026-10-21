import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { Project, Task } from '../types'
import { createId } from '../lib/id'
import { nowISO } from '../lib/logic'
import { initialState, reducer, saveState } from '../lib/reducer'
import { AppContext } from './appStore'
import type { ProjectInput, TaskInput } from './appStore'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  // Каждое изменение состояния сохраняется в localStorage.
  useEffect(() => {
    saveState(state)
  }, [state])

  const createProject = useCallback((input: ProjectInput): Project => {
    const now = nowISO()
    const project: Project = {
      id: createId('prj'),
      name: input.name.trim(),
      description: input.description.trim(),
      createdAt: now,
      updatedAt: now,
    }
    dispatch({ type: 'project/create', project })
    return project
  }, [])

  const updateProject = useCallback((id: string, input: ProjectInput) => {
    dispatch({
      type: 'project/update',
      id,
      name: input.name.trim(),
      description: input.description.trim(),
      updatedAt: nowISO(),
    })
  }, [])

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'project/delete', id })
  }, [])

  const createTask = useCallback((input: TaskInput): Task => {
    const now = nowISO()
    const task: Task = {
      id: createId('tsk'),
      title: input.title.trim(),
      description: input.description.trim(),
      projectId: input.projectId,
      status: input.status,
      createdAt: now,
      updatedAt: now,
      dueDate: input.dueDate,
      completedAt: input.status === 'done' ? now : null,
    }
    dispatch({ type: 'task/create', task })
    return task
  }, [])

  const updateTask = useCallback(
    (id: string, input: TaskInput) => {
      const existing = state.tasks.find((t) => t.id === id)
      const now = nowISO()
      dispatch({
        type: 'task/update',
        id,
        patch: {
          title: input.title.trim(),
          description: input.description.trim(),
          projectId: input.projectId,
          status: input.status,
          updatedAt: now,
          dueDate: input.dueDate,
          // У уже завершённой задачи сохраняем момент завершения.
          completedAt: input.status === 'done' ? (existing?.completedAt ?? now) : null,
        },
      })
    },
    [state.tasks],
  )

  const setTaskStatus = useCallback((id: string, status: Task['status']) => {
    dispatch({ type: 'task/status', id, status })
  }, [])

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'task/delete', id })
  }, [])

  const clearDemoData = useCallback(() => {
    dispatch({ type: 'data/clear-demo' })
  }, [])

  const seedDemoData = useCallback(() => {
    dispatch({ type: 'data/seed-demo' })
  }, [])

  const value = useMemo(
    () => ({
      state,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      clearDemoData,
      seedDemoData,
    }),
    [
      state,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      clearDemoData,
      seedDemoData,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
