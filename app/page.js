'use client';
import { useState, useEffect } from 'react';
import Logo from '@/img/kupa_logo.png';
import Image from 'next/image';
import Loader from './components/loader';
import '../node_modules/@fortawesome/fontawesome-free/css/all.min.css';

export default function Home() {
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [resultCount, setResultCount] = useState('');
	const [videosData, setVideosData] = useState([]);
	const [searchResults, setSearchResults] = useState([]);
  const [expandedContext, setExpandedContext] = useState(null);

	const fetchData = async () => {
		const response = await fetch('/api/counter', {
			method: 'GET',
		});
		const data = await response.json();
		setResultCount(data.documentCount);
		console.log('run');
		console.log(data.documentCount);
	};
	useEffect(() => {
		fetchData();
	}, []); // Empty dependency array
	function convertToList(objectOfObjects) {
		// Convert the object to an array of values
		const arrayOfObjects = Object.values(objectOfObjects);

		// Sort the array based on context length (descending order)
		const sortedArray = arrayOfObjects.sort((a, b) => {
      const lengthA = a.context ? a.context.length : 0;
      const lengthB = b.context ? b.context.length : 0;
      return lengthB - lengthA;
    });
    
    // Map the sorted array to the desired format
    return sortedArray.map(item => ({
      url: item.url || '',
      context: item.context || '',
      contextCount: item.context ? item.context.length : 0,
      episode_name: item.episode_name || '',
      episode_number: item.episode_number || '',
      season_number: item.season_number || '',
    }));
	}
  const toggleContext = (index) => {
    if (expandedContext === index) {
      setExpandedContext(null);
    } else {
      setExpandedContext(index);
    }
  };
	const handleSubmit = async (event) => {
		setLoading(true);
		event.preventDefault();
		const response = await fetch(`/api/search?q=${searchTerm}`, {
			method: 'GET',
		});

		if (response.ok) {
			try {
				const data = await response.json();
				console.log(data);

				setSearchResults(Object.keys(data).length);
				// Set the count of results
				let temp = convertToList(data);
        console.log(`this is the temp ${temp}`);
        
				setVideosData(temp); // Convert and sort the data
				setLoading(false);
			} catch (error) {
				console.error('Error parsing JSON:', error);
				setLoading(false);
				// Handle the error appropriately (e.g., show an error message to the user)
			}
		} else {
			console.error('Request failed with status:', response.status);
			setLoading(false);
			// Handle the error appropriately (e.g., show an error message to the user)
		}
	};
	return (
		<div className="min-h-screen bg-gray-100 rtl">
			<main
				className="container mx-auto py-10 min-h-[90vh] rtl px-3 sm:px-2
      ">
				<div className="flex flex-col items-center">
					<Image
						src={Logo}
						alt="Logo"
						className="mb-4"
						width={200}
						height={200}
					/>
					{resultCount > 0 ? (
						<p className="text-slate-500 mb-1">
							בוסגה בוצעו עד עכשיו {resultCount} חיפושים
						</p>
					) : (
						<p className="text-slate-500 mb-1">יום בנעימים</p>
					)}
					<form onSubmit={handleSubmit} className="mb-8">
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="מנוע חיפוש משפטים מעונות 1-4"
							className="px-4 py-2 border text-center border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-800 focus:ring-custom-red min-w-[250px] md:min-w-[500px]"
							required
						/>
						<button
							type="submit"
							className="px-4 py-2 ml-2 bg-custom-red text-white rounded-lg hover:bg-blue-600">
							חפש לי
						</button>
					</form>

					{searchResults > 0 && (
						<p className="mb-8 text-black">
							בוסגה מצאנו {searchResults} תוצאות!
						</p>
					)}
				</div>
				{loading ? (
					<Loader />
				) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videosData.map((item, index) => (
            <div key={index} className="video-wrapper bg-white p-4 rounded-lg shadow">
              <div className="relative pt-[56.25%]">
                <iframe
                  src={`https://www.youtube.com/embed/${item.url.split('watch?v=')[1]}`}
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              </div>
              <p className="mt-2 text-black text-sm italic">{item.context[0]}</p>
              <p className="mt-2 text-black font-bold">מספר הקשרים: {item.contextCount}</p>
              <button
                onClick={() => toggleContext(index)}
                className="mt-2 px-4 py-2 bg-custom-red text-white rounded-lg hover:bg-blue-600"
              >
                {expandedContext === index ? 'הסתר הקשרים' : 'הצג הקשרים'}
              </button>
              {expandedContext === index && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">כל ההקשרים:</h3>
                  <ul className="list-disc text-black list-inside">
                    {item.context.map((context, idx) => (
                      <li key={idx} className="mb-2">{context}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>

			<footer className="bg-gray-800 text-white flex  items-center py-4 bottom-0  min-h-[10vh]">
				<div className="container mx-auto flex justify-center  text-center">
					<div className="flex justify-center items-center mb-2">
						<a
							href="https://www.linkedin.com/in/bar-levi-atias-/"
							target="_blank"
							rel="noopener noreferrer"
							className="mx-2">
							<i className="fab fa-linkedin"></i>
						</a>
						<a
							href="https://github.com/barleviatias"
							target="_blank"
							rel="noopener noreferrer"
							className="mx-2">
							<i className="fab fa-github"></i>
						</a>
					</div>
					<p>All rights reserved &copy; 2023 Bar Levi Atias</p>
				</div>
			</footer>
		</div>
	);
}
