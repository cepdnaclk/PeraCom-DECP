import { Kafka } from "kafkajs";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer = kafka.producer();

export async function publishEvent(topic: string, event: any) {
  await producer.connect();
  await producer.send({
    topic,
    messages: [
      {
        key: event.eventId,
        value: JSON.stringify(event),
      },
    ],
  });
}
