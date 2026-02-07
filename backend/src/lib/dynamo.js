import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.DYNAMO_REGION || "us-east-1";
const endpoint = process.env.DYNAMO_ENDPOINT;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "local";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "local";

const client = new DynamoDBClient({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

export const docClient = DynamoDBDocumentClient.from(client);
export const messagesTableName =
  process.env.DYNAMO_MESSAGES_TABLE || "Messages";

export const ensureMessagesTable = async () => {
  if (process.env.DYNAMO_AUTO_CREATE_TABLE !== "true") return;
  try {
    await client.send(
      new DescribeTableCommand({ TableName: messagesTableName })
    );
  } catch (error) {
    if (error.name !== "ResourceNotFoundException") {
      throw error;
    }
    await client.send(
      new CreateTableCommand({
        TableName: messagesTableName,
        AttributeDefinitions: [
          { AttributeName: "conversationId", AttributeType: "S" },
          { AttributeName: "createdAt", AttributeType: "N" },
        ],
        KeySchema: [
          { AttributeName: "conversationId", KeyType: "HASH" },
          { AttributeName: "createdAt", KeyType: "RANGE" },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  }
};
