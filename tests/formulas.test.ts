import { describe, expect, it } from 'vitest'
import katex from 'katex'
import { formulaCatalog, searchFormulas } from '../src/physics/formulaCatalog'
import { referencePhotos } from '../src/physics/referencePhotos'

describe('formula reference library', () => {
  it('renders every equation without mathematical syntax errors', () => {
    for (const entry of formulaCatalog) {
      for (const tex of entry.tex) {
        expect(() => katex.renderToString(tex, { throwOnError: true, strict: 'error' }), `${entry.id}: ${tex}`).not.toThrow()
      }
    }
  })
  it('has unique IDs and explicit provenance for every topic', () => {
    expect(new Set(formulaCatalog.map(entry => entry.id)).size).toBe(formulaCatalog.length)
    for (const entry of formulaCatalog) {
      expect(entry.tex.length, entry.id).toBeGreaterThan(0)
      expect(entry.sources.length > 0 || entry.reconstructed === true, entry.id).toBe(true)
      expect(entry.description, entry.id).not.toBe('')
      expect(entry.usage, entry.id).not.toBe('')
    }
  })
  it('indexes all 38 supplied lecture photos, including conceptual pages', () => {
    const sources = new Set(referencePhotos.map(entry => entry.file))
    expect(sources.size).toBe(38)
    for (let number = 5897; number <= 5934; number++) {
      expect(sources.has(number === 5903 ? 'IMG_5903 2.HEIC' : `IMG_${number}.HEIC`), `Missing IMG_${number}`).toBe(true)
    }
  })
  it('finds underlying steps and keeps lecture variants outside active model groups', () => {
    expect(searchFormulas('chain').length).toBeGreaterThan(0)
    expect(searchFormulas('chain rule').length).toBeGreaterThan(0)
    expect(searchFormulas('series', 'network').length).toBeGreaterThan(0)
    expect(searchFormulas('IMG_5928').length).toBeGreaterThan(0)
    expect(searchFormulas('damping', 'network')).toHaveLength(0)
    expect(searchFormulas('damping', 'lecture').length).toBeGreaterThan(0)
  })
})
