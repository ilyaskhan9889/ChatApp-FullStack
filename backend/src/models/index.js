import { User } from "./User.js";
import { FriendRequest } from "./FriendRequest.js";
import { UserFriend } from "./UserFriend.js";

User.belongsToMany(User, {
  as: "friends",
  through: UserFriend,
  foreignKey: "userId",
  otherKey: "friendId",
});

User.hasMany(FriendRequest, { as: "sentRequests", foreignKey: "senderId" });
User.hasMany(FriendRequest, {
  as: "receivedRequests",
  foreignKey: "recipientId",
});

FriendRequest.belongsTo(User, { as: "sender", foreignKey: "senderId" });
FriendRequest.belongsTo(User, { as: "recipient", foreignKey: "recipientId" });

export { User, FriendRequest, UserFriend };
