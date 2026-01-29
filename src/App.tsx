import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ComponentViewer } from './components/ComponentViewer';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function AppContent() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Compare Mode State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const compareContainerRef = useRef<HTMLDivElement>(null);

  // Column Resizing State
  const [resizingColIndex, setResizingColIndex] = useState<number | null>(null);

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
    // Optional: Clear selection when toggling? Or keep it?
    // For now, let's keep it, but maybe we want to initialize selectedPaths with current selectedPath if entering compare mode
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

  // Column Resize Handlers
  const startResizingCol = useCallback((index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColIndex(index);
  }, []);

  const stopResizingCol = useCallback(() => {
    setResizingColIndex(null);
  }, []);

  const resizeCol = useCallback((e: MouseEvent) => {
    if (resizingColIndex === null || !compareContainerRef.current) return;

    const containerRect = compareContainerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // Mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mousePercent = (mouseX / containerWidth) * 100;

    // Calculate left edge of the resizing column
    let leftEdgePercent = 0;
    for (let i = 0; i < resizingColIndex; i++) {
      leftEdgePercent += columnWidths[i];
    }

    // New width for Left Col = MousePos% - LeftEdge%
    let newLeftColWidth = mousePercent - leftEdgePercent;

    // Constraints: Min 10%
    if (newLeftColWidth < 10) newLeftColWidth = 10;

    // Check Right Col (index + 1)
    // We steal from right neighbor or push it
    const combinedWidth = columnWidths[resizingColIndex] + columnWidths[resizingColIndex + 1];
    let newRightColWidth = combinedWidth - newLeftColWidth;

    // Right Col constraint
    if (newRightColWidth < 10) {
      newRightColWidth = 10;
      newLeftColWidth = combinedWidth - 10;
    }

    setColumnWidths(prev => {
      const next = [...prev];
      next[resizingColIndex] = newLeftColWidth;
      next[resizingColIndex + 1] = newRightColWidth;
      return next;
    });

  }, [resizingColIndex, columnWidths]);

  // Global listeners for column resize
  useEffect(() => {
    if (resizingColIndex !== null) {
      window.addEventListener('mousemove', resizeCol);
      window.addEventListener('mouseup', stopResizingCol);
    } else {
      window.removeEventListener('mousemove', resizeCol);
      window.removeEventListener('mouseup', stopResizingCol);
    }
    return () => {
      window.removeEventListener('mousemove', resizeCol);
      window.removeEventListener('mouseup', stopResizingCol);
    };
  }, [resizingColIndex, resizeCol, stopResizingCol]);

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
      cursor: (isResizingSidebar || resizingColIndex !== null) ? 'col-resize' : 'default',
      userSelect: (isResizingSidebar || resizingColIndex !== null) ? 'none' : 'auto',
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
                  minWidth: '50px', // Absolute minimum
                  position: 'relative'
                }}>
                  <ComponentViewer path={path} />

                  {/* Resize Handle (except for last column) */}
                  {index < Array.from(selectedPaths).length - 1 && (
                    <div
                      onMouseDown={startResizingCol(index)}
                      style={{
                        width: '6px',
                        right: '-3px',
                        top: 0, bottom: 0,
                        position: 'absolute',
                        cursor: 'col-resize',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      className="column-resize-handle"
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
