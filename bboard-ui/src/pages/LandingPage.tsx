import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mark, Arrow } from '../components/AppHeader';
import { usePageSeo } from '../hooks';

const researchPhoto =
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400';
const hospitalPhoto =
  'https://images.unsplash.com/photo-1579154204449-47c454770447?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1000';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  usePageSeo({
    title: 'Membrane — Privacy-Preserving Clinical Trials on Midnight',
    description:
      'Zero-knowledge clinical research and hospital cohort recruitment platform built on the Midnight Network.',
  });

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="brand" to="/">
          <img src="/membrane-logo.png" alt="Membrane logo" className="brand-logo h-10 w-10" />
          Membrane
        </Link>
        <nav>
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#for-teams">For teams</a>
        </nav>
        <button type="button" onClick={() => navigate('/lab')}>
          Launch app <Arrow />
        </button>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">
              <i /> Built on Midnight
            </span>
            <h1>
              Find the right health data.
              <br />
              <em>Reveal none of it.</em>
            </h1>
            <p>
              Membrane lets research labs verify that hospitals hold the data needed for a study without a single
              patient record leaving hospital walls.
            </p>
            <div className="hero-actions">
              <button type="button" className="landing-primary" onClick={() => navigate('/lab')}>
                Create a data request <Arrow />
              </button>
              <a href="#how">See how it works</a>
            </div>
            <div className="hero-proof">
              <span>Zero raw data shared</span>
              <i />
              <span>Proofs generated locally</span>
              <i />
              <span>Results verified on-chain</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <img src={researchPhoto} alt="Medical researcher working with clinical laboratory equipment" />
              <span className="image-shade" />
              <div className="photo-caption">
                <span>Research lab</span>
                <strong>Define the cohort, not the patients.</strong>
              </div>
            </div>
            <div className="verification-card">
              <div className="verification-top">
                <span className="check-mark">✓</span>
                <div>
                  <small>Proof verified</small>
                  <strong>Cohort criteria met</strong>
                </div>
              </div>
              <div className="proof-line">
                <span>ICD K30</span>
                <span>Ages 40–65</span>
                <span>≥ 200</span>
              </div>
              <p>
                <i /> No patient records received
              </p>
            </div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
          </div>
        </section>

        <section className="trust-row">
          <span>PRIVATE DISCOVERY FOR</span>
          <strong>Clinical research</strong>
          <i />
          <strong>Hospital networks</strong>
          <i />
          <strong>Life sciences</strong>
          <i />
          <strong>Public health</strong>
        </section>

        <section className="how-section" id="how">
          <div className="section-heading">
            <span>How it works</span>
            <h2>
              A clear answer without
              <br />
              exposing the evidence.
            </h2>
            <p>Three steps replace weeks of manual data feasibility checks.</p>
          </div>
          <div className="step-grid">
            <article>
              <span className="step-number">01</span>
              <div className="step-art criteria-art">
                <b>K30</b>
                <i>40–65</i>
                <i>≥ 200</i>
              </div>
              <h3>Lab defines the criteria</h3>
              <p>
                The research lab publishes a public predicate: condition, cohort size, age range, and can choose to
                deactivate trial enrollment when they have gotten enough hospital partners.
              </p>
            </article>
            <article>
              <span className="step-number">02</span>
              <div className="step-art private-art">
                <span className="mini-db">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mini-lock">🔒</span>
                <b>Local proof</b>
              </div>
              <h3>Hospital proves locally</h3>
              <p>A proof server evaluates private records inside the hospital's environment. The records never move.</p>
            </article>
            <article>
              <span className="step-number">03</span>
              <div className="step-art verified-art">
                <span>✓</span>
                <b>QUALIFIED</b>
                <i />
              </div>
              <h3>Midnight verifies the result</h3>
              <p>The lab receives a verified proof and can begin a governed data-use negotiation.</p>
            </article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div className="privacy-copy">
            <span className="section-tag">Privacy architecture</span>
            <h2>
              Public coordination.
              <br />
              <em>Private computation.</em>
            </h2>
            <p>
              Membrane follows Midnight's dual-state model. The request and result live on-chain; patient records and
              witness data stay within the hospital.
            </p>
            <div className="privacy-points">
              <div>
                <span>✓</span>
                <p>
                  <strong>Local by default</strong>
                  <small>Proof generation happens inside hospital infrastructure.</small>
                </p>
              </div>
              <div>
                <span>✓</span>
                <p>
                  <strong>Minimal disclosure</strong>
                  <small>Only the truth of the requested predicate is revealed.</small>
                </p>
              </div>
            </div>
          </div>
          <div
            className="architecture-illustration"
            aria-label="Data request moves from the lab to Midnight while private records remain inside the hospital"
          >
            <div className="arch-zone public-zone">
              <small>PUBLIC NETWORK</small>
              <div className="arch-node">
                <span>R</span>
                <p>
                  <strong>Research lab</strong>
                  <small>Public criteria</small>
                </p>
              </div>
              <div className="arch-path">
                <i />
                <i />
                <i />
              </div>
              <div className="arch-node contract-node">
                <span>
                  <Mark />
                </span>
                <p>
                  <strong>Membrane</strong>
                  <small>Verified result</small>
                </p>
              </div>
            </div>
            <div className="privacy-wall">
              <span>PRIVACY BOUNDARY</span>
            </div>
            <div className="arch-zone private-zone">
              <small>HOSPITAL ENVIRONMENT</small>
              <div className="arch-node">
                <span>H</span>
                <p>
                  <strong>Hospital wallet</strong>
                  <small>Authorization</small>
                </p>
              </div>
              <div className="private-stack">
                <div>
                  <span className="stack-icon">P</span>
                  <p>
                    <strong>Proof server</strong>
                    <small>Local ZK compute</small>
                  </p>
                </div>
                <div>
                  <span className="stack-icon">D</span>
                  <p>
                    <strong>Private state</strong>
                    <small>Patient records</small>
                  </p>
                </div>
              </div>
              <span className="stays-here">Data stays here</span>
            </div>
          </div>
        </section>

        <section className="teams-section" id="for-teams">
          <div className="section-heading centered">
            <span>Built for both sides</span>
            <h2>One protocol. Two simple workflows.</h2>
          </div>
          <div className="team-grid">
            <article className="team-card lab-card">
              <div>
                <span>FOR RESEARCH LABS</span>
                <h3>Discover qualified data partners faster.</h3>
                <p>Publish cohort criteria, receive verified matches, and move directly into partner negotiation.</p>
                <button type="button" onClick={() => navigate('/lab')}>
                  Open lab workspace <Arrow />
                </button>
              </div>
              <div className="team-visual lab-team-visual">
                <div className="floating-request">
                  <small>ACTIVE REQUEST</small>
                  <strong>Digestive Health Outcomes</strong>
                  <span>
                    <i /> 2 qualified hospitals
                  </span>
                </div>
              </div>
            </article>
            <article className="team-card hospital-card">
              <div>
                <span>FOR HOSPITALS</span>
                <h3>Prove eligibility. Keep custody.</h3>
                <p>Respond to promising studies without exposing identities, rows, or exact cohort membership.</p>
                <button type="button" onClick={() => navigate('/hospital')}>
                  Open hospital workspace <Arrow />
                </button>
              </div>
              <div className="team-photo">
                <img src={hospitalPhoto} alt="Clinical researcher working securely inside a laboratory" />
                <span>Records remain local</span>
              </div>
            </article>
          </div>
        </section>

        <section className="final-cta">
          <div>
            <span>Private data discovery starts here</span>
            <h2>
              Ask the data.
              <br />
              Don't take the data.
            </h2>
          </div>
          <button type="button" onClick={() => navigate('/lab')}>
            Launch Membrane <Arrow />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="brand" to="/">
          <img src="/membrane-logo.png" alt="Membrane logo" className="brand-logo h-10 w-10" />
          Membrane
        </Link>
        <p>Zero-knowledge health data discovery on Midnight.</p>
      </footer>
    </div>
  );
};
