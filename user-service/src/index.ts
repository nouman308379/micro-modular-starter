import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import logger from "./core/utils/logger.util.js";
import bodyParser from "body-parser";
import morgan from "morgan";
import "dotenv/config";
import passport from "passport";
import session from "express-session";

import "../src/modules/auth/strategies/jwt-strategy.js";
import "../src/modules/auth/strategies/google-strategy.js";

import authRouter from "../src/modules/auth/routes/auth.route.js";

// Add at the top
import { fileURLToPath } from "url";
import { dirname } from "path";

// Simulate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Then this will work:
dotenv.config({ path: path.resolve(__dirname, "../.env") });


const morganFormat = ":method :url :status :response-time ms";

const app = express();
const port = process.env.PORT || 8000;

const corsOptions = {
  credentials: true,
  origin: "*",
};

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: any) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use("/api/v1/auth/", authRouter);

app.get("/", (res: express.Response) => {
  res.send("User Login");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
