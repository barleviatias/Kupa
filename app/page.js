// pages/index.js or app/page.js (depending on your Next.js version)
'use client';
import { useState, useEffect } from 'react';
import Logo from '@/img/kupa_logo.png';
import Image from 'next/image';
import Loader from './components/loader';
import ResultsList from './components/resultsList';
import '../node_modules/@fortawesome/fontawesome-free/css/all.min.css';

export default function Home() {
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [resultCount, setResultCount] = useState('');
	const [resultsData, setResultsData] = useState([]);
	const [searchResults, setSearchResults] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);

	const fetchData = async () => {
		const response = await fetch('/api/counter', {
			method: 'GET',
		});
		const data = await response.json();
		setResultCount(data.documentCount);
	};

	useEffect(() => {
		fetchData();
	}, []);

	function convertToList(objectOfObjects) {
		const arrayOfObjects = Object.values(objectOfObjects);
		const sortedArray = arrayOfObjects.sort((a, b) => {
			const lengthA = a.context ? a.context.length : 0;
			const lengthB = b.context ? b.context.length : 0;
			return lengthB - lengthA;
		});
		return sortedArray.map((item) => ({
			url: item.url || '',
			context: item.context || [],
			episode_name: item.episode_name || '',
			episode_number: item.episode_number || '',
			season_number: item.season_number || '',
		}));
	}

	const handleSubmit = async (event) => {
		setLoading(true);
		setHasSearched(true);
		event.preventDefault();
		const response = await fetch(`/api/search?q=${searchTerm}`, {
			method: 'GET',
		});

		if (response.ok) {
			try {
				const data = await response.json();
				setSearchResults(Object.keys(data).length);
				let temp = convertToList(data);
				setResultsData(temp.length > 0 ? temp : []);
			} catch (error) {
				console.error('Error parsing JSON:', error);
				setResultsData([]);
			}
		} else {
			console.error('Request failed with status:', response.status);
			setResultsData([]);
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-gray-100 rtl">
			<main className="container mx-auto py-10 min-h-[90vh] rtl px-3 sm:px-2">
				<div className="flex flex-col items-center">
					<Image
						src={Logo}
						alt="Logo"
						className="mb-6"
						width={200}
						height={200}
					/>
					{resultCount > 0 ? (
						<p className="text-slate-600 mb-4 text-lg font-medium">
							בוסגה בוצעו עד עכשיו <span className="font-bold text-custom-red">{resultCount}</span> חיפושים
						</p>
					) : (
						<p className="text-slate-600 mb-4 text-lg font-medium">יום בנעימים</p>
					)}
					<form onSubmit={handleSubmit} className="mb-8 w-full max-w-2xl">
						<div className="flex flex-row sm:flex-row items-center">
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="מנוע חיפוש משפטים מעונות 1-4"
								className="px-4 py-3 border text-center border-gray-300 rounded-r-lg sm:rounded-lg focus:outline-none focus:ring-2 text-gray-800 focus:ring-custom-red w-full sm:w-4/5 sm:ml-2"
								required
							/>
							<button
								type="submit"
								className="px-6 py-3 bg-custom-red text-white rounded-l-lg sm:rounded-lg hover:bg-hover-red transition duration-300 whitespace-nowrap sm:w-1/5">
								חפש לי
							</button>
						</div>
					</form>

					{searchResults > 0 && (
						<p className="mb-8 text-black text-xl font-semibold">
							בוסגה מצאנו <span className="text-custom-red">{searchResults}</span> תוצאות!
						</p>
					)}
				</div>
				{loading ? (
					<Loader />
				) : hasSearched && resultsData.length === 0 ? (
					<div className="text-center mt-8 bg-white p-6 rounded-lg shadow-md">
						<p className="text-2xl font-bold text-custom-red mb-3">
							אין תוצאות! בוא ננסה שוב!
						</p>
						<p className="text-lg text-gray-600">
							נסה לחפש משהו אחר או לשנות את מילות החיפוש שלך.
						</p>
					</div>
				) : resultsData.length > 0 ? (
					<ResultsList resultsData={resultsData} />
				) : null}
			</main>

			<footer className="bg-gray-800 text-white py-6 bottom-0 min-h-[10vh]">
				<div className="container mx-auto flex flex-col items-center">
					<div className="flex justify-center items-center mb-4">
						<a
							href="https://www.linkedin.com/in/bar-levi-atias-/"
							target="_blank"
							rel="noopener noreferrer"
							className="mx-3 text-2xl hover:text-custom-red transition duration-300">
							<i className="fab fa-linkedin"></i>
						</a>
						<a
							href="https://github.com/barleviatias"
							target="_blank"
							rel="noopener noreferrer"
							className="mx-3 text-2xl hover:text-custom-red transition duration-300">
							<i className="fab fa-github"></i>
						</a>
					</div>
					<p className="text-sm">All rights reserved &copy; 2023 Bar Levi Atias</p>
					<script
						async
						defer
						src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
					<noscript>
						<img
							src="https://queue.simpleanalyticscdn.com/noscript.gif"
							alt=""
							referrerpolicy="no-referrer-when-downgrade"
						/>
					</noscript>
				</div>
			</footer>
		</div>
	);
}