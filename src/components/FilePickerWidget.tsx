import React, { useState } from 'react';
import { Upload, Image as ImageIcon, FileText, CheckCircle, Trash2, Paperclip, Send } from 'lucide-react';
import { DocumentFile, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface FilePickerWidgetProps {
  language: Language;
  onFilesAttached: (files: DocumentFile[]) => void;
  onSkip?: () => void;
}

export const FilePickerWidget: React.FC<FilePickerWidgetProps> = ({
  language,
  onFilesAttached,
  onSkip,
}) => {
  const t = TRANSLATIONS[language];
  const [selectedFiles, setSelectedFiles] = useState<DocumentFile[]>([
    // Pre-populate a sample photo for fast hackathon demoing!
    {
      id: 'doc-sample-1',
      name: 'incident_photo_remera.jpg',
      size: '1.8 MB',
      type: 'image/jpeg',
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray: File[] = Array.from(e.target.files);
    const newDocs: DocumentFile[] = filesArray.map((file: File, idx: number) => ({
      id: `doc-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type,
      dataUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setSelectedFiles((prev) => [...prev, ...newDocs]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendFiles = () => {
    if (selectedFiles.length > 0) {
      onFilesAttached(selectedFiles);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-3.5 my-2 text-slate-800 max-w-md w-full overflow-hidden">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Paperclip className="w-4 h-4 text-emerald-600" />
        <h4 className="font-bold text-xs text-slate-900">
          {language === 'rw' ? 'Gushyiraho Amafoto cyangwa Rapora' : 'Upload Incident Photos / Police Report'}
        </h4>
      </div>

      {/* File Dropzone Area */}
      <label className="mt-2.5 flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition p-4 rounded-xl cursor-pointer group">
        <Upload className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform mb-1" />
        <span className="text-xs font-semibold text-emerald-800 text-center">{t.dropFilesHere}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (Max 10MB)</span>
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
      </label>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            {language === 'rw' ? 'Amafoto & Dosiye Zateguwe' : 'Attached Files'} ({selectedFiles.length})
          </span>
          {selectedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                )}
                <div className="overflow-hidden">
                  <p className="font-semibold text-slate-800 truncate text-xs">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{file.size}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="text-slate-400 hover:text-rose-500 p-1 transition"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 font-medium transition"
          >
            {language === 'rw' ? 'Simbuka (No photos to attach)' : 'Skip Attachment'}
          </button>
        )}
        <button
          onClick={handleSendFiles}
          disabled={selectedFiles.length === 0}
          className="ml-auto bg-[#075e54] disabled:bg-gray-300 hover:bg-[#128c7e] text-white font-semibold py-1.5 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{language === 'rw' ? 'Oherereza Amafoto' : 'Attach & Proceed'}</span>
        </button>
      </div>
    </div>
  );
};
