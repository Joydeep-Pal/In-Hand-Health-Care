const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

const isLocalMongoUri = (uri) => /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(uri || '');

const getMongoUri = () => {
  const configuredUri = process.env.MONGO_URI;
  const retailerEnvPath = path.resolve(__dirname, '../../../../backend/.env');

  if (configuredUri && !isLocalMongoUri(configuredUri)) return configuredUri;
  if (fs.existsSync(retailerEnvPath)) {
    const retailerMongoUri = dotenv.parse(fs.readFileSync(retailerEnvPath, 'utf8')).MONGODB_URI;
    if (retailerMongoUri && !isLocalMongoUri(retailerMongoUri)) return retailerMongoUri;
  }
  return configuredUri;
};

const connectDB = async () => {
  const mongoUri = getMongoUri();
  if (!mongoUri) throw new Error('Set MONGO_URI in location/server/.env.');

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed (${error.name || 'connection error'}${error.code ? `, ${error.code}` : ''}).`);
    process.exit(1);
  }
};

module.exports = connectDB;
