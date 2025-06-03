import type { Express, RequestHandler } from "express";
import session from "express-session";

// Mock user for local development
const mockUser = {
  id: "local-dev-user",
  email: "dev@localhost.com",
  firstName: "Local",
  lastName: "Developer",
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  claims: {
    sub: "local-dev-user",
    email: "dev@localhost.com",
    first_name: "Local",
    last_name: "Developer",
    profile_image_url: null
  }
};

export function setupLocalDevAuth(app: Express) {
  console.log("Setting up local development authentication bypass...");
  
  // Simple session for local dev
  app.use(session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow HTTP for local dev
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Mock authentication middleware for local dev
  app.use((req: any, res, next) => {
    req.user = mockUser;
    req.isAuthenticated = () => true;
    next();
  });

  // Local dev auth routes
  app.get("/api/login", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });
}

// Local dev authentication check (always passes)
export const isAuthenticatedLocal: RequestHandler = (req, res, next) => {
  next();
};