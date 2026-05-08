type AppConfig = {
  port: number;
  userApiBaseUrl: string;
};

export const appConfig: AppConfig = {
  port: Number(process.env.PORT) || 8080,
  userApiBaseUrl: process.env.USER_API_BASE_URL || "http://user-service:3001",
};
