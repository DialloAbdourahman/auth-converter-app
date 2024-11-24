import { UserDoc } from "../models/user";
import jwt from "jsonwebtoken";

export const generateJwtCode = (user: UserDoc, key: string) => {
  const code = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    key
  );

  return { code };
};
