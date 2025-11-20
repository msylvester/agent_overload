import { config } from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { getRecords } from './data_service.js';

// Load environment variables from .env.local
config({ path: '../.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined in .env.local');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  const startTime = Date.now();

  try {
    // Connect the client to the server
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB Atlas!');

    // Fetch records from local MongoDB
    console.log('\n📦 Fetching records from local MongoDB...');
    const records = await getRecords();
    console.log(`✅ Retrieved ${records.length} records from local database`);

    if (records.length === 0) {
      console.log('⚠️  No records to migrate. Exiting.');
      return;
    }

    // Get the target database and collection
    const db = client.db("companies");
    const collection = db.collection("funded_companies");

    // Clear existing data
    console.log('\n🗑️  Clearing existing data in Atlas...');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing documents`);

    // Insert all records
    console.log('\n📤 Inserting records into Atlas...');
    const insertResult = await collection.insertMany(records);
    console.log(`✅ Successfully inserted ${insertResult.insertedCount} documents`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Migration completed in ${duration}s`);
    console.log(`📊 Summary: ${records.length} records transferred to companies.funded_companies`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

run().catch(console.dir);
