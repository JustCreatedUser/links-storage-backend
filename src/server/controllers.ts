import bcrypt from "bcrypt";
import USER_SCHEMA, { LINK_STORAGE } from "./User-model";
import jsonwebtoken from "jsonwebtoken";
type renderedApp = "local" | "synchronized";
export function authMiddleware(req: any, res: any, next: any) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).redirect("/login");
  }
  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET!);
    req.userId = (decoded as { userId: string }).userId;
    next();
  } catch (error: any) {
    res.redirect("/login");
  }
}
export async function createUser(req: any, res: any) {
  try {
    const { username, password } = req.body,
      hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      userRegisteredInDB = await USER_SCHEMA.findOne({
        username: username,
      });
    if (userRegisteredInDB) {
      res.status(409).redirect("/register/?attempt=again");
    }
    const newUser = new USER_SCHEMA({
      username,
      password: hashedPassword,
    });
    const token = jsonwebtoken.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET!
    );
    res.cookie("token", token, { httpOnly: true });
    await newUser.save();
    res.status(200).redirect(`/main-app`);
  } catch (error: any) {
    console.log(error.message);
  }
}
export function renderLocalApp(_: any, res: any) {
  const app: renderedApp = "local";
  res.render("main-app", {
    app,
    headerTitle: "Local app",
    metaPageDescription:
      "This is the local version of this app. It gives you same opportunities as the main one, however you can't access your data on other device",
  });
}
export async function renderMainApp(req: any, res: any) {
  const app: renderedApp = "synchronized";
  try {
    const userId: string = req.userId,
      user = await USER_SCHEMA.findById(userId),
      username = (() => {
        if (user) return user.username;
        else {
          throw new Error("NO USER");
        }
      })(),
      linksStorage = JSON.stringify(user.linksStorage),
      allFilterGroups = JSON.stringify(user.allFilterGroups);
    res.render("main-app", {
      app,
      username,
      linksStorage,
      allFilterGroups,
      userId,
      headerTitle: "Main app",
      metaPageDescription:
        "This is the main version of this app. Everything here is available: your links are stored properly and securely, you can access the data with account synchronization and it's just a better choice!",
    });
  } catch (error: any) {
    res.status(401).redirect("/login");
  }
}
export async function synchronizeDataWithAccount(req: any, res: any) {
  try {
    const linksStorage = JSON.parse(req.body.linksStorage) as LINK_STORAGE,
      allFilterGroups = JSON.parse(req.body.allFilterGroups) as string[],
      token = req.cookies.token as string,
      decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET!),
      userInDb = await USER_SCHEMA.findById(
        (decodedToken as { userId: string }).userId
      );
    if (!userInDb) throw new Error("NO USER");
    userInDb.linksStorage = linksStorage;
    userInDb.allFilterGroups = allFilterGroups;
    await userInDb.save();
    res.status(200).redirect("/main-app");
  } catch (error: any) {
    console.log(error.message);
  }
}
export async function signIn(req: any, res: any) {
  const { password, username } = req.body;
  try {
    const user = await USER_SCHEMA.findOne({ username: username });
    if (!user) return res.status(401).redirect("/login?status=again");
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) return res.status(401).redirect("/login");
    const token = jsonwebtoken.sign(
      { userId: user._id },
      process.env.JWT_SECRET!
    );
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/main-app");
  } catch {
    console.log("error");
  }
}
export async function goToAccountPage(req: any, res: any) {
  try {
    const userId = req.params.user,
      user = await USER_SCHEMA.findById(userId),
      username = (() => {
        if (user) return user.username;
        else {
          throw new Error("NO USER");
        }
      })();
    res.render("account", {
      userId,
      headerTitle: "Account - " + username,
      metaPageDescription:
        "This is your account's page. Here you can configure your user's params",
    });
  } catch (error: any) {
    console.log(error.message);
  }
}
export async function deleteUser(req: any, res: any) {
  try {
    const userId = req.params.user;
    await USER_SCHEMA.findByIdAndDelete(userId);
    res.status(200).redirect("/login");
  } catch (error: any) {
    console.log(error.message);
  }
}
export function logout(_: any, res: any) {
  try {
    res.clearCookie("token");
    res.redirect("/login");
  } catch (error: any) {
    console.log(error.message);
  }
}
