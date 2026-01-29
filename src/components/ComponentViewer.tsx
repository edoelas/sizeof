import React, { useEffect, useState, useCallback } from 'react';
import { fetchComponentData } from '../utils/dataLoader';
import type { ComponentData } from '../types';
import { SvgRenderer } from './SvgRenderer';
import { DataTable } from './DataTable';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ComponentViewerProps {
    path: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export const ComponentViewer: React.FC<ComponentViewerProps> = ({ path, isSidebarOpen, onToggleSidebar }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [data, setData] = useState<ComponentData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [selectedRowData, setSelectedRowData] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setSelectedRowIndex(null);
        setSelectedRowData(null); // Reset selection on path change

        fetchComponentData(path)
            .then((result) => {
                setData(result);
                setLoading(false);
                // Auto-select first row if available
                if (result.config?.data?.length > 0) {
                    setSelectedRowIndex(0);
                    setSelectedRowData(result.config.data[0]);
                }
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [path]);

    // Helper for title
    const renderTitle = () => {
        if (loading) return <span>Loading...</span>;
        if (error) return <span style={{ color: 'red' }}>Error</span>;
        if (!data) return <span>Select a Component</span>;
        return (
            <>
                {data.config.name}
                <span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {data.config.standard}
                </span>
            </>
        );
    };

    // Resizing State
    const [topPaneHeight, setTopPaneHeight] = useState(33); // percentage
    const [dragState, setDragState] = useState<{ startY: number, startHeight: number } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Resizing Handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setDragState({
            startY: e.clientY,
            startHeight: topPaneHeight
        });
    }, [topPaneHeight]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate delta percentage
        const deltaPixels = e.clientY - dragState.startY;
        const deltaPercent = (deltaPixels / containerRect.height) * 100;

        let newHeight = dragState.startHeight + deltaPercent;

        // Clamp values (min 10%, max 90%)
        newHeight = Math.max(10, Math.min(90, newHeight));
        setTopPaneHeight(newHeight);
    }, [dragState]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);

    // Global listeners for dragging
    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, handleMouseMove, handleMouseUp]);

    const handleRowSelect = (index: number, row: Record<string, string>) => {
        setSelectedRowIndex(index);
        setSelectedRowData(row);
    };

    // Diagram Visibility State
    const [isDiagramVisible, setIsDiagramVisible] = useState(true);

    // Main Render
    return (
        <div
            ref={containerRef}
            className="component-viewer"
            style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: dragState ? 'row-resize' : 'default',
                userSelect: dragState ? 'none' : 'auto'
            }}
        >
            {/* Header - Fixed at Top */}
            <h3 style={{
                margin: 0,
                padding: '8px 16px',
                // paddingLeft logic removed
                fontSize: '13px',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-sub-header)',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Integrated Hamburger Button */}
                    {!isSidebarOpen && (
                        <button
                            onClick={onToggleSidebar}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                margin: '-4px' // Negative margin to align with padding
                            }}
                            title="Open Menu"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--row-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderTitle()}
                    </div>
                </div>

                {/* Diagram Toggle Button (Only show if data available) */}
                {data && (
                    <button
                        onClick={() => setIsDiagramVisible(!isDiagramVisible)}
                        title={isDiagramVisible ? 'Hide Diagram' : 'Show Diagram'}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--row-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {isDiagramVisible ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 15l-6-6-6 6" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        )}
                    </button>
                )}
            </h3>

            {/* Top Pane: Diagram (Collapsible) */}
            {data && isDiagramVisible && (
                <div style={{
                    flexBasis: `${topPaneHeight}%`,
                    flexGrow: 0,
                    flexShrink: 0,
                    minHeight: '100px',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-grid)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        // Technical Grid Pattern
                        backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }} />

                    <div style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                        <SvgRenderer svgContent={data.svg} data={selectedRowData} />
                    </div>
                </div>
            )}

            {/* Resize Handle - Simple (Visible only when diagram is shown) */}
            {data && isDiagramVisible && (
                <div
                    onMouseDown={handleMouseDown}
                    className="horizontal-resize-handle"
                    style={{
                        height: '12px',
                        margin: '-6px 0',
                        cursor: 'row-resize',
                        zIndex: 100, // Ensure above sticky headers
                        position: 'relative'
                    }}
                />
            )}

            {/* Bottom Pane: Data Table */}
            {data && (
                <div style={{
                    flex: 1,
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-panel)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <DataTable
                        config={data.config}
                        selectedRowIndex={selectedRowIndex}
                        onRowSelect={handleRowSelect}
                    />
                </div>
            )}

            {/* Empty State / Loading / Error Body */}
            {!data && (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    {loading ? 'Loading...' : (error ? `Error: ${error}` : 'Select a component from the sidebar.')}
                </div>
            )}
        </div>
    );
};
