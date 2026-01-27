# fpps (real name TBD)

A peer-to-peer file sharing application. Supports two-way uploads using a concept of "rooms".

## Getting Started

-   `pnpm dev` - Starts a dev server at http://localhost:5173/

-   `pnpm build` - Builds for production, emitting to `dist/`. Prerenders all found routes in app to static HTML

-   `pnpm preview` - Starts a server at http://localhost:4173/ to test production build locally

## Technologies

- WebRPC: peer-to-peer communication
- Preact frontend for a slim SPA experience
- Minimal server infrastructure (cloudflare workers): encrypted signaling via http to establish peer to peer connectivity
- Upload/download folders using [fflate](https://github.com/101arrowz/fflate), for single file download and compression!
- Using [StreamSaver.js](https://github.com/jimmywarting/StreamSaver.js) library to download files as a writable stream. It has better support support then [saveFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker#browser_compatibility).
