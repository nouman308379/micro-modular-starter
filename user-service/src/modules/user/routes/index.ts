import { Router } from "express";
import UserController from "../controllers/user.js";
// import passport from "passport";
const userRouter = Router();

userRouter.post("/signup", UserController.inviteCompanyUser);