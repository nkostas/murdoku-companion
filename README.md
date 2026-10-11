# Murdoku Companion

An interactive browser-based companion for **solving Murdoku puzzles**. Keep track of suspects, possible positions, deductions and notes while you work out the solution yourself. **This is an assistant, not an automatic solver.**

**Current version:** `v0.3.44`

## Run the app

- **Online:** [Open Murdoku Companion](https://nkostas.github.io/murdoku-companion/)
- **Offline:** Download or clone the project and open `index.html` in a modern browser.

No installation, account, server or database is required. Puzzle state is stored in the browser when local storage is available; use Export to back it up or move it between browsers and devices.

## New / Edit — Puzzle setup guide

Open **New / Edit** in the top bar to create a new puzzle or modify the current one. You can also open the editor's **Help** button for the in-app instructions.

### 1. Basic information

1. Type a puzzle **Title**. If left blank, the image filename can be used.
2. Choose a **6×6**, **9×9** or **16×16** preset, or enter custom numbers for **Rows**, **Columns** and **Suspects** (up to 52 suspects).
3. Press **Apply** to generate the suspects. Every Apply redistributes their colors across the full color spectrum.

The letter **X** is never used. With up to **22** suspects, **V** is reserved for the Victim. With more than 22 suspects, neither V nor X is used; IDs can continue with two letters when needed.

### 2. Image

Add a background using **Image URL** or **Choose local image**. Local images are embedded in the saved puzzle. Use **Remove image** when necessary. The grid can also be used without an image.

### 3. Grid alignment and editor modes

| Mode | How to use it |
| --- | --- |
| **Perspective** | Drag the TL, TR, BR and BL handles onto the four corners of a grid photographed at an angle, then select **Rectify image**. **Reset corners** starts over. |
| **Calibration** | Drag the four grid edges directly in the preview to align the grid lines with the image. The numeric inset fields are no longer shown. |
| **Blocked cells** | Left-click an empty cell to block it, or a blocked cell to unblock it. **Left drag** repeats the first cell's add/remove action across the dragged cells. **Right click** is disabled. Use **Clear all blocked cells** to start again. |

Blocked cells are optional; use them only when a puzzle location is known to be unavailable.

### 4. Editor layout

The three Editor modes are arranged vertically. Their related action buttons appear to the right only for the active mode: **Rectify image** / **Reset corners** for Perspective, and **Clear all** for Blocked cells.

Drag the **right edge of the editor tools panel** horizontally to adjust its width independently of the Play suspect sidebar. The width is saved in this browser.

The **Marker & symbol size** control is in **Play**, under the Note Symbols panel.

### 5. Finish

- **Save & Play** saves the setup and returns to the board.
- **Cancel** leaves the editor without saving the latest changes.
- **New Puzzle** starts a fresh setup, including an empty blocked-cell list.

Changing the grid dimensions or suspect IDs can reset play progress. Export a backup first if you want to preserve your existing puzzle and annotations.

## Play — Solving guide

The suspect panel is on the **left**, the puzzle grid is in the **center**, and editing, viewing, checking and saving controls are on the **right**. Open the Play **Help** button for a concise guide in the app.

### 1. Marking the grid

Select a suspect or note symbol, then use the following gestures:

| Action | Result |
| --- | --- |
| **Left click** | Add/remove a candidate mark for the selected suspect or note symbol. |
| **Left drag** | Add/remove candidate marks across cells; the first cell determines the action for that drag. |
| **Right click / drag** | Add/remove a global **X**, meaning this cell is impossible for every suspect. |
| **Long left press** | Place/remove the selected suspect or note symbol. Other cells in that row and column become automatically unavailable. |
| **Eraser + left click / drag** | Clear candidate marks, manual X and any placement from the visited cells. The eraser's right click still controls X. |

You can see possible positions for **all** suspects simultaneously. Selecting a suspect emphasizes its marks without hiding or dimming the others.

### 2. Suspect cards

| Action on a suspect | Result |
| --- | --- |
| **Left click** | Select the suspect. Keyboard A–Z also selects a matching single-letter suspect. |
| **Right click** | Cycle ribbon: **none → single → double → thick → none**. For a suspect without a ribbon, the last-used ribbon type and color are applied. |
| **Ctrl + click** | Cycle ribbon color: **white, black, red, yellow, green, blue, orange, purple**. |
| **Shift + click** | Cycle gender: **none → male → female → none**. |
| **Long left press** | Change the suspect's letter, subject to the puzzle naming rules. |

The cards show the gender in the upper left and the ribbon in the upper right. A placed suspect shows a prominent check mark. Use **Redistribute colors** in the suspect panel to generate new colors without clearing progress.

### 3. Note symbols

The four note symbols — **▲ Triangle**, **● Circle**, **■ Square**, **★ Star** — can be used for additional deductions. They can have candidate marks and placements, but **do not count as suspects** when checking completion.

### 4. Editing history, erasing and checking

- **Undo / Redo** reverses or restores board actions (candidate marks, X marks and placements) only. It does not undo gender/ribbon/color choices.
- **Clear selected suspect** removes the selected suspect's notes and placement.
- **Reset progress** clears play progress after confirmation.
- **Available positions** counts cells that are not blocked, manually marked X, occupied or automatically excluded by a placement. Candidate marks do not change this number.
- **Check** verifies that the suspects are placed consistently with the board restrictions. **It does not know or check the official puzzle solution.**

At most one suspect or note symbol can be placed in each row and column; some rows or columns may remain empty.

### 5. View options

- **Marker & symbol size** below Note Symbols in the left panel adjusts the size of board annotations immediately, from **70% to 150%**. It is saved with the puzzle.
- **Coordinates** displays row/column coordinates.
- **Dark view / Light view** changes the interface theme, without altering the puzzle image.
- The sidebar width and top bar height can be resized by dragging their borders.

### 6. Export and Import

**Export** saves the **puzzle setup and progress together** into one JSON file, named like:

`Backyard Garden_20261011_1530.json`

**Import** loads the JSON file to restore your puzzle and progress. This is also useful when moving to another computer or browser. Export before modifying a puzzle if you want a backup.

## AI disclosure

**Murdoku Companion was created with the assistance of AI.** AI tools have been used for application development, debugging, interface design and documentation. The project requirements and feature decisions are guided by its maintainer.

## License

No license has been selected yet. All rights reserved by the copyright holder until a license is added.
