import { UserDoc } from "../models/user";
import jwt from "jsonwebtoken";

export const generateTokens = (user: UserDoc) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_JWT_KEY as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_JWT_KEY as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
  );

  return { accessToken, refreshToken };
};
