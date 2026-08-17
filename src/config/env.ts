// Zod validates environment variables so the app fails early if .env is wrong
import * as z from 'zod';

// Read and validate Vite env vars (from .env files)
const createEnv = () => {
  // Expected shape of our environment config
  const EnvSchema = z.object({
    // API base URL, e.g. http://localhost:8000 — empty in dev uses Vite proxy
    API_URL: z.string(),
    // "true" / "false" string → boolean (optional)
    ENABLE_API_MOCKING: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true')
      .optional(),
    // Frontend URL (used by older mock-server setups)
    APP_URL: z.string().optional().default('http://localhost:3000'),
    // Port for a separate mock API process (not required when using MSW in browser)
    APP_MOCK_API_PORT: z.string().optional().default('8080'),
  });

  // Vite exposes env vars as import.meta.env.VITE_APP_*
  // We strip the VITE_APP_ prefix so schema keys are short (API_URL, etc.)
  const envVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith('VITE_APP_')) {
      acc[key.replace('VITE_APP_', '')] = value;
    }
    return acc;
  }, {});

  // Validate the collected env vars (empty API_URL = use Vite dev proxy)
  const parsedEnv = EnvSchema.safeParse({
    API_URL: '',
    ...envVars,
  });

  // If invalid, throw a clear error listing missing/bad fields
  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
The following variables are missing or invalid:
${Object.entries(parsedEnv.error.flatten().fieldErrors)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}
`,
    );
  }

  // Return the clean, typed env object
  return parsedEnv.data;
};

// Create once and export for the whole app
export const env = createEnv();
