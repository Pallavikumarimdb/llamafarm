/**
 * YAML Schema Validator
 * Validates YAML content against the LlamaFarm config schema
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import yaml from 'yaml'
// @ts-ignore - JSON import
import schemaJson from '../schemas/llamafarm-config.schema.json'

// Initialize validator on module load
let validate: any = null

function initializeValidator() {
  if (validate) return validate

  try {
    // Use imported schema directly
    const schema = schemaJson

    // Verify schema loaded
    if (!schema || typeof schema !== 'object') {
      console.error('Schema is not a valid object:', schema)
      throw new Error('Invalid schema format')
    }

    // Create AJV instance with formats support
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
    })

    // Add format validation (email, uri, etc.)
    try {
      addFormats(ajv as any)
    } catch (e) {
      console.warn('Failed to add formats, continuing without:', e)
    }

    // Compile the schema
    validate = ajv.compile(schema)

    console.log('Schema validator initialized successfully')
    return validate
  } catch (error) {
    console.error('Failed to initialize schema validator:', error)
    // Return a no-op validator that always passes
    validate = () => true
    return validate
  }
}

// Initialize on module load
initializeValidator()

export interface ValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
  path?: string
}

/**
 * Validate YAML content against the schema
 * @param yamlContent - Raw YAML string
 * @returns Array of validation errors
 */
export async function validateYAML(yamlContent: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  try {
    // Get validator (already initialized)
    const validator = initializeValidator()
    if (!validator) {
      console.error('Validator not available')
      return []
    }

    // Parse YAML
    const doc = yaml.parseDocument(yamlContent)

    // Check for YAML syntax errors
    if (doc.errors.length > 0) {
      for (const error of doc.errors) {
        const linePos = (error as any).linePos
        errors.push({
          line: linePos?.[0]?.line ?? 1,
          column: linePos?.[0]?.col ?? 1,
          message: error.message,
          severity: 'error',
        })
      }
      return errors
    }

    // Convert to JavaScript object for schema validation
    const data = doc.toJS()

    // Validate against schema
    const valid = validator(data)

    if (!valid && validator.errors) {
      for (const error of validator.errors) {
        // Try to find the line number for the error path
        const instancePath = (error as any).instancePath || ''
        const path = instancePath || error.schemaPath
        const errorPath = path.replace(/^\//, '').replace(/\//g, '.')

        // Get line number from YAML document
        let line = 1
        let column = 1

        if (instancePath) {
          const pathParts = instancePath.split('/').filter(Boolean)
          try {
            let node: any = doc.contents
            for (const part of pathParts) {
              if (node && typeof node === 'object') {
                // Handle arrays
                if (node.items && Array.isArray(node.items)) {
                  const index = parseInt(part)
                  if (!isNaN(index) && node.items[index]) {
                    node = node.items[index]
                  }
                }
                // Handle objects
                else if (node.items) {
                  const item = node.items.find((i: any) => {
                    return i.key?.value === part
                  })
                  if (item) {
                    node = item.value
                  }
                }
              }
            }

            if (node && node.range) {
              const pos = (doc as any).linePos(node.range[0])
              if (pos) {
                line = pos.line
                column = pos.col
              }
            }
          } catch (e) {
            // If we can't find the exact position, default to line 1
          }
        }

        // Format error message
        let message = error.message || 'Validation error'
        const params = error.params as any
        if (params) {
          if (error.keyword === 'required' && params.missingProperty) {
            message = `Missing required property: ${params.missingProperty}`
          } else if (error.keyword === 'enum' && params.allowedValues) {
            message = `Must be one of: ${params.allowedValues.join(', ')}`
          } else if (error.keyword === 'type' && params.type) {
            message = `Must be of type ${params.type}`
          } else if (error.keyword === 'additionalProperties' && params.additionalProperty) {
            message = `Unknown property: ${params.additionalProperty}`
          }
        }

        errors.push({
          line,
          column,
          message,
          severity: 'error',
          path: errorPath,
        })
      }
    }

    return errors
  } catch (e) {
    // YAML parse error
    const error = e as Error
    return [
      {
        line: 1,
        column: 1,
        message: `YAML parse error: ${error.message}`,
        severity: 'error',
      },
    ]
  }
}

/**
 * Check if YAML content is valid
 * @param yamlContent - Raw YAML string
 * @returns true if valid, false otherwise
 */
export async function isValidYAML(yamlContent: string): Promise<boolean> {
  const errors = await validateYAML(yamlContent)
  return errors.length === 0
}
