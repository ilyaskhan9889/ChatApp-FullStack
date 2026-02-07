import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../lib/db.js";

export const User = sequelize.define(
  "User",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.TEXT, defaultValue: "" },
    profile: { type: DataTypes.STRING, defaultValue: "" },
    nativeLanguage: { type: DataTypes.STRING, defaultValue: "" },
    learningLanguage: { type: DataTypes.STRING, defaultValue: "" },
    location: { type: DataTypes.STRING, defaultValue: "" },
    isOnboarded: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "users",
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: { attributes: {} },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (!user.password) return;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeUpdate: async (user) => {
        if (!user.changed("password")) return;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
    },
  }
);

User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};
