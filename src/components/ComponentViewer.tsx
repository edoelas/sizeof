import React, { useEffect, useState, useCallback } from 'react';
import { fetchComponentData } from '../utils/dataLoader';
import type { ComponentData } from '../types';
import { SvgRenderer } from './SvgRenderer';
import { DataTable } from './DataTable';


interface ComponentViewerProps {
    path: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export const ComponentViewer: React.FC<ComponentViewerProps> = ({ path, isSidebarOpen, onToggleSidebar }) => {

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
    // Table Visibility State
    const [isTableVisible, setIsTableVisible] = useState(true);

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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderTitle()}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Button 1: Maximize Diagram (Hide Table) 
                        Active = Table is HIDDEN (Diagram Maximized).
                        Icon: Expand/Maximize icon.
                    */}
                    {data && (
                        <button
                            onClick={() => {
                                if (!isTableVisible && !isDiagramVisible) setIsDiagramVisible(true);
                                // Toggle Table Visibility
                                setIsTableVisible(!isTableVisible);
                                // If hiding table, ensure diagram is visible
                                if (isTableVisible) setIsDiagramVisible(true);
                            }}
                            title={isTableVisible ? "Maximize Diagram" : "Show Table"}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: !isTableVisible ? 'var(--accent-color)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--row-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                {isTableVisible ? (
                                    // Icon for "Maximize Diagram" (Table Visible -> Expand/Maximize)
                                    // User provided "Maximize" icon (arrows out)
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                ) : (
                                    // Icon for "Show Table" (Restore/Minimize)
                                    // User provided "Minimize" icon (arrows in)
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                                )}
                            </svg>
                        </button>
                    )}

                    {/* Button 2: Hide Diagram (Maximize Table) 
                         Active = Diagram is HIDDEN.
                         Icon: Collapse/Hide Image icon.
                     */}
                    {data && (
                        <button
                            onClick={() => {
                                if (!isDiagramVisible && !isTableVisible) setIsTableVisible(true);
                                // Toggle Diagram Visibility
                                setIsDiagramVisible(!isDiagramVisible);
                                // If hiding diagram, ensure table is visible
                                if (isDiagramVisible) setIsTableVisible(true);
                            }}
                            title={isDiagramVisible ? "Hide Diagram" : "Show Diagram"}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: !isDiagramVisible ? 'var(--accent-color)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--row-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                {isDiagramVisible ? (
                                    // Hide Diagram (Chevron Up) - User provided "Hide" icon
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                                ) : (
                                    // Show Diagram (Chevron Down) - User provided "Show" icon
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                )}
                            </svg>
                        </button>
                    )}
                </div>
            </h3>

            {/* Top Pane: Diagram (Collapsible) */}
            {data && isDiagramVisible && (
                <div style={{
                    flexBasis: isTableVisible ? `${topPaneHeight}%` : '100%',
                    flexGrow: isTableVisible ? 0 : 1,
                    flexShrink: 0,
                    minHeight: '100px',
                    borderBottom: isTableVisible ? '1px solid var(--border-color)' : 'none',
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

                    <div style={{ flex: 1, overflow: 'hidden', padding: isTableVisible ? '16px' : '0', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                        <SvgRenderer svgContent={data.svg} data={selectedRowData} />
                    </div>
                </div>
            )}

            {/* Resize Handle - Simple (Visible only when diagram is shown) */}
            {data && isDiagramVisible && isTableVisible && (
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
            {data && isTableVisible && (
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
