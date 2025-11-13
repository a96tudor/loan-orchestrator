# Loan Orchestrator Frontend

React + TypeScript + Vite + Tailwind CSS frontend application.

## Development

### Running the Application

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
npm run build
npm run preview
```

## Tooling

### Linting

This project uses ESLint with flat config for code quality and consistency.

- **Check for linting errors**: `npm run lint`
- **Auto-fix linting issues**: `npm run lint:fix`

The ESLint configuration includes:
- TypeScript-aware rules
- React and React Hooks rules
- Accessibility (jsx-a11y) rules
- Tailwind CSS-specific linting
- Import/export validation

### Formatting

This project uses Prettier for code formatting.

- **Format all files**: `npm run format`
- **Check formatting**: `npm run format:check`

### Editor Integration

For the best development experience, configure your editor to:

1. **ESLint**: Run ESLint on save to catch issues immediately
   - VS Code: Install the "ESLint" extension
   - The extension will automatically use the `eslint.config.mjs` flat config

2. **Prettier**: Format on save using Prettier
   - VS Code: Install the "Prettier - Code formatter" extension
   - Add to your VS Code settings:
     ```json
     {
       "editor.defaultFormatter": "esbenp.prettier-vscode",
       "editor.formatOnSave": true,
       "[typescript]": {
         "editor.defaultFormatter": "esbenp.prettier-vscode"
       },
       "[typescriptreact]": {
         "editor.defaultFormatter": "esbenp.prettier-vscode"
       }
     }
     ```

This setup ensures that:
- ESLint handles code quality and best practices
- Prettier handles code formatting
- No conflicts between ESLint and Prettier (via `eslint-config-prettier`)

