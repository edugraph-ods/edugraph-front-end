# EduGraph — Frontend (Next.js + TypeScript)

This repository implements the frontend using **Next.js** and **TypeScript**, following the principles of **Clean Architecture**, with a defined layered organization that includes presentation/components, contexts, hooks, lib, styles and utils.


# What is this project

The EduGraph frontend is an application developed with Next.js and TypeScript that provides the presentation layer for university learning path planning. It is structured following principles inspired by Clean Architecture, so that the presentation logic (pages and components) is separated from the application logic (hooks and contexts) and domain utilities (lib/utils). The API (backend) operates as an independent service and is consumed by the frontend via HTTP calls.

---

# Prerequisites

* Node.js (LTS recommended, e.g. **>= 18**)
* npm (v9+) — or your preferred package manager (yarn/pnpm)
* Git (optional)

---

# Quick start (create project)


```bash
git clone https://github.com/edugraph-ods/edugraph-front-end.git
cd edugraph-front-end
```

---

# Install required dependencies

Run these commands in the frontend project root.

```bash
# 1) shadcn UI 
npx shadcn@latest add button

# 2) react-icons
npm install react-icons --save

# 3) next-intl (i18n)
npm install next-intl

# 4) motion 
npm install motion

# 5) Framer Motion
npm install framer-motion

# 6) React Flow
npm install reactflow

# 7) React Toastify
npm install react-toastify @types/react-toastify

# 8) Dagre
npm install dagre @types/dagre
```

---

# Run the app

```bash

npm/yarn/pnpm install

npm/yarn/pnpm run dev

```

Production build:

```bash
npm/yarn/pnpm run build
npm/yarn/pnpm start
```

---

## License

This project is licensed under the MIT License see the [LICENSE](./LICENSE) file for details.