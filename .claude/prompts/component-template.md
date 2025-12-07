# React Component Template

When creating new React components for this project:

## File Structure
```
web/src/components/
├── ComponentName.jsx
└── ComponentName.css
```

## Component Template
```jsx
import './ComponentName.css';

export function ComponentName({ prop1, prop2 }) {
  return (
    <div className="component-name">
      {/* Component content */}
    </div>
  );
}
```

## Style Guide
- Use functional components with hooks
- Extract props with destructuring
- Use CSS modules or separate CSS files
- Follow black and white theme:
  - Primary: `var(--primary-color)` (#000000)
  - Background: `var(--bg-primary)` (#ffffff)
  - Secondary: `var(--bg-secondary)` (#f5f5f5)
  - Text: `var(--text-primary)` (#000000)
  - Borders: `var(--border-color)` (#e0e0e0)
- Use Radix UI components when possible
- Ensure responsive design with media queries

## Example Component
```jsx
import './Button.css';

export function Button({ onClick, children, variant = 'primary' }) {
  return (
    <button
      className={`button button-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```
