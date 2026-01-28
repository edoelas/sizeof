
import yaml from 'js-yaml';
import type { CatalogItem, ComponentData, ComponentConfig } from '../types';

const REPO_OWNER = 'edoelas';
const REPO_NAME = 'sizeof-catalog';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

interface GitHubTreeItem {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
}

interface GitHubTreeResponse {
    sha: string;
    url: string;
    tree: GitHubTreeItem[];
    truncated: boolean;
}

// Helper to format directory names into readable labels (e.g. "socket_head" -> "Socket Head")
function formatLabel(slug: string): string {
    return slug
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
    try {
        const response = await fetch(`${API_BASE}/git/trees/${BRANCH}?recursive=1`);
        if (!response.ok) throw new Error('Failed to fetch repository tree');

        const data: GitHubTreeResponse = await response.json();

        // 1. Filter for all 'config.yaml' files to identify component directories
        const componentPaths = data.tree
            .filter(item => item.path.endsWith('config.yaml'))
            .map(item => item.path.replace('/config.yaml', ''));

        // 2. Build the tree structure
        const rootItems: CatalogItem[] = [];

        // Helper to find or create a node in the tree
        const findOrCreateNode = (items: CatalogItem[], id: string, name: string): CatalogItem => {
            let node = items.find(i => i.id === id);
            if (!node) {
                node = { id, name, children: [] };
                items.push(node);
            }
            return node;
        };

        componentPaths.forEach(fullPath => {
            const parts = fullPath.split('/'); // e.g., ["screws", "socket_head"]
            let currentLevel = rootItems;

            parts.forEach((part, index) => {
                const isLeaf = index === parts.length - 1;
                const formattedName = formatLabel(part);

                // Ensure the node exists at this level
                const node = findOrCreateNode(currentLevel, part, formattedName);

                if (isLeaf) {
                    // It's a component! Add the path so it becomes clickable
                    node.path = fullPath;
                    // Leaf nodes don't strictly need children initialized if we treat them as terminals
                    // But our Recursive Tree component uses 'children' to decide if it's a folder. 
                    // We'll leave children valid but empty, or undefined? 
                    // The Sidebar checks: item.children && item.children.length > 0
                    // So if we don't add children, it will be treated as a leaf. That's correct.
                    delete node.children;
                } else {
                    // Access children for next iteration
                    if (!node.children) node.children = [];
                    currentLevel = node.children;
                }
            });
        });

        return rootItems;

    } catch (error) {
        console.error("Error fetching catalog from GitHub:", error);
        // Fallback or empty? User wants GitHub.
        throw error;
    }
}

export async function fetchComponentData(path: string): Promise<ComponentData> {
    // Use RAW URLs for content
    const [configRes, svgRes] = await Promise.all([
        fetch(`${RAW_BASE}/${path}/config.yaml`),
        fetch(`${RAW_BASE}/${path}/diagram.svg`)
    ]);

    if (!configRes.ok || !svgRes.ok) {
        throw new Error(`Failed to fetch component data for ${path} from GitHub`);
    }

    const configText = await configRes.text();
    const svgText = await svgRes.text();

    if (configText.trim().startsWith('<!DOCTYPE') || configText.trim().startsWith('<html')) {
        throw new Error(`Failed to fetch config (got HTML) for ${path}`);
    }

    const config = yaml.load(configText) as ComponentConfig;

    if (!config || !Array.isArray(config.data)) {
        throw new Error(`Invalid configuration format for ${path}`);
    }

    return {
        config,
        svg: svgText
    };
}

