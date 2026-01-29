export interface CatalogItem {
    id: string;
    name: string;
    path?: string;
    children?: CatalogItem[];
}

export interface ComponentColumn {
    key: string;
    label: string;
    type?: 'string' | 'number';
    unit?: string;
}

export interface ComponentConfig {
    meta?: {
        id: string;
        version: string;
    };
    name: string;
    standard: string;
    columns: ComponentColumn[];
    data: Record<string, string | number>[];
}

export interface ComponentData {
    config: ComponentConfig;
    svg: string;
}
