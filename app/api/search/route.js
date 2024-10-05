import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';
const CONTEXT_LEN = 30;

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createFlexibleRegex(phrase) {
	const cleanPhrase = phrase.replace(/[^\u0590-\u05FF\s]/g, '').trim();
	const words = cleanPhrase.split(/\s+/).filter((word) => word.length > 0);
	const regexString = words
		.map((word) => `(${escapeRegExp(word)})`)
		.join('.*?');
	return new RegExp(regexString, 'gi');
}

export async function GET(request) {
	try {
		await mongoose.connect(MONGO_URI, {
			dbName: DB_NAME,
		});

		const db = mongoose.connection.db;
		const collection = db.collection('kupa');
		const { searchParams } = new URL(request.url);
		const q = searchParams.get('q');
		console.log('Search query:', q);

		const logCollection = db.collection('log');
		const searchData = {
			query: q,
			timestamp: new Date(),
		};
		await logCollection.insertOne(searchData);

		const flexibleRegex = createFlexibleRegex(q);
		console.log('Flexible Regex pattern:', flexibleRegex);

		const documents = await collection
			.find({ script: flexibleRegex })
			.toArray();
		console.log('Number of documents found:', documents.length);

		if (documents.length === 0) {
			console.log(
				'No documents found. Checking first 5 documents in collection:'
			);
			const sampleDocs = await collection.find().limit(5).toArray();
			sampleDocs.forEach((doc, index) => {
				console.log(`Document ${index + 1}:`);
				console.log('Episode:', doc.episode_name);
				console.log('Script preview:', doc.script.substring(0, 500));
				console.log('---');
			});
		}

		const results = documents
			.map((doc) => {
				const script = doc.script;
				let contexts = [];
				let lastEnd = 0;
				let match;
				while (true) {
          const match = flexibleRegex.exec(script.slice(lastEnd));
          if (!match) break;
					const start = lastEnd + match.index;
					const end = start + match[0].length;

					let context_start = Math.max(lastEnd, start - CONTEXT_LEN);
					let context_end = Math.min(script.length, end + CONTEXT_LEN);

					while (context_start > 0 && /\S/.test(script[context_start - 1]))
						context_start--;
					while (context_end < script.length && /\S/.test(script[context_end]))
						context_end++;

					const context = script.slice(context_start, context_end).trim();
					contexts.push(context);
          lastEnd = context_end;
          flexibleRegex.lastIndex = 0; // Reset regex lastIndex
				}

				console.log('Matched document:');
				console.log('Episode:', doc.episode_name);
				console.log('Contexts found:', contexts.length);
				contexts.forEach((context, index) => {
					console.log(`Context ${index + 1}:`, context);
				});

				return {
					_id: doc._id,
					episode_name: doc.episode_name,
					episode_number: doc.episode_number,
					season_number: doc.season_number,
					url: doc.youtube_url,
					context: contexts,
				};
			})
			.filter((result) => result.context.length > 0); // Filter out results with no contexts

		console.log('Total results with contexts:', results.length);

		return new Response(JSON.stringify(results), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error retrieving documents:', error);
		return new Response(
			JSON.stringify({
				error: 'An error occurred while retrieving documents.',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} finally {
		await mongoose.disconnect();
	}
}
