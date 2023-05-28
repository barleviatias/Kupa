const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = 3000;

const uri =
	'mongodb+srv://barlevi_atias:Bb8159075@atlascluster.8h1liyd.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB connection URL
const dbName = 'test'; // Replace with your database name
const collectionName = 'test'; // Replace with the name of your collection

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: false,
		deprecationErrors: true,
	},
});

async function connectToMongoDB() {
	try {
		await client.connect();
		console.log('Connected to MongoDB');
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		process.exit(1); // Terminate the application if the connection fails
	}
}

async function getCollections() {
	try {
		const db = client.db(dbName);
		const collections = await db.listCollections().toArray();
		return collections.map(collection => collection.name);
	} finally {
		// Don't close the connection here; keep it open for subsequent queries
	}
}

async function getCollectionData() {
	try {
		const db = client.db(dbName);
		const collection = db.collection(collectionName);
		const documents = await collection.find({}, { projection: { _id: 0, title: 1 } }).toArray();
		return documents;
	} finally {
		// Don't close the connection here; keep it open for subsequent queries
	}
}
async function createTextIndex() {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.createIndex({ text: 'text' }); // Replace 'title' with the actual field name you want to create the text index on
        console.log('Text index created successfully');
    } finally {
       
    }
}

// Call createTextIndex to create the text index before performing the $text query
// createTextIndex().catch(console.error);
async function searchData(searchTerm) {
    try {
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      console.log(searchTerm);
      const result = await collection.find( { $text: { $search: searchTerm } }).toArray();
      return result;
    } finally {
      // Don't close the connection here; keep it open for subsequent queries
    }
  }
app.use(cors());

app.get('/', (req, res) => {
	res.send('Hello, world!');
});

app.get('/collections', async (req, res) => {
	try {
		const collections = await getCollectionData();
		res.json(collections);
	} catch (error) {
		console.error('Error:', error);
		res.status(500).send('Internal Server Error');
	}
});

app.get('/query', async (req, res) => {
	try {
		const { searchTerm } = req.query; // Extract the search term from the request query
        console.log(searchTerm);
		const result = await searchData(searchTerm);

		// Send the result as JSON
		res.json(result);
	} catch (error) {
		console.error('Error:', error);
		res.status(500).send('Internal Server Error');
	}
});

app.listen(port, async () => {
	await connectToMongoDB();
	console.log(`Server is running on port ${port}`);
});
