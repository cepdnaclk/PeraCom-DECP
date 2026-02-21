import { Kafka } from "kafkajs";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

export async function createConsumer(groupId: string, topic: string) {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topic });
  return consumer;
}
