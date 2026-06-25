import { Component } from 'react'

// ─── ErrorBoundary ─────────────────────────────────────────────────────────────
// DEBUG COMPONENT — wraps <App /> to surface runtime crashes on Vercel deploy.
// Shows the full error message + stack trace on screen in plain text.
// Remove or replace with a friendlier UI once the root cause is fixed.

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // Also log so it appears in Vercel Function logs
    console.error('[ErrorBoundary] Caught render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { error, info } = this.state
    return (
      <div style={{
        fontFamily: 'monospace',
        background: '#100F06',
        color: '#F5F4ED',
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        overflowX: 'auto',
      }}>
        <h1 style={{ color: '#F47575', fontSize: '20px', marginBottom: '12px' }}>
          ⚠ Runtime Error — Linguo Debug
        </h1>
        <p style={{ color: '#FFDA57', fontSize: '14px', marginBottom: '8px' }}>
          <strong>Error:</strong> {error?.message ?? String(error)}
        </p>
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          background: '#1a1a10',
          color: '#F47575',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          marginBottom: '16px',
          border: '1px solid #F47575/30',
        }}>
          {error?.stack ?? 'No stack available'}
        </pre>
        <p style={{ color: '#FFDA57', fontSize: '14px', marginBottom: '8px' }}>
          <strong>Component Stack:</strong>
        </p>
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          background: '#1a1a10',
          color: '#A293FF',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          border: '1px solid #A293FF/30',
        }}>
          {info?.componentStack ?? 'No component stack available'}
        </pre>
        <p style={{ color: '#F5F4ED', opacity: 0.4, fontSize: '11px', marginTop: '16px' }}>
          Copy this entire page and share it to diagnose the issue.
        </p>
      </div>
    )
  }
}
