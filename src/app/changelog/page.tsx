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
      <div>
        <h2 className="text-2xl font-semibold mb-2">Version 0.1.1</h2>
        <p className="text-gray-600 mb-4">July 17, 2025</p>
        <ul className="list-disc list-inside">
          <li>Added property image gallery: users can now view multiple images per property with a carousel/gallery UI.</li>
          <li>Properties are now viewable on the main page without authentication; users only need to sign up when applying.</li>
          <li>Improved public property browsing experience and fixed image modal navigation.</li>
        </ul>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Version 0.1.2</h2>
        <p className="text-gray-600 mb-4">July 17, 2025</p>
        <ul className="list-disc list-inside">
          <li>Replaced <code>html-pdf-node</code> with <code>puppeteer</code> for PDF generation to resolve Next.js/webpack compatibility issues.</li>
          <li>Receipt PDFs now use a compact A5 format and improved styling for a more professional, receipt-like appearance.</li>
          <li>General bug fixes and code cleanup in the receipts API.</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangelogPage;
