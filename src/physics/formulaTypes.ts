import type { ProblemId } from './model'

export type FormulaScope = ProblemId | 'shared' | 'lecture'
export type FormulaEntry = {
  id: string
  title: string
  scope: FormulaScope
  group: string
  tex: string[]
  description: string
  usage: string
  sources: string[]
  reconstructed?: boolean
  correction?: string
  tags?: string[]
}
