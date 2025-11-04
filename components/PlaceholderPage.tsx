import React from 'react';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

const PlaceholderPage: React.FC<{ title: string; t: any }> = ({ title, t }) => (
  <div className="p-6 lg:p-8">
    <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md border border-slate-200">
      <div className="text-center p-8">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-slate-100 rounded-full mb-4">
          <ClipboardDocumentListIcon className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-slate-500">{t.under_construction}</p>
      </div>
    </div>
  </div>
);

export default PlaceholderPage;
