import Counter from "@/models/Counter";

export async function getNextSequence(modelName: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { modelName },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true },
  );
  return counter.sequenceValue;
}
