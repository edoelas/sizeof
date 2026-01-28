import React from 'react';
import type { ComponentConfig } from '../types';
import './DataTable.css';

interface DataTableProps {
    config: ComponentConfig;
    selectedRowIndex: number | null;
    onRowSelect: (index: number, row: Record<string, string>) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ config, selectedRowIndex, onRowSelect }) => {
    return (
        <div className="table-container">
            <h3>{config.name} <span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{config.standard}</span></h3>
            <div className="table-scroll-area">
                <table className="component-table">
                    <thead>
                        <tr>
                            {config.columns.map((col) => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {config.data.map((row, idx) => (
                            <tr
                                key={idx}
                                className={selectedRowIndex === idx ? 'selected' : ''}
                                onClick={() => onRowSelect(idx, row)}
                            >
                                {config.columns.map((col) => (
                                    <td key={col.key}>{row[col.key]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
