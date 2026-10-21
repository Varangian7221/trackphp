import { useState } from 'react'
import { ClipboardList, Eye, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../store/appStore'
import { useToast } from '../store/toastStore'
import type { Project } from '../types'
import { projectProgress, todayISO } from '../lib/logic'
import { formatDateTime } from '../lib/format'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'

interface ProjectsProps {
  onOpenCreate: () => void
  onOpenEdit: (project: Project) => void
  onViewTasks: (project: Project) => void
}

export function Projects({ onOpenCreate, onOpenEdit, onViewTasks }: ProjectsProps) {
  const { state, deleteProject } = useApp()
  const { notify } = useToast()
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)

  const relatedTasks = (project: Project) =>
    state.tasks.filter((task) => task.projectId === project.id)

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Проекты</h1>
          <p className="page__subtitle">Всего проектов: {state.projects.length}</p>
        </div>
        <div className="page__actions">
          <button type="button" className="button button--primary" onClick={onOpenCreate}>
            <FolderPlus size={16} aria-hidden="true" />
            Новый проект
          </button>
        </div>
      </div>

      {state.projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="Проектов пока нет"
            description="Создайте первый проект — задачи всегда принадлежат какому-либо проекту."
            action={
              <button type="button" className="button button--primary" onClick={onOpenCreate}>
                <FolderPlus size={16} aria-hidden="true" />
                Создать проект
              </button>
            }
          />
        </div>
      ) : (
        <div className="project-grid">
          {state.projects.map((project) => {
            const tasks = relatedTasks(project)
            const done = tasks.filter((t) => t.status === 'done').length
            const percent = projectProgress(tasks)
            const overdueCount = tasks.filter(
              (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayISO(),
            ).length

            return (
              <article key={project.id} className="card project-card">
                <div className="project-card__head">
                  <h2 className="project-card__name">{project.name}</h2>
                  <div className="project-card__actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => onViewTasks(project)}
                      aria-label={`Открыть задачи проекта ${project.name}`}
                      title="Задачи проекта"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => onOpenEdit(project)}
                      aria-label={`Редактировать проект ${project.name}`}
                      title="Редактировать"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => setPendingDelete(project)}
                      aria-label={`Удалить проект ${project.name}`}
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="project-card__description">
                  {project.description || 'Без описания'}
                </p>

                <div className="project-card__progress">
                  <div className="project-card__progress-meta">
                    <span>
                      {done} из {tasks.length} задач выполнено
                    </span>
                    <span className="project-card__percent">{percent}%</span>
                  </div>
                  <ProgressBar value={percent} label={`Прогресс проекта ${project.name}`} />
                  <p className="project-card__hint">
                    {tasks.length === 0
                      ? 'Прогресс: 0% — у проекта пока нет задач'
                      : overdueCount > 0
                        ? `Просрочено задач: ${overdueCount}`
                        : 'Просроченных задач нет'}
                  </p>
                </div>

                <p className="project-card__dates">
                  Обновлён: {formatDateTime(project.updatedAt)}
                </p>

                <div className="project-card__footer">
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    onClick={() => onViewTasks(project)}
                  >
                    <Eye size={15} aria-hidden="true" />
                    Задачи проекта
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Удалить проект?"
          confirmLabel="Удалить проект"
          message={
            <>
              <p>
                Проект <strong>«{pendingDelete.name}»</strong> будет удалён безвозвратно.
              </p>
              {relatedTasks(pendingDelete).length > 0 ? (
                <p className="confirm__warning">
                  Внимание: с проектом связано задач:{' '}
                  <strong>{relatedTasks(pendingDelete).length}</strong>. Все они будут удалены
                  вместе с проектом, чтобы не осталось задач без проекта.
                </p>
              ) : (
                <p className="confirm__warning">Связанных задач у проекта нет.</p>
              )}
            </>
          }
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const project = pendingDelete
            const count = relatedTasks(project).length
            setPendingDelete(null)
            deleteProject(project.id)
            notify(
              count > 0
                ? `Проект и связанные задачи (${count}) удалены`
                : 'Проект удалён',
            )
          }}
        />
      ) : null}
    </div>
  )
}
