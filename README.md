# GameVerse

A dark, responsive browser arcade ready for GitHub Pages and also served by a
small C++17 web server for local score recording.

## Publish with GitHub Pages

1. Create a GitHub repository and upload everything inside this folder.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your main branch and the **/(root)** folder.
5. Save. GitHub will publish the root `index.html`.

The games run as a static website on GitHub Pages. Local score history uses the
optional C++ server; personal best scores still work through browser storage.

## Run

```bash
cmake -S . -B build
cmake --build build
./build/gameverse
```

Open `http://localhost:8080`.

## Easy edits

- Game names, descriptions, categories and image paths: `assets/js/data.js`
- Colors, spacing and animation: `assets/css/styles.css`
- Shared UI: `assets/js/app.js`
- Shared game engine: `assets/js/games/engine.js`
- Individual game settings: `assets/js/games/<game-name>.js`
- Game images: `assets/games/<game-name>/`
- C++ server and score API: `src/main.cpp`

Each game image folder contains `cover.jpg`, `card.jpg`, and `thumb.jpg`.
