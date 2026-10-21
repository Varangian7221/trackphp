import type { AppState, Project, Task, TaskStatus } from '../types'
import { isTaskStatus } from '../types'

export const STORAGE_KEY = 'dela-v-poryadke:v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage as StorageLike
    }
  } catch {
    // Доступ к localStorage может быть запрещён (например, приватный режим).
    return null
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function readDate(value: unknown): string {
  return typeof value === 'string' && ISO_RE.test(value) ? value : new Date(0).toISOString()
}

function normalizeProject(value: unknown): Project | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const name = readString(value.name).trim()
  if (!id || !name) return null
  const createdAt = readDate(value.createdAt)
  const updatedAt = readDate(value.updatedAt)
  return {
    id,
    name,
    description: readString(value.description),
    createdAt,
    updatedAt: updatedAt < createdAt ? createdAt : updatedAt,
  }
}

function normalizeTask(value: unknown, projectIds: Set<string>): Task | null {
  if (!isRecord(value)) return null
  const id = readString(value.id)
  const title = readString(value.title).trim()
  const projectId = readString(value.projectId)
  if (!id || !title || !projectId) return null
  // Убираем осиротевшие записи: задача обязана ссылаться на существующий проект.
  if (!projectIds.has(projectId)) return null
  const status: TaskStatus = isTaskStatus(value.status) ? value.status : 'todo'
  const createdAt = readDate(value.createdAt)
  const updatedAt = readDate(value.updatedAt)
  const rawDue = value.dueDate
  const dueDate =
    typeof rawDue === 'string' && DATE_RE.test(rawDue) ? rawDue : null
  const completedAt =
    status === 'done'
      ? (readOptionalString(value.completedAt) ?? new Date(0).toISOString())
      : null
  return {
    id,
    title,
    description: readString(value.description),
    projectId,
    status,
    createdAt,
    updatedAt: updatedAt < createdAt ? createdAt : updatedAt,
    dueDate,
    completedAt,
  }
}

/**
 * Читает состояние из localStorage. Возвращает null, если данных нет
 * или сохранённые данные некорректны (некорректные записи отбрасываются).
 */
export function loadState(storage: StorageLike | null = defaultStorage()): AppState | null {
  if (!storage) return null
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : []
    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : []
    const projects = rawProjects
      .map(normalizeProject)
      .filter((p): p is Project => p !== null)
    const projectIds = new Set(projects.map((p) => p.id))
    const tasks = rawTasks
      .map((t) => normalizeTask(t, projectIds))
      .filter((t): t is Task => t !== null)
    return {
      projects,
      tasks,
      demoSeeded: parsed.demoSeeded === true,
    }
  } catch {
    return null
  }
}

/**
 * Есть ли сохранённые данные (даже если прочитать их не удалось).
 * Позволяет отличить первый запуск от повреждённого хранилища.
 */
export function hasStoredData(storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    return storage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export function saveState(
  state: AppState,
  storage: StorageLike | null = defaultStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projects: state.projects,
        tasks: state.tasks,
        demoSeeded: state.demoSeeded,
      }),
    )
    return true
  } catch {
    // Превышена квота или хранилище недоступно — приложение продолжает работать в памяти.
    return false
  }
}
