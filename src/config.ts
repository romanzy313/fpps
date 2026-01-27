export const config = {
  appUrl: import.meta.env.VITE_APP_URL as string,
};

if (!config.appUrl) {
  console.log("ENV IS", import.meta.env);
  throw new Error("APP URL is not defined");
}
