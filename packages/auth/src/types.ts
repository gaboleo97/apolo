declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      tenantId: string;
      role: string;
      modules: string[];
    };
  }
}

export {};