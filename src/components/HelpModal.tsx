import React from 'react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                padding: '24px',
                borderRadius: '8px',
                maxWidth: '600px', // Slightly wider max
                width: '95%', // Wider on mobile
                maxHeight: '90vh', // Prevent overflow on small screens
                overflowY: 'auto', // Enable scrolling if tall
                WebkitOverflowScrolling: 'touch', // SMOOTH SCROLLING FOR IOS
                overscrollBehavior: 'contain', // Prevent body scroll chaining
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--border-color)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>How to Use Component Viewer</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            fontSize: '20px',
                            padding: '4px'
                        }}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    <h3 style={{ fontSize: '15px', marginTop: '0', marginBottom: '8px', color: 'var(--text-accent)' }}>Navigation</h3>
                    <p style={{ margin: '0 0 12px 0' }}>
                        Browse components using the sidebar tree. Click a component to view its diagram and data table.
                        Use the <strong>Search</strong> bar to quickly find components by name or path.
                    </p>

                    <h3 style={{ fontSize: '15px', marginTop: '0', marginBottom: '8px', color: 'var(--text-accent)' }}>Compare Mode</h3>
                    <p style={{ margin: '0 0 12px 0' }}>
                        Click the <strong>Compare Icon</strong> (split rectangle) in the sidebar header to toggle Compare Mode.
                        <br />
                        When active, check boxes appear next to components. Select multiple components to view them side-by-side.
                    </p>

                    <h3 style={{ fontSize: '15px', marginTop: '0', marginBottom: '8px', color: 'var(--text-accent)' }}>Resizing</h3>
                    <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>
                        <li>Drag the sidebar edge to resize the navigation pane.</li>
                        <li>Drag the horizontal divider in the viewer to adjust the Diagram vs Table split.</li>
                        <li>In Compare Mode, drag the vertical gaps between columns to adjust their widths.</li>
                    </ul>
                </div>

                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--text-accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};
