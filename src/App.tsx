import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ComponentViewer } from './components/ComponentViewer';
import './index.css';

function App() {
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
      userSelect: isResizingSidebar ? 'none' : 'auto'
    }}>
      <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, margin: 0, backgroundColor: '#fff' }}>
        {selectedPath ? (
          <ComponentViewer path={selectedPath} />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888'
          }}>
            Select a component from the sidebar to view details.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
