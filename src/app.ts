import {
  CODE,
  errorHandler,
  NotFoundError,
  requireAuth,
} from "@daconverter/common-libs";
import express from "express";
import cookieParser from "cookie-parser";
import "express-async-errors";
import { signupRouter } from "./routes/signup";
import { signinRouter } from "./routes/signin";
import { refreshRouter } from "./routes/refresh";
import { logoutRouter } from "./routes/logout";
import { profileRouter } from "./routes/profile";
import { updateRouter } from "./routes/update";
import { passwordRouter } from "./routes/password";
import { activateRouter } from "./routes/activate";
import { forgotPasswordRouter } from "./routes/forgot-password";
import { resetPasswordRouter } from "./routes/reset-password";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/users/signin", signinRouter);
app.use("/api/users", signupRouter);
app.use("/api/users/token", refreshRouter);
app.use("/api/users/logout", logoutRouter);
app.use("/api/users/activate", activateRouter);
app.use("/api/users/forgot-password", forgotPasswordRouter);
app.use("/api/users/reset-password", resetPasswordRouter);
app.use("/api/users/profile", requireAuth, profileRouter);
app.use("/api/users/password", requireAuth, passwordRouter);
app.use("/api/users", requireAuth, updateRouter);

app.use("*", () => {
  throw new NotFoundError("Route does not exist", CODE.NOT_FOUND);
});

app.use(errorHandler);

export { app };
