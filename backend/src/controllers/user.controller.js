import { populate } from "dotenv";
import { User } from "../models/User.js";
import { FriendRequest } from "../models/FriendRequest.js";
export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user._id; // get current user ID from req.user set in protectRoute middleware
    const currentUser = await User.findById(currentUserId); // fetch current user details
    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true }, // only include onboarded users
      ],
    }); // fetch all users except current user
    return res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error fetching recommended users:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate(
        "friends",
        "fullName profile nativeLanguage learningLanguage"
      ); // populate friends with selected fields
    res.status(200).json(user.friends);
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
    const recipient = await User.findById(recipientId); // fetch recipient user details
    if (!recipient) {
      return res.status(404).json({ message: "Recipient user not found" });
    }
    // check if already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    }); // check if friend request already exists in either direction

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already exists" });
    }
    const friendRequest = new FriendRequest({
      sender: myId,
      recipient: recipientId,
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
    const friendRequest = await FriendRequest.findByIdAndUpdate(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this friend request",
      });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();
    // update both users' friends list
    // $addToSet: adds to array only if it doesn't already exist
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });
  } catch (error) {
    console.error("Error accepting friend request:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function getFriendRequests(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      recipient: req.user._id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profile nativeLanguage learningLanguage"
    );
    const acceptedRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "accepted",
    }).populate("recipient", "fullName profile");
    return res.status(200).json({ incomingRequests, acceptedRequests });
  } catch (error) {
    console.error("Error fetching friend requests:", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
}
export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profile nativeLanguage learningLanguage"
    );
    return res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error("Error fetching outgoing friend requests:", error.message`)`);
    res.status(500).json({ message: "Internal Server error" });
  }
}
