import express from "express";
import ViteExpress from "vite-express";
import router from "./router";
import connectDB from "./connect-database";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
const app = express();
app
  .set("view engine", "ejs")
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(methodOverride("_method"));
require("dotenv").config();
app.use(router);
ViteExpress.listen(app, 3000, async () => {
  connectDB.then(
    (result) => {
      console.log(result);
    },
    (error) => {
      console.log(error.message);
    }
  );
});
