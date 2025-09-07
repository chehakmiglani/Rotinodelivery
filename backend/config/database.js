import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Server will continue without database connection');
    console.log('💡 To fix: Install and start MongoDB, or use MongoDB Atlas');
    // Don't exit the process - let the server run without DB
  }
};

export default connectDB;
