import { describe, expect, it } from 'vitest'
import type { AppState } from '../types'
import { STORAGE_KEY, loadState, saveState } from './storage'
import type { StorageLike } from './storage'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>
} {
  const data: Record<string, string> = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

function validState(): AppState {
  return {
    projects: [
      {
        id: 'p1',
        name: 'Проект',
        description: 'Описание',
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-02T10:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 't1',
        title: 'Задача',
        description: 'Детали',
        projectId: 'p1',
        status: 'in_progress',
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-03T10:00:00.000Z',
        dueDate: '2026-11-01',
        completedAt: null,
      },
    ],
    demoSeeded: false,
  }
}

describe('saveState / loadState', () => {
  it('сохраняет и восстанавливает состояние без потерь', () => {
    const storage = memoryStorage()
    expect(saveState(validState(), storage)).toBe(true)
    expect(loadState(storage)).toEqual(validState())
  })

  it('отсутствие ключа возвращает null', () => {
    expect(loadState(memoryStorage())).toBeNull()
  })

  it('некорректный JSON не роняет чтение', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{не json' })
    expect(loadState(storage)).toBeNull()
  })

  it('неправильная структура даёт пустое состояние вместо падения', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ projects: 'нет', tasks: 42 }) })
    expect(loadState(storage)).toEqual({ projects: [], tasks: [], demoSeeded: false })
  })

  it('полностью неожиданный тип данных отбрасывается', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify([1, 2, 3]) })
    expect(loadState(storage)).toBeNull()
  })

  it('некорректные записи отбрасываются, корректные сохраняются', () => {
    const raw = {
      projects: [
        { id: 'p1', name: 'Ок', description: '', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' },
        { id: '', name: 'Без id' },
        { id: 'p2', name: '   ' },
        null,
        5,
      ],
      tasks: [
        {
          id: 't1',
          title: 'Ок',
          projectId: 'p1',
          status: 'done',
          createdAt: '2026-10-01T10:00:00.000Z',
          updatedAt: '2026-10-01T10:00:00.000Z',
          dueDate: '2026-10-10',
          completedAt: '2026-10-05T10:00:00.000Z',
        },
        { id: 't2', title: 'Сирота', projectId: 'p-нет' },
        { id: 't3', title: 'С статусом-мусором', projectId: 'p1', status: 'zzz', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z', dueDate: 'некорректно' },
        { id: 't4' },
      ],
      demoSeeded: 'да',
    }
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(raw) })
    const loaded = loadState(storage)

    expect(loaded).not.toBeNull()
    expect(loaded!.projects.map((p) => p.id)).toEqual(['p1'])
    expect(loaded!.tasks.map((t) => t.id)).toEqual(['t1', 't3'])
    expect(loaded!.demoSeeded).toBe(false)

    const restored = loaded!.tasks[1]
    // Неизвестный статус нормализуется, некорректный срок очищается.
    expect(restored.status).toBe('todo')
    expect(restored.dueDate).toBeNull()
    expect(restored.completedAt).toBeNull()
  })

  it('completedAt сохраняется только у выполненных задач', () => {
    const raw = {
      projects: [{ id: 'p1', name: 'P', description: '', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' }],
      tasks: [
        {
          id: 't1',
          title: 'Задача',
          projectId: 'p1',
          status: 'todo',
          createdAt: '2026-10-01T10:00:00.000Z',
          updatedAt: '2026-10-01T10:00:00.000Z',
          dueDate: null,
          completedAt: '2026-10-05T10:00:00.000Z',
        },
      ],
    }
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(raw) })
    expect(loadState(storage)!.tasks[0].completedAt).toBeNull()
  })

  it('возвращается false, если хранилище недоступно или переполнено', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
      removeItem: () => {},
    }
    expect(loadState(broken)).toBeNull()
    expect(saveState(validState(), broken)).toBe(false)
    expect(saveState(validState(), null)).toBe(false)
    expect(loadState(null)).toBeNull()
  })
})
