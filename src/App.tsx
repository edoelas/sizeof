import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ComponentViewer } from './components/ComponentViewer';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function AppContent() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingSidebar(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingSidebar) {
      // Clamp width between 200px and 600px
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    }
  }, [isResizingSidebar]);

  useEffect(() => {
    if (isResizingSidebar) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizingSidebar, resize, stopResizing]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      cursor: isResizingSidebar ? 'col-resize' : 'default',
      userSelect: isResizingSidebar ? 'none' : 'auto',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)'
    }}>
      <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}>
        <Sidebar onSelect={setSelectedPath} />
      </div>

      {/* Vertical Resize Handle */}
      <div
        onMouseDown={startResizing}
        style={{
          width: '10px', // Wider hit area
          cursor: 'col-resize',
          zIndex: 50, // Ensure above content
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 -5px', // Center overlap
          position: 'relative'
        }}
        className="vertical-resize-handle"
      >
        <div className="handle-lines" />
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, margin: 0, backgroundColor: 'var(--bg-panel)' }}>
        {selectedPath ? (
          <ComponentViewer path={selectedPath} />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            Select a component from the sidebar to view details.
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
