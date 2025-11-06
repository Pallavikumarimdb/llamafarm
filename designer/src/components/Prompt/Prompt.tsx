import { useState } from 'react'
import ModeToggle from '../ModeToggle'
import type { Mode } from '../ModeToggle'
import { Button } from '../ui/button'
import ConfigEditor from '../ConfigEditor/ConfigEditor'
import { usePackageModal } from '../../contexts/PackageModalContext'
import Prompts from './GeneratedOutput/Prompts'
import { useModeWithReset } from '../../hooks/useModeWithReset'
import { useActiveProject } from '../../hooks/useActiveProject'
import { useProject } from '../../hooks/useProjects'
import { findConfigPointer } from '../../utils/configNavigation'

const Prompt = () => {
  const [mode, setMode] = useModeWithReset('designer')
  const [configPointer, setConfigPointer] = useState<string | null>(null)
  const { openPackageModal } = usePackageModal()
  const activeProject = useActiveProject()
  const { data: projectResp } = useProject(
    activeProject?.namespace || '',
    activeProject?.project || '',
    !!activeProject?.namespace && !!activeProject?.project
  )

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode === 'code') {
      const pointer = findConfigPointer(
        (projectResp as any)?.project?.config,
        { type: 'prompts' }
      )
      setConfigPointer(pointer)
    } else {
      setConfigPointer(null)
    }
    setMode(nextMode)
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl ">
          {mode === 'designer' ? 'Prompts' : 'Config editor'}
        </h2>
        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onToggle={handleModeChange} />
          <Button
            variant="outline"
            size="sm"
            onClick={openPackageModal}
            disabled
          >
            Package
          </Button>
        </div>
      </div>
      {mode === 'designer' ? (
        <div className="flex-1 min-h-0 pb-6 overflow-auto">
          <Prompts />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden pb-6">
          <ConfigEditor className="h-full" initialPointer={configPointer} />
        </div>
      )}
    </div>
  )
}

export default Prompt
