import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 运行时崩溃兜底：任何渲染错误都显示可读的中文错误卡，绝不黑屏。
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0f16', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 520, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16, padding: 22, fontSize: 14, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>界面运行时出错（已捕获，非黑屏）</div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: 10, fontSize: 12 }}>{String(this.state.error && this.state.error.message || this.state.error)}</pre>
          <div style={{ marginTop: 10, color: '#94a3b8', fontSize: 12 }}>
            请截图发回后刷新重试；桌面版可在仓库 app 目录执行 npm ci 与 npm run build 重新构建界面。
          </div>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>刷新界面</button>
        </div>
      </div>
    );
  }
}

window.__PET_BOOTED__ = true;
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
