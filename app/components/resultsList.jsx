// components/ResultsList.jsx
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';

const ResultItem = ({ item, index, expandedContext, toggleContext }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div className="video-wrapper bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <h2 className='text-2xl font-bold text-custom-red mb-4'>
        עונה {item.season_number} פרק {item.episode_number} - {item.episode_name}
      </h2>
      <div ref={ref} className="relative pt-[56.25%] mb-4">
        {inView ? (
          <iframe
            src={`https://www.youtube.com/embed/${item.url.split('watch?v=')[1]}`}
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-md"
          ></iframe>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-200 rounded-md animate-pulse" />
        )}
      </div>
      {item.context && item.context.length > 0 && (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-700">
            מספר אזכורים: <span className="text-custom-red">{item.context.length}</span>
          </p>
          <p className="text-gray-600 italic border-r-4 border-custom-red pr-4 py-2">
            {item.context[0]}
          </p>
          
          {item.context.length > 1 && (
            <div className="mt-4">
              <button
                onClick={() => toggleContext(index)}
                className="px-4 py-2 bg-custom-red text-white rounded-lg hover:bg-hover-red transition duration-300 text-sm font-medium"
              >
                {expandedContext === index ? 'הסתר אזכורים' : 'הצג עוד אזכורים'}
              </button>
              {expandedContext === index && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 text-gray-700">אזכורים נוספים:</h3>
                  <ul className="space-y-2 text-gray-600">
                    {item.context.slice(1).map((context, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-custom-red mr-2">•</span>
                        <span>{context}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultsList = ({ resultsData }) => {
  const [expandedContext, setExpandedContext] = useState(null);

  const toggleContext = (index) => {
    setExpandedContext(expandedContext === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {resultsData.map((item, index) => (
        <ResultItem
          key={index}
          item={item}
          index={index}
          expandedContext={expandedContext}
          toggleContext={toggleContext}
        />
      ))}
    </div>
  );
};

export default ResultsList;