import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUpdateProject, projectKeys } from './useProjects'

/**
 * Type for a database
 */
export type Database = {
  name: string
  type: 'ChromaStore' | 'QdrantStore'
  config?: Record<string, any>
  default_embedding_strategy?: string
  default_retrieval_strategy?: string
  embedding_strategies?: Array<{
    name: string
    type: string
    priority?: number
    config?: Record<string, any>
  }>
  retrieval_strategies?: Array<{
    name: string
    type: string
    config?: Record<string, any>
    default?: boolean
  }>
}

/**
 * Hook to manage databases in the config
 * Provides mutations for creating, updating, and deleting databases
 *
 * @param namespace - The project namespace
 * @param projectId - The project identifier
 * @returns Mutation hooks for database operations
 */
export const useDatabaseManager = (namespace: string, projectId: string) => {
  const queryClient = useQueryClient()
  const updateProjectMutation = useUpdateProject()

  /**
   * Create a new database
   */
  const createDatabase = useMutation({
    mutationFn: async ({
      database,
      projectConfig,
    }: {
      database: Database
      projectConfig: any
    }) => {
      if (!namespace || !projectId || !projectConfig) {
        throw new Error('Missing required parameters for database creation')
      }

      // Get or initialize rag.databases
      const rag = projectConfig.rag || {}
      const databases = rag.databases || []

      // Check if database name already exists
      const exists = databases.some((db: any) => db.name === database.name)
      if (exists) {
        throw new Error(
          `Database "${database.name}" already exists. Please use a different name.`
        )
      }

      // Add new database
      const updatedDatabases = [...databases, database]

      // Build updated config
      const nextConfig = {
        ...projectConfig,
        rag: {
          ...rag,
          databases: updatedDatabases,
        },
      }

      // Update project via API
      return await updateProjectMutation.mutateAsync({
        namespace,
        projectId,
        request: { config: nextConfig },
      })
    },
    onSuccess: () => {
      // Invalidate project config to trigger refetch
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(namespace, projectId),
      })
    },
    onError: (error) => {
      console.error('Failed to create database:', error)
    },
  })

  /**
   * Update an existing database
   */
  const updateDatabase = useMutation({
    mutationFn: async ({
      oldName,
      updates,
      projectConfig,
      datasetUpdates,
    }: {
      oldName: string
      updates: Partial<Database>
      projectConfig: any
      datasetUpdates?: Array<{ name: string; database: string }>
    }) => {
      if (!namespace || !projectId || !projectConfig) {
        throw new Error('Missing required parameters for database update')
      }

      // Get or initialize rag.databases
      const rag = projectConfig.rag || {}
      const databases = rag.databases || []

      // Find database by name
      const databaseIndex = databases.findIndex(
        (db: any) => db.name === oldName
      )

      if (databaseIndex === -1) {
        throw new Error(`Database "${oldName}" not found in config`)
      }

      // If renaming, check new name doesn't exist
      if (updates.name && updates.name !== oldName) {
        const nameExists = databases.some(
          (db: any) => db.name === updates.name
        )
        if (nameExists) {
          throw new Error(
            `Database "${updates.name}" already exists. Please use a different name.`
          )
        }
      }

      // Update the database
      const updatedDatabases = [...databases]
      updatedDatabases[databaseIndex] = {
        ...updatedDatabases[databaseIndex],
        ...updates,
      }

      // Update datasets if database was renamed
      let updatedDatasets = projectConfig.datasets || []
      if (datasetUpdates && datasetUpdates.length > 0) {
        updatedDatasets = updatedDatasets.map((ds: any) => {
          const update = datasetUpdates.find((u) => u.name === ds.name)
          if (update) {
            return { ...ds, database: update.database }
          }
          return ds
        })
      }

      // Build updated config
      const nextConfig = {
        ...projectConfig,
        rag: {
          ...rag,
          databases: updatedDatabases,
        },
        datasets: updatedDatasets,
      }

      // Update project via API
      return await updateProjectMutation.mutateAsync({
        namespace,
        projectId,
        request: { config: nextConfig },
      })
    },
    onSuccess: () => {
      // Invalidate project config to trigger refetch
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(namespace, projectId),
      })
    },
    onError: (error) => {
      console.error('Failed to update database:', error)
    },
  })

  /**
   * Delete a database
   */
  const deleteDatabase = useMutation({
    mutationFn: async ({
      databaseName,
      projectConfig,
      reassignTo,
    }: {
      databaseName: string
      projectConfig: any
      reassignTo?: string
    }) => {
      if (!namespace || !projectId || !projectConfig) {
        throw new Error('Missing required parameters for database deletion')
      }

      // Get or initialize rag.databases
      const rag = projectConfig.rag || {}
      const databases = rag.databases || []

      // Filter out the database
      const updatedDatabases = databases.filter(
        (db: any) => db.name !== databaseName
      )

      if (updatedDatabases.length === databases.length) {
        throw new Error(`Database "${databaseName}" not found in config`)
      }

      // Update datasets that were using this database
      let updatedDatasets = projectConfig.datasets || []
      if (reassignTo) {
        updatedDatasets = updatedDatasets.map((ds: any) => {
          if (ds.database === databaseName) {
            return { ...ds, database: reassignTo }
          }
          return ds
        })
      }

      // Build updated config
      const nextConfig = {
        ...projectConfig,
        rag: {
          ...rag,
          databases: updatedDatabases,
        },
        datasets: updatedDatasets,
      }

      // Update project via API
      return await updateProjectMutation.mutateAsync({
        namespace,
        projectId,
        request: { config: nextConfig },
      })
    },
    onSuccess: () => {
      // Invalidate project config to trigger refetch
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(namespace, projectId),
      })
    },
    onError: (error) => {
      console.error('Failed to delete database:', error)
    },
  })

  return {
    createDatabase,
    updateDatabase,
    deleteDatabase,
    isUpdating:
      createDatabase.isPending ||
      updateDatabase.isPending ||
      deleteDatabase.isPending,
  }
}

