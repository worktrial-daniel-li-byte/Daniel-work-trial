# Dispatch 09 — resumed worker

- **Before reward:** -0.1043
- **After reward:**  -0.1044
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

In src/App.tsx or src/App.css, the checkbox icon on the "This is a test" card currently appears as a solid blue filled square with a white checkmark. The reference shows it as a smaller, more subtle blue outlined checkbox.

Specifically, in the reference it's a blue square (outline) with a blue checkmark, about 16px, no fill. 

Find the checkbox SVG/element on the card (likely has class like `.jira-card__type`, `.jira-task-icon`, `.jira-checkbox`, or is an inline SVG near the "AUT-1" text in src/App.tsx).

Replace the blue fill with outline styling. Use this SVG inline:
```jsx
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="#4688EC" stroke-width="1.5" fill="none"/>
  <path d="M4.5 8.5L7 11L11.5 5.5" stroke="#4688EC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

If the checkbox is rendered via CSS background, set background to transparent and use a border instead.

Only change this one icon. Do not change any other visual element.

## Rationale

The card checkbox icon is the most visible mismatch: solid filled blue square in current vs outlined blue square in reference. Fixing it should improve SSIM in the card region and slightly improve color diversity.

## Worker summary

Edited two files: (1) src/App.tsx — replaced the inline SVG inside `.jira-issue-type` on the board card with the outlined 16×16 checkbox (blue `#4688EC` stroked rect + checkmark, no fill); (2) src/App.css — changed `.jira-issue-type` background from solid `#1868DB` to `transparent` and color to `#4688EC` so no blue fill remains behind the new outlined icon.
