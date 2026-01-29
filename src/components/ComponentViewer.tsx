import React, { useEffect, useState, useCallback } from 'react';
import { fetchComponentData } from '../utils/dataLoader';
import type { ComponentData } from '../types';
import { SvgRenderer } from './SvgRenderer';
import { DataTable } from './DataTable';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ComponentViewerProps {
    path: string;
}

export const ComponentViewer: React.FC<ComponentViewerProps> = ({ path }) => {
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

    // Resizing State
    const [topPaneHeight, setTopPaneHeight] = useState(45); // percentage
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

    if (loading) return <div>Loading component data...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!data) return null;

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
            {/* Top Pane: Diagram */}
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

                <h3 style={{
                    margin: 0,
                    padding: '8px 16px',
                    paddingLeft: isMobile ? '50px' : '16px', // Avoid hamburger overlap
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-sub-header)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {data.config.name}
                    <span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {data.config.standard}
                    </span>
                </h3>

                <div style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                    <SvgRenderer svgContent={data.svg} data={selectedRowData} />
                </div>
            </div>

            {/* Resize Handle - Simple */}
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

            {/* Bottom Pane: Data Table */}
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
        </div>
    );
};
