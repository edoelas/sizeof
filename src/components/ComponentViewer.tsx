import React, { useEffect, useState, useCallback } from 'react';
import { fetchComponentData } from '../utils/dataLoader';
import type { ComponentData } from '../types';
import { SvgRenderer } from './SvgRenderer';
import { DataTable } from './DataTable';

interface ComponentViewerProps {
    path: string;
}

export const ComponentViewer: React.FC<ComponentViewerProps> = ({ path }) => {
    const [data, setData] = useState<ComponentData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [selectedRowData, setSelectedRowData] = useState<Record<string, string> | null>(null);

    // Resizing State
    const [topPaneHeight, setTopPaneHeight] = useState(45); // percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

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

    // Resizing Handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate percentage: (MouseY - ContainerTop) / ContainerHeight * 100
        let newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;

        // Clamp values (min 10%, max 90%)
        newHeight = Math.max(10, Math.min(90, newHeight));
        setTopPaneHeight(newHeight);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Global listeners for dragging (attached to window to catch fast movements)
    useEffect(() => {
        if (isDragging) {
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
    }, [isDragging, handleMouseMove, handleMouseUp]);

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
                cursor: isDragging ? 'row-resize' : 'default',
                userSelect: isDragging ? 'none' : 'auto'
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
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-sub-header)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 1
                }}>DIAGRAM PREVIEW</h3>

                <div style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                    <SvgRenderer svgContent={data.svg} data={selectedRowData} />
                </div>
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="horizontal-resize-handle"
                style={{
                    height: '10px',
                    margin: '-5px 0', // Centered overlapping
                    cursor: 'row-resize',
                    zIndex: 50, // High z-index to overlay sticky header
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div className="handle-lines" />
            </div>

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
