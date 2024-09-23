import express from "express";
type registerAttempt = "normal" | "again";
const router = express.Router();
import {
  authMiddleware,
  createUser,
  renderLocalApp,
  renderMainApp,
  signIn,
  goToAccountPage,
  deleteUser,
  logout,
  isPersonVerifiedForRequest,
} from "../controllers";
import dbRouter from "./db";
router
  .get("/", authMiddleware, (_, res) => {
    res.redirect("/main-app");
  })
  .get("/login", (req: any, res) => {
    console.log("entry /login");
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
    console.log("entry /register");
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
  .use(dbRouter)
  .get("/users/:user", authMiddleware, goToAccountPage)
  .get("/local-app", renderLocalApp)
  .get("/main-app", authMiddleware, renderMainApp)
  .post("/login", signIn)
  .post("/users", createUser)
  .delete("/users/:user", isPersonVerifiedForRequest, deleteUser)
  .get("/logout", logout)
  .get("*", (req, res) => {
    res.status(404).render("error-page-info", {
      headerTitle: "Page not found",
      url: req.originalUrl,
      isUserRegistered: false,
      metaPageDescription: "This page is not valid. Search for another one",
    });
  });
export default router;
