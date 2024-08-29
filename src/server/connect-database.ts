const connectDB = new Promise(async (resolve, reject) => {
  try {
    const mongoose = await import("mongoose");
    mongoose.default.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGODB_URL!);
    resolve(`database connected: ${conn.connection.host}`);
  } catch (error) {
    reject(error);
  }
});
export default connectDB;
