import { useCallback, useState } from 'react'
import { CheckSquare, ClipboardList, LayoutDashboard, Plus } from 'lucide-react'
import type { Project, Task } from './types'
import { EMPTY_QUERY } from './types'
import type { TaskQuery } from './types'
import { useApp } from './store/appStore'
import { useToast } from './store/toastStore'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ProjectFormModal } from './components/ProjectFormModal'
import { TaskFormModal } from './components/TaskFormModal'
import { Toasts } from './components/Toasts'
import { Overview } from './pages/Overview'
import { Projects } from './pages/Projects'
import { Tasks } from './pages/Tasks'
import { TaskDetail } from './pages/TaskDetail'
import logoUrl from './assets/img/logo.png'
import htmlAcademyUrl from './assets/img/htmlacademy.svg'

export type View =
  | { name: 'overview' }
  | { name: 'projects' }
  | { name: 'tasks' }
  | { name: 'task'; id: string }

const NAV_ITEMS: Array<{
  view: View
  label: string
  icon: typeof LayoutDashboard
  count?: 'projects' | 'tasks'
}> = [
  { view: { name: 'overview' }, label: 'Обзор', icon: LayoutDashboard },
  { view: { name: 'projects' }, label: 'Проекты', icon: ClipboardList, count: 'projects' },
  { view: { name: 'tasks' }, label: 'Все задачи', icon: CheckSquare, count: 'tasks' },
]

export default function App() {
  const { state, createProject, updateProject, createTask, updateTask, clearDemoData } = useApp()
  const { notify } = useToast()

  const [view, setView] = useState<View>({ name: 'overview' })
  const [query, setQuery] = useState<TaskQuery>(EMPTY_QUERY)
  const [projectModal, setProjectModal] = useState<{ initial?: Project } | null>(null)
  const [taskModal, setTaskModal] = useState<{ initial?: Task; presetProjectId?: string } | null>(
    null,
  )
  const [confirmDemoClear, setConfirmDemoClear] = useState(false)

  const go = useCallback((next: View) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }, [])

  const openTasks = useCallback(
    (filters?: Partial<TaskQuery>) => {
      setQuery({ ...EMPTY_QUERY, ...filters })
      go({ name: 'tasks' })
    },
    [go],
  )

  const openTask = useCallback((id: string) => go({ name: 'task', id }), [go])

  const openCreateProject = useCallback(() => setProjectModal({}), [])
  const openEditProject = useCallback((project: Project) => setProjectModal({ initial: project }), [])
  const openCreateTask = useCallback(
    (presetProjectId?: string) => setTaskModal({ presetProjectId }),
    [],
  )
  const openEditTask = useCallback((task: Task) => setTaskModal({ initial: task }), [])

  const handleSaveProject = useCallback(
    (input: { name: string; description: string }) => {
      if (projectModal?.initial) {
        updateProject(projectModal.initial.id, input)
        notify('Проект обновлён')
      } else {
        createProject(input)
        notify('Проект создан')
      }
    },
    [projectModal, createProject, updateProject, notify],
  )

  const handleSaveTask = useCallback(
    (input: Parameters<typeof createTask>[0]) => {
      if (taskModal?.initial) {
        updateTask(taskModal.initial.id, input)
        notify('Задача обновлена')
      } else {
        createTask(input)
        notify('Задача создана')
      }
    },
    [taskModal, createTask, updateTask, notify],
  )

  const currentNav =
    view.name === 'task' ? { name: 'tasks' } as View : view

  const navCounts: Record<'projects' | 'tasks', number> = {
    projects: state.projects.length,
    tasks: state.tasks.length,
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container header__inner">
          <button
            type="button"
            className="brand"
            onClick={() => go({ name: 'overview' })}
          >
            <img
              src={logoUrl}
              width={153}
              height={42}
              alt="Логотип «Дела в порядке»"
              className="brand__logo"
            />
          </button>

          <nav className="nav" aria-label="Основная навигация">
            {NAV_ITEMS.map(({ view: target, label, icon: Icon, count }) => {
              const active = currentNav.name === target.name
              return (
                <button
                  key={target.name}
                  type="button"
                  className={`nav__item ${active ? 'nav__item--active' : ''}`}
                  onClick={() => go(target)}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{label}</span>
                  {count ? <span className="nav__count">{navCounts[count]}</span> : null}
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            className="button button--primary header__action"
            onClick={() => openCreateTask()}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Задача</span>
          </button>
        </div>
      </header>

      <main className="container main">
        {view.name === 'overview' ? (
          <Overview
            onOpenTasks={openTasks}
            onOpenTask={openTask}
            onOpenCreateTask={openCreateTask}
            onOpenCreateProject={openCreateProject}
            onClearDemo={() => setConfirmDemoClear(true)}
          />
        ) : null}

        {view.name === 'projects' ? (
          <Projects
            onOpenCreate={openCreateProject}
            onOpenEdit={openEditProject}
            onViewTasks={(project) => openTasks({ projectId: project.id })}
          />
        ) : null}

        {view.name === 'tasks' ? (
          <Tasks
            query={query}
            onQueryChange={setQuery}
            onResetQuery={() => setQuery(EMPTY_QUERY)}
            onOpenCreate={openCreateTask}
            onOpenEdit={openEditTask}
            onSelectTask={openTask}
            onOpenCreateProject={openCreateProject}
          />
        ) : null}

        {view.name === 'task' ? (
          <TaskDetail
            taskId={view.id}
            onBack={() => go({ name: 'tasks' })}
            onOpenEdit={openEditTask}
          />
        ) : null}
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__copyright">
            <p>© 2026, «Дела в порядке» — веб-приложение для удобного ведения списка дел.</p>
            <p className="footer__note">
              Данные хранятся только в localStorage вашего браузера: без сервера, синхронизации и
              резервного копирования.
            </p>
          </div>

          <div className="footer__developed-by">
            <a href="https://htmlacademy.ru/intensive/php" target="_blank" rel="noreferrer">
              <img src={htmlAcademyUrl} alt="HTML Academy" width={118} height={40} />
            </a>
          </div>
        </div>
      </footer>

      {projectModal ? (
        <ProjectFormModal
          initial={projectModal.initial}
          onClose={() => setProjectModal(null)}
          onSave={handleSaveProject}
        />
      ) : null}

      {taskModal ? (
        <TaskFormModal
          projects={state.projects}
          initial={taskModal.initial}
          presetProjectId={taskModal.presetProjectId}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
          onCreateProject={openCreateProject}
        />
      ) : null}

      {confirmDemoClear ? (
        <ConfirmDialog
          title="Удалить демонстрационные данные?"
          confirmLabel="Удалить демо-данные"
          message={
            <>
              Будут удалены все демонстрационные проекты и связанные с ними задачи, в том числе
              добавленные вами внутри этих проектов. Ваши собственные проекты и задачи останутся.
            </>
          }
          onCancel={() => setConfirmDemoClear(false)}
          onConfirm={() => {
            setConfirmDemoClear(false)
            clearDemoData()
            notify('Демо-данные удалены')
          }}
        />
      ) : null}

      <Toasts />
    </div>
  )
}
