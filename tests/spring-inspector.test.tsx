import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_PARAMETERS, deriveModel, sampleModel } from '../src/physics/model';
import { COMPOUND_SPRINGS, compoundSpringCharacteristics } from '../src/physics/compoundSprings';
import { CompoundSpringScene } from '../src/components/CompoundSpringScene';
import { SpringInspector } from '../src/components/SpringInspector';

const p = { ...DEFAULT_PARAMETERS, m: 3, k1: 10, k2: 30, k3: 20, k4: 60, k5: 90, x0: .23 };

describe('selected physical spring characteristics', () => {
  it('reports individual forces, extensions and energies without treating a pair as one physical spring', () => {
    // Independent junction solution: A=.06 m, B=.10 m, C=.13 m; final mass=.23 m.
    const extensions = [.06, .06, .04, .03, .03, .13, .1];
    const forces = [.6, .6, 1.2, .6, .6, 7.8, 9];
    const energies = [.018, .018, .024, .009, .009, .507, .45];
    for (let index = 0; index < 7; index++) {
      const spring = compoundSpringCharacteristics(p, .23, index)!;
      expect(spring.extension).toBeCloseTo(extensions[index], 12);
      expect(spring.forceMagnitude).toBeCloseTo(forces[index], 12);
      expect(spring.vibrationEnergy).toBeCloseTo(energies[index], 12);
      expect(spring.compliance).toBe(1 / p[spring.parameter]);
    }
  });

  it('keeps paired stiffness edits linked and single-spring edits local to the chosen parameter', () => {
    expect(COMPOUND_SPRINGS.map(spring => spring.parameter)).toEqual(['k1', 'k1', 'k2', 'k3', 'k3', 'k4', 'k5']);
    const changed = { ...p, k1: 50 };
    expect(compoundSpringCharacteristics(changed, .23, 0)?.stiffness).toBe(50);
    expect(compoundSpringCharacteristics(changed, .23, 1)?.pairStiffness).toBe(100);
    expect(compoundSpringCharacteristics(changed, .23, 2)?.stiffness).toBe(30);
    expect(compoundSpringCharacteristics(changed, .23, 3)?.stiffness).toBe(20);
    expect(compoundSpringCharacteristics(changed, .23, 6)?.stiffness).toBe(90);
  });

  it('reverses deformation while retaining force magnitude and quadratic energy, and handles equilibrium', () => {
    for (let index = 0; index < 7; index++) {
      const positive = compoundSpringCharacteristics(p, .23, index)!;
      const negative = compoundSpringCharacteristics(p, -.23, index)!;
      const rest = compoundSpringCharacteristics(p, 0, index)!;
      expect(negative.extension).toBe(-positive.extension);
      expect(negative.forceMagnitude).toBe(positive.forceMagnitude);
      expect(negative.vibrationEnergy).toBe(positive.vibrationEnergy);
      expect(rest.forceMagnitude).toBe(0);
      expect(rest.vibrationEnergy).toBe(0);
    }
    expect(compoundSpringCharacteristics(p, .23, -1)).toBeUndefined();
    expect(compoundSpringCharacteristics(p, .23, 7)).toBeUndefined();
  });
});

describe('spring inspector access and presentation', () => {
  it('exposes seven keyboard-accessible spring targets only on simulation 05, even with labels hidden', () => {
    for (const problem of ['compound', 'compound-inverted'] as const) {
      const html = renderToStaticMarkup(<CompoundSpringScene parameters={p} model={deriveModel(problem, p)}
        snapshot={sampleModel(problem, p, 0)} labels={false} forces onDrag={() => {}} onBeginDrag={() => {}}
        onRelease={() => {}} onSpringChange={() => {}} />);
      expect((html.match(/role="button"/g) ?? []).length).toBe(problem === 'compound-inverted' ? 7 : 0);
      if (problem === 'compound-inverted') {
        for (const spring of COMPOUND_SPRINGS) expect(html).toContain(`aria-label="Inspect ${spring.name}"`);
        expect((html.match(/class="spring-hit-target"/g) ?? []).length).toBe(7);
      }
    }
  });

  it('identifies the selected spring and provides labeled editing controls and per-spring measurements', () => {
    const html = renderToStaticMarkup(<SpringInspector id="selected-spring" index={0} parameters={p}
      snapshot={sampleModel('compound-inverted', p, 0)} onChange={() => {}} onClose={() => {}} />);
    expect(html).toContain('k₁ · left spring');
    expect(html).toContain('Floor support');
    expect(html).toContain('Changing it updates both springs');
    expect(html).toContain('aria-label="Stiffness k₁"');
    expect(html).toContain('aria-label="Stiffness k₁ slider"');
    expect(html).toContain('selected-spring-k1');
    expect(html).toContain('Compliance 1/k');
    expect(html).toContain('Vibration energy ½kδ²');
    expect(html).toContain('Close spring inspector');
  });
});
