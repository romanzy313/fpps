export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
};

if (!config.apiUrl) {
  console.log("ENV IS", import.meta.env);
  throw new Error("API URL is not defined");
}
