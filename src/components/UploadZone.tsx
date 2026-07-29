import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileImage } from 'lucide-react';

export function UploadZone({
  accept,
  onFile,
  label,
  hint,
  icon,
  disabled,
}: {
  accept: string;
  onFile: (file: File) => void;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile, disabled]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
            : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
          dragOver
            ? 'bg-brand-500 text-white'
            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
        }`}
      >
        {icon || <UploadCloud size={26} />}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {label}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

export function FilePreview({
  file,
  previewUrl,
}: {
  file: File;
  previewUrl?: string;
}) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-12 w-12 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          <FileImage size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
