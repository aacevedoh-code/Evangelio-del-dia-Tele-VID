
import React from 'react';
import { AlertTriangleIcon } from './icons';

interface ErrorMessageProps {
    message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/50 rounded-lg shadow-md border border-red-200 dark:border-red-700">
            <AlertTriangleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Ocurrió un Error</h2>
            <p className="mt-2 text-red-700 dark:text-red-300">
                {message}
            </p>
        </div>
    );
};
