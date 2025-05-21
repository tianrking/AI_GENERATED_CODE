
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="p-4 bg-red-700 bg-opacity-30 border border-red-500 rounded-lg text-red-300">
      <p className="font-semibold">Error:</p>
      <p>{message}</p>
    </div>
  );
};
