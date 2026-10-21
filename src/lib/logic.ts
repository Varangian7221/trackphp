import type { DueFilter, Project, Task, TaskQuery, TaskStatus } from '../types'

/** Текущая дата в формате YYYY-MM-DD (локальная). */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nowISO(date: Date = new Date()): string {
  return date.toISOString()
}

export function isOverdue(task: Task, today: string = todayISO()): boolean {
  if (task.status === 'done') return false
  if (!task.dueDate) return false
  return task.dueDate < today
}

/** Прогресс проекта в процентах. Для проекта без задач — 0%. */
export function projectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 }
  for (const task of tasks) {
    if (task.status in counts) counts[task.status] += 1
  }
  return counts
}

export interface OverviewStats {
  total: number
  todo: number
  inProgress: number
  done: number
  overdue: number
}

export function overviewStats(
  tasks: Task[],
  today: string = todayISO(),
): OverviewStats {
  const counts = countByStatus(tasks)
  return {
    total: tasks.length,
    todo: counts.todo,
    inProgress: counts.in_progress,
    done: counts.done,
    overdue: tasks.filter((t) => isOverdue(t, today)).length,
  }
}

/** Поиск по названию и описанию без учёта регистра. */
export function matchesSearch(task: Task, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return (
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q)
  )
}

function isWithinWeek(dueDate: string, today: string): boolean {
  const due = new Date(`${dueDate}T00:00:00`)
  const base = new Date(`${today}T00:00:00`)
  const diffDays = Math.round((due.getTime() - base.getTime()) / 86_400_000)
  return diffDays >= 0 && diffDays <= 7
}

export function matchesDue(task: Task, due: DueFilter, today: string): boolean {
  switch (due) {
    case 'all':
      return true
    case 'none':
      return !task.dueDate
    case 'overdue':
      return isOverdue(task, today)
    case 'today':
      return Boolean(task.dueDate) && task.dueDate === today
    case 'week':
      return task.dueDate !== null && isWithinWeek(task.dueDate, today)
  }
}

/** Комбинация поиска, фильтров и сортировки. */
export function applyTaskQuery(
  tasks: Task[],
  query: TaskQuery,
  today: string = todayISO(),
): Task[] {
  const filtered = tasks.filter((task) => {
    if (!matchesSearch(task, query.search)) return false
    if (query.projectId !== 'all' && task.projectId !== query.projectId) return false
    if (query.status !== 'all' && task.status !== query.status) return false
    return matchesDue(task, query.due, today)
  })
  return sortTasks(filtered, query.sort)
}

export function sortTasks(tasks: Task[], sort: TaskQuery['sort']): Task[] {
  const copy = [...tasks]
  if (sort === 'title') {
    copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    return copy
  }
  const dir = sort === 'due_asc' ? 1 : -1
  copy.sort((a, b) => {
    // Задачи без срока всегда в конце списка.
    if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title, 'ru')
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    if (a.dueDate === b.dueDate) return a.title.localeCompare(b.title, 'ru')
    return a.dueDate < b.dueDate ? -dir : dir
  })
  return copy
}

/** Незавершённые задачи с ближайшим дедлайном (без просроченных и без срока). */
export function upcomingDeadlines(
  tasks: Task[],
  limit = 5,
  today: string = todayISO(),
): Task[] {
  return tasks
    .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate >= today)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0))
    .slice(0, limit)
}

export function overdueTasks(tasks: Task[], today: string = todayISO()): Task[] {
  return tasks
    .filter((t) => isOverdue(t, today))
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
}

/**
 * Обновление статуса задачи с учётом completedAt:
 * «Выполнена» фиксирует момент завершения, любой другой статус сбрасывает его.
 */
export function applyStatus(task: Task, status: TaskStatus, now = nowISO()): Task {
  if (task.status === status) return task
  return {
    ...task,
    status,
    completedAt: status === 'done' ? now : null,
    updatedAt: now,
  }
}

export function projectTaskIds(projects: Project[], tasks: Task[]): string[] {
  const ids = new Set(projects.map((p) => p.id))
  return tasks.filter((t) => ids.has(t.projectId)).map((t) => t.id)
}
