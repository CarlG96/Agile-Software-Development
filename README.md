# Agile Software Development

This repository is organized as two npm workspaces:

- `frontend/`: Vite, React, and TypeScript web application
- `backend/caseStudyAPI/`: Express and TypeORM API

## Run both applications

```powershell
npm install
npm run dev
```

`npm run dev` starts the backend watcher first and the Vite frontend alongside it. Output is labeled as `backend` or `frontend`; stopping either process stops the other.

The frontend starts independently of the database. The API initializes its MySQL data source before accepting requests, so it will remain unavailable until MySQL is running and `backend/caseStudyAPI/.env.development` contains valid database settings.

To run one application on its own, use `npm run dev:backend` or `npm run dev:frontend` from the repository root.
