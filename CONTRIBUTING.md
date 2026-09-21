# Contributing

Issues and pull requests are welcome.

- `npm install`, then `npm test` (headless Blockly under jsdom) and `npm run typecheck`.
- `npm run dev` starts the demo. It needs `TYPESAFE_API_KEY` in `.env` or the environment; the key stays in the Node proxy and never reaches the browser.
- New blocks go in `src/blocks/`, their code in `src/generators/`, and a generator test in `test/`.
- Keep each block to one Jev question. Batching several questions into one request is a separate block on the roadmap.
