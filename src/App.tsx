import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ComponentViewer } from './components/ComponentViewer';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function AppContent() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Sidebar Width State
  const [sidebarWidth, setSidebarWidth] = useState(260);

  // Compare Mode State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const compareContainerRef = useRef<HTMLDivElement>(null);

  // Simplified Resize State
  // We store initial values on start to calculate deltas accurately without drift
  const [resizeState, setResizeState] = useState<{
    type: 'sidebar' | 'column';
    index?: number; // for column
    startX: number;
    startWidths: number[]; // for column: [left, right] widths; for sidebar: [width]
  } | null>(null);

  // Sync column widths when selection changes
  useEffect(() => {
    const count = selectedPaths.size;
    if (count > 0) {
      setColumnWidths(Array(count).fill(100 / count));
    } else {
      setColumnWidths([]);
    }
  }, [selectedPaths]);

  const toggleCompareMode = useCallback(() => {
    setIsCompareMode(prev => !prev);
    if (!isCompareMode && selectedPath) {
      setSelectedPaths(new Set([selectedPath]));
    }
  }, [isCompareMode, selectedPath]);

  const handleMultiSelect = useCallback((path: string, selected: boolean) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  // START HANDLERS
  const startResizingSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizeState({
      type: 'sidebar',
      startX: e.clientX,
      startWidths: [sidebarWidth]
    });
  }, [sidebarWidth]);

  const startResizingCol = useCallback((index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!columnWidths.length) return;
    setResizeState({
      type: 'column',
      index,
      startX: e.clientX,
      startWidths: [columnWidths[index], columnWidths[index + 1]]
    });
  }, [columnWidths]);

  const stopResizing = useCallback(() => {
    setResizeState(null);
  }, []);

  // GLOBAL RESIZE HANDLER
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeState) return;

    if (resizeState.type === 'sidebar') {
      const delta = e.clientX - resizeState.startX;
      const newWidth = Math.max(200, Math.min(600, resizeState.startWidths[0] + delta));
      setSidebarWidth(newWidth);
    }
    else if (resizeState.type === 'column' && resizeState.index !== undefined && compareContainerRef.current) {
      const index = resizeState.index;
      const containerWidth = compareContainerRef.current.offsetWidth;
      const deltaPixels = e.clientX - resizeState.startX;
      const deltaPercent = (deltaPixels / containerWidth) * 100;

      let newLeft = resizeState.startWidths[0] + deltaPercent;
      let newRight = resizeState.startWidths[1] - deltaPercent;

      // Clamping (min 5%)
      if (newLeft < 5) {
        newLeft = 5;
        newRight = resizeState.startWidths[0] + resizeState.startWidths[1] - 5;
      } else if (newRight < 5) {
        newRight = 5;
        newLeft = resizeState.startWidths[0] + resizeState.startWidths[1] - 5;
      }

      setColumnWidths(prev => {
        const next = [...prev];
        next[index] = newLeft;
        next[index + 1] = newRight;
        return next;
      });
    }
  }, [resizeState]);

  useEffect(() => {
    if (resizeState) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resizeState, handleGlobalMouseMove, stopResizing]);




  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      cursor: resizeState ? 'col-resize' : 'default',
      userSelect: resizeState ? 'none' : 'auto',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)'
    }}>
      <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}>
        <Sidebar
          onSelect={setSelectedPath}
          isCompareMode={isCompareMode}
          onToggleCompareMode={toggleCompareMode}
          selectedPaths={selectedPaths}
          onMultiSelect={handleMultiSelect}
        />
      </div>

      {/* Vertical Resize Handle (Sidebar) - Simple */}
      <div
        onMouseDown={startResizingSidebar}
        className="vertical-resize-handle"
        style={{
          width: '12px',
          margin: '0 -6px',
          zIndex: 100,
          cursor: 'col-resize',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center'
        }}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, margin: 0, backgroundColor: 'var(--bg-panel)', overflow: 'hidden' }}>
        {isCompareMode ? (
          <div
            ref={compareContainerRef}
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: '100%',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            {Array.from(selectedPaths).length > 0 ? (
              Array.from(selectedPaths).map((path, index) => (
                <div key={path} style={{
                  width: `${columnWidths[index]}%`,
                  height: '100%',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '50px',
                  position: 'relative'
                }}>
                  <ComponentViewer path={path} />

                  {/* Column Resize Handle - Simple */}
                  {index < Array.from(selectedPaths).length - 1 && (
                    <div
                      onMouseDown={startResizingCol(index)}
                      className="column-resize-handle"
                      style={{
                        width: '12px',
                        right: '-6px',
                        top: 0, bottom: 0,
                        position: 'absolute',
                        cursor: 'col-resize',
                        zIndex: 100
                      }}
                    />
                  )}
                </div>
              ))
            ) : (
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Select components to compare.
              </div>
            )}
          </div>
        ) : (
          selectedPath ? (
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
          )
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
