import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, messagesTableName } from "../lib/dynamo.js";

export async function getConversationMessages(req, res) {
  try {
    const currentUserId = req.user._id.toString();
    const { id: otherUserId } = req.params;
    const limit = Number(req.query.limit) || 30;
    const before = req.query.before ? Number(req.query.before) : null;
    if (!otherUserId) {
      return res.status(400).json({ message: "Missing user id" });
    }
    const conversationId = [currentUserId, otherUserId].sort().join("-");
    const params = {
      TableName: messagesTableName,
      KeyConditionExpression: "conversationId = :cid",
      ExpressionAttributeValues: {
        ":cid": conversationId,
      },
      ScanIndexForward: false,
      Limit: limit,
    };
    if (before) {
      params.KeyConditionExpression =
        "conversationId = :cid AND createdAt < :before";
      params.ExpressionAttributeValues[":before"] = before;
    }
    const data = await docClient.send(new QueryCommand(params));
    const items = data.Items ? [...data.Items].reverse() : [];
    return res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    return res.status(500).json({ message: "Internal Server error" });
  }
}
