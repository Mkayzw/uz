// src/app/changelog/page.tsx
import React from 'react';

const ChangelogPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Changelog</h1>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Version 0.1.0</h2>
        <p className="text-gray-600 mb-4">July 16, 2025</p>
        <ul className="list-disc list-inside">
          <li>Initial release of the application.</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangelogPage;
