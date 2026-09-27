This folder is intentionally empty.

The 3D watch shown in the Hero and Configurator sections is built procedurally
in script.js using Three.js primitive geometry — not loaded from a .glb file.
This is deliberate: loading a .glb requires GLTFLoader to fetch a binary file,
which browsers block when a page is opened directly via file:// (no server).

A procedural model also lets the Configurator recolor and restructure the
watch live (case finish, dial color, and a genuinely different strap
geometry for leather/rubber vs. a segmented steel bracelet) with no loading
step at all.

If you want to use a real watch.glb in the future, place it here and load it
with GLTFLoader — but you will need to run the project through a local web
server (e.g. `npx serve` or VS Code's "Live Server") rather than
double-clicking index.html, since file:// blocks the loader's internal
fetch request.
