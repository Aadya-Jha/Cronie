import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";
import { startScheduler } from "./scheduler/schedulerLoop.js";

connectDB();
startScheduler();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


