import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import passport from "passport";
import express from "express";
const authRouter = Router();

authRouter.post("/signup", authController.signUpUser);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: express.Request, res: express.Response) {
    console.log("Google Auth Callback");
    console.log(req.session);
    console.log(req.user);

    res.json("Login Success");
  }
);

authRouter.post("/login", authController.loginUser);

authRouter.post("/verify-email", authController.verifyEmail);

authRouter.post("/forgot-password", authController.forgotPassword);

authRouter.post("/reset-password", authController.setPassword);

authRouter.post("/forgot-email", authController.forgetEmail);

export default authRouter;
