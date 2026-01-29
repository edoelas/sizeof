import React, { useEffect, useRef } from 'react';

interface SvgRendererProps {
    svgContent: string;
    data: Record<string, string | number> | null;
    units?: Record<string, string>;
}

export const SvgRenderer: React.FC<SvgRendererProps> = ({ svgContent, data, units }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Update SVG content when data changes
    useEffect(() => {
        if (!containerRef.current) return;

        let finalSvg = svgContent;

        // Apply Mustache-style substitution {{ key }}
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                // 1. Raw Value ({{ key_raw }}) - Use this for geometry!
                const regexRaw = new RegExp(`{{\\s*${key}_raw\\s*}}`, 'g');
                finalSvg = finalSvg.replace(regexRaw, String(value));

                // 2. Default Value ({{ key }}) - Includes unit if available (Text labels)
                const regexDefault = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                let displayValue = String(value);

                if (units && units[key]) {
                    displayValue = `${value} ${units[key]}`;
                }

                finalSvg = finalSvg.replace(regexDefault, displayValue);
            });
        }

        // Render the processed SVG
        containerRef.current.innerHTML = finalSvg;

        // Legacy Support: Also try keyed element textContent replacement for backward compatibility
        // (Only if we still have elements with old IDs in the SVG)
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                const element = containerRef.current?.querySelector(`#val_${key}`);
                if (element) {
                    element.textContent = String(value);
                }
            });
        }

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
