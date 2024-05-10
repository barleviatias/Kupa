
import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-custom-red border-solid rounded-full animate-spin border-t-transparent"></div>
    </div>
  );
};

export default Loader;