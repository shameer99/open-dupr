# Audit of Hardcoded Values

This document outlines the hardcoded values identified in the codebase that should be made dynamic. Using environment variables or a configuration file for these values will improve the flexibility and maintainability of the application.

## `open-dupr-react/src/lib/api.ts`

- **Hardcoded Value:** `const BASE_URL = "https://api.dupr.gg";`
- **Suggestion:** This URL should be loaded from an environment variable. For a Vite project, this can be done by creating a `.env` file in the `open-dupr-react` directory with the following content:

  ```
  VITE_API_BASE_URL=https://api.dupr.gg
  ```

  The code can then be updated to use this environment variable:

  ```typescript
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  ```

## `open-dupr-react/src/components/pages/Login.tsx`

- **Hardcoded Values:**
  - `href="https://dashboard.dupr.com/signup"`
  - `href="https://github.com/shameer99/open-dupr"`
- **Suggestion:** These URLs can also be moved to environment variables to allow for easier configuration.

  In `.env`:
  ```
  VITE_DUPR_SIGNUP_URL=https://dashboard.dupr.com/signup
  VITE_GITHUB_REPO_URL=https://github.com/shameer99/open-dupr
  ```

  In the component:
  ```tsx
  <a
    href={import.meta.env.VITE_DUPR_SIGNUP_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    Create one on DUPR
  </a>
  ...
  <a
    href={import.meta.env.VITE_GITHUB_REPO_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    GitHub
  </a>
  ```

## `api_reference/raw_openapi_spec.json`

- **Hardcoded Value:** `"url": "https://api.dupr.gg"`
- **Suggestion:** While this file is primarily for documentation, the base URL could be tokenized (e.g., `{{API_BASE_URL}}`) and replaced during a build or documentation generation process. This would ensure that the API documentation always reflects the correct environment. However, for a static documentation file, this is lower priority than the application code.
