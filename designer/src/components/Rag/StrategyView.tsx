import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FontIcon from '../../common/FontIcon'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { defaultStrategies } from './strategies'
import { useToast } from '../ui/toast'
import PageActions from '../common/PageActions'
import { Mode } from '../ModeToggle'
import Tabs from '../Tabs'
import { ChevronDown, Plus, Settings, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

function StrategyView() {
  const navigate = useNavigate()
  const { strategyId } = useParams()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('designer')

  const [strategyMetaTick, setStrategyMetaTick] = useState(0)

  const strategyName = useMemo(() => {
    if (!strategyId) return 'Strategy'
    try {
      const override = localStorage.getItem(
        `lf_strategy_name_override_${strategyId}`
      )
      if (override && override.trim().length > 0) return override
    } catch {}
    const found = defaultStrategies.find(s => s.id === strategyId)
    if (found) return found.name
    // Fallback to title-casing the id
    return strategyId
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }, [strategyId, strategyMetaTick])

  const strategyDescription = useMemo(() => {
    if (!strategyId) return ''
    try {
      const override = localStorage.getItem(
        `lf_strategy_description_${strategyId}`
      )
      if (override !== null) return override
    } catch {}
    const found = defaultStrategies.find(s => s.id === strategyId)
    return found?.description || ''
  }, [strategyId, strategyMetaTick])

  const usedBy = ['aircraft-maintenance-guides', 'another dataset']

  // Removed embedding model save flow; processing edits persist immediately

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // (Removed) embedding save flow and listeners

  // Tabbed Parsers/Extractors data -------------------------------------------
  type ParserRow = {
    id: string
    name: string
    priority: number
    include: string
    exclude: string
    summary: string
  }
  type ExtractorRow = {
    id: string
    name: string
    priority: number
    applyTo: string
    summary: string
  }

  const defaultParsers: ParserRow[] = [
    {
      id: 'pdf-llamaindex',
      name: 'PDFParser_LlamaIndex',
      priority: 100,
      include: '*.pdf, *.PDF',
      exclude: '*_draft.pdf, *.tmp.pdf',
      summary:
        'Semantic chunking, 1000 chars, 200 overlap, extract metadata & tables',
    },
    {
      id: 'pdf-pypdf2',
      name: 'PDFParser_PyPDF2',
      priority: 50,
      include: '*.pdf, *.PDF',
      exclude: '*_draft.pdf, *.tmp.pdf',
      summary: 'Paragraph chunking, 1000 chars, 150 overlap, extract metadata',
    },
    {
      id: 'docx-llamaindex',
      name: 'DocxParser_LlamaIndex',
      priority: 100,
      include: '*.docx, *.DOCX, *.doc, *.DOC',
      exclude: '~$*, *.tmp',
      summary: '1000 chars, 150 overlap, extract tables & metadata',
    },
    {
      id: 'md-python',
      name: 'MarkdownParser_Python',
      priority: 100,
      include: '*.md, *.markdown, *.mdown, *.mkd, README*',
      exclude: '*.tmp.md, _draft*.md',
      summary: 'Section-based, extract code & links',
    },
    {
      id: 'csv-pandas',
      name: 'CSVParser_Pandas',
      priority: 100,
      include: '*.csv, *.CSV, *.tsv, *.TSV, *.dat',
      exclude: '*_backup.csv, *.tmp.csv',
      summary: 'Row-based, 500 chars, UTF-8',
    },
    {
      id: 'excel-pandas',
      name: 'ExcelParser_Pandas',
      priority: 100,
      include: '*.xlsx, *.XLSX, *.xls, *.XLS',
      exclude: '~$*, *.tmp.xlsx',
      summary: 'Process all sheets, 500 chars, extract metadata',
    },
    {
      id: 'text-python',
      name: 'TextParser_Python',
      priority: 50,
      include: '*.txt, *.json, *.xml, *.yaml, *.py, *.js, LICENSE*, etc.',
      exclude: '*.pyc, *.pyo, *.class',
      summary: 'Sentence-based, 1200 chars, 200 overlap',
    },
  ]

  const defaultExtractors: ExtractorRow[] = [
    {
      id: 'content-stats',
      name: 'ContentStatisticsExtractor',
      priority: 100,
      applyTo: 'All files (*)',
      summary: 'Include readability, vocabulary & structure analysis',
    },
    {
      id: 'entity',
      name: 'EntityExtractor',
      priority: 90,
      applyTo: 'All files (*)',
      summary:
        'Extract: PERSON, ORG, GPE, DATE, PRODUCT, MONEY, PERCENT | Min length: 2',
    },
    {
      id: 'keyword',
      name: 'KeywordExtractor',
      priority: 80,
      applyTo: 'All files (*)',
      summary: 'YAKE algorithm, 10 max keywords, 3 min keyword length',
    },
    {
      id: 'table',
      name: 'TableExtractor',
      priority: 100,
      applyTo: '*.pdf, *.PDF only',
      summary: 'Dict format output, extract headers, merge cells',
    },
    {
      id: 'datetime',
      name: 'DateTimeExtractor',
      priority: 100,
      applyTo: '*.csv, *.xlsx, *.xls, *.tsv',
      summary: 'Formats: ISO8601, US, EU | Extract relative dates & times',
    },
    {
      id: 'pattern',
      name: 'PatternExtractor',
      priority: 100,
      applyTo: '*.py, *.js, *.java, *.cpp, *.c, *.h',
      summary:
        'Email, URL, IP, version + custom function/class definition patterns',
    },
    {
      id: 'heading',
      name: 'HeadingExtractor',
      priority: 100,
      applyTo: '*.md, *.markdown, README*',
      summary: 'Max level 6, include hierarchy & outline extraction',
    },
    {
      id: 'link',
      name: 'LinkExtractor',
      priority: 90,
      applyTo: '*.md, *.markdown, *.html, *.htm',
      summary: 'Extract URLs, emails, and domains',
    },
  ]

  const [activeTab, setActiveTab] = useState<'parsers' | 'extractors'>(
    'parsers'
  )
  const [openRows, setOpenRows] = useState<Set<string>>(new Set())

  const [parserRows, setParserRows] = useState<ParserRow[]>(defaultParsers)
  const [extractorRows, setExtractorRows] =
    useState<ExtractorRow[]>(defaultExtractors)

  const storageKeys = useMemo(() => {
    if (!strategyId) return { parsers: '', extractors: '' }
    return {
      parsers: `lf_strategy_parsers_${strategyId}`,
      extractors: `lf_strategy_extractors_${strategyId}`,
    }
  }, [strategyId])

  const loadPersisted = () => {
    try {
      if (!storageKeys.parsers || !storageKeys.extractors) return
      const pRaw = localStorage.getItem(storageKeys.parsers)
      const eRaw = localStorage.getItem(storageKeys.extractors)
      if (pRaw) {
        try {
          const arr = JSON.parse(pRaw)
          if (Array.isArray(arr)) setParserRows(arr)
        } catch {}
      } else {
        setParserRows(defaultParsers)
      }
      if (eRaw) {
        try {
          const arr = JSON.parse(eRaw)
          if (Array.isArray(arr)) setExtractorRows(arr)
        } catch {}
      } else {
        setExtractorRows(defaultExtractors)
      }
    } catch {}
  }

  useEffect(() => {
    loadPersisted()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKeys.parsers, storageKeys.extractors])

  const saveParsers = (rows: ParserRow[]) => {
    try {
      if (storageKeys.parsers)
        localStorage.setItem(storageKeys.parsers, JSON.stringify(rows))
    } catch {}
  }
  const saveExtractors = (rows: ExtractorRow[]) => {
    try {
      if (storageKeys.extractors)
        localStorage.setItem(storageKeys.extractors, JSON.stringify(rows))
    } catch {}
  }
  const toggleRow = (id: string) => {
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getPriorityVariant = (
    p: number
  ): 'default' | 'secondary' | 'outline' => {
    if (p >= 100) return 'default'
    if (p >= 50) return 'secondary'
    return 'outline'
  }

  // Add Parser modal ----------------------------------------------------------
  const [isAddParserOpen, setIsAddParserOpen] = useState(false)
  const [newParserName, setNewParserName] = useState('')
  const [newParserPriority, setNewParserPriority] = useState<string>('100')
  const [newParserInclude, setNewParserInclude] = useState('')
  const [newParserExclude, setNewParserExclude] = useState('')
  const [newParserSummary, setNewParserSummary] = useState('')

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const handleCreateParser = () => {
    const name = newParserName.trim()
    const prio = Number(newParserPriority)
    if (!name || !Number.isFinite(prio)) return
    const idBase = slugify(name) || 'parser'
    const id = `${idBase}-${Date.now()}`
    const next: ParserRow = {
      id,
      name,
      priority: prio,
      include: newParserInclude.trim(),
      exclude: newParserExclude.trim(),
      summary: newParserSummary.trim(),
    }
    const rows = [...parserRows, next]
    setParserRows(rows)
    saveParsers(rows)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: { strategyId, type: 'parser:add', item: next },
          })
        )
      }
    } catch {}
    setOpenRows(prev => new Set(prev).add(id))
    setIsAddParserOpen(false)
    setNewParserName('')
    setNewParserPriority('100')
    setNewParserInclude('')
    setNewParserExclude('')
    setNewParserSummary('')
  }

  // Edit/Delete Parser modals -------------------------------------------------
  const [isEditParserOpen, setIsEditParserOpen] = useState(false)
  const [editParserId, setEditParserId] = useState<string>('')
  const [editParserName, setEditParserName] = useState('')
  const [editParserPriority, setEditParserPriority] = useState<string>('100')
  const [editParserInclude, setEditParserInclude] = useState('')
  const [editParserExclude, setEditParserExclude] = useState('')
  const [editParserSummary, setEditParserSummary] = useState('')

  const openEditParser = (id: string) => {
    const found = parserRows.find(p => p.id === id)
    if (!found) return
    setEditParserId(found.id)
    setEditParserName(found.name)
    setEditParserPriority(String(found.priority))
    setEditParserInclude(found.include)
    setEditParserExclude(found.exclude)
    setEditParserSummary(found.summary)
    setIsEditParserOpen(true)
  }

  const handleUpdateParser = () => {
    const name = editParserName.trim()
    const prio = Number(editParserPriority)
    if (!editParserId || !name || !Number.isFinite(prio)) return
    const next = parserRows.map(p =>
      p.id === editParserId
        ? {
            ...p,
            name,
            priority: prio,
            include: editParserInclude.trim(),
            exclude: editParserExclude.trim(),
            summary: editParserSummary.trim(),
          }
        : p
    )
    setParserRows(next)
    saveParsers(next)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: { strategyId, type: 'parser:update', id: editParserId },
          })
        )
      }
    } catch {}
    setIsEditParserOpen(false)
  }

  const [isDeleteParserOpen, setIsDeleteParserOpen] = useState(false)
  const [deleteParserId, setDeleteParserId] = useState<string>('')
  const openDeleteParser = (id: string) => {
    setDeleteParserId(id)
    setIsDeleteParserOpen(true)
  }
  const handleDeleteParser = () => {
    if (!deleteParserId) return
    const next = parserRows.filter(p => p.id !== deleteParserId)
    setParserRows(next)
    saveParsers(next)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: { strategyId, type: 'parser:delete', id: deleteParserId },
          })
        )
      }
    } catch {}
    setIsDeleteParserOpen(false)
    setDeleteParserId('')
  }

  // Add/Edit/Delete Extractor modals -----------------------------------------
  const [isAddExtractorOpen, setIsAddExtractorOpen] = useState(false)
  const [newExtractorName, setNewExtractorName] = useState('')
  const [newExtractorPriority, setNewExtractorPriority] =
    useState<string>('100')
  const [newExtractorApplyTo, setNewExtractorApplyTo] = useState('')
  const [newExtractorSummary, setNewExtractorSummary] = useState('')

  const handleCreateExtractor = () => {
    const name = newExtractorName.trim()
    const prio = Number(newExtractorPriority)
    if (!name || !Number.isFinite(prio)) return
    const idBase = slugify(name) || 'extractor'
    const id = `${idBase}-${Date.now()}`
    const next: ExtractorRow = {
      id,
      name,
      priority: prio,
      applyTo: newExtractorApplyTo.trim() || 'All files (*)',
      summary: newExtractorSummary.trim(),
    }
    const rows = [...extractorRows, next]
    setExtractorRows(rows)
    saveExtractors(rows)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: { strategyId, type: 'extractor:add', item: next },
          })
        )
      }
    } catch {}
    setOpenRows(prev => new Set(prev).add(id))
    setIsAddExtractorOpen(false)
    setNewExtractorName('')
    setNewExtractorPriority('100')
    setNewExtractorApplyTo('')
    setNewExtractorSummary('')
  }

  const [isEditExtractorOpen, setIsEditExtractorOpen] = useState(false)
  const [editExtractorId, setEditExtractorId] = useState<string>('')
  const [editExtractorName, setEditExtractorName] = useState('')
  const [editExtractorPriority, setEditExtractorPriority] =
    useState<string>('100')
  const [editExtractorApplyTo, setEditExtractorApplyTo] = useState('')
  const [editExtractorSummary, setEditExtractorSummary] = useState('')

  const openEditExtractor = (id: string) => {
    const found = extractorRows.find(e => e.id === id)
    if (!found) return
    setEditExtractorId(found.id)
    setEditExtractorName(found.name)
    setEditExtractorPriority(String(found.priority))
    setEditExtractorApplyTo(found.applyTo)
    setEditExtractorSummary(found.summary)
    setIsEditExtractorOpen(true)
  }
  const handleUpdateExtractor = () => {
    const name = editExtractorName.trim()
    const prio = Number(editExtractorPriority)
    if (!editExtractorId || !name || !Number.isFinite(prio)) return
    const next = extractorRows.map(e =>
      e.id === editExtractorId
        ? {
            ...e,
            name,
            priority: prio,
            applyTo: editExtractorApplyTo.trim(),
            summary: editExtractorSummary.trim(),
          }
        : e
    )
    setExtractorRows(next)
    saveExtractors(next)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: {
              strategyId,
              type: 'extractor:update',
              id: editExtractorId,
            },
          })
        )
      }
    } catch {}
    setIsEditExtractorOpen(false)
  }

  const [isDeleteExtractorOpen, setIsDeleteExtractorOpen] = useState(false)
  const [deleteExtractorId, setDeleteExtractorId] = useState<string>('')
  const openDeleteExtractor = (id: string) => {
    setDeleteExtractorId(id)
    setIsDeleteExtractorOpen(true)
  }
  const handleDeleteExtractor = () => {
    if (!deleteExtractorId) return
    const next = extractorRows.filter(e => e.id !== deleteExtractorId)
    setExtractorRows(next)
    saveExtractors(next)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: {
              strategyId,
              type: 'extractor:delete',
              id: deleteExtractorId,
            },
          })
        )
      }
    } catch {}
    setIsDeleteExtractorOpen(false)
    setDeleteExtractorId('')
  }

  // Reset to defaults (for universal strategy) --------------------------------
  const isUniversal = strategyId === 'processing-universal'
  const handleResetDefaults = () => {
    if (!isUniversal) return
    const ok = confirm('Reset parsers and extractors to defaults?')
    if (!ok) return
    try {
      setParserRows(defaultParsers)
      setExtractorRows(defaultExtractors)
      if (storageKeys.parsers)
        localStorage.setItem(
          storageKeys.parsers,
          JSON.stringify(defaultParsers)
        )
      if (storageKeys.extractors)
        localStorage.setItem(
          storageKeys.extractors,
          JSON.stringify(defaultExtractors)
        )
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lf:processingUpdated', {
            detail: { strategyId, type: 'reset:defaults' },
          })
        )
      }
    } catch {}
  }

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // @ts-ignore custom event
        const { strategyId: sid } = (e as CustomEvent).detail || {}
        if (sid && strategyId && sid === strategyId) {
          setStrategyMetaTick(t => t + 1)
        }
      } catch {}
    }
    window.addEventListener(
      'lf:strategyExtractionUpdated',
      handler as EventListener
    )
    return () =>
      window.removeEventListener(
        'lf:strategyExtractionUpdated',
        handler as EventListener
      )
  }, [strategyId])

  // (Removed) save button logic – edits persist immediately

  return (
    <div className="w-full flex flex-col gap-3 pb-20">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between mb-1">
        <nav className="text-sm md:text-base flex items-center gap-1.5">
          <button
            className="text-teal-600 dark:text-teal-400 hover:underline"
            onClick={() => navigate('/chat/rag')}
          >
            RAG
          </button>
          <span className="text-muted-foreground px-1">/</span>
          <span className="text-foreground">Processing strategies</span>
          <span className="text-muted-foreground px-1">/</span>
          <span className="text-foreground">{strategyName}</span>
        </nav>
        <PageActions mode={mode} onModeChange={setMode} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-medium">{strategyName}</h2>
          <button
            className="p-1 rounded-md hover:bg-accent text-muted-foreground"
            onClick={() => {
              setEditName(strategyName)
              setEditDescription(strategyDescription)
              setIsEditOpen(true)
            }}
            aria-label="Edit strategy"
            title="Edit strategy"
          >
            <FontIcon type="edit" className="w-4 h-4" />
          </button>
        </div>
      </div>
      {strategyDescription && (
        <div className="text-sm text-muted-foreground">
          {strategyDescription}
        </div>
      )}

      {/* Used by + Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">Used by</div>
          {usedBy.map(u => (
            <Badge key={u} variant="secondary" size="sm" className="rounded-xl">
              {u}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddParserOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Parser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddExtractorOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Extractor
          </Button>
          {isUniversal ? (
            <Button variant="outline" size="sm" onClick={handleResetDefaults}>
              Reset to defaults
            </Button>
          ) : null}
        </div>
      </div>

      {/* Processing editors */}
      {/* Tabs header outside card */}
      <Tabs
        activeTab={activeTab}
        setActiveTab={t => setActiveTab(t as 'parsers' | 'extractors')}
        tabs={[
          { id: 'parsers', label: `Parsers (${parserRows.length})` },
          { id: 'extractors', label: `Extractors (${extractorRows.length})` },
        ]}
      />
      <section className="rounded-lg border border-border bg-card p-4">
        {activeTab === 'parsers' ? (
          <div className="flex flex-col gap-2">
            {parserRows.map(row => {
              const open = openRows.has(row.id)
              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-3 hover:bg-accent/20 transition-colors"
                >
                  <button
                    className="w-full flex items-center gap-2 text-left"
                    onClick={() => toggleRow(row.id)}
                    aria-expanded={open}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                    <div className="flex-1 text-sm font-medium">{row.name}</div>
                    <Badge
                      variant={getPriorityVariant(row.priority)}
                      size="sm"
                      className="rounded-xl mr-2"
                    >
                      Priority: {row.priority}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Configure parser"
                        onClick={e => {
                          e.stopPropagation()
                          openEditParser(row.id)
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Remove parser"
                        onClick={e => {
                          e.stopPropagation()
                          openDeleteParser(row.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </button>
                  {open ? (
                    <div className="mt-2 rounded-md border border-border bg-accent/10 p-2 text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Include:
                        </span>{' '}
                        {row.include}{' '}
                        <span className="ml-2 font-medium text-foreground">
                          Exclude:
                        </span>{' '}
                        {row.exclude}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {row.summary}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {extractorRows.map(row => {
              const open = openRows.has(row.id)
              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-3 hover:bg-accent/20 transition-colors"
                >
                  <button
                    className="w-full flex items-center gap-2 text-left"
                    onClick={() => toggleRow(row.id)}
                    aria-expanded={open}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                    <div className="flex-1 text-sm font-medium">{row.name}</div>
                    <Badge
                      variant={getPriorityVariant(row.priority)}
                      size="sm"
                      className="rounded-xl mr-2"
                    >
                      Priority: {row.priority}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Configure extractor"
                        onClick={e => {
                          e.stopPropagation()
                          openEditExtractor(row.id)
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Remove extractor"
                        onClick={e => {
                          e.stopPropagation()
                          openDeleteExtractor(row.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </button>
                  {open ? (
                    <div className="mt-2 rounded-md border border-border bg-accent/10 p-2 text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Apply to:
                        </span>{' '}
                        {row.applyTo}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {row.summary}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Add Parser Modal */}
      <Dialog open={isAddParserOpen} onOpenChange={setIsAddParserOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Add parser
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                className="mt-1 bg-background"
                placeholder="e.g., PDFParser_LlamaIndex"
                value={newParserName}
                onChange={e => setNewParserName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <Input
                  type="number"
                  className="mt-1 bg-background"
                  value={newParserPriority}
                  onChange={e => setNewParserPriority(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Include patterns
                </Label>
                <Input
                  className="mt-1 bg-background"
                  placeholder="*.pdf, *.PDF"
                  value={newParserInclude}
                  onChange={e => setNewParserInclude(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-3">
                <Label className="text-xs text-muted-foreground">
                  Exclude patterns
                </Label>
                <Input
                  className="mt-1 bg-background"
                  placeholder="*_draft.pdf, *.tmp.pdf"
                  value={newParserExclude}
                  onChange={e => setNewParserExclude(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Summary</Label>
              <Textarea
                rows={3}
                className="mt-1 bg-background"
                placeholder="Chunking, sizes, overlap, metadata, etc."
                value={newParserSummary}
                onChange={e => setNewParserSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
              onClick={() => setIsAddParserOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm ${
                newParserName.trim().length > 0
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'opacity-50 cursor-not-allowed bg-primary text-primary-foreground'
              }`}
              onClick={handleCreateParser}
              disabled={newParserName.trim().length === 0}
              type="button"
            >
              Add parser
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parser Modal */}
      <Dialog open={isEditParserOpen} onOpenChange={setIsEditParserOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Edit parser
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                className="mt-1 bg-background"
                value={editParserName}
                onChange={e => setEditParserName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <Input
                  type="number"
                  className="mt-1 bg-background"
                  value={editParserPriority}
                  onChange={e => setEditParserPriority(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Include patterns
                </Label>
                <Input
                  className="mt-1 bg-background"
                  value={editParserInclude}
                  onChange={e => setEditParserInclude(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Exclude patterns
              </Label>
              <Input
                className="mt-1 bg-background"
                value={editParserExclude}
                onChange={e => setEditParserExclude(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Summary</Label>
              <Textarea
                rows={3}
                className="mt-1 bg-background"
                value={editParserSummary}
                onChange={e => setEditParserSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
              onClick={() => setIsEditParserOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm ${
                editParserName.trim().length > 0
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'opacity-50 cursor-not-allowed bg-primary text-primary-foreground'
              }`}
              onClick={handleUpdateParser}
              disabled={editParserName.trim().length === 0}
              type="button"
            >
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Parser Modal */}
      <Dialog open={isDeleteParserOpen} onOpenChange={setIsDeleteParserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Delete parser
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to delete this parser? This action cannot be
            undone.
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
              onClick={() => setIsDeleteParserOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90 text-sm"
              onClick={handleDeleteParser}
              type="button"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Extractor Modal */}
      <Dialog open={isAddExtractorOpen} onOpenChange={setIsAddExtractorOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Add extractor
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                className="mt-1 bg-background"
                placeholder="e.g., KeywordExtractor"
                value={newExtractorName}
                onChange={e => setNewExtractorName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <Input
                  type="number"
                  className="mt-1 bg-background"
                  value={newExtractorPriority}
                  onChange={e => setNewExtractorPriority(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Apply to
                </Label>
                <Input
                  className="mt-1 bg-background"
                  placeholder="All files (*)"
                  value={newExtractorApplyTo}
                  onChange={e => setNewExtractorApplyTo(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Summary</Label>
              <Textarea
                rows={3}
                className="mt-1 bg-background"
                placeholder="Description of what this extractor does"
                value={newExtractorSummary}
                onChange={e => setNewExtractorSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
              onClick={() => setIsAddExtractorOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm ${
                newExtractorName.trim().length > 0
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'opacity-50 cursor-not-allowed bg-primary text-primary-foreground'
              }`}
              onClick={handleCreateExtractor}
              disabled={newExtractorName.trim().length === 0}
              type="button"
            >
              Add extractor
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Extractor Modal */}
      <Dialog open={isEditExtractorOpen} onOpenChange={setIsEditExtractorOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Edit extractor
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                className="mt-1 bg-background"
                value={editExtractorName}
                onChange={e => setEditExtractorName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <Input
                  type="number"
                  className="mt-1 bg-background"
                  value={editExtractorPriority}
                  onChange={e => setEditExtractorPriority(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Apply to
                </Label>
                <Input
                  className="mt-1 bg-background"
                  value={editExtractorApplyTo}
                  onChange={e => setEditExtractorApplyTo(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Summary</Label>
              <Textarea
                rows={3}
                className="mt-1 bg-background"
                value={editExtractorSummary}
                onChange={e => setEditExtractorSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
              onClick={() => setIsEditExtractorOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm ${
                editExtractorName.trim().length > 0
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'opacity-50 cursor-not-allowed bg-primary text-primary-foreground'
              }`}
              onClick={handleUpdateExtractor}
              disabled={editExtractorName.trim().length === 0}
              type="button"
            >
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Extractor Modal */}
      <Dialog
        open={isDeleteExtractorOpen}
        onOpenChange={setIsDeleteExtractorOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Delete extractor
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to delete this extractor? This action cannot
            be undone.
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
              onClick={() => setIsDeleteExtractorOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90 text-sm"
              onClick={handleDeleteExtractor}
              type="button"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Strategy Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Edit strategy
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <label className="text-xs text-muted-foreground">
                Strategy name
              </label>
              <input
                className="w-full mt-1 bg-transparent rounded-lg py-2 px-3 border border-input text-foreground"
                placeholder="Enter name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Description
              </label>
              <textarea
                rows={4}
                className="w-full mt-1 bg-transparent rounded-lg py-2 px-3 border border-input text-foreground"
                placeholder="Add a brief description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90 text-sm"
              onClick={() => {
                if (!strategyId) return
                const ok = confirm(
                  'Are you sure you want to delete this strategy?'
                )
                if (ok) {
                  try {
                    localStorage.removeItem(
                      `lf_strategy_name_override_${strategyId}`
                    )
                    localStorage.removeItem(
                      `lf_strategy_description_${strategyId}`
                    )
                    // Mark strategy as deleted so it disappears from lists
                    const raw = localStorage.getItem('lf_strategy_deleted')
                    const arr = raw ? (JSON.parse(raw) as string[]) : []
                    const set = new Set(arr)
                    set.add(strategyId)
                    localStorage.setItem(
                      'lf_strategy_deleted',
                      JSON.stringify(Array.from(set))
                    )
                  } catch {}
                  setIsEditOpen(false)
                  setStrategyMetaTick(t => t + 1)
                  navigate('/chat/rag')
                  toast({ message: 'Strategy deleted', variant: 'default' })
                }
              }}
              type="button"
            >
              Delete
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <button
                className="px-3 py-2 rounded-md text-sm text-primary hover:underline"
                onClick={() => setIsEditOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm ${editName.trim().length > 0 ? 'bg-primary text-primary-foreground hover:opacity-90' : 'opacity-50 cursor-not-allowed bg-primary text-primary-foreground'}`}
                onClick={() => {
                  if (!strategyId || editName.trim().length === 0) return
                  try {
                    localStorage.setItem(
                      `lf_strategy_name_override_${strategyId}`,
                      editName.trim()
                    )
                    localStorage.setItem(
                      `lf_strategy_description_${strategyId}`,
                      editDescription
                    )
                  } catch {}
                  setIsEditOpen(false)
                  setStrategyMetaTick(t => t + 1)
                }}
                disabled={editName.trim().length === 0}
                type="button"
              >
                Save
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End processing editors */}

      {/* Retrieval and Embedding moved to project-level settings. */}
    </div>
  )
}

export default StrategyView
