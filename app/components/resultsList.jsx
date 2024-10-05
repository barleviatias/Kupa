// components/ResultsList.js
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';

const ResultsList = ({ resultsData }) => {
  const [expandedContext, setExpandedContext] = useState(null);

  const toggleContext = (index) => {
    if (expandedContext === index) {
      setExpandedContext(null);
    } else {
      setExpandedContext(index);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {resultsData.map((item, index) => {
        const [ref, inView] = useInView({
          triggerOnce: true,
          threshold: 0.1,
        });

        return (
          <div
            key={index}
            className="video-wrapper bg-white p-4 rounded-lg shadow"
          >
            <p className='text-xl font-bold text-custom-red'>עונה {item.season_number} פרק {item.episode_number} {item.episode_name}</p>
            <div ref={ref} className="relative pt-[56.25%]">
              {inView ? (
                <iframe
                  src={`https://www.youtube.com/embed/${item.url.split('watch?v=')[1]}`}
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              ) : (
                <div className="absolute top-0 left-0 w-full h-full bg-gray-200" />
              )}
            </div>
            {item.context && item.context.length > 0 && (
              <>
                <p className="mt-2 text-black font-bold">
                  מספר אזכורים: {item.context.length}
                </p>
                <p className="mt-2 text-black text-sm italic">
                  {item.context[0]}
                </p>
                
                {item.context.length > 1 && (
                  <>
                    <button
                      onClick={() => toggleContext(index)}
                      className="mt-2 px-4 py-2 bg-custom-red text-white rounded-lg hover:bg-hover-red"
                    >
                      {expandedContext === index ? 'הסתר אזכורים' : 'הצג עוד אזכורים'}
                    </button>
                    {expandedContext === index && (
                      <div className="mt-4">
                        <h3 className="font-bold mb-2">אזכורים נוספים:</h3>
                        <ul className="list-disc text-black list-inside">
                          {item.context.slice(1).map((context, idx) => (
                            <li key={idx} className="mb-2">
                              {context}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResultsList;