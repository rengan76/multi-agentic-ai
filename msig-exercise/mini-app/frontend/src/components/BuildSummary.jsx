import { useState, useEffect } from 'react'

function BuildSummary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/build-summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading build summary...</div>
  if (!summary) return <div className="loading">No build summary available</div>

  return (
    <div>
      <div className="card">
        <h2>Build Summary</h2>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
          Built by: {summary.builtBy}
        </p>

        <div className="summary-section">
          <h4>Feature: {summary.feature}</h4>
        </div>

        <div className="summary-section">
          <h4>User Stories</h4>
          <ul className="stories-list">
            {summary.stories && summary.stories.map(story => (
              <li key={story.id}>
                <span className="story-id">[{story.id}]</span>
                {story.title} — <em style={{ color: '#888' }}>{story.acceptance}</em>
              </li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          <h4>API Endpoints</h4>
          <ul className="endpoint-list">
            {summary.endpoints && summary.endpoints.map((ep, i) => (
              <li key={i}>
                <span className="method">{ep.method}</span>
                {ep.path} — {ep.desc}
              </li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          <h4>Generated Files</h4>
          <ul className="endpoint-list">
            {summary.files && summary.files.map((f, i) => (
              <li key={i}>📄 {f}</li>
            ))}
          </ul>
        </div>

        {summary.tests && (
          <div className="summary-section">
            <h4>Test Results</h4>
            <ul className="endpoint-list">
              {summary.tests.map((t, i) => (
                <li key={i}>
                  {t.passed ? '✅' : '❌'} {t.endpoint}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuildSummary
