# Flora // ASCII Bloom

An interactive digital flowers library foundation. The current collection contains one flower: **FLORA / 03 - ASCII Bloom**, rendered as a depth-aware ASCII scene on a canvas.

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. Vite is configured with a relative base path so the built site works on GitHub Pages.

## Structure

- `src/engine/` contains typed 3D math, palettes, and the ASCII renderer.
- `src/flowers/` contains the extensible flower registry and the `flora03` geometry.
- `src/components/` contains the canvas and observatory HUD.
- `src/hooks/useOpeningAnimation.ts` controls the automatic bloom entrance and yields to manual bloom input.
- `src/styles/` contains design tokens and HUD/global styles.

New flowers can be added as a `FlowerDefinition` under `src/flowers/` and registered in `src/flowers/registry.ts`; the selector is already registry-driven.
