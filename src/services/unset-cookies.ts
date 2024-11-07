import { Response } from "express";

export const unsetCookies = (res: Response) => {
  res.clearCookie("access", {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });

  res.clearCookie("refresh", {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
};
