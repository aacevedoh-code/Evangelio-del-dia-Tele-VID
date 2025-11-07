
import React from 'react';
import { BookIcon } from './icons';

export const WelcomeMessage: React.FC = () => {
    return (
        <div className="text-center p-8 bg-white dark:bg-gray-800/50 rounded-lg shadow-md">
            <BookIcon className="h-16 w-16 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bienvenido al Lector Divino CEC</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Seleccione una fecha y los ciclos litúrgicos para encontrar las lecturas bíblicas diarias
                según el calendario de la Conferencia Episcopal de Colombia.
            </p>
        </div>
    );
};
