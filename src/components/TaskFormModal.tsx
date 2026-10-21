import { useState } from 'react'
import type { FormEvent } from 'react'
import { FolderPlus } from 'lucide-react'
import { Modal } from './Modal'
import { STATUS_LABELS, STATUS_ORDER } from '../types'
import type { Project, Task } from '../types'
import type { TaskInput } from '../store/appStore'

interface TaskFormModalProps {
  projects: Project[]
  initial?: Task
  presetProjectId?: string
  onClose: () => void
  onSave: (input: TaskInput) => void
  onCreateProject: () => void
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function TaskFormModal({
  projects,
  initial,
  presetProjectId,
  onClose,
  onSave,
  onCreateProject,
}: TaskFormModalProps) {
  const firstProjectId = projects[0]?.id ?? ''
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? presetProjectId ?? firstProjectId,
  )
  const [status, setStatus] = useState(initial?.status ?? 'todo')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [errors, setErrors] = useState<{ title?: string; projectId?: string; dueDate?: string }>({})

  if (projects.length === 0) {
    return (
      <Modal title="Новая задача" onClose={onClose} titleId="task-form-title">
        <div className="modal__body empty">
          <span className="empty__icon" aria-hidden="true">
            <FolderPlus size={26} />
          </span>
          <p className="empty__title">Сначала создайте проект</p>
          <p className="empty__description">
            Задача должна быть связана с существующим проектом.
          </p>
          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Отмена
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                onClose()
                onCreateProject()
              }}
            >
              Создать проект
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!title.trim()) nextErrors.title = 'Укажите название задачи'
    if (!projects.some((p) => p.id === projectId)) nextErrors.projectId = 'Выберите проект'
    if (dueDate && !DATE_RE.test(dueDate)) nextErrors.dueDate = 'Некорректная дата'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSave({
      title,
      description,
      projectId,
      status,
      dueDate: dueDate || null,
    })
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Редактирование задачи' : 'Новая задача'}
      onClose={onClose}
      titleId="task-form-title"
    >
      <form className="modal__body form" onSubmit={submit} noValidate>
        <div className="form__field">
          <label className="form__label" htmlFor="task-title">
            Название <span className="form__required">*</span>
          </label>
          <input
            id="task-title"
            className={`input ${errors.title ? 'input--invalid' : ''}`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (errors.title) setErrors((e) => ({ ...e, title: undefined }))
            }}
            placeholder="Например, Согласовать макет главной"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'task-title-error' : undefined}
            autoFocus
          />
          {errors.title ? (
            <p className="form__error" id="task-title-error" role="alert">
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="form__grid">
          <div className="form__field">
            <label className="form__label" htmlFor="task-project">
              Проект <span className="form__required">*</span>
            </label>
            <select
              id="task-project"
              className={`select ${errors.projectId ? 'input--invalid' : ''}`}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              aria-invalid={Boolean(errors.projectId)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId ? (
              <p className="form__error" role="alert">
                {errors.projectId}
              </p>
            ) : null}
          </div>

          <div className="form__field">
            <label className="form__label" htmlFor="task-status">
              Статус
            </label>
            <select
              id="task-status"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            >
              {STATUS_ORDER.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="task-due">
            Срок
          </label>
          <input
            id="task-due"
            type="date"
            className={`input ${errors.dueDate ? 'input--invalid' : ''}`}
            value={dueDate}
            onChange={(event) => {
              setDueDate(event.target.value)
              if (errors.dueDate) setErrors((e) => ({ ...e, dueDate: undefined }))
            }}
            aria-describedby="task-due-hint"
          />
          <p className="form__hint" id="task-due-hint">
            Необязательно. Пустое поле означает «Без срока».
          </p>
          {errors.dueDate ? (
            <p className="form__error" role="alert">
              {errors.dueDate}
            </p>
          ) : null}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="task-description">
            Описание
          </label>
          <textarea
            id="task-description"
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Детали задачи (необязательно)"
            rows={3}
          />
        </div>

        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="button button--primary">
            {initial ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
