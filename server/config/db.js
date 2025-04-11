import { connect } from 'mongoose';
import config from 'config';
const mongoURI = config.get('mongoURI');

const connectDB = async () => {
  try {
    await connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'ctf' // Specify the database name
    });
    
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;