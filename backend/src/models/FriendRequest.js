import { DataTypes } from "sequelize";
import { sequelize } from "../lib/db.js";

export const FriendRequest = sequelize.define(
  "FriendRequest",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderId: { type: DataTypes.UUID, allowNull: false },
    recipientId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "accepted"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "friend_requests",
    timestamps: true,
  }
);
