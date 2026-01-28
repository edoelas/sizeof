import React, { useEffect, useRef } from 'react';

interface SvgRendererProps {
    svgContent: string;
    data: Record<string, string> | null;
}

export const SvgRenderer: React.FC<SvgRendererProps> = ({ svgContent, data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial Render of SVG
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = svgContent;
        }
    }, [svgContent]);

    // Update values when data changes
    useEffect(() => {
        if (!data || !containerRef.current) return;

        Object.entries(data).forEach(([key, value]) => {
            // Look for elements with id="val_{key}"
            const element = containerRef.current?.querySelector(`#val_${key}`);
            if (element) {
                element.textContent = value;
            }
        });
    }, [data, svgContent]);

    return (
        <div
            ref={containerRef}
            className="svg-renderer"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
                // Let parent handle padding/background
            }}
        />
    );
};
