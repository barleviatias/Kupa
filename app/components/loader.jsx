
import React from 'react';

const Loader = () => {
  return (
    <div role="status" className="flex items-center justify-center gap-3 text-gray-700">
      <div aria-hidden="true" className="w-8 h-8 border-4 border-custom-red border-solid rounded-full motion-safe:animate-spin border-t-transparent"></div>
      <span>מחפשים ציטוטים…</span>
    </div>
  );
};

export default Loader;
