import React from 'react';
import type { ComponentConfig } from '../types';
import './DataTable.css';

interface DataTableProps {
    config: ComponentConfig;
    selectedRowIndex: number | null;
    onRowSelect: (index: number, row: Record<string, string | number>) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ config, selectedRowIndex, onRowSelect }) => {
    return (
        <div className="table-container">
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
                                    <td key={col.key}>
                                        {row[col.key]}
                                        {col.unit && <span style={{ opacity: 0.5, fontSize: '0.8em', marginLeft: '2px' }}>{col.unit}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
