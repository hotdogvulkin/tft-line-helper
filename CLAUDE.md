# TFT Line Helper - Claude Code Instructions

## Source of Truth
ALL comp data must come exclusively from `tft_set16_comp_reference.json` in this directory.
Do NOT invent champions, items, traits, or comps from memory or general TFT knowledge.
If something is not in the reference file, it does not exist in this app.

## Board Positioning Rules
- Row 1: ALL melee units (tanks, fighters, juggernauts, wardens, bruisers, melee carries)
- Row 2: ONLY used in Freljord comps for Frozen Tower positioning (Volibear/Tryndamere behind tower for damage amp)
- Row 3: Never used
- Row 4: ALL ranged units (carries, mages, casters, marksmen)
- Rule: if the unit walks up to hit enemies = Row 1. If it stands still and shoots/casts = Row 4.

## Project Structure
- This is an Electron + React + TypeScript + Vite app
- Entry: `src/` contains all source code
- The interactive Runeterra map is the main UI — each region is a clickable polygon
- Clicking a region opens a comp panel showing comps assigned to that region

## What the App Does
Guides TFT players on how to play meta comps. For each region on the map, show:
1. The comps assigned to that region (from the JSON)
2. For each comp: tier, playstyle, difficulty, win condition, core units + items, augments, stage-by-stage guide, positioning, and tips

## Data File
`tft_set16_comp_reference.json` — structured by region, each with:
- `lore`: flavor text for the region
- `key_trait_mechanic`: how the trait works
- `comps[]`: array of comp objects with all guide data

## Do Not
- Use champion names not in the reference file
- Invent positioning that contradicts the row rules above
- Add comps not in the reference file
- Change which region a comp belongs to
