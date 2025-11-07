
import React from 'react';
import { BookIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <BookIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Lector Divino <span className="text-blue-600 dark:text-blue-400">CEC</span>
        </h1>
      </div>
    </header>
  );
};
