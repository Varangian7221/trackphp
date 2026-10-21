import { AlertTriangle, CalendarClock, CheckSquare, CircleDot, FolderPlus, Hourglass, Loader, ListChecks, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store/appStore'
import type { TaskQuery } from '../types'
import { overviewStats, overdueTasks, projectProgress, todayISO, upcomingDeadlines } from '../lib/logic'
import { formatDueDate, formatDateTime } from '../lib/format'
import { EmptyState } from '../components/EmptyState'

interface OverviewProps {
  onOpenTasks: (filters?: Partial<TaskQuery>) => void
  onOpenTask: (id: string) => void
  onOpenCreateTask: () => void
  onOpenCreateProject: () => void
  onClearDemo: () => void
}

export function Overview({
  onOpenTasks,
  onOpenTask,
  onOpenCreateTask,
  onOpenCreateProject,
  onClearDemo,
}: OverviewProps) {
  const { state } = useApp()
  const today = todayISO()
  const stats = overviewStats(state.tasks, today)
  const upcoming = upcomingDeadlines(state.tasks, 5, today)
  const overdue = overdueTasks(state.tasks, today)
  const projectById = new Map(state.projects.map((p) => [p.id, p]))
  const isEmpty = state.projects.length === 0 && state.tasks.length === 0
  const lastUpdated =
    [...state.tasks.map((t) => t.updatedAt), ...state.projects.map((p) => p.updatedAt)]
      .sort()
      .at(-1) ?? null

  const cards = [
    { label: 'Всего задач', value: stats.total, icon: ListChecks, tone: 'neutral' },
    { label: 'К выполнению', value: stats.todo, icon: CircleDot, tone: 'todo' },
    { label: 'В работе', value: stats.inProgress, icon: Loader, tone: 'in_progress' },
    { label: 'Выполнена', value: stats.done, icon: CheckSquare, tone: 'done' },
    { label: 'Просрочена', value: stats.overdue, icon: AlertTriangle, tone: 'overdue' },
  ]

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Обзор</h1>
          <p className="page__subtitle">
            {state.projects.length} проектов · {state.tasks.length} задач
          </p>
        </div>
        <div className="page__actions">
          <button type="button" className="button button--ghost" onClick={onOpenCreateProject}>
            <FolderPlus size={16} aria-hidden="true" />
            Новый проект
          </button>
          <button type="button" className="button button--primary" onClick={onOpenCreateTask}>
            <Plus size={16} aria-hidden="true" />
            Новая задача
          </button>
        </div>
      </div>

      {state.demoSeeded ? (
        <div className="banner" role="note">
          <div className="banner__text">
            <strong>Демо-данные.</strong> Показываем пример проектов и задач. Удалите их, чтобы
            начать работу со своими записями.
          </div>
          <button type="button" className="button button--ghost button--small" onClick={onClearDemo}>
            <Trash2 size={15} aria-hidden="true" />
            Удалить демо-данные
          </button>
        </div>
      ) : null}

      <section className="stats" aria-label="Сводка по задачам">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`stat stat--${tone}`}>
            <span className="stat__icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className="stat__value">{value}</span>
            <span className="stat__label">{label}</span>
          </div>
        ))}
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="upcoming-title">
          <div className="card__head">
            <h2 className="card__title" id="upcoming-title">
              <CalendarClock size={18} aria-hidden="true" />
              Ближайшие дедлайны
            </h2>
            <button
              type="button"
              className="link-button"
              onClick={() => onOpenTasks({ sort: 'due_asc' })}
            >
              Все задачи
            </button>
          </div>

          {isEmpty ? (
            <EmptyState
              icon={CalendarClock}
              title="Пока нет задач"
              description="Создайте первый проект и задачу, чтобы видеть дедлайны здесь."
            />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Ближайших дедлайнов нет"
              description="Незавершённых задач с назначенным сроком на сегодня и позже не найдено."
            />
          ) : (
            <ul className="deadline-list">
              {upcoming.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="deadline"
                    onClick={() => onOpenTask(task.id)}
                  >
                    <span className="deadline__main">
                      <span className="deadline__title">{task.title}</span>
                      <span className="deadline__project">
                        {projectById.get(task.projectId)?.name ?? 'Без проекта'}
                      </span>
                    </span>
                    <span className="deadline__due">{formatDueDate(task.dueDate, today)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="overdue-title">
          <div className="card__head">
            <h2 className="card__title" id="overdue-title">
              <AlertTriangle size={18} aria-hidden="true" />
              Просроченные
            </h2>
            {overdue.length > 0 ? (
              <button
                type="button"
                className="link-button"
                onClick={() => onOpenTasks({ due: 'overdue', sort: 'due_asc' })}
              >
                Показать все
              </button>
            ) : null}
          </div>

          {overdue.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Просроченных задач нет"
              description="Все незавершённые задачи в срок или без назначенного срока."
            />
          ) : (
            <ul className="deadline-list">
              {overdue.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="deadline deadline--overdue"
                    onClick={() => onOpenTask(task.id)}
                  >
                    <span className="deadline__main">
                      <span className="deadline__title">{task.title}</span>
                      <span className="deadline__project">
                        {projectById.get(task.projectId)?.name ?? 'Без проекта'}
                      </span>
                    </span>
                    <span className="deadline__due">{formatDueDate(task.dueDate, today)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="progress-title">
        <div className="card__head">
          <h2 className="card__title" id="progress-title">
            <Hourglass size={18} aria-hidden="true" />
            Прогресс проектов
          </h2>
          <button type="button" className="link-button" onClick={() => onOpenTasks()}>
            Все задачи
          </button>
        </div>

        {state.projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="Проектов пока нет"
            description="Создайте проект, чтобы отслеживать прогресс."
            action={
              <button type="button" className="button button--primary" onClick={onOpenCreateProject}>
                <FolderPlus size={16} aria-hidden="true" />
                Новый проект
              </button>
            }
          />
        ) : (
          <ul className="progress-list">
            {state.projects.map((project) => {
              const tasks = state.tasks.filter((t) => t.projectId === project.id)
              const done = tasks.filter((t) => t.status === 'done').length
              const percent = projectProgress(tasks)
              return (
                <li key={project.id} className="progress-list__item">
                  <span className="progress-list__name">{project.name}</span>
                  <span className="progress-list__meta">
                    {done} из {tasks.length} · {percent}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="quick-title">
        <div className="card__head">
          <h2 className="card__title" id="quick-title">
            <Plus size={18} aria-hidden="true" />
            Быстрые действия
          </h2>
        </div>
        <div className="quick-actions">
          <button type="button" className="button button--primary" onClick={onOpenCreateTask}>
            <Plus size={16} aria-hidden="true" />
            Создать задачу
          </button>
          <button type="button" className="button button--ghost" onClick={onOpenCreateProject}>
            <FolderPlus size={16} aria-hidden="true" />
            Создать проект
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onOpenTasks({ due: 'overdue' })}
          >
            <AlertTriangle size={16} aria-hidden="true" />
            Просроченные задачи
          </button>
        </div>
      </section>

      <p className="page__hint">Последнее обновление данных: {formatDateTime(lastUpdated)}</p>
    </div>
  )
}
