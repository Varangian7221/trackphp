import type { AppState, Project, Task } from '../types'

function shiftDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Демонстрационный набор: можно удалить одной кнопкой на «Обзоре». */
export function createDemoState(): AppState {
  const now = new Date().toISOString()

  const projects: Project[] = [
    {
      id: 'demo-project-site',
      name: 'Редизайн сайта',
      description: 'Обновление главной страницы и каталога компании.',
      createdAt: daysAgoISO(14),
      updatedAt: daysAgoISO(2),
    },
    {
      id: 'demo-project-app',
      name: 'Мобильное приложение',
      description: 'MVP приложения для заказа услуг.',
      createdAt: daysAgoISO(10),
      updatedAt: daysAgoISO(1),
    },
    {
      id: 'demo-project-empty',
      name: 'Внутренняя документация',
      description: 'Пока пустой проект — чтобы показать прогресс 0%.',
      createdAt: daysAgoISO(3),
      updatedAt: daysAgoISO(3),
    },
  ]

  const task = (
    id: string,
    title: string,
    projectId: string,
    status: Task['status'],
    dueDate: string | null,
    extra: Partial<Task> = {},
  ): Task => ({
    id,
    title,
    description: '',
    projectId,
    status,
    createdAt: daysAgoISO(7),
    updatedAt: now,
    dueDate,
    completedAt: status === 'done' ? daysAgoISO(2) : null,
    ...extra,
  })

  const tasks: Task[] = [
    task('demo-task-1', 'Согласовать структуру главной', 'demo-project-site', 'done', shiftDays(-2)),
    task('demo-task-2', 'Подготовить макеты баннеров', 'demo-project-site', 'done', shiftDays(-1)),
    task('demo-task-3', 'Сверстать страницу «О компании»', 'demo-project-site', 'in_progress', shiftDays(-1), {
      description: 'Адаптив для мобильных экранов обязателен.',
    }),
    task('demo-task-4', 'Написать тексты для каталога', 'demo-project-site', 'todo', shiftDays(2), {
      description: 'Короткие описания категорий и карточек товаров.',
    }),
    task('demo-task-5', 'Проверить формы обратной связи', 'demo-project-site', 'todo', null),
    task('demo-task-6', 'Спроектировать экран авторизации', 'demo-project-app', 'in_progress', shiftDays(1)),
    task('demo-task-7', 'Собрать прототип в Figma', 'demo-project-app', 'done', shiftDays(-4)),
    task('demo-task-8', 'Настроить сборку APK', 'demo-project-app', 'todo', shiftDays(5)),
    task('demo-task-9', 'Отправить прототип на тестирование', 'demo-project-app', 'todo', shiftDays(-3), {
      description: 'Срок уже прошёл — задача должна выглядеть просроченной.',
    }),
  ]

  return { projects, tasks, demoSeeded: true }
}

export function isDemoId(id: string): boolean {
  return id.startsWith('demo-')
}
