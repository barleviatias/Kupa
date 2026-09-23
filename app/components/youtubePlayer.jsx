import { useEffect, useRef, useState } from 'react';

let apiPromise;
function loadPlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { apiPromise = null; reject(new Error('Player API unavailable')); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function YoutubePlayer({ videoId, title, selection }) {
  const host = useRef(null);
  const controller = useRef(null);
  const latest = useRef(selection);
  const [error, setError] = useState({ videoId, code: null });
  const errorCode = error.videoId === videoId ? error.code : null;
  useEffect(() => { latest.current = selection; }, [selection]);
  useEffect(() => {
    let cancelled = false, instance;
    loadPlayerApi().then(YT => {
      if (cancelled) return;
      const frame = document.createElement('iframe');
      frame.title = title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.className = 'absolute inset-0 w-full h-full rounded-md';
      const params = new URLSearchParams({ enablejsapi: '1', origin: window.location.origin,
        playsinline: '1', start: String(latest.current.start) });
      frame.src = `https://www.youtube.com/embed/${videoId}?${params}`;
      host.current.appendChild(frame);
      instance = new YT.Player(frame, { events: {
        onReady: event => {
          if (cancelled) return;
          controller.current = event.target;
          if (latest.current.revision) {
            event.target.seekTo(latest.current.start, true);
            event.target.playVideo();
          }
        },
        onError: event => { if (!cancelled) setError({ videoId, code: event.data }); },
      } });
    }).catch(() => { if (!cancelled) setError({ videoId, code: 'network' }); });
    return () => { cancelled = true; controller.current = null; instance?.destroy(); };
  }, [videoId, title]);
  useEffect(() => {
    if (selection.revision && controller.current) {
      controller.current.seekTo(selection.start, true);
      controller.current.playVideo();
    }
  }, [selection]);
  return <>
    <div ref={host} className="absolute inset-0" />
    {errorCode !== null && <p role="status" data-youtube-error={errorCode} className="absolute bottom-0 inset-x-0 bg-white text-sm text-gray-700 p-2">
      לא ניתן להפעיל את הסרטון כאן כרגע. אפשר לפתוח אותו ב־YouTube.
    </p>}
  </>;
}
