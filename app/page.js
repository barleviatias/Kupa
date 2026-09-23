// pages/index.js or app/page.js (depending on your Next.js version)
'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import TopSearches from './components/topSearches';
import Logo from '@/img/kupa_logo.png';
import Image from 'next/image';
import Link from 'next/link';
import Loader from './components/loader';
import ResultsList from './components/resultsList';
import { validateQuery, normalize } from '@/lib/subtitle-search.mjs';
import '../node_modules/@fortawesome/fontawesome-free/css/all.min.css';


export default function Home() {
	return <Suspense fallback={<Loader />}><HomeContent /></Suspense>;
}

function HomeContent() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const urlQuery = searchParams.get('q');
	const [retry, setRetry] = useState(0);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [resultCount, setResultCount] = useState('');
	const [resultsData, setResultsData] = useState([]);
	const [searchResults, setSearchResults] = useState(0);
	const [error, setError] = useState('');
	const [inputError, setInputError] = useState('');
	const activeRequest = useRef(null);
	const [hasSearched, setHasSearched] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		fetch('/api/counter', { signal: controller.signal })
			.then(response => response.ok ? response.json() : null)
			.then(data => { if (data) setResultCount(data.documentCount); })
			.catch(() => {});
		return () => { controller.abort(); activeRequest.current?.abort(); };
	}, []);

	function convertToList(objectOfObjects) {
		const arrayOfObjects = Object.values(objectOfObjects);
		const sortedArray = arrayOfObjects.sort((a, b) => {
			const lengthA = a.context ? a.context.length : 0;
			const lengthB = b.context ? b.context.length : 0;
			return lengthB - lengthA;
		});
		return sortedArray.map((item) => ({
			_id: item._id,
			matches: item.matches || [],
			url: item.url || '',
			context: item.context || [],
			episode_name: item.episode_name || '',
			episode_number: item.episode_number || '',
			season_number: item.season_number || '',
		}));
	}

	function queryError(value) {
		if (!value?.trim()) return 'יש להזין משפט בעברית.';
		if (value.length > 200) return 'אפשר לחפש עד 200 תווים.';
		if (normalize(value).split(' ').length > 20) return 'אפשר לחפש עד 20 מילים.';
		if (!validateQuery(value)) return 'יש להזין לפחות מילה אחת בעברית.';
		return '';
	}

	useEffect(() => {
		activeRequest.current?.abort();
		/* eslint-disable react-hooks/set-state-in-effect -- URL navigation must reset stale search state before the new request. */
		setSearchTerm(urlQuery ?? '');
		setResultsData([]);
		setSearchResults(0);
		setError('');
		setInputError('');
		setHasSearched(urlQuery !== null);
		if (urlQuery === null) { setLoading(false); return; }
		const invalid = queryError(urlQuery);
		if (invalid) { setInputError(invalid); setHasSearched(false); setLoading(false); return; }
		const controller = new AbortController();
		activeRequest.current = controller;
		setLoading(true);
		/* eslint-enable react-hooks/set-state-in-effect */
		async function run() {
			try {
				const response = await fetch(`/api/search?${new URLSearchParams({ q: urlQuery })}`, { signal: controller.signal });
				const data = await response.json();
					if (!response.ok || !Array.isArray(data)) throw new Error('Search failed');
				if (controller.signal.aborted || activeRequest.current !== controller) return;
				setResultsData(convertToList(data));
				setSearchResults(data.length);
			} catch (failure) {
				if (!controller.signal.aborted && activeRequest.current === controller) {
						setError('החיפוש נכשל. נסו שוב בעוד רגע.');
				}
			} finally {
				if (!controller.signal.aborted && activeRequest.current === controller) setLoading(false);
			}
		}
		run();
		return () => controller.abort();
	}, [urlQuery, retry]);

	const handleSubmit = event => {
		event.preventDefault();
		const query = searchTerm.trim();
		const invalid = queryError(query);
		setInputError(invalid);
		if (invalid) return;
		if (query === urlQuery) { setRetry(value => value + 1); return; }
		const params = new URLSearchParams(searchParams.toString());
		params.set('q', query);
		router.push(`${pathname}?${params}`, { scroll: false });
	};

	return (
		<div className="min-h-screen bg-gray-100 rtl">
			<main className="container mx-auto py-10 min-h-[90vh] rtl px-3 sm:px-2">
				<div className="flex flex-col items-center">
					<header className="mb-6">
					<Link href="/" aria-label="חזרה לעמוד הבית" className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-custom-red">
					<Image
						src={Logo}
						alt="קופה ראשית"
						priority
						className="w-auto h-auto"
						width={200}
						height={200}
					/>
					</Link>

					</header>
					{resultCount > 0 ? (
						<p className="text-slate-600 mb-4 text-lg font-medium">
							בוסגה בוצעו עד עכשיו <span className="font-bold text-custom-red">{resultCount}</span> חיפושים
						</p>
					) : (
						<p className="text-slate-600 mb-4 text-lg font-medium">יום בנעימים</p>
					)}
					<form action="/" method="get" onSubmit={handleSubmit} className="mb-8 w-full max-w-2xl">
						<div className="flex flex-row sm:flex-row items-center">
							<input
								type="text"
								name="q"
								maxLength={200}
								aria-label="חיפוש משפט בעברית"
								value={searchTerm}
									onChange={(e) => { setSearchTerm(e.target.value); setInputError(''); }}
									placeholder="מנוע חיפוש משפטים מעונות 1-5"
									aria-describedby={inputError ? 'search-help search-error' : 'search-help'}
									aria-invalid={Boolean(inputError)}
								className="px-4 py-3 border text-center border-gray-300 rounded-r-lg sm:rounded-lg focus:outline-none focus:ring-2 text-gray-800 focus:ring-custom-red w-full sm:w-4/5 sm:ml-2"
								/>
							<button
								type="submit"
								className="px-6 py-3 bg-custom-red text-white rounded-l-lg sm:rounded-lg hover:bg-hover-red transition duration-300 whitespace-nowrap sm:w-1/5">
								חפש לי
							</button>
							</div>
						<p id="search-help" className="sr-only">חפשו משפט בעברית, עד 20 מילים ו־200 תווים</p>
						{inputError && <p id="search-error" role="alert" className="mt-2 text-sm font-medium text-custom-red">{inputError}</p>}
					</form>

					{urlQuery === null && <TopSearches />}

					{searchResults > 0 && !loading && (
						<p role="status" className="mb-8 text-black text-xl font-semibold">
							בוסגה מצאנו <span className="text-custom-red">{searchResults}</span> תוצאות!
						</p>
					)}
				</div>
				{loading ? (
					<Loader />
				) : error ? (
					<p role="alert" className="text-center text-custom-red bg-white p-6 rounded-lg">{error}</p>
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
						<ResultsList key={urlQuery} resultsData={resultsData} query={urlQuery || ''} />
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
					<a
						href="https://www.buymeacoffee.com/barleviatiR"
						target="_blank"
						rel="noopener noreferrer"
						dir="rtl"
						className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-custom-red text-white rounded-lg hover:bg-hover-red transition duration-300 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white mb-5"
					>
						<span aria-hidden="true" className="text-xl">☕</span>
						<span>קנו לי קפה</span>
						<span className="sr-only"> (נפתח בלשונית חדשה)</span>
					</a>
					<p className="text-sm">All rights reserved &copy; 2023 Bar Levi Atias</p>
					<script
						async
						defer
						src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
					<noscript>
						<img
							src="https://queue.simpleanalyticscdn.com/noscript.gif"
							alt=""
							referrerPolicy="no-referrer-when-downgrade"
						/>
					</noscript>
				</div>
			</footer>
		</div>
	);
}
