import { compoundDeformation, deriveCompoundStiffness, type Model, type Parameters, type Snapshot } from '../physics/model';
import { MathFormula } from '../ui/Math';
import './SpringNetworkInfo.css';
import './CompoundSpringInfo.css';

export type CompoundSpringInfoProps = { parameters: Parameters; model: Model; snapshot: Snapshot };
function value(number: number): string {
  if (!Number.isFinite(number)) return '—';
  return Math.abs(number) < 1e-9 ? '0' : Number(number.toPrecision(4)).toString();
}
function signed(number: number): string { return `${number > 1e-9 ? '+' : ''}${value(number)}`; }
function tex(number: number): string {
  const [coefficient, exponent] = value(number).split('e');
  return exponent ? `${coefficient}\\times10^{${Number(exponent)}}` : coefficient;
}

/** Explanation for the seven-spring compound network, distinct from the five-spring problem. */
export function CompoundSpringInfo({ parameters: p, model, snapshot: s }: CompoundSpringInfoProps) {
  const stiffness = deriveCompoundStiffness(p);
  const d = compoundDeformation(p, s.x);
  const values = [p.k1, p.k1, p.k2, p.k3, p.k3, p.k4, p.k5];
  const names = ['k₁ · left', 'k₁ · right', 'k₂', 'k₃ · left', 'k₃ · right', 'k₄', 'k₅'];
  const paths = ['Upper parallel pair', 'Upper parallel pair', 'Middle of left branch', 'Lower parallel pair', 'Lower parallel pair', 'Ceiling to collector C', 'Collector C to mass'];

  return <details className="spring-network-info compound-spring-info">
    <summary>more info</summary>
    <div className="spring-network-info__content">
      <header className="spring-network-info__heading">
        <span className="eyebrow">INSIDE THE COMPOUND NETWORK</span>
        <h3>Seven springs. Reduce the connections in order.</h3>
        <p>The two upper k₁ springs form a parallel pair. That pair, k₂ and the two lower k₃ springs form the left series branch. The long k₄ spring is parallel with this entire left branch. Finally, k₅ connects their collector to the mass in series.</p>
      </header>
      <div className="spring-network-info__overview compound-spring-info__reductions">
        <section className="spring-network-info__reduction">
          <h4>1 / Combine each identical parallel pair</h4>
          <MathFormula tex={String.raw`k_{\mathrm{top}}=k_1+k_1=2k_1`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`k_{\mathrm{top}}=2(${tex(p.k1)})=${tex(stiffness.kTop)}\;\mathrm{N/m}`} />
          <MathFormula tex={String.raw`k_{\mathrm{bottom}}=k_3+k_3=2k_3`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`k_{\mathrm{bottom}}=2(${tex(p.k3)})=${tex(stiffness.kBottom)}\;\mathrm{N/m}`} />
          <p>Each pair shares one deformation. Its two spring forces add.</p>
        </section>
        <section className="spring-network-info__reduction">
          <h4>2 / Reduce the left series branch</h4>
          <MathFormula tex={String.raw`k_L=\left(\frac1{2k_1}+\frac1{k_2}+\frac1{2k_3}\right)^{-1}`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`\begin{aligned}k_L&=\left(\frac1{${tex(stiffness.kTop)}}+\frac1{${tex(p.k2)}}+\frac1{${tex(stiffness.kBottom)}}\right)^{-1}\\&=${tex(stiffness.kLeft)}\;\mathrm{N/m}\end{aligned}`} />
          <p>The top pair, middle spring and bottom pair carry the same total left-branch force. Their deformations add.</p>
        </section>
        <section className="spring-network-info__reduction">
          <h4>3 / Put the left branch in parallel with k₄</h4>
          <MathFormula tex={String.raw`k_P=k_L+k_4`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`k_P=${tex(stiffness.kLeft)}+${tex(p.k4)}=${tex(stiffness.kParallel)}\;\mathrm{N/m}`} />
          <p>Both paths run from the fixed ceiling to collector C, so both have total deformation dC. Their forces add at C.</p>
        </section>
        <section className="spring-network-info__reduction">
          <h4>4 / Connect the final k₅ spring in series</h4>
          <MathFormula tex={String.raw`k_{\mathrm{eq}}=\frac{k_Pk_5}{k_P+k_5}`} />
          <MathFormula className="spring-network-info__substitution" tex={String.raw`\begin{aligned}k_{\mathrm{eq}}&=\frac{${tex(stiffness.kParallel)}(${tex(p.k5)})}{${tex(stiffness.kParallel)}+${tex(p.k5)}}\\&=${tex(stiffness.kEquivalent)}\;\mathrm{N/m}\end{aligned}`} />
          <p>The ceiling-to-collector assembly and k₅ split the total mass displacement x. Only k₅ touches the mass.</p>
        </section>
      </div>

      <section className="compound-spring-info__nodes" aria-label="Solved junction motion">
        <h4>Each junction moves by its own amount</h4>
        <p>All displacements below are measured downward from loaded equilibrium. The rigid bars A, B and C have no mass. The scene uses these solved displacements for every spring endpoint.</p>
        <div className="compound-spring-info__node-layout">
          <MathFormula tex={String.raw`\begin{aligned}
            d_C&=\frac{k_5}{k_P+k_5}x\\
            d_A&=\frac{k_L}{2k_1}d_C\\
            d_B&=d_A+\frac{k_L}{k_2}d_C
          \end{aligned}`} />
          <dl>
            <div><dt>Mass displacement x</dt><dd>{signed(s.x)} <small>m</small></dd></div>
            <div><dt>A · below upper pair</dt><dd>{signed(d.upperJunction)} <small>m</small></dd></div>
            <div><dt>B · below k₂</dt><dd>{signed(d.lowerJunction)} <small>m</small></dd></div>
            <div><dt>C · collector above k₅</dt><dd>{signed(d.collector)} <small>m</small></dd></div>
          </dl>
        </div>
      </section>

      <section aria-label="Seven individual spring values">
        <div className="spring-network-info__section-heading"><h4>All seven physical springs</h4><span>t = {value(s.time)} s</span></div>
        <p>Stiffness is a physical setting. Deformation δ is the change from loaded equilibrium: positive is stretch, negative is compression. The force values are incremental magnitudes; static preload is excluded.</p>
        <div className="spring-network-info__springs compound-spring-info__springs">
          {names.map((name, index) => <article className={`spring-network-info__spring${index === 6 ? ' compound-spring-info__final-spring' : ''}`} key={name}>
            <header><h5>{name}</h5>{index === 6 && <span>ON MASS</span>}</header>
            <p className="spring-network-info__stiffness"><strong>{value(values[index])}</strong><span> N/m</span></p>
            <p className="spring-network-info__path">{paths[index]}</p>
            <dl>
              <div><dt>Deformation δ</dt><dd>{signed(d.extensions[index])} <small>m</small></dd></div>
              <div><dt>{index === 6 ? 'Mass force magnitude' : 'Internal force magnitude'}</dt><dd>{value(Math.abs(d.forces[index]))} <small>N</small></dd></div>
            </dl>
          </article>)}
        </div>
        <MathFormula tex={String.raw`\begin{aligned}
          \delta_{1a}=\delta_{1b}&=d_A\\
          \delta_2&=d_B-d_A\\
          \delta_{3a}=\delta_{3b}&=d_C-d_B\\
          \delta_4&=d_C,\qquad\delta_5=x-d_C
        \end{aligned}`} />
      </section>

      <section className="spring-network-info__force">
        <div>
          <h4>Follow the force to the mass</h4>
          <MathFormula tex={String.raw`\begin{aligned}
            F_L&=2F_1=F_2=2F_3\\
            F_5&=F_L+F_4\\
            F_{\mathrm{mass}}&=F_5=-k_5(x-d_C)\\
            &=-k_{\mathrm{eq}}x
          \end{aligned}`} />
          <p>F₁ and F₃ each denote one spring in their identical pair. The force splits between parallel paths and recombines at the collector. Do not add all seven internal forces as if they each acted on the mass.</p>
        </div>
        <div className="spring-network-info__force-values">
          <dl>
            <div><dt>Left branch F_L</dt><dd>{signed(d.forces[2])} <small>N</small></dd></div>
            <div><dt>Long spring F₄</dt><dd>{signed(d.forces[5])} <small>N</small></dd></div>
            <div className="spring-network-info__force-total"><dt>Only k₅ acts on the mass</dt><dd>{signed(d.forces[6])} <small>N</small></dd></div>
            <div><dt>Equivalent −k_eq x</dt><dd>{signed(-model.linearStiffness * s.x)} <small>N</small></dd></div>
          </dl>
          <p>Negative is upward; positive is downward. These are restoring-force signs for the downward-positive coordinate. Displayed values are rounded.</p>
        </div>
      </section>
    </div>
  </details>;
}

export default CompoundSpringInfo;
