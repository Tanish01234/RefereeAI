'use client';

import { useState, useEffect } from 'react';
import { RefereeAIResponse } from '@/lib/refereeai-core';

export default function Home() {
  const [mode, setMode] = useState<'landing' | 'app'>('landing');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RefereeAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    // Show feedback form after 5 seconds
    const timer = setTimeout(() => {
      const hasSeenFeedback = sessionStorage.getItem('refereeai_feedback_seen');
      if (!hasSeenFeedback) {
        setShowFeedback(true);
        sessionStorage.setItem('refereeai_feedback_seen', 'true');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    setMode('app');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/referee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Failed to analyze decision');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would send feedback to your backend
    console.log('Feedback submitted:', { email: feedbackEmail, feedback: feedbackText });

    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  const getOptionName = (optionId: string) => {
    return response?.options.find((opt) => opt.id === optionId)?.name || optionId;
  };

  return (
    <div className="container">
      {/* LANDING SCREEN */}
      {mode === 'landing' && (
        <div className="landing-screen">
          {/* Hero Section */}
          <section className="landing-hero">
            <h1 className="landing-hero-heading">
              Not sure what to choose? RefereeAI breaks it down.
            </h1>
            <p className="landing-hero-subtext">
              RefereeAI compares options, explains trade-offs, and helps you choose — without deciding for you.
            </p>
          </section>

          {/* What RefereeAI Does */}
          <section className="what-it-does">
            <div className="features-grid">
              <div className="feature-card">
                <h3>Compares realistic options</h3>
                <p>See your choices side by side with real strengths, weaknesses, and trade-offs.</p>
              </div>
              <div className="feature-card">
                <h3>Surfaces hidden risks</h3>
                <p>Discover what you might overlook — time costs, learning curves, and long-term impacts.</p>
              </div>
              <div className="feature-card">
                <h3>Gives conditional guidance</h3>
                <p>Get context-aware suggestions based on your priorities, not generic advice.</p>
              </div>
            </div>
          </section>

          {/* What RefereeAI Does NOT Do */}
          <section className="what-it-doesnt-do">
            <div className="trust-builder">
              <p className="trust-builder-label">What RefereeAI does not do:</p>
              <ul className="trust-list">
                <li>Does not tell you what's "best"</li>
                <li>Does not replace your judgment</li>
                <li>Does not push a single answer</li>
              </ul>
            </div>
          </section>

          {/* Primary CTA */}
          <section className="landing-cta">
            <button className="primary-cta" onClick={handleGetStarted}>
              Get Started
            </button>
          </section>
        </div>
      )}

      {/* APP SCREEN */}
      {mode === 'app' && (
        <div className="app-screen">
          {/* Hero Section - Command Attention */}
          <section className="hero">
            <h1 className="hero-heading">
              Think clearly. Decide confidently.
            </h1>
            <p className="hero-subtext">
              Compare your options and understand the trade-offs.
            </p>
          </section>

          {/* Decision Input Section - Command Interface */}
          <section className="decision-input-section">
            <label className="input-label" htmlFor="decision-input">
              What are you choosing between?
            </label>
            <form onSubmit={handleSubmit}>
              <div className="input-card">
                <textarea
                  id="decision-input"
                  className="decision-textarea"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="React vs Django for my next project&#10;MVP now or wait?&#10;AWS or GCP for a small startup?"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="cta-button"
                  disabled={loading || !query.trim()}
                >
                  {loading ? 'Breaking the decision down…' : 'Get Clarity'}
                </button>
              </div>
            </form>

            {/* Contextual Examples */}
            {!response && !loading && (
              <div className="decision-examples">
                <p className="examples-intro">Not sure how to phrase it? Examples:</p>
                <div className="examples-list">
                  <button
                    type="button"
                    className="example-item"
                    onClick={() => setQuery("Should I learn React or Django first?")}
                  >
                    Should I learn React or Django first?
                  </button>
                  <button
                    type="button"
                    className="example-item"
                    onClick={() => setQuery("MVP now or wait until the product feels complete?")}
                  >
                    MVP now or wait until the product feels complete?
                  </button>
                  <button
                    type="button"
                    className="example-item"
                    onClick={() => setQuery("Job hunt immediately or spend time building a strong portfolio?")}
                  >
                    Job hunt immediately or spend time building a strong portfolio?
                  </button>
                  <button
                    type="button"
                    className="example-item"
                    onClick={() => setQuery("Freelancing for flexibility or full-time for stability?")}
                  >
                    Freelancing for flexibility or full-time for stability?
                  </button>
                  <button
                    type="button"
                    className="example-item"
                    onClick={() => setQuery("Move to a new city for growth or stay where I am?")}
                  >
                    Move to a new city for growth or stay where I am?
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Philosophy - Footer Whisper */}
          {!response && (
            <div className="philosophy-whisper">
              <span>Clarity begins with the question</span>
              <span>Options reveal themselves</span>
              <span>Trade-offs define the choice</span>
              <span>The decision stays yours</span>
            </div>
          )}


          {/* Error State */}
          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading">
              <p className="loading-text">Analyzing the trade-offs…</p>
            </div>
          )}

          {/* Output Section - Structured & Serious */}
          {response && (
            <section className="output-section">
              {/* Decision Context */}
              <div className="output-block">
                <h2 className="output-block-title">Decision Context</h2>
                <div className="decision-context">
                  <p>
                    <strong>Decision:</strong> {response.decisionContext.restatement}
                  </p>
                  {response.decisionContext.goals.length > 0 && (
                    <div>
                      <strong>Goals:</strong>
                      <ul>
                        {response.decisionContext.goals.map((goal, idx) => (
                          <li key={idx}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {response.decisionContext.constraints.length > 0 && (
                    <div>
                      <strong>Constraints:</strong>
                      <ul>
                        {response.decisionContext.constraints.map((constraint, idx) => (
                          <li key={idx}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="output-block">
                <h2 className="output-block-title">Options</h2>
                <div className="options-grid">
                  {response.options.map((option) => (
                    <div key={option.id} className="option-card">
                      <h4>{option.name}</h4>
                      <p>{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison */}
              <div className="output-block">
                <h2 className="output-block-title">Comparison</h2>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th>Strengths</th>
                      <th>Weaknesses</th>
                      <th>Time & Effort</th>
                      <th>Learning Curve</th>
                      <th>Scalability</th>
                      <th>Hidden Risks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.comparison.map((comp) => (
                      <tr key={comp.optionId}>
                        <td>
                          <strong>{getOptionName(comp.optionId)}</strong>
                        </td>
                        <td>
                          <ul className="comparison-list">
                            {comp.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          <ul className="comparison-list">
                            {comp.weaknesses.map((weakness, idx) => (
                              <li key={idx}>{weakness}</li>
                            ))}
                          </ul>
                        </td>
                        <td>{comp.timeEffort}</td>
                        <td>{comp.learningCurve}</td>
                        <td>{comp.scalability}</td>
                        <td>
                          <ul className="comparison-list">
                            {comp.hiddenRisks.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Trade-offs */}
              <div className="output-block">
                <h2 className="output-block-title">Trade-off Analysis</h2>
                {response.tradeOffs.map((tradeoff) => (
                  <div key={tradeoff.optionId} className="tradeoff-card">
                    <h4>{getOptionName(tradeoff.optionId)}</h4>
                    <div className="tradeoff-section">
                      <strong>What you gain</strong>
                      <ul>
                        {tradeoff.gains.map((gain, idx) => (
                          <li key={idx}>{gain}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="tradeoff-section">
                      <strong>What you give up</strong>
                      <ul>
                        {tradeoff.sacrifices.map((sacrifice, idx) => (
                          <li key={idx}>{sacrifice}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="tradeoff-section">
                      <strong>Risks you accept</strong>
                      <ul>
                        {tradeoff.risks.map((risk, idx) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conditional Guidance */}
              <div className="output-block">
                <h2 className="output-block-title">Conditional Guidance</h2>
                {response.conditionalGuidance.map((guidance) => (
                  <div key={guidance.optionId} className="guidance-card">
                    <h4>{getOptionName(guidance.optionId)}</h4>
                    <ul>
                      {guidance.conditions.map((condition, idx) => (
                        <li key={idx}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Referee Note */}
              <div className="referee-note">
                <p>{response.refereeNote}</p>
              </div>
            </section>
          )}
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div className="feedback-overlay" onClick={() => setShowFeedback(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            {!feedbackSubmitted ? (
              <>
                <button
                  className="feedback-close"
                  onClick={() => setShowFeedback(false)}
                  aria-label="Close feedback form"
                >
                  ×
                </button>
                <h3 className="feedback-title">Have thoughts? We're listening.</h3>
                <p className="feedback-subtext">
                  RefereeAI is still evolving. If something feels unclear—or helpful—we'd love to know.
                </p>
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="feedback-field">
                    <label htmlFor="feedback-email">Email (optional)</label>
                    <input
                      id="feedback-email"
                      type="email"
                      className="feedback-input"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="feedback-field">
                    <label htmlFor="feedback-text">Your thoughts</label>
                    <textarea
                      id="feedback-text"
                      className="feedback-textarea"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="What's working? What could be clearer?"
                      required
                    />
                  </div>
                  <button type="submit" className="feedback-submit">
                    Share feedback
                  </button>
                </form>
              </>
            ) : (
              <div className="feedback-success">
                <p>Thank you. Your feedback helps shape RefereeAI.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


