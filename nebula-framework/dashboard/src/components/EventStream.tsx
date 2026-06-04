import { useState, useEffect, useRef } from 'react'

interface Event {
  event: string
  data: Record<string, any>
  timestamp: string
}

export function EventStream() {
  const [events, setEvents] = useState<Event[]>([])
  const [connected, setConnected] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load history
    fetch('/api/events/history?limit=50')
      .then(r => r.json())
      .then(d => setEvents(d.history || []))
      .catch(() => {})

    // Connect SSE
    const source = new EventSource('/api/events')
    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)

    const eventTypes = [
      'workflow:started', 'workflow:completed', 'workflow:failed',
      'step:started', 'step:completed', 'step:failed', 'step:retrying',
      'gate:passed', 'gate:failed',
      'llm:request', 'llm:response',
    ]

    eventTypes.forEach(type => {
      source.addEventListener(type, (e: MessageEvent) => {
        const data = JSON.parse(e.data)
        setEvents(prev => [...prev.slice(-200), { event: type, data, timestamp: new Date().toISOString() }])
      })
    })

    return () => source.close()
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString()
    } catch {
      return '--:--:--'
    }
  }

  const getEventColor = (event: string): string => {
    if (event.includes('failed')) return 'var(--accent-red)'
    if (event.includes('completed') || event.includes('passed')) return 'var(--accent-green)'
    if (event.includes('retrying')) return 'var(--accent-yellow)'
    if (event.includes('started')) return 'var(--accent)'
    return 'var(--accent-purple)'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3>Live Event Stream</h3>
        <span style={{ fontSize: 12, color: connected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {connected ? '● Connected (SSE)' : '○ Disconnected'}
        </span>
      </div>

      <div className="event-log" ref={logRef}>
        {events.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No events yet. Execute a workflow to see real-time events.
          </div>
        )}
        {events.map((ev, i) => (
          <div key={i} className="event">
            <span className="time">{formatTime(ev.timestamp)}</span>
            <span className="type" style={{ color: getEventColor(ev.event) }}>{ev.event}</span>
            <span className="detail">
              {ev.data?.stepId && `step: ${ev.data.stepId}`}
              {ev.data?.agent && ` agent: ${ev.data.agent}`}
              {ev.data?.gateId && ` gate: ${ev.data.gateId}`}
              {ev.data?.tokens && ` tokens: ${ev.data.tokens}`}
              {ev.data?.durationMs && ` ${ev.data.durationMs}ms`}
              {ev.data?.error && ` ERROR: ${ev.data.error}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
