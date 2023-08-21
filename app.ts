import { processEvents } from "./src/listener";
import connectToDatabase from "./src/setup/mongoConfig";

const app = async () => {
  try {
    const db = await connectToDatabase();
  } catch (err) {
    console.log(err);
  }

  await processEvents();
};

app().catch(console.error);
