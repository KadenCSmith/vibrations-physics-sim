import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_PARAMETERS, deriveModel, sampleModel, type ProblemId } from '../src/physics/model';
import { CompoundSpringScene } from '../src/components/CompoundSpringScene';
import { EquationPanel } from '../src/ui/EquationPanel';

describe('compound scene orientation and equilibrium labeling', () => {
  it.each<ProblemId>(['compound', 'compound-inverted'])('keeps the whole mass visible at both release limits in %s', problem => {
    for (const x0 of [-.25, .25]) {
      const parameters = { ...DEFAULT_PARAMETERS, x0 };
      const model = deriveModel(problem, parameters);
      const snapshot = sampleModel(problem, parameters, 0);
      const html = renderToStaticMarkup(<CompoundSpringScene parameters={parameters} model={model} snapshot={snapshot}
        labels forces onDrag={() => {}} onRelease={() => {}} onBeginDrag={() => {}} />);
      const rect = html.match(/<rect[^>]*y="([^"]+)"[^>]*height="46"[^>]*class="mass-outline"/);
      expect(rect).not.toBeNull();
      const top = Number(rect![1]);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top + 46).toBeLessThanOrEqual(430);
      expect(html).toContain(`positive ${problem === 'compound-inverted' ? 'upward' : 'downward'}`);
    }
  });

  it('shows compressive static equilibrium with a negative gravity numerator only in the inverted scene', () => {
    for (const problem of ['compound', 'compound-inverted'] as const) {
      const parameters = { ...DEFAULT_PARAMETERS };
      const html = renderToStaticMarkup(<EquationPanel problem={problem} parameters={parameters}
        model={deriveModel(problem, parameters)} snapshot={sampleModel(problem, parameters, 0)} />);
      expect(html).not.toContain('katex-error');
      expect(html).toContain(problem === 'compound-inverted' ? String.raw`\Delta_s=-\frac{mg}` : String.raw`\Delta_s=\frac{mg}`);
    }
  });
});
