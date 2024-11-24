import jwt from "jsonwebtoken";

export const decodeJwtCode = (code: string, key: string) => {
  const decoded: any = jwt.verify(code, key);

  const { id, email } = decoded;

  return { id, email };
};
