import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from './Modal'
import type { Project } from '../types'
import type { ProjectInput } from '../store/appStore'

interface ProjectFormModalProps {
  initial?: Project
  onClose: () => void
  onSave: (input: ProjectInput) => void
}

export function ProjectFormModal({ initial, onClose, onSave }: ProjectFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Укажите название проекта')
      return
    }
    onSave({ name, description })
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Редактирование проекта' : 'Новый проект'}
      onClose={onClose}
      titleId="project-form-title"
    >
      <form className="modal__body form" onSubmit={submit} noValidate>
        <div className="form__field">
          <label className="form__label" htmlFor="project-name">
            Название <span className="form__required">*</span>
          </label>
          <input
            id="project-name"
            className={`input ${error ? 'input--invalid' : ''}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
            placeholder="Например, Редизайн сайта"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'project-name-error' : undefined}
            autoFocus
          />
          {error ? (
            <p className="form__error" id="project-name-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="project-description">
            Описание
          </label>
          <textarea
            id="project-description"
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Коротко о цели проекта (необязательно)"
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
