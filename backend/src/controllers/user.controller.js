import { Op } from "sequelize";
import { User, FriendRequest, UserFriend } from "../models/index.js";
export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user._id; // get current user ID from req.user set in protectRoute middleware
    const friendLinks = await UserFriend.findAll({
      where: { userId: currentUserId },
      attributes: ["friendId"],
    });
    const friendIds = friendLinks.map((link) => link.friendId);
    const recommendedUsers = await User.findAll({
      where: {
        _id: {
          [Op.ne]: currentUserId,
          ...(friendIds.length > 0 ? { [Op.notIn]: friendIds } : {}),
        },
        isOnboarded: true,
      },
    }); // fetch all users except current user
    return res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error fetching recommended users:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function getMyFriends(req, res) {
  try {
    const user = await User.findByPk(req.user._id, {
      include: [
        {
          model: User,
          as: "friends",
          attributes: ["_id", "fullName", "profile", "nativeLanguage", "learningLanguage"],
          through: { attributes: [] },
        },
      ],
    }); // populate friends with selected fields
    res.status(200).json(user ? user.friends : []);
  } catch (error) {
    console.error("Error fetching friends:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params; // recipient id from params

    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send friend request to yourself" });
    }
    // check if recipient exists
    const recipient = await User.findByPk(recipientId); // fetch recipient user details
    if (!recipient) {
      return res.status(404).json({ message: "Recipient user not found" });
    }
    // check if already friends
    const existingFriend = await UserFriend.findOne({
      where: { userId: myId, friendId: recipientId },
    });
    if (existingFriend) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    const existingRequest = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { senderId: myId, recipientId },
          { senderId: recipientId, recipientId: myId },
        ],
      },
    }); // check if friend request already exists in either direction

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already exists" });
    }
    const friendRequest = new FriendRequest({
      senderId: myId,
      recipientId: recipientId,
    });
    await friendRequest.save();
    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error sending friend request:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findByPk(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this friend request",
      });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();
    // update both users' friends list
    // $addToSet: adds to array only if it doesn't already exist
    await UserFriend.findOrCreate({
      where: {
        userId: friendRequest.senderId,
        friendId: friendRequest.recipientId,
      },
    });
    await UserFriend.findOrCreate({
      where: {
        userId: friendRequest.recipientId,
        friendId: friendRequest.senderId,
      },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error accepting friend request:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function getFriendRequests(req, res) {
  try {
    const incomingRequests = await FriendRequest.findAll({
      where: {
        recipientId: req.user._id,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["_id", "fullName", "profile", "nativeLanguage", "learningLanguage"],
        },
      ],
    });
    const acceptedRequests = await FriendRequest.findAll({
      where: {
        senderId: req.user._id,
        status: "accepted",
      },
      include: [
        {
          model: User,
          as: "recipient",
          attributes: ["_id", "fullName", "profile"],
        },
      ],
    });
    return res.status(200).json({ incomingRequests, acceptedRequests });
  } catch (error) {
    console.error("Error fetching friend requests:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.findAll({
      where: {
        senderId: req.user._id,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "recipient",
          attributes: ["_id", "fullName", "profile", "nativeLanguage", "learningLanguage"],
        },
      ],
    });
    return res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error("Error fetching outgoing friend requests:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
