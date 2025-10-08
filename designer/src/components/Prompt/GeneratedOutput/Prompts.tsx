import { useMemo, useState } from 'react'
import { useActiveProject } from '../../../hooks/useActiveProject'
import { useProject } from '../../../hooks/useProjects'
import projectService from '../../../api/projectService'
import PromptModal, { PromptModalMode } from './PromptModal'

interface PromptRow {
  role?: string
  preview: string
}

const Prompts = () => {
  const activeProject = useActiveProject()
  const { data: projectResponse, refetch } = useProject(
    activeProject?.namespace || '',
    activeProject?.project || '',
    !!activeProject?.namespace && !!activeProject?.project
  )

  const rows: PromptRow[] = useMemo(() => {
    const prompts = projectResponse?.project?.config?.prompts as
      | Array<{ role?: string; content: string }>
      | undefined
    if (!prompts || prompts.length === 0) return []
    return prompts.map(p => ({ role: p.role, preview: p.content }))
  }, [projectResponse])

  // Add prompt modal state
  const [isOpen, setIsOpen] = useState(false)
  const [mode] = useState<PromptModalMode>('create')
  const [initialVersion] = useState('')
  const [initialText] = useState('')

  const handleCreatePrompt = async (_version: string, text: string) => {
    if (!activeProject || !projectResponse?.project?.config) return
    const config = projectResponse.project.config
    const nextPrompts = Array.isArray(config.prompts) ? [...config.prompts] : []
    nextPrompts.unshift({ role: 'system', content: text })

    const request = { config: { ...config, prompts: nextPrompts } }
    await projectService.updateProject(
      activeProject.namespace,
      activeProject.project,
      request
    )
    await refetch()
    setIsOpen(false)
  }

  return (
    <div className="w-full h-full">
      <div className="w-full flex items-center justify-between mb-2 gap-3">
        <p className="text-sm text-muted-foreground">
          Prompts are instructions that tell your model how to behave. The
          following prompts have been saved for this project so far. You can
          view the prompts defined in your project configuration.
        </p>
        <button
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          onClick={() => setIsOpen(true)}
        >
          New prompt
        </button>
      </div>
      <table className="w-full">
        <thead className="bg-white dark:bg-blue-600 font-normal">
          <tr>
            <th className="text-left w-[15%] py-2 px-3 font-normal">Role</th>
            <th className="text-left w-[85%] py-2 px-3 font-normal">Preview</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((prompt, index) => (
            <tr
              key={index}
              className={`border-b border-solid border-white dark:border-blue-600 text-sm font-mono leading-4 tracking-[0.32px]${
                index === rows.length - 1 ? 'border-b-0' : 'border-b'
              }`}
            >
              <td className="align-top p-3">{prompt.role || '—'}</td>
              <td className="align-top p-3">
                <div className="whitespace-pre-line break-words line-clamp-6">
                  {prompt.preview}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={2}
                className="align-top p-3 text-sm text-muted-foreground"
              >
                No prompts found in project configuration.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <PromptModal
        isOpen={isOpen}
        mode={mode}
        initialVersion={initialVersion}
        initialText={initialText}
        onClose={() => setIsOpen(false)}
        onSave={handleCreatePrompt}
      />
    </div>
  )
}

export default Prompts
