import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import "./db";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const teacherExists = await storage.getUserByEmail("teprathna@gmail.com");
    if (!teacherExists) {
      await storage.createUser({
        name: "Tep Rathna",
        email: "teprathna@gmail.com",
        password: "teacher123",
        role: "teacher",
      });
      console.log("Created test teacher");
    }

    const studentExists = await storage.getUserByEmail("rathna@gmail.com");
    if (!studentExists) {
      await storage.createUser({
        name: "rathna",
        email: "rathna@gmail.com",
        password: "student123",
        role: "student",
      });
      console.log("Created test student");
    }

    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    const host = process.platform === "win32" ? "localhost" : "0.0.0.0";
    httpServer.listen({ port, host, reusePort: process.platform !== "win32" }, () => {
      console.log(`serving on port ${port}`);
    });
  } catch (err: any) {
    console.error("Failed to start server:", err.message || err);
    if (err.code === "EADDRINUSE") process.exit(1);
  }
})();
