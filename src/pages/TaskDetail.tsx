import { useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckSquare, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../store/appStore'
import { useToast } from '../store/toastStore'
import type { Task, TaskStatus } from '../types'
import { STATUS_LABELS, STATUS_ORDER } from '../types'
import { isOverdue, todayISO } from '../lib/logic'
import { formatDateTime, formatDueDate } from '../lib/format'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'

interface TaskDetailProps {
  taskId: string
  onBack: () => void
  onOpenEdit: (task: Task) => void
}

export function TaskDetail({ taskId, onBack, onOpenEdit }: TaskDetailProps) {
  const { state, setTaskStatus, deleteTask } = useApp()
  const { notify } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const task = state.tasks.find((item) => item.id === taskId) ?? null
  const today = todayISO()

  if (!task) {
    return (
      <div className="page">
        <button type="button" className="button button--ghost" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          К списку задач
        </button>
        <div className="card" style={{ marginTop: '1rem' }}>
          <EmptyState
            icon={CheckSquare}
            title="Задача не найдена"
            description="Возможно, она была удалена."
            action={
              <button type="button" className="button button--primary" onClick={onBack}>
                Вернуться к списку
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const project = state.projects.find((p) => p.id === task.projectId) ?? null
  const overdue = isOverdue(task, today)

  const changeStatus = (status: TaskStatus) => {
    if (status === task.status) return
    setTaskStatus(task.id, status)
    notify(`Статус: «${STATUS_LABELS[status]}»`)
  }

  return (
    <div className="page">
      <button type="button" className="button button--ghost" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        К списку задач
      </button>

      <article className="card task-detail">
        <div className="task-detail__head">
          <div>
            <p className="task-detail__project">
              {project ? project.name : 'Проект не найден'}
            </p>
            <h1 className="task-detail__title">{task.title}</h1>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {overdue ? (
          <p className="task-detail__overdue" role="alert">
            <AlertTriangle size={17} aria-hidden="true" />
            Срок прошёл: {formatDueDate(task.dueDate, today)}
          </p>
        ) : null}

        <section className="task-detail__section" aria-labelledby="status-heading">
          <h2 className="task-detail__heading" id="status-heading">
            Статус
          </h2>
          <div className="segmented" role="group" aria-label="Изменить статус задачи">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                className={`segmented__item ${
                  task.status === status ? 'segmented__item--active' : ''
                }`}
                onClick={() => changeStatus(status)}
                aria-pressed={task.status === status}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </section>

        <section className="task-detail__section" aria-labelledby="fields-heading">
          <h2 className="task-detail__heading" id="fields-heading">
            Детали
          </h2>
          <dl className="details">
            <div className="details__row">
              <dt>Проект</dt>
              <dd>{project ? project.name : '—'}</dd>
            </div>
            <div className="details__row">
              <dt>Срок</dt>
              <dd className={overdue ? 'text-overdue' : ''}>
                {formatDueDate(task.dueDate, today)}
                {overdue ? ' (просрочено)' : ''}
              </dd>
            </div>
            <div className="details__row">
              <dt>Создана</dt>
              <dd>{formatDateTime(task.createdAt)}</dd>
            </div>
            <div className="details__row">
              <dt>Обновлена</dt>
              <dd>{formatDateTime(task.updatedAt)}</dd>
            </div>
            <div className="details__row">
              <dt>Завершена</dt>
              <dd>{task.completedAt ? formatDateTime(task.completedAt) : '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="task-detail__section" aria-labelledby="description-heading">
          <h2 className="task-detail__heading" id="description-heading">
            Описание
          </h2>
          <p className="task-detail__description">
            {task.description || 'Без описания'}
          </p>
        </section>

        <div className="task-detail__actions">
          <button type="button" className="button button--ghost" onClick={() => onOpenEdit(task)}>
            <Pencil size={16} aria-hidden="true" />
            Редактировать
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} aria-hidden="true" />
            Удалить
          </button>
        </div>
      </article>

      {confirmDelete ? (
        <ConfirmDialog
          title="Удалить задачу?"
          confirmLabel="Удалить задачу"
          message={
            <>
              Задача <strong>«{task.title}»</strong> будет удалена безвозвратно.
            </>
          }
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false)
            deleteTask(task.id)
            notify('Задача удалена')
            onBack()
          }}
        />
      ) : null}
    </div>
  )
}
