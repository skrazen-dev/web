export const ENV = {
  jwtSecret: process.env.JWT_SECRET ?? "dev-jwt-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
} as const;