import express from "express";
type registerAttempt = "normal" | "again";
const router = express.Router();
import {
  authMiddleware,
  createUser,
  renderLocalApp,
  renderMainApp,
  signIn,
  synchronizeDataWithAccount,
  goToAccountPage,
  deleteUser,
  logout,
  getAccountDb,
} from "./controllers";
router
  .get("/", authMiddleware, (_, res) => {
    res.redirect("/main-app");
  })
  .get("/login", (req: any, res) => {
    if (req.userId) {
      res.redirect("/main-app");
    }
    res.render("user-form", {
      headerTitle: "Login",
      formLink: "/login",
      metaPageDescription:
        "On this page you can login to your account and easily access your saved data",
    });
  })
  .get("/register", (req, res) => {
    const attempt: registerAttempt =
      (req.query as { attempt: "again" }).attempt || "normal";
    res.render("user-form", {
      attempt,
      headerTitle: "Register",
      formLink: "/users",
      metaPageDescription:
        "On this page you can register a new account and use it wherever you want",
    });
  })
  .get("/users/:user", goToAccountPage)
  .put("/users/:user/db", synchronizeDataWithAccount)
  .get("/local-app", renderLocalApp)
  .get("/main-app", authMiddleware, renderMainApp)
  .get("/users/:user/db", getAccountDb)
  .post("/login", signIn)
  .post("/users", createUser)
  .delete("/users/:user", deleteUser)
  .get("/logout", logout);
export default router;
