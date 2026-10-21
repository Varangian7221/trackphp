import { describe, expect, it } from 'vitest'
import type { AppState, Project, Task } from '../types'
import { initialState, reducer } from './reducer'
import type { Action } from './reducer'
import { STORAGE_KEY } from './storage'
import type { StorageLike } from './storage'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Проект',
    description: 'Описание',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Задача',
    description: '',
    projectId: 'p1',
    status: 'todo',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    dueDate: null,
    completedAt: null,
    ...overrides,
  }
}

function makeState(): AppState {
  return {
    projects: [makeProject(), makeProject({ id: 'p2', name: 'Второй' })],
    tasks: [
      makeTask(),
      makeTask({ id: 't2', projectId: 'p2' }),
      makeTask({ id: 't3', projectId: 'p1', status: 'done', completedAt: '2026-10-05T10:00:00.000Z' }),
    ],
    demoSeeded: false,
  }
}

function run(state: AppState, action: Action): AppState {
  return reducer(state, action)
}

describe('reducer: проекты', () => {
  it('создание проекта добавляет его в список', () => {
    const project = makeProject({ id: 'p3', name: 'Новый' })
    const next = run(makeState(), { type: 'project/create', project })
    expect(next.projects).toHaveLength(3)
    expect(next.projects[0].id).toBe('p3')
  })

  it('обновление проекта меняет имя, описание и updatedAt', () => {
    const next = run(makeState(), {
      type: 'project/update',
      id: 'p1',
      name: 'Переименован',
      description: 'Новое описание',
      updatedAt: '2026-10-20T10:00:00.000Z',
    })
    const updated = next.projects.find((p) => p.id === 'p1')!
    expect(updated.name).toBe('Переименован')
    expect(updated.description).toBe('Новое описание')
    expect(updated.updatedAt).toBe('2026-10-20T10:00:00.000Z')
  })

  it('удаление проекта удаляет и его задачи (нет осиротевших записей)', () => {
    const next = run(makeState(), { type: 'project/delete', id: 'p1' })
    expect(next.projects.map((p) => p.id)).toEqual(['p2'])
    expect(next.tasks.map((t) => t.id)).toEqual(['t2'])
    expect(next.tasks.every((t) => next.projects.some((p) => p.id === t.projectId))).toBe(true)
  })

  it('удаление несуществующего проекта не меняет состояние', () => {
    const state = makeState()
    expect(run(state, { type: 'project/delete', id: 'нет' })).toEqual(state)
  })
})

describe('reducer: задачи', () => {
  it('перевод в «Выполнена» фиксирует completedAt', () => {
    const next = run(makeState(), {
      type: 'task/status',
      id: 't1',
      status: 'done',
    })
    const task = next.tasks.find((t) => t.id === 't1')!
    expect(task.status).toBe('done')
    expect(task.completedAt).not.toBeNull()
  })

  it('возврат в незавершённый статус сбрасывает completedAt', () => {
    const next = run(makeState(), {
      type: 'task/status',
      id: 't3',
      status: 'todo',
    })
    expect(next.tasks.find((t) => t.id === 't3')!.completedAt).toBeNull()
  })

  it('обновление задачи сохраняет createdAt и меняет остальные поля', () => {
    const next = run(makeState(), {
      type: 'task/update',
      id: 't1',
      patch: {
        title: 'Новое название',
        description: 'Новое описание',
        projectId: 'p2',
        status: 'in_progress',
        updatedAt: '2026-10-19T10:00:00.000Z',
        dueDate: '2026-12-01',
        completedAt: null,
      },
    })
    const task = next.tasks.find((t) => t.id === 't1')!
    expect(task.title).toBe('Новое название')
    expect(task.projectId).toBe('p2')
    expect(task.dueDate).toBe('2026-12-01')
    expect(task.createdAt).toBe('2026-10-01T10:00:00.000Z')
  })

  it('удаление задачи убирает её из списка', () => {
    const next = run(makeState(), { type: 'task/delete', id: 't2' })
    expect(next.tasks.map((t) => t.id)).toEqual(['t1', 't3'])
  })
})

describe('initialState — первый запуск и повреждённые данные', () => {
  function storageWith(value: string | null): StorageLike {
    return {
      getItem: () => value,
      setItem: () => {},
      removeItem: () => {},
    }
  }

  it('без сохранённых данных загружается демо-набор', () => {
    const state = initialState(null)
    expect(state.demoSeeded).toBe(true)
    expect(state.projects.length).toBeGreaterThan(0)
    expect(state.tasks.length).toBeGreaterThan(0)
  })

  it('нечитаемые данные не подсовывают демо — состояние пустое', () => {
    const state = initialState(storageWith('{{повреждено'))
    expect(state).toEqual({ projects: [], tasks: [], demoSeeded: false })
  })

  it('валидные данные восстанавливаются', () => {
    const saved: AppState = {
      projects: [makeProject({ id: 'kept' })],
      tasks: [makeTask({ id: 'kept-task', projectId: 'kept' })],
      demoSeeded: false,
    }
    const state = initialState(storageWith(JSON.stringify(saved)))
    expect(state.projects.map((p) => p.id)).toEqual(['kept'])
    expect(state.tasks.map((t) => t.id)).toEqual(['kept-task'])
  })

  it('hasStoredData отличает первый запуск от наличия ключа', () => {
    const empty: StorageLike = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    const filled: StorageLike = {
      getItem: (k) => (k === STORAGE_KEY ? 'мусор' : null),
      setItem: () => {},
      removeItem: () => {},
    }
    expect(initialState(empty).demoSeeded).toBe(true)
    expect(initialState(filled).demoSeeded).toBe(false)
  })
})

describe('reducer: демо-данные', () => {
  const demoState: AppState = {
    projects: [
      makeProject({ id: 'demo-p1', name: 'Демо 1' }),
      makeProject({ id: 'my-p', name: 'Мой' }),
    ],
    tasks: [
      makeTask({ id: 'demo-t1', projectId: 'demo-p1' }),
      makeTask({ id: 'my-t', projectId: 'my-p' }),
      makeTask({ id: 'my-t-inside-demo', projectId: 'demo-p1' }),
    ],
    demoSeeded: true,
  }

  it('очистка демо удаляет демо-проекты, их задачи и сохраняет свои записи', () => {
    const next = run(demoState, { type: 'data/clear-demo' })
    expect(next.projects.map((p) => p.id)).toEqual(['my-p'])
    expect(next.tasks.map((t) => t.id)).toEqual(['my-t'])
    expect(next.demoSeeded).toBe(false)
  })

  it('повторная загрузка демо не дублирует данные', () => {
    const next = run(demoState, { type: 'data/seed-demo' })
    expect(next).toEqual(demoState)
  })

  it('демо загружается только в пустое состояние', () => {
    const empty: AppState = { projects: [], tasks: [], demoSeeded: false }
    const next = run(empty, { type: 'data/seed-demo' })
    expect(next.projects.length).toBeGreaterThan(0)
    expect(next.demoSeeded).toBe(true)
  })
})
