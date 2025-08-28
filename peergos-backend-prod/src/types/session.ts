declare module "express-session" {
  interface SessionData {
    userId?: number;
    companyId?: number;
    userRole?: string;
    username?: string;
    email?: string;
    lastActivity?: Date;
    isAuthenticated?: boolean;
  }
}

export {};