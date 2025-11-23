export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  appUrl: import.meta.env.VITE_APP_URL as string,
};

if (!config.apiUrl) {
  console.log("ENV IS", import.meta.env);
  throw new Error("API URL is not defined");
}

if (!config.appUrl) {
  console.log("ENV IS", import.meta.env);
  throw new Error("APP URL is not defined");
}
