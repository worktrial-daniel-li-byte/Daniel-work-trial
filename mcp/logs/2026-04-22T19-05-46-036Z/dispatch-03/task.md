# Dispatch 03 — resumed worker

- **Before reward:** -0.0364
- **After reward:**  -0.0386
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Several small but important visual differences remain between our app and the reference. Focus ONLY on these fixes in src/App.tsx and src/App.css:

1. **Jira brand logo in sidebar header**: The current Jira logo looks like a plain blue rounded square. Replace it with the actual Atlassian Jira logo shape: two overlapping chevrons. Use this inline SVG (replace the existing Jira logo JSX in the sidebar header):
```jsx
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="jiraGrad1" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0052CC"/>
      <stop offset="1" stop-color="#2684FF"/>
    </linearGradient>
  </defs>
  <path d="M11.53 2 2 11.53a1.5 1.5 0 0 0 0 2.12l9.53 9.53a1.5 1.5 0 0 0 2.12 0L22 13.65a1.5 1.5 0 0 0 0-2.12L12.47 2a.75.75 0 0 0-1.06 0Z" fill="url(#jiraGrad1)"/>
  <path d="M12 8 8 12l4 4 4-4-4-4Z" fill="#fff" fill-opacity="0.35"/>
</svg>
```

2. **External-link arrow icons** next to "Confluence", "Goals", "Teams" in the sidebar: the reference shows small ↗ arrows on the far-right of those rows. If they're missing or wrong color, make sure each of those three sidebar items has a trailing `<svg>` with an arrow-up-right shape (you can use this SVG):
```jsx
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ marginLeft: 'auto', opacity: 0.6 }}><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
```

3. **Board column header count chips**: the small "1" / "0" / "0" next to "To Do" / "In Progress" / "Done" should sit on a slightly darker purple chip with padding. Update the CSS for the column-header count selector (search for the class used, likely `.column-count` or `.kanban-column__count` in src/App.css) and set:
```
background: rgba(101, 84, 192, 0.18);
color: #352c63;
padding: 2px 8px;
border-radius: 4px;
font-size: 12px;
font-weight: 600;
line-height: 1.2;
```

Only change those three things. Leave everything else as is.

## Rationale

Adding the proper Jira logo gradient + external link icons + colored count chips should push both SSIM and color sub-scores up (more distinct pixels and matching chip backgrounds).

## Worker summary

Edited **src/App.tsx**: replaced the Jira brand logo SVG with the new chevron/gradient path, and replaced the external-link arrow SVG (for Confluence/Goals/Teams) with the stronger 14px `stroke-width=2` arrow using `marginLeft: 'auto', opacity: 0.6`. Edited **src/App.css**: updated `.jira-col__count` to use the purple chip background `rgba(101, 84, 192, 0.18)`, color `#352c63`, `padding: 2px 8px`, `border-radius: 4px`, `font-size: 12px`, `font-weight: 600`, `line-height: 1.2`.
