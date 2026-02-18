# Component Footprint Viewer

A comprehensive viewer for mechanical component footprints, standards, and dimensions.

## Catalog Data Format

Each component in the `sizeof-catalog` repository must follow this structure:

### 1. Configuration (`config.yaml`)

Defines the component metadata, columns, units, and data rows.

```yaml
meta:
  id: "iso-4762-socket-head"  # Unique stable ID
  version: "1.0"

name: "Socket Head Cap Screws"
standard: "DIN 912 / ISO 4762"

columns:
  - key: "size"
    label: "Nominal Size"
    type: "string"

  - key: "pitch"
    label: "Thread Pitch"
    type: "number"
    unit: "mm"    # Unit info (separating data from presentation)

  - key: "H"
    label: "Head Diameter (Max)"
    type: "number"
    unit: "mm"

data:
  # Data should be pure numbers where possible
  - { size: "M3", pitch: 0.5, H: 5.5 }
  - { size: "M4", pitch: 0.7, H: 7.0 }
```

### 2. Diagram (`diagram.svg`)

The vector illustration of the component. Use Mustache-style templates for variable substitution.

#### Variable Reference Guide

| Syntax | Description | Example Output | Context |
| :--- | :--- | :--- | :--- |
| `{{ key }}` | **Default Display**. Includes unit if defined. | `0.5 mm` | Best for `<text>` labels. |
| `{{ key_raw }}` | **Raw Numeric Value**. No units. | `0.5` | REQUIRED for attributes (`width`, `d`, `x`, `y`). |

#### Example SVG

```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- GEOMETRY: Always use _raw to ensure valid numbers in attributes -->
  <rect 
    x="10" 
    y="10" 
    width="{{ H_raw }}" 
    height="50" 
    fill="#ddd" 
    stroke="black" 
  />

  <!-- LABELS: Use standard variable to show "5.5 mm" -->
  <text x="10" y="5">
    Head Dia: {{ H }}
  </text>
</svg>
```

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
