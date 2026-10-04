# GameVerse

A dark, responsive browser arcade served by a small C++17 web server.

## Run

```bash
cmake -S . -B build
cmake --build build
./build/gameverse
```

Open `http://localhost:8080`.

## Easy edits

- Game names, descriptions, categories and image paths: `public/assets/js/data.js`
- Colors, spacing and animation: `public/assets/css/styles.css`
- Shared UI: `public/assets/js/app.js`
- Shared game engine: `public/assets/js/games/engine.js`
- Individual game settings: `public/assets/js/games/<game-name>.js`
- Game images: `public/assets/games/<game-name>/`
- C++ server and score API: `src/main.cpp`

Each game image folder contains `cover.jpg`, `card.jpg`, and `thumb.jpg`.
