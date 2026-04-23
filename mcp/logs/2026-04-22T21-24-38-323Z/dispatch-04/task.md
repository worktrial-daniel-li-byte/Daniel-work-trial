# Dispatch 04 — resumed worker

- **Before reward:** -0.0727
- **After reward:**  -0.0727
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: raise pqgram region scores by mirroring the reference's DOM sub-tree nesting inside each anchor.

Step A (diagnosis — run bash, no code changes):

1. Read /Users/fleet/fleet-trial/reference_app/html/reference.html.

2. For each of these testids, extract the element with that data-testid AND everything inside it up to closing tag. Print each as a structured tree showing only tag names, data-testid values, and nesting depth (ignore class/style/aria/text content). Use a simple indented `<tag data-testid="...">` form, one element per line.

   Testids to extract from reference.html:
   - page-layout.root
   - page-layout.top-nav
   - page-layout.sidebar
   - horizontal-nav.ui.content.horizontal-nav
   - horizontal-nav-header.ui.project-header.header
   - business-filters.ui.filters.assignee-filter
   - board.content.board-wrapper
   - layout-controller.ui.bottom-right-corner.container.styled-container

   You can do this with a small Node script that parses with a library already in node_modules (check for cheerio, jsdom, parse5). Or write the smallest regex-based extractor you can. Limit each subtree to the first ~80 lines if it's huge.

3. Separately, open http://localhost:5173 with Playwright (chromium is already installed per your last run) and for each of those same testids print the SAME tree-of-tags shape from the live gen DOM.

4. Print the two trees side-by-side (or one after the other labeled REF / GEN) for each testid so I can see where the shapes diverge.

Do NOT edit any files yet. Just output both trees per region so I can plan the structural edits.

## Rationale

pqgram: regions scores are low (not zero but ~0.15-0.35) because wrapper-div nesting under each anchor doesn't match the reference. Seeing both trees lets me dispatch precise structural edits that will raise details.pqgram.regions and details.pqgram.whole.

## Worker summary

I now have both trees. Here's the side-by-side comparison for all 8 regions:

---

## REF vs GEN — per region

### 1. `page-layout.root`
| REF | GEN |
|-----|-----|
| `<div>` → `<div data-testid="page-layout.banner">` (first child) | `<div>` → `<header data-testid="page-layout.top-nav">` (first child — **banner missing**) |

REF has a `data-testid="page-layout.banner"` div as the very first child; GEN has none.

---

### 2. `page-layout.top-nav`
```
REF <header data-testid="page-layout.top-nav">
  <style>
  <style>
  <div>           ← left: hamburger + logo area
    <div>
      <div>
        <button>
        ...
      <div>
        <button>
        ...
      <div data-testid="atlassian-navigation--product-home--container">
        <a>
  <div>           ← middle: search + create
    <button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper">
      <div data-testid="search-input-container">
        <div>
          <span>
            <svg>
        <input data-testid="search-input">
    <span data-testid="ak-spotlight-target-global-create-spotlight">
      <div>
        <button data-testid="atlassian-navigation--create-button">
  <nav>           ← right: Rovo + notifications + help + avatar
    <div>
      <button>
      <span data-testid="atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate">
      <div>
        <div data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger">
      <div data-testid="atlassian-navigation--secondary-actions--help--menu-trigger">

GEN <header data-testid="page-layout.top-nav">
  <div>           ← left
    <button>
    <button>
    <div>
  <div>           ← middle (search + create — NO wrapping button, NO testids on input/container)
    <div>
      <span><svg>
      <input>
    <button>
  <div>           ← right — plain <div>, NOT <nav>; missing all secondary-action testids
    <button>
    <button>
    <div>
```
**Key diffs**: (a) middle section should be wrapped in `<button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper">` containing `<div data-testid="search-input-container">` + `<input data-testid="search-input">` and sibling `<span data-testid="ak-spotlight-target-global-create-spotlight">` → `<button data-testid="atlassian-navigation--create-button">`; (b) right section must be `<nav>` not `<div>`; (c) missing `atlassian-navigation--product-home--container`, `atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate`, `atlassian-navigation--secondary-actions--notifications--menu-trigger`, `atlassian-navigation--secondary-actions--help--menu-trigger` testids.

---

### 3. `page-layout.sidebar`
```
REF  <nav data-testid="page-layout.sidebar">        ← tag: <nav>
  <div><div><div>
    <div>
      <div data-testid="NAV4_for-you-container">
        <a data-testid="NAV4_for-you">
      ...
    <div>
      <div><div data-testid="NAV4_jira.sidebar.apps-container">
        <button data-testid="NAV4_jira.sidebar.apps">
        ...
        <button data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger">

GEN  <aside data-testid="page-layout.sidebar">      ← tag: <aside> (wrong)
  <div><div><ul>   ← list-based structure; NO NAV4_* testids anywhere
    <li><button>...
    <li><button>...
```
**Key diffs**: Tag should be `<nav>` not `<aside>`; missing `NAV4_for-you-container`, `NAV4_for-you`, `NAV4_jira.sidebar.apps-container`, `NAV4_jira.sidebar.apps`, `more-nav-menu-button-trigger` testids.

---

### 4. `horizontal-nav.ui.content.horizontal-nav` ← **nesting is INVERTED**
```
REF  <header data-testid="horizontal-nav.ui.content.horizontal-nav">  ← tag: <header>
  <div>
    <div>
      <div>
        <div>
          <nav>             ← breadcrumb
        <div data-testid="horizontal-nav-header.ui.project-header.header">  ← project header INSIDE horizontal-nav!
    <nav>                   ← tabs
      <ul><li><a data-testid="navigation-kit-ui-tab.ui.link-tab">...

GEN  <nav data-testid="horizontal-nav.ui.content.horizontal-nav">   ← tag: <nav> (wrong)
  <div>
    <span><button>...  ← tab buttons directly, NO wrapping <ul><li><a> structure
```
**Critical**: In REF, `horizontal-nav.ui.content.horizontal-nav` is a `<header>` that **wraps** `horizontal-nav-header.ui.project-header.header`. In GEN it's reversed — the project-header wraps the nav. The nesting relationship is inverted.

---

### 5. `horizontal-nav-header.ui.project-header.header`
```
REF  <div data-testid="horizontal-nav-header.ui.project-header.header">
  <div>                      ← avatar/icon column
    <div><div><div>
      <img data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image">
  <div>                      ← title column
    <form><div><div>
      <button>
      <div><div><h1>
        <div data-testid="horizontal-nav-header.common.ui.read-view">
  <div>                      ← team/share column
    <div>
      <button data-testid="team-button-trigger">
    <div><div>
      <button data-testid="navigation-project-action-menu.ui.themed-button">
  <div>                      ← action icons column
    <button>
    <div><button>
    <div><span><button data-testid="feedback-button.horizontal-nav-feedback-button">
    <span><button data-testid="platform.ui.fullscreen-button.fullscreen-button">

GEN  <div data-testid="horizontal-nav-header.ui.project-header.header">
  <div>                      ← eyebrow breadcrumb
    <span><span>
  <div>                      ← title row (icon + h1 + buttons collapsed)
    <span><svg>
    <h1>
    <button>
    <div><button>
    <div>
    <div>
      <button><button><button><button>
  <nav data-testid="horizontal-nav.ui.content.horizontal-nav">   ← tabs NESTED here (wrong)
```
**Key diffs**: REF has 4 distinct `<div>` children (icon, title-form, team, actions), each with specific testids. GEN collapses everything into 2 divs + wraps the nav tabs as a child.

---

### 6. `business-filters.ui.filters.assignee-filter`
```
REF  <fieldset data-testid="business-filters.ui.filters.assignee-filter">
  <legend>
  <div>
    <div>
      <input>
      <div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">
        <div><span><img>
        <span><span><div>
-- fieldset ends here --
<button data-testid="business-filters.ui.filters.trigger.button-wrapper">  ← SIBLING of fieldset, NOT a child

GEN  <fieldset data-testid="business-filters.ui.filters.assignee-filter">
  <button data-testid="business-filters.ui.filters.trigger.button-wrapper">  ← INSIDE fieldset (wrong)
    <span><span><span>
  <span data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">
    <span><span>
```
**Key diffs**: In REF the fieldset contains `legend + div > div > [input, div(presence-avatar)]`; the trigger button is a **sibling** of the fieldset, not a child. In GEN the trigger button is the first child of the fieldset, and presence avatar is a direct `<span>` child (missing the `div > span > img` inner structure).

---

### 7. `board.content.board-wrapper`
```
REF  <div data-testid="board.content.board-wrapper">
  <div><div>
    <div data-testid="board.content.cell">           ← per-column cell
      <div data-testid="board.content.cell.column-header">
        <div><div><form>...
            <div data-testid="board.content.cell.column-header.name">
        <div><button>...(add-card btn)
      <div data-testid="board.content.cell.scroll-container">
        <div><div>
          <div><button>  (drag handle)
          <div data-testid="board.content.cell.card">
            <a>
            <div><span><span><span><div><button>...
    <div data-testid="board.content.cell">  (2nd column)
    ...

GEN  <div data-testid="board.content.board-wrapper">
  <div><div>            ← column wrapper
    <div>               ← NO board.content.cell testid
      <button>
      <span><span>
    <div>               ← NO board.content.cell.scroll-container testid
      <div>
        <article>       ← card rendered as <article> not anchored with card testid
  <div>                 ← 2nd column, same structure, no testids
  <div>                 ← 3rd column
  <button>              ← add column button
```
**Key diffs**: Missing `board.content.cell`, `board.content.cell.column-header`, `board.content.cell.column-header.name`, `board.content.cell.scroll-container`, `board.content.cell.card` testids. Cards rendered as `<article>` without the `<a>` anchor child.

---

### 8. `layout-controller.ui.bottom-right-corner.container.styled-container`
```
REF  <div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container">
  <div>
    <div>
      <div>                ← spacer/empty
      <div>
        <div>
          <div>
            <button data-testid="platform-ai-button">
              <span>
              <div><svg>...

GEN  <div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container">
  <div>
    <button>               ← button is only 2 levels deep (div > div > button)
      <span>
```
**Key diffs**: REF wraps the button in 4 nested `<div>` layers before the `<button data-testid="platform-ai-button">`; GEN goes `div > button` (only 1 layer). Missing `platform-ai-button` testid.

---

## Summary of highest-impact structural mismatches

| Region | Tag wrong | Nesting wrong | Missing testids |
|--------|-----------|---------------|-----------------|
| `page-layout.root` | — | banner div missing | `page-layout.banner` |
| `page-layout.top-nav` | right section `<div>` → `<nav>` | search wrapper missing | 6 testids (search-input, create-button, notifications, help, etc.) |
| `page-layout.sidebar` | `<aside>` → `<nav>` | — | 5 NAV4_* testids |
| `horizontal-nav.ui.content.horizontal-nav` | `<nav>` → `<header>` | **inverted**: nav should wrap project-header, not vice-versa | `navigation-kit-ui-tab.ui.link-tab` |
| `horizontal-nav-header.ui.project-header.header` | — | tabs nested inside (wrong) | `navigation-apps-sidebar-inline-config...`, `team-button-trigger`, `feedback-button.*`, `platform.ui.fullscreen-button.*`, `horizontal-nav-header.common.ui.read-view` |
| `business-filters.ui.filters.assignee-filter` | — | trigger button is child (should be sibling) | `legend` child missing |
| `board.content.board-wrapper` | — | — | `board.content.cell`, `board.content.cell.column-header`, `board.content.cell.scroll-container`, `board.content.cell.card` |
| `layout-controller.*` | — | button only 2 levels deep (needs 4) | `platform-ai-button` |
