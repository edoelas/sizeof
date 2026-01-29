import React, { useEffect, useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { CatalogItem } from '../types';
import { fetchCatalog } from '../utils/dataLoader';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

interface SidebarProps {
    onSelect: (path: string) => void;
    isCompareMode: boolean;
    onToggleCompareMode: () => void;
    selectedPaths: Set<string>;
    onMultiSelect: (path: string, selected: boolean) => void;
    onOpenHelp: () => void;
    onClose: () => void;
}

interface TreeNodeProps {
    item: CatalogItem;
    onSelect: (path: string) => void;
    forceExpand?: boolean;
    isCompareMode: boolean;
    selectedPaths: Set<string>;
    onMultiSelect: (path: string, selected: boolean) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ item, onSelect, forceExpand, isCompareMode, selectedPaths, onMultiSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    // Sync open state with forceExpand when searching
    useEffect(() => {
        if (forceExpand && hasChildren) {
            setIsOpen(true);
        }
    }, [forceExpand, hasChildren]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsOpen(!isOpen);
        } else if (item.path) {
            if (isCompareMode) {
                // In compare mode, clicking the label also toggles the checkbox
                onMultiSelect(item.path, !selectedPaths.has(item.path));
            } else {
                onSelect(item.path);
            }
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (item.path) {
            onMultiSelect(item.path, e.target.checked);
        }
    };

    return (
        <div className="tree-node">
            <div className={`node-label ${hasChildren ? 'folder' : 'file'}`} onClick={handleClick}>
                {hasChildren && <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>}

                {/* Checkbox for compare mode - only for leaf nodes */}
                {!hasChildren && isCompareMode && (
                    <input
                        type="checkbox"
                        checked={item.path ? selectedPaths.has(item.path) : false}
                        onChange={handleCheckboxChange}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginRight: '8px' }}
                    />
                )}

                {item.name}
            </div>
            {/* If expanded or forced open, show children */}
            {hasChildren && isOpen && (
                <div className="node-children">
                    {item.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            item={child}
                            onSelect={onSelect}
                            forceExpand={forceExpand} // Pass it down
                            isCompareMode={isCompareMode}
                            selectedPaths={selectedPaths}
                            onMultiSelect={onMultiSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};



export const Sidebar: React.FC<SidebarProps> = ({
    onSelect,
    isCompareMode,
    onToggleCompareMode,
    selectedPaths,
    onMultiSelect,
    onOpenHelp,
    onClose
}) => {
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    // Removed isHelpOpen state

    useEffect(() => {
        fetchCatalog().then((data) => {
            setCatalog(data);
            setLoading(false);
        });
    }, []);

    const { theme, toggleTheme } = useTheme();

    // Filter Logic
    const filteredCatalog = useMemo(() => {
        if (!searchTerm.trim()) return catalog;

        // 1. Setup Fuse
        const getLeafNodes = (nodes: CatalogItem[]): CatalogItem[] => {
            return nodes.reduce((acc, node) => {
                if (node.children && node.children.length > 0) {
                    acc.push(...getLeafNodes(node.children));
                } else if (node.path) {
                    // It's a component
                    acc.push(node);
                }
                return acc;
            }, [] as CatalogItem[]);
        };

        const leafNodes = getLeafNodes(catalog);

        const fuse = new Fuse(leafNodes, {
            keys: [
                { name: 'name', weight: 0.7 },
                { name: 'path', weight: 0.3 } // Path allows finding "screws" even if name is "Socket Head"
            ],
            threshold: 0.4,
            includeScore: true
        });

        const fuseResults = fuse.search(searchTerm);
        // Use a Set of references for O(1) lookup
        const matchedItems = new Set(fuseResults.map(r => r.item));

        // 2. Reconstruct Tree
        // Keep a node if:
        // a) It is a matched leaf itself
        // b) It has descendants that are matches
        const filterTree = (nodes: CatalogItem[]): CatalogItem[] => {
            return nodes.map(node => {
                if (node.children) {
                    // If it's a folder, filter its children first
                    const filteredChildren = filterTree(node.children);
                    if (filteredChildren.length > 0) {
                        return { ...node, children: filteredChildren };
                    }
                } else {
                    // If it's a leaf, check if it was matched
                    if (matchedItems.has(node)) {
                        return node;
                    }
                }
                return null;
            }).filter(n => n !== null) as CatalogItem[];
        };

        return filterTree(catalog);

    }, [searchTerm, catalog]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Close Button (Unified behavior) */}
                        <button
                            onClick={onClose}
                            className="theme-toggle"
                            title="Hide Menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <h2 style={{ margin: 0 }}>Components</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {/* Compare Toggle Button */}
                        <button
                            onClick={onToggleCompareMode}
                            className="theme-toggle"
                            title={isCompareMode ? 'Exit Compare Mode' : 'Compare Mode'}
                            style={{
                                color: isCompareMode ? 'var(--text-accent)' : undefined,
                                backgroundColor: isCompareMode ? 'var(--row-selected)' : undefined
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                        </button>

                        {/* Help Button */}
                        <button
                            onClick={onOpenHelp}
                            className="theme-toggle"
                            title="Help & Instructions"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="theme-toggle"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? (
                                // Show "Dark Mode" icon (Moon) to switch to Dark
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                </svg>
                            ) : (
                                // Show "Light Mode" icon (Sun) to switch to Light
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Removed old text button */}

                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            <div className="sidebar-content">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    filteredCatalog.map((item) => (
                        <TreeNode
                            key={item.id}
                            item={item}
                            onSelect={onSelect}
                            forceExpand={!!searchTerm.trim()}
                            isCompareMode={isCompareMode}
                            selectedPaths={selectedPaths}
                            onMultiSelect={onMultiSelect}
                        />
                    ))
                )}
                {/* Empty state */}
                {!loading && filteredCatalog.length === 0 && (
                    <div style={{ padding: '16px', color: '#888', fontSize: '0.9em' }}>
                        No matching components found.
                    </div>
                )}
            </div>
        </div>
    );
};
