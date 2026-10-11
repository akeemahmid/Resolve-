import { httpRouter } from "convex/server";
import { upload, options } from "./inspections/uploadHttp";
import { auth } from "./auth";
import { webhook } from "./coordination/webhook";

const http = httpRouter();

auth.addHttpRoutes(http);
http.route({ path: "/resend-webhook", method: "POST", handler: webhook });
http.route({ path: "/inspection-upload", method: "POST", handler: upload });
http.route({ path: "/inspection-upload", method: "OPTIONS", handler: options });

export default http;
