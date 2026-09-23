import { useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import YoutubePlayer from './youtubePlayer';
import { normalize, searchVariants, youtubeId, playbackSeconds, formatTime } from '@/lib/subtitle-search.mjs';

function HighlightedQuote({ text, query }) {
  const words = new Set(searchVariants(normalize(query || '')).flatMap(variant => variant.split(' ')).filter(Boolean));
  const parts = String(text || '').split(/([\u0590-\u05FF0-9]+)/g);
  return <>{parts.map((part, index) => {
    const token = normalize(part);
    return token && [...words].some(word => token.includes(word))
      ? <mark key={index} className="rounded bg-red-100 px-0.5 font-semibold text-red-900">{part}</mark>
      : <span key={index}>{part}</span>;
  })}</>;
}

function ResultItem({ item, query }) {
  const [expanded, setExpanded] = useState(false);
  const [selection, setSelection] = useState({ start: 0, revision: 0 });
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1, rootMargin: '200px 0px' });
  const player = useRef(null);
  const videoId = youtubeId(item.url);
  const matches = item.matches?.length ? item.matches : (item.context || []).map(text => ({ text }));
  const title = `עונה ${item.season_number} פרק ${item.episode_number} - ${item.episode_name}`;
  const play = match => {
    setSelection(previous => ({ start: playbackSeconds(match.playbackStartMs), revision: previous.revision + 1 }));
    requestAnimationFrame(() => player.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div ref={player} className="relative aspect-video w-full overflow-hidden bg-gray-900">
        <div ref={ref} className="absolute inset-0">
          {videoId ? <>
            <div className="absolute inset-0 bg-cover bg-center" style={inView ? { backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` } : undefined} aria-hidden="true" />
            {(inView || selection.revision > 0) && <YoutubePlayer videoId={videoId} selection={selection} title={title} />}
          </> : <div className="flex h-full items-center justify-center text-sm text-white">הסרטון אינו זמין</div>}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500">עונה {item.season_number} · פרק {item.episode_number}</p>
            <h2 className="text-xl font-bold leading-snug text-gray-900">{item.episode_name}</h2>
          </div>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-custom-red">{matches.length} {matches.length === 1 ? 'אזכור' : 'אזכורים'}</span>
        </div>
        <ul className="space-y-3">
          {(expanded ? matches : matches.slice(0, 1)).map((match, index) => (
            <li key={`${index}-${match.sourceStartMs}`} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="whitespace-pre-line text-base leading-relaxed text-gray-800"><HighlightedQuote text={match.text} query={query} /></p>
              {videoId && Number.isFinite(match.playbackStartMs) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" onClick={() => play(match)}
                    aria-label={`נגן מהזמן ${formatTime(match.playbackStartMs)}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-custom-red px-3 py-2 text-sm font-semibold text-white hover:bg-hover-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-red">
                    <span aria-hidden="true">▶</span> נגן מהציטוט <span dir="ltr">{formatTime(match.playbackStartMs)}</span>
                  </button>
                  <a href={`https://www.youtube.com/watch?v=${videoId}&t=${playbackSeconds(match.playbackStartMs)}s`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-custom-red underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-custom-red">
                    פתיחה ב־YouTube <span className="sr-only">(נפתח בלשונית חדשה)</span>
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
        {matches.length > 1 && (
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}
            className="mt-4 text-sm font-semibold text-custom-red hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-custom-red">
            {expanded ? 'הסתר אזכורים' : `הצג עוד ${matches.length - 1} אזכורים`}
          </button>
        )}
      </div>
    </article>
  );
}

export default function ResultsList({ resultsData, query }) {
  const [season, setSeason] = useState('all');
  const [sort, setSort] = useState('matches');
  const seasons = [...new Set(resultsData.map(item => String(item.season_number)))].sort((a, b) => Number(a) - Number(b));
  const shown = resultsData.filter(item => season === 'all' || String(item.season_number) === season)
    .sort((a, b) => sort === 'episode'
      ? Number(a.season_number) - Number(b.season_number) || Number(a.episode_number) - Number(b.episode_number)
      : (b.matches?.length || b.context?.length || 0) - (a.matches?.length || a.context?.length || 0)
        || Number(a.season_number) - Number(b.season_number) || Number(a.episode_number) - Number(b.episode_number));
  return <section aria-label="תוצאות החיפוש" className="max-w-6xl mx-auto">
    <div className="mb-6 flex w-full flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:w-fit sm:px-4">
      <div className="flex items-center gap-2 border-l border-gray-200 pl-3 text-sm font-bold text-gray-800">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-custom-red" />
        סינון תוצאות
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
        עונה
        <select value={season} onChange={event => setSeason(event.target.value)} className="max-w-[8rem] bg-transparent font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-custom-red">
          <option value="all">כל העונות</option>
          {seasons.map(value => <option key={value} value={value}>עונה {value}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
        מיון
        <select value={sort} onChange={event => setSort(event.target.value)} className="max-w-[11rem] bg-transparent font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-custom-red">
          <option value="matches">הכי הרבה אזכורים</option>
          <option value="episode">לפי סדר הפרקים</option>
        </select>
      </label>
      <p role="status" className={season === 'all' ? 'sr-only' : 'text-sm font-medium text-custom-red'}>מוצגים {shown.length} מתוך {resultsData.length} פרקים</p>
    </div>
    <div className={`grid grid-cols-1 gap-6 ${shown.length === 1 ? 'max-w-3xl mx-auto' : 'lg:grid-cols-2'}`}>
      {shown.map(item => <ResultItem key={item._id} item={item} query={query} />)}
    </div>
  </section>;
}
