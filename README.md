<div align="center">

<img src="https://vitejs.dev/logo.svg" alt="Vite Logo" width="80" />
<img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React Logo" width="80" />
<img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript Logo" width="80" />

# ⚡ React + TypeScript + Vite

**The fastest way to bootstrap a modern React application.**  
Minimal. Typed. Blazing fast.

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-Configured-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)

</div>

---

## 🧩 Overview

This template gives you a **minimal but powerful** setup to get React working in Vite with:

- ⚡ **HMR** (Hot Module Replacement) out of the box
- 🔷 **Full TypeScript** support
- 🧹 **ESLint** pre-configured with sensible defaults

---

## 🔌 Official Plugins

Two official Vite plugins are available for React — pick based on your needs:

| Plugin | Transformer | Best For |
|--------|-------------|----------|
| [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) | [Oxc](https://oxc.rs) | Fastest builds, modern toolchain |
| [`@vitejs/plugin-react-swc`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) | [SWC](https://swc.rs/) | Rust-based, excellent compatibility |

---

## ⚗️ React Compiler

> **Note:** The React Compiler is **not enabled** in this template due to its impact on dev & build performance.

To opt in, follow the official guide:
👉 [React Compiler Installation Docs](https://react.dev/learn/react-compiler/installation)

---

## 🧹 Expanding the ESLint Configuration

For **production applications**, it's strongly recommended to enable type-aware lint rules.

### Step 1 — Enable Typed Linting

```js
// eslint.config.js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Remove tseslint.configs.recommended and replace with one of:
      tseslint.configs.recommendedTypeChecked,   // ✅ Recommended
      tseslint.configs.strictTypeChecked,        // 🔒 Stricter
      tseslint.configs.stylisticTypeChecked,     // 🎨 Stylistic (optional add-on)
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### Step 2 — Add React-Specific Lint Rules *(optional but recommended)*

Install the plugins:

```bash
npm install -D eslint-plugin-react-x eslint-plugin-react-dom
```

Then configure:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],  // ⚛️  React rules
      reactDom.configs.recommended,              // 🌐 React DOM rules
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

## 📚 Resources

- 📖 [Vite Documentation](https://vitejs.dev/guide/)
- ⚛️ [React Documentation](https://react.dev/)
- 🔷 [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- 🧹 [ESLint Docs](https://eslint.org/docs/latest/)

---

<div align="center">

Made with ❤️ using **Vite** · **React** · **TypeScript**

</div>
