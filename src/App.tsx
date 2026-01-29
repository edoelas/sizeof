import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ComponentViewer } from './components/ComponentViewer';
import { ThemeProvider } from './context/ThemeContext';
import { useMediaQuery } from './hooks/useMediaQuery';
import { HelpModal } from './components/HelpModal';
import './index.css';

function AppContent() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Responsive State
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Sync sidebar open state with mobile changes
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

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

  const handleSidebarSelect = useCallback((path: string) => {
    setSelectedPath(path);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // START HANDLERS
  const startResizingSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) return; // No resize on mobile
    setResizeState({
      type: 'sidebar',
      startX: e.clientX,
      startWidths: [sidebarWidth]
    });
  }, [sidebarWidth, isMobile]);

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
      height: '100dvh',
      width: '100vw',
      overflow: 'hidden',
      cursor: resizeState ? 'col-resize' : 'default',
      userSelect: resizeState ? 'none' : 'auto',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)',
      position: 'relative' // For backdrop context
    }}>
      {/* Help Modal (App Level to avoid clipping) */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`sidebar-container ${isMobile ? 'mobile' : ''} ${isSidebarOpen ? 'open' : 'closed'}`}
        style={{
          width: isMobile ? '80%' : (isSidebarOpen ? sidebarWidth : 0),
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: (!isMobile && isSidebarOpen) ? '1px solid var(--border-color)' : 'none',
          overflow: 'hidden', // Hide content when width is 0 (Desktop)
          transition: isMobile ? 'none' : 'width 0.3s ease' // Smooth transition on desktop
        }}
      >
        <Sidebar
          onSelect={handleSidebarSelect}
          isCompareMode={isCompareMode}
          onToggleCompareMode={toggleCompareMode}
          selectedPaths={selectedPaths}
          onMultiSelect={handleMultiSelect}
          onOpenHelp={() => setIsHelpOpen(true)}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Vertical Resize Handle (Sidebar) - Simple (Desktop Only) */}
      {!isMobile && (
        <div
          onMouseDown={startResizingSidebar}
          className="vertical-resize-handle"
          style={{
            width: '12px',
            margin: '0 -6px',
            zIndex: 100,
            cursor: 'col-resize',
            position: 'relative',
            display: isSidebarOpen ? 'flex' : 'none', // Hide handle when closed
            justifyContent: 'center'
          }}
        />
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, margin: 0, backgroundColor: 'var(--bg-panel)', overflow: 'hidden', position: 'relative' }}>

        {/* Floating Hamburger Removed - now integrated into headers */}

        {isCompareMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Compare Mode Header */}


            <div
              ref={compareContainerRef}
              style={{
                display: 'flex',
                flexDirection: 'row',
                flex: 1,
                overflowX: isMobile ? 'auto' : 'hidden', // Allow scroll on mobile
                overflowY: 'hidden'
              }}
            >
              {Array.from(selectedPaths).length > 0 ? (
                Array.from(selectedPaths).map((path, index) => (
                  <div key={path} style={{
                    width: isMobile ? '100%' : `${columnWidths[index]}%`, // Stack or scroll on mobile
                    flexShrink: isMobile ? 0 : 1, // Don't shrink on mobile
                    minWidth: isMobile ? '100%' : '50px',
                    height: '100%',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}>
                    <ComponentViewer
                      path={path}
                      isSidebarOpen={isSidebarOpen}
                      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    />

                    {!isMobile && index < Array.from(selectedPaths).length - 1 && (
                      <div
                        onMouseDown={startResizingCol(index)}
                        className="column-resize-handle"
                        style={{
                          position: 'absolute',
                          right: '-6px',
                          top: 0,
                          bottom: 0,
                          width: '12px',
                          cursor: 'col-resize',
                          zIndex: 10
                        }}
                      />
                    )}
                    {/* Note: ComponentViewer inside Compare Mode will have its OWN header too. 
                            If we want a "Clean" compare, we might need to tell ComponentViewer to hide its header? 
                            OR just let it have headers (Component Name is useful). 
                            If Component Viewer has header, we don't need the top "Compare Mode" header? 
                            No, we need the "Menu" button somewhere if Sidebar is closed.
                            
                            Actually, if ComponentViewer handles the menu button, and we render multiple ComponentViewers...
                            We will have multiple Menu buttons? Yes.
                            That looks bad.
                            
                            BETTER: 
                            In Compare Mode, render a single Top Header for the APP.
                            Then render ComponentViewers WITHOUT their header (or with a reduced header).
                            BUT ComponentViewer handles menu button now.
                        */ }
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                  Select components from the sidebar to compare.
                </div>
              )}
            </div>
          </div>
        ) : (
          selectedPath ? (
            <ComponentViewer
              path={selectedPath}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-panel)'
            }}>
              {/* Empty State Header for Menu Button */}
              <div style={{
                padding: '8px 16px',
                height: '38px', // Match other headers
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid transparent' // Maintain height consistency
              }}>
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '4px',
                      margin: '-4px'
                    }}
                    title="Open Menu"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                Select a component from the sidebar to view details.
              </div>
            </div>
          )
        )}

      </main >
    </div >
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
