import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

export const UserFriend = sequelize.define(
  "UserFriend",
  {
    userId: { type: DataTypes.UUID, allowNull: false },
    friendId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "user_friends",
    timestamps: false,
  }
);
