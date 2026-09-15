import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lgs2027.studytracker",
  appName: "LGS 2027",
  webDir: "public",
  server: {
    url: "https://lgsapp.vercel.app",
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#0f172a",
  },
};

export default config;
