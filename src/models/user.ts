import mongoose from "mongoose";
import { PasswordManager } from "../services/password";

// An interface that describes the properties required to create a new user
interface UserAttrs {
  email: string;
  password: string;
}

// An interface that describes the properties that a User documents has
export interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  token?: string;
  updatedAt: string;
  createdAt: string;
}

// An interface that describes the properties that a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // We are modifying the toJSON function here and make sure that it returns a json that we want.
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.token;
        delete ret.__v;
      },
    },
  }
);

// A middleware function that runs before we save a document.
userSchema.pre("save", async function (done) {
  // Only has the password if it has been modified.
  if (this.isModified("password")) {
    const hashed = await PasswordManager.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

// The only way we create a new record and to allow TS to figure out what types we are using.
// Here, we are adding a method to the model.
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
