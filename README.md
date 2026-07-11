# Fractal Drift

An interactive WebGL2 navigator for flying through procedural 3D worlds: Mandelbox, liminal rooms, lattices, organic tunnels, infinite pizza, a neon cathedral, Menger sponge, crystal fields, void rings, and custom GLSL distance fields.

## Controls

- Desktop: `WASD` to move, mouse to look, `Shift` to boost, `F` for the formula editor.
- Touch: left joystick to move, drag the world to look.
- The graphics panel controls speed, draw distance, field of view, ray-march detail, shadows, and volumetric glow.

## Development

```bash
npm ci
npm run dev
```

The default build targets the OpenAI Sites/Vinext runtime:

```bash
npm run build
```

## GitHub Pages

The workflow in `.github/workflows/pages.yml` creates a static Next.js export and publishes it to GitHub Pages after every push to `main`. In repository settings, Pages must use **GitHub Actions** as its source.
