/**
 * Centralized API configuration.
 * Defaults to the production Azure App Service backend if NEXT_PUBLIC_API_URL is unset.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";
