import express from "express";
import router from "./routes/main";
import connectDB from "./connect-database";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import expressEjsLayouts from "express-ejs-layouts";
const PORT = process.env.PORT || 3000;
const app = express();
app
  .set("view engine", "ejs")
  .use(expressEjsLayouts)
  .use(express.static(__dirname + "/public"))
  .use(express.static(__dirname + "/client/js"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(methodOverride("_method"));
require("dotenv").config();
app.use(router);
app.listen(PORT, async () => {
  connectDB.then(
    (result) => {
      console.log(result);
    },
    (error) => {
      console.log("!DB-ERROR! - " + error.message);
    }
  );
});
