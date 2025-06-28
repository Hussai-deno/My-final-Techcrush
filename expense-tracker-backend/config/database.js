import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    console.log(`💾 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;