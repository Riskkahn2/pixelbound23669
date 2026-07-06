# PIXELBOUND

A pixel-art auto-battler / idle dungeon crawler that runs entirely in the browser. Recruit a party, send them off to fight on their own, spend their loot and levels back at the tavern, and repeat.

No build step, no dependencies, no server required — it's just HTML, CSS, and vanilla JS drawn to a `<canvas>`.

## Running it

Open [pixelbound.html](pixelbound.html) directly in a browser:

```powershell
start pixelbound.html
```

If you'd rather serve it over `http://` (e.g. to test from another device on your network, or to avoid `file://` restrictions in some mobile browsers):

```powershell
npx serve .
```

## How it plays

- **Party** — recruit up to 6 heroes (Fighter, Thief, Healer, Mage), gear them up, spend level-up points.
- **Recruit / Shop / Stash** — hire new heroes, buy potions and gear, manage loot.
- **Map** — send your party into one of four biomes (Gloomwood Forest → Sunscar Wastes), each harder than the last with its own enemies and boss. The party fights automatically; you can use potions, pause, speed up, or retreat mid-run.
- **The Nightmare** — an endless, boss-less biome that unlocks once all four regular biomes are cleared. There's no way to win it — enemies and difficulty keep escalating the longer you stay, and the only way out is to retreat (which keeps everything you've earned so far).

## Files

- `pixelbound.html` — page shell and DOM structure
- `pixelbound.css` — styling
- `pixelbound.js` — game data, simulation, rendering, and UI
