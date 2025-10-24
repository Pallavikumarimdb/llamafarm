/**
 * CodeMirror YAML Schema Linter
 * Provides synchronous linting for CodeMirror by caching validation results
 */

import { validateYAML, ValidationError } from './yamlSchemaValidator'

// Cache validation results
let lastContent = ''
let lastErrors: ValidationError[] = []
let validationInProgress = false

/**
 * Get diagnostics for CodeMirror (synchronous)
 * This function is called by CodeMirror on every change
 */
export function getYAMLDiagnostics(content: string): ValidationError[] {
  // Return cached results if content hasn't changed
  if (content === lastContent) {
    return lastErrors
  }

  // If validation is in progress, return last known results
  if (validationInProgress) {
    return lastErrors
  }

  // Start async validation in background
  validationInProgress = true
  validateYAML(content)
    .then(errors => {
      lastContent = content
      lastErrors = errors
      validationInProgress = false
    })
    .catch(error => {
      console.error('Validation error:', error)
      validationInProgress = false
    })

  // Return last known errors for now
  return lastErrors
}

/**
 * Clear the validation cache
 */
export function clearValidationCache() {
  lastContent = ''
  lastErrors = []
  validationInProgress = false
}
