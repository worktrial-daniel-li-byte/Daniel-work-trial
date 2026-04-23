# Dispatch 04 — resumed worker

- **Before reward:** 0.0124
- **After reward:**  0.0125
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

In src/App.tsx, find the sidebar "Autoloop" nav item (the one currently highlighted/active showing a blue square next to the text "Autoloop"). The blue square should contain a small white CLOUD icon (like the Atlassian "Confluence-style" cloud), not be empty.

Replace the icon/glyph inside that blue square with an inline SVG cloud icon. Use this SVG (set width=16 height=16 and fill white):
```
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 19a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 17.8 9.1 4 4 0 0 1 17 17H6.5z" fill="white"/></svg>
```

Also, in the TOPBAR, the "Jira" logo badge (the blue rounded-square to the left of the "Jira" text) should contain a simple white triangular/diamond Jira-like glyph. Replace whatever is currently inside that `.jira-sb-brand-logo` (or equivalent topbar brand-logo) container with this inline SVG (width 18 height 18, fill white):
```
<svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M11.53 2 2 11.53a.67.67 0 0 0 0 .94l5.77 5.77a.67.67 0 0 0 .94 0L12 15l3.29 3.29a.67.67 0 0 0 .94 0L22 12.47a.67.67 0 0 0 0-.94L12.47 2a.67.67 0 0 0-.94 0Z"/></svg>
```

Only edit src/App.tsx. Keep all other elements. If the brand-logo container is an `<img>` or uses a mask, replace it with a `<span>` wrapping the SVG.

## Rationale

Adding the proper Jira brand glyph and the cloud-on-Autoloop icon introduces white/blue pixel detail matching the reference, improving SSIM on those small but attention-grabbing regions.

## Worker summary

Edited src/App.tsx: replaced the empty blue "Autoloop" sidebar swatch with a blue square containing the white cloud SVG, and replaced the gradient Jira brand SVG inside `.jira-sb-brand-logo` with the simple white triangular Jira glyph (18×18, fill white).
