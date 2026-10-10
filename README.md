# Murdoku Companion

An interactive browser-based companion for solving Murdoku puzzles. Create and edit a grid, mark possible and impossible positions for suspects, and save or restore your puzzle progress.

## Quick start

Open **`index.html`** in a modern browser. No account, installation, backend, or database is required.

The project can also be served as a static site using GitHub Pages.

## Features

- Configure grid size, suspects, an image background, blocked cells, and perspective alignment.
- Mark candidates, place suspects and note symbols, or rule out cells with an X.
- Mouse drag support, an eraser, and board-only Undo/Redo.
- Annotate suspects with gender and colored ribbons; redistribute suspect colors.
- Light and dark interface themes. The puzzle image is left unchanged.
- Export and import a JSON file containing the puzzle and its progress.
- Browser-local autosave.

## Controls

### On the puzzle grid

| Action | Result |
| --- | --- |
| Left click / drag | Toggle or paint candidate marks for the selected suspect or symbol |
| Right click / drag | Mark or remove X |
| Long left press | Place or remove a suspect or symbol |
| Eraser + left click / drag | Clear cells |
| Undo / Redo | Revert or replay board actions only |

### On suspect cards

| Action | Result |
| --- | --- |
| Left click | Select suspect |
| Right click | Cycle ribbon style |
| Ctrl + click | Cycle ribbon color |
| Shift + click | Cycle gender |
| Long left press | Change the suspect letter |

## Saving

Progress is automatically saved in your browser. **Export** a JSON backup if you want to move progress to another browser or device; use **Import** to restore it.

## Current version

**v0.3.42** — blocked-cell editing supports left click / drag to add or erase blocks, based on the first clicked cell.

## License

No license has been selected yet. All rights reserved by the copyright holder until a license is added.