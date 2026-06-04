import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import authRouter from "./routes/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(projectRoot, "dist", "public");

  app.use(express.static(staticPath));

  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT) || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`  tRPC:  http://localhost:${port}/api/trpc`);
    console.log(`  Auth:  http://localhost:${port}/api/auth/login`);
  });
}

startServer().catch(console.error);