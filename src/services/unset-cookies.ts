import { Response } from "express";

export const unsetCookies = (res: Response) => {
  res.clearCookie("access", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.clearCookie("refresh", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
};
