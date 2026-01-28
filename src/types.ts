export interface CatalogItem {
    id: string;
    name: string;
    path?: string;
    children?: CatalogItem[];
}

export interface ComponentColumn {
    key: string;
    label: string;
}

export interface ComponentConfig {
    name: string;
    standard: string;
    columns: ComponentColumn[];
    data: Record<string, string>[];
}

export interface ComponentData {
    config: ComponentConfig;
    svg: string;
}
