import React, { useEffect, useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { CatalogItem } from '../types';
import { fetchCatalog } from '../utils/dataLoader';
import './Sidebar.css';

interface SidebarProps {
    onSelect: (path: string) => void;
}

interface TreeNodeProps {
    item: CatalogItem;
    onSelect: (path: string) => void;
    forceExpand?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ item, onSelect, forceExpand }) => {
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
            onSelect(item.path);
        }
    };

    return (
        <div className="tree-node">
            <div className={`node-label ${hasChildren ? 'folder' : 'file'}`} onClick={handleClick}>
                {hasChildren && <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>}
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCatalog().then((data) => {
            setCatalog(data);
            setLoading(false);
        });
    }, []);

    // Filter Logic
    const filteredCatalog = useMemo(() => {
        if (!searchTerm.trim()) return catalog;

        // 1. Setup Fuse
        // We only want to search "Leaf Nodes" (Components). 
        // Folder matching is annoying if it returns empty folders. 
        // If a folder's name matches, we only want to show it if it contains matching components? 
        // Or simpler: We essentially search for components, and the tree just shows the path to them.
        // The user explicitly requested to search using the "full path".

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
                <h2>Components</h2>
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
