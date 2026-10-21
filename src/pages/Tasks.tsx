import { Check, FolderPlus, ListX, Pencil, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useApp } from '../store/appStore'
import { useToast } from '../store/toastStore'
import type { Task, TaskQuery } from '../types'
import { EMPTY_QUERY, STATUS_LABELS, STATUS_ORDER } from '../types'
import { applyTaskQuery, isOverdue, todayISO } from '../lib/logic'
import { formatDueDate } from '../lib/format'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'

interface TasksProps {
  query: TaskQuery
  onQueryChange: (query: TaskQuery) => void
  onResetQuery: () => void
  onOpenCreate: (presetProjectId?: string) => void
  onOpenEdit: (task: Task) => void
  onSelectTask: (id: string) => void
  onOpenCreateProject: () => void
}

export function Tasks({
  query,
  onQueryChange,
  onResetQuery,
  onOpenCreate,
  onOpenEdit,
  onSelectTask,
  onOpenCreateProject,
}: TasksProps) {
  const { state, setTaskStatus } = useApp()
  const { notify } = useToast()
  const today = todayISO()

  const results = applyTaskQuery(state.tasks, query, today)
  const isFiltered =
    query.search !== EMPTY_QUERY.search ||
    query.projectId !== EMPTY_QUERY.projectId ||
    query.status !== EMPTY_QUERY.status ||
    query.due !== EMPTY_QUERY.due ||
    query.sort !== EMPTY_QUERY.sort

  const projectById = new Map(state.projects.map((p) => [p.id, p]))
  const hasAnyData = state.projects.length > 0 || state.tasks.length > 0

  const patch = (part: Partial<TaskQuery>) => onQueryChange({ ...query, ...part })

  const toggleStatus = (task: Task) => {
    if (task.status === 'done') {
      setTaskStatus(task.id, 'in_progress')
      notify(`«${task.title}» — снова в работе`)
    } else {
      setTaskStatus(task.id, 'done')
      notify(`«${task.title}» — выполнена`)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Все задачи</h1>
          <p className="page__subtitle">
            Показано задач: {results.length} из {state.tasks.length}
          </p>
        </div>
        <div className="page__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => onOpenCreate()}
            disabled={state.projects.length === 0}
            title={
              state.projects.length === 0 ? 'Сначала создайте проект' : 'Создать задачу'
            }
          >
            <Plus size={16} aria-hidden="true" />
            Новая задача
          </button>
        </div>
      </div>

      <section className="card filters" aria-label="Поиск и фильтры">
        <div className="filters__search">
          <Search size={16} aria-hidden="true" />
          <label className="visually-hidden" htmlFor="task-search">
            Поиск по названию и описанию…
          </label>
          <input
            id="task-search"
            type="search"
            className="input filters__input"
            placeholder="Поиск по названию и описанию…"
            value={query.search}
            onChange={(event) => patch({ search: event.target.value })}
          />
        </div>

        <div className="filters__row">
          <div className="filters__control">
            <label className="filters__label" htmlFor="filter-project">
              Проект
            </label>
            <select
              id="filter-project"
              className="select"
              value={query.projectId}
              onChange={(event) => patch({ projectId: event.target.value as TaskQuery['projectId'] })}
            >
              <option value="all">Все проекты</option>
              {state.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filters__control">
            <label className="filters__label" htmlFor="filter-status">
              Статус
            </label>
            <select
              id="filter-status"
              className="select"
              value={query.status}
              onChange={(event) => patch({ status: event.target.value as TaskQuery['status'] })}
            >
              <option value="all">Все статусы</option>
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="filters__control">
            <label className="filters__label" htmlFor="filter-due">
              Срок
            </label>
            <select
              id="filter-due"
              className="select"
              value={query.due}
              onChange={(event) => patch({ due: event.target.value as TaskQuery['due'] })}
            >
              <option value="all">Любой срок</option>
              <option value="overdue">Просроченные</option>
              <option value="today">Сегодня</option>
              <option value="week">Ближайшие 7 дней</option>
              <option value="none">Без срока</option>
            </select>
          </div>

          <div className="filters__control">
            <label className="filters__label" htmlFor="filter-sort">
              Сортировка
            </label>
            <select
              id="filter-sort"
              className="select"
              value={query.sort}
              onChange={(event) => patch({ sort: event.target.value as TaskQuery['sort'] })}
            >
              <option value="due_asc">По дедлайну: сначала ближайшие</option>
              <option value="due_desc">По дедлайну: сначала поздние</option>
              <option value="title">По названию</option>
            </select>
          </div>

          <button
            type="button"
            className="button button--ghost filters__reset"
            onClick={onResetQuery}
            disabled={!isFiltered}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Сбросить фильтры
          </button>
        </div>
      </section>

      {!hasAnyData ? (
        <div className="card">
          <EmptyState
            icon={FolderPlus}
            title="Начните с проекта"
            description="Задачи привязаны к проектам. Создайте проект, а затем задачу."
            action={
              <button type="button" className="button button--primary" onClick={onOpenCreateProject}>
                <FolderPlus size={16} aria-hidden="true" />
                Создать проект
              </button>
            }
          />
        </div>
      ) : results.length === 0 ? (
        <div className="card">
          {state.tasks.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Задач пока нет"
              description="Создайте первую задачу — она сразу появится в этом списке."
              action={
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => onOpenCreate()}
                  disabled={state.projects.length === 0}
                >
                  <Plus size={16} aria-hidden="true" />
                  Создать задачу
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={ListX}
              title="Ничего не найдено"
              description="По заданным условиям поиска и фильтров задач нет."
              action={
                <button type="button" className="button button--ghost" onClick={onResetQuery}>
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Сбросить фильтры
                </button>
              }
            />
          )}
        </div>
      ) : (
        <ul className="task-list">
          {results.map((task) => {
            const overdue = isOverdue(task, today)
            const project = projectById.get(task.projectId)
            return (
              <li
                key={task.id}
                className={`task-row ${overdue ? 'task-row--overdue' : ''} ${
                  task.status === 'done' ? 'task-row--done' : ''
                }`}
              >
                <button
                  type="button"
                  className={`task-row__check ${task.status === 'done' ? 'task-row__check--done' : ''}`}
                  onClick={() => toggleStatus(task)}
                  aria-label={
                    task.status === 'done'
                      ? `Вернуть в работу задачу «${task.title}»`
                      : `Отметить выполненной задачу «${task.title}»`
                  }
                  title={
                    task.status === 'done' ? 'Вернуть в работу' : 'Отметить выполненной'
                  }
                >
                  <Check size={15} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="task-row__body"
                  onClick={() => onSelectTask(task.id)}
                >
                  <span className="task-row__title">{task.title}</span>
                  <span className="task-row__meta">
                    <span>{project?.name ?? 'Проект удалён'}</span>
                    <span aria-hidden="true">·</span>
                    <span className={overdue ? 'text-overdue' : ''}>
                      {overdue ? 'Просрочено: ' : ''}
                      {formatDueDate(task.dueDate, today)}
                    </span>
                  </span>
                </button>

                <div className="task-row__side">
                  <StatusBadge status={task.status} />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onOpenEdit(task)}
                    aria-label={`Редактировать задачу «${task.title}»`}
                    title="Редактировать"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
