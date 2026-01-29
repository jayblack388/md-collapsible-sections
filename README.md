# Markdown Collapsible Sections

Collapse and expand sections in the Markdown preview by clicking on headers. Great for navigating long documents.

## Features

- Click any header (h1-h6) to collapse/expand its content
- **Cmd/Ctrl+Click** to recursively collapse or expand a section AND all its nested children
- Chevron indicator shows collapse state
- Nested sections work correctly (collapsing h2 hides h3, h4, etc. until next h2)
- State persists across preview refreshes
- Smooth animations

## Installation

Search "Markdown Collapsible Sections" in the Cursor/VS Code Extensions panel.

Or install from [Open VSX](https://open-vsx.org/extension/jayblack388/md-collapsible-sections).

## Usage

1. Open a Markdown file
2. Open the Markdown preview (Cmd+Shift+V / Ctrl+Shift+V)
3. Click any header to collapse its section
4. Click again to expand
5. **Cmd+Click** (Mac) or **Ctrl+Click** (Windows/Linux) to recursively collapse/expand the section and all its nested sub-sections

## How It Works

- **H1** collapses everything until the next H1
- **H2** collapses everything until the next H1 or H2
- **H3** collapses everything until the next H1, H2, or H3
- And so on...

## License

MIT
