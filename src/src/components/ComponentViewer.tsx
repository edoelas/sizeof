import React, { useEffect, useState } from 'react';
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

    const handleRowSelect = (index: number, row: Record<string, string>) => {
        setSelectedRowIndex(index);
        setSelectedRowData(row);
    };

    if (loading) return <div>Loading component data...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!data) return null;

    return (
        <div className="component-viewer" style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1, // Grow to fill main
            width: '100%', // Enforce full width
            height: '100%',
            overflow: 'hidden',
        }}>
            {/* Top Pane: Diagram */}
            <div style={{
                flex: '0 0 45%', // Fixed 45% height 
                minHeight: '200px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    // Technical Grid Pattern
                    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.5,
                    pointerEvents: 'none'
                }} />

                <h3 style={{
                    margin: 0,
                    padding: '8px 16px',
                    fontSize: '13px', // Matched to DataTable CSS of 13px
                    color: 'var(--text-primary)', // Standard text color
                    backgroundColor: '#f8f9fa', // Matched color
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 1
                }}>DIAGRAM PREVIEW</h3>

                <div style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                    <SvgRenderer svgContent={data.svg} data={selectedRowData} />
                </div>
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
