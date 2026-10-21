import { describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '../types'
import { EMPTY_QUERY } from '../types'
import {
  applyStatus,
  applyTaskQuery,
  countByStatus,
  isOverdue,
  matchesSearch,
  overviewStats,
  projectProgress,
  sortTasks,
  todayISO,
  upcomingDeadlines,
} from './logic'

const TODAY = '2026-10-21'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'tsk-1',
    title: 'Задача',
    description: '',
    projectId: 'prj-1',
    status: 'todo',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    dueDate: null,
    completedAt: null,
    ...overrides,
  }
}

describe('todayISO', () => {
  it('возвращает дату в формате YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(todayISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('isOverdue', () => {
  it('незавершённая задача с прошедшим сроком — просроченная', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-10-20' }), TODAY)).toBe(true)
  })

  it('срок сегодня — ещё не просрочена', () => {
    expect(isOverdue(makeTask({ dueDate: TODAY }), TODAY)).toBe(false)
  })

  it('срок в будущем — не просрочена', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-11-01' }), TODAY)).toBe(false)
  })

  it('выполненная задача с прошедшим сроком — не просроченная', () => {
    expect(
      isOverdue(makeTask({ status: 'done', dueDate: '2026-10-01' }), TODAY),
    ).toBe(false)
  })

  it('отсутствующий срок — не просроченная', () => {
    expect(isOverdue(makeTask({ dueDate: null }), TODAY)).toBe(false)
  })

  it('некорректный срок в данных не роняет проверку', () => {
    expect(isOverdue(makeTask({ dueDate: null }), TODAY)).toBe(false)
  })
})

describe('projectProgress', () => {
  it('проект без задач даёт 0%', () => {
    expect(projectProgress([])).toBe(0)
  })

  it('считает долю выполненных задач', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done' }),
      makeTask({ id: '2', status: 'done' }),
      makeTask({ id: '3', status: 'todo' }),
      makeTask({ id: '4', status: 'in_progress' }),
    ]
    expect(projectProgress(tasks)).toBe(50)
  })

  it('все задачи выполнены — 100%', () => {
    expect(
      projectProgress([
        makeTask({ id: '1', status: 'done' }),
        makeTask({ id: '2', status: 'done' }),
      ]),
    ).toBe(100)
  })

  it('округляет вниз при неполном делении', () => {
    const tasks = [
      makeTask({ id: '1', status: 'done' }),
      makeTask({ id: '2' }),
      makeTask({ id: '3' }),
    ]
    expect(projectProgress(tasks)).toBe(33)
  })
})

describe('overviewStats и countByStatus', () => {
  it('считает все статусы и просроченные', () => {
    const tasks = [
      makeTask({ id: '1', status: 'todo', dueDate: '2026-10-01' }),
      makeTask({ id: '2', status: 'todo', dueDate: null }),
      makeTask({ id: '3', status: 'in_progress' }),
      makeTask({ id: '4', status: 'done', dueDate: '2026-10-01' }),
    ]
    const stats = overviewStats(tasks, TODAY)
    expect(stats).toEqual({ total: 4, todo: 2, inProgress: 1, done: 1, overdue: 1 })
  })

  it('пустой список — нули', () => {
    expect(overviewStats([], TODAY)).toEqual({
      total: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
    })
    expect(countByStatus([])).toEqual({ todo: 0, in_progress: 0, done: 0 })
  })
})

describe('matchesSearch', () => {
  it('ищет по названию без учёта регистра', () => {
    expect(matchesSearch(makeTask({ title: 'Согласовать МАКЕТ' }), 'макет')).toBe(true)
  })

  it('ищет по описанию', () => {
    expect(matchesSearch(makeTask({ description: 'Подробности в тексте' }), 'текст')).toBe(true)
  })

  it('не находит по совпадению в другом поле', () => {
    expect(matchesSearch(makeTask({ title: 'Один' }), 'два')).toBe(false)
  })

  it('пустой запрос пропускает все задачи', () => {
    expect(matchesSearch(makeTask(), '   ')).toBe(true)
  })
})

describe('sortTasks', () => {
  const early = makeTask({ id: 'early', title: 'А', dueDate: '2026-10-20' })
  const late = makeTask({ id: 'late', title: 'Б', dueDate: '2026-11-05' })
  const noDue = makeTask({ id: 'none', title: 'В', dueDate: null })

  it('по возрастанию дедлайна, без срока в конце', () => {
    const sorted = sortTasks([noDue, late, early], 'due_asc')
    expect(sorted.map((t) => t.id)).toEqual(['early', 'late', 'none'])
  })

  it('по убыванию дедлайна, без срока всё равно в конце', () => {
    const sorted = sortTasks([noDue, early, late], 'due_desc')
    expect(sorted.map((t) => t.id)).toEqual(['late', 'early', 'none'])
  })

  it('по названию', () => {
    const sorted = sortTasks([late, early, noDue], 'title')
    expect(sorted.map((t) => t.id)).toEqual(['early', 'late', 'none'])
  })

  it('не мутирует входной массив', () => {
    const input = [late, early]
    sortTasks(input, 'due_asc')
    expect(input.map((t) => t.id)).toEqual(['late', 'early'])
  })
})

describe('applyTaskQuery — поиск, фильтры и сортировка вместе', () => {
  const tasks: Task[] = [
    makeTask({ id: 'a', title: 'Написать отчёт', projectId: 'p1', status: 'todo', dueDate: '2026-10-19' }),
    makeTask({ id: 'b', title: 'Отчёт по продажам', description: 'Таблицы и графики', projectId: 'p2', status: 'in_progress', dueDate: '2026-10-21' }),
    makeTask({ id: 'c', title: 'Позвонить клиенту', projectId: 'p1', status: 'done', dueDate: '2026-10-10' }),
    makeTask({ id: 'd', title: 'Без срока', projectId: 'p1', status: 'todo', dueDate: null }),
  ]

  it('поиск комбинируется с фильтром проекта и статуса', () => {
    const result = applyTaskQuery(
      tasks,
      { ...EMPTY_QUERY, search: 'отчёт', projectId: 'p1', status: 'todo' },
      TODAY,
    )
    expect(result.map((t) => t.id)).toEqual(['a'])
  })

  it('фильтр «просроченные» работает с текущей датой', () => {
    const result = applyTaskQuery(tasks, { ...EMPTY_QUERY, due: 'overdue' }, TODAY)
    expect(result.map((t) => t.id)).toEqual(['a'])
  })

  it('фильтр «сегодня» находит задачу с дедлайном на сегодня', () => {
    const result = applyTaskQuery(tasks, { ...EMPTY_QUERY, due: 'today' }, TODAY)
    expect(result.map((t) => t.id)).toEqual(['b'])
  })

  it('фильтр «без срока»', () => {
    const result = applyTaskQuery(tasks, { ...EMPTY_QUERY, due: 'none' }, TODAY)
    expect(result.map((t) => t.id)).toEqual(['d'])
  })

  it('сортировка применяется после фильтрации', () => {
    const result = applyTaskQuery(tasks, { ...EMPTY_QUERY, sort: 'due_asc' }, TODAY)
    // c (10.10) → a (19.10) → b (21.10) → d (без срока)
    expect(result.map((t) => t.id)).toEqual(['c', 'a', 'b', 'd'])
  })

  it('пустой поиск возвращает все задачи с фильтрами по умолчанию', () => {
    const result = applyTaskQuery(tasks, EMPTY_QUERY, TODAY)
    expect(result).toHaveLength(4)
  })

  it('несовпадающие условия дают пустой результат', () => {
    const result = applyTaskQuery(
      tasks,
      { ...EMPTY_QUERY, search: 'несуществующее' },
      TODAY,
    )
    expect(result).toEqual([])
  })
})

describe('upcomingDeadlines', () => {
  it('берёт ближайшие незавершённые дедлайны начиная с сегодня', () => {
    const tasks = [
      makeTask({ id: 'past', dueDate: '2026-10-20' }),
      makeTask({ id: 'today', dueDate: '2026-10-21' }),
      makeTask({ id: 'week', dueDate: '2026-10-25' }),
      makeTask({ id: 'done', status: 'done', dueDate: '2026-10-22' }),
      makeTask({ id: 'none', dueDate: null }),
    ]
    expect(upcomingDeadlines(tasks, 5, TODAY).map((t) => t.id)).toEqual(['today', 'week'])
  })

  it('ограничивает количество и работает с пустым списком', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-10-22' }),
      makeTask({ id: '2', dueDate: '2026-10-23' }),
      makeTask({ id: '3', dueDate: '2026-10-24' }),
    ]
    expect(upcomingDeadlines(tasks, 2, TODAY).map((t) => t.id)).toEqual(['1', '2'])
    expect(upcomingDeadlines([], 5, TODAY)).toEqual([])
  })
})

describe('applyStatus — completedAt', () => {
  it('перевод в «Выполнена» фиксирует completedAt', () => {
    const task = applyStatus(makeTask(), 'done', '2026-10-21T12:00:00.000Z')
    expect(task.status).toBe('done')
    expect(task.completedAt).toBe('2026-10-21T12:00:00.000Z')
    expect(task.updatedAt).toBe('2026-10-21T12:00:00.000Z')
  })

  it('возврат в незавершённый статус сбрасывает completedAt', () => {
    const done = applyStatus(makeTask(), 'done', '2026-10-21T12:00:00.000Z')
    const reopened = applyStatus(done, 'in_progress', '2026-10-21T13:00:00.000Z')
    expect(reopened.status).toBe('in_progress')
    expect(reopened.completedAt).toBeNull()
  })

  it('тот же статус возвращает задачу без изменений', () => {
    const task = makeTask()
    expect(applyStatus(task, 'todo', '2026-10-21T12:00:00.000Z')).toBe(task)
  })
})

describe('защита от некорректных статусов в данных', () => {
  it('countByStatus игнорирует неизвестные значения', () => {
    const tasks = [makeTask({ status: 'unknown' as TaskStatus })]
    expect(countByStatus(tasks)).toEqual({ todo: 0, in_progress: 0, done: 0 })
  })
})
