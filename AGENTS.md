# Testing Startup

When testing this app, load the initial board state before starting the dev server or interacting with the UI.

Run `npm run state:load` to load the default fixture from `fixtures/initial-state.json`.

Run `npm run state:load -- ./path/to/fixture.json` to load a different test fixture into `public/initial-state.json`.

Do not edit `public/initial-state.json` by hand for tests. Use the CLI loader instead.
