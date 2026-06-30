// src/components/ThumbnailGallery.tsx
import React, { useCallback } from 'react';
import { UploadedFile, FileState } from '../types'; 
import { useDropzone } from 'react-dropzone';
import { Image, FileText, X, Camera } from 'lucide-react'; 

interface ThumbnailGalleryProps {
  fileType: keyof FileState;
  files: UploadedFile[];
  onRemoveFile: (fileId: string, fileType: keyof FileState) => void;
  onFileReorder: (draggedId: string, targetId: string, fileType: keyof FileState) => void;
  onFileDrop: (newFiles: File[], fileType: keyof FileState) => void;
  theme: any;
  accept: { [key: string]: string[] };
}

// Utility to render the file icon/preview
const FilePreview: React.FC<{ file: UploadedFile }> = ({ file }) => {
  const isImage = file.file.type.startsWith('image');
  
  if (isImage) {
    return <img src={file.previewUrl} alt="Preview" className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700 p-1">
      <FileText size={36} className="text-gray-400" />
      <span className="text-xs text-gray-400 truncate w-full px-1">{file.file.name}</span>
    </div>
  );
};


export const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({ 
  fileType, files, onRemoveFile, onFileReorder, onFileDrop, theme, accept 
}) => {
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileDrop(acceptedFiles, fileType);
  }, [onFileDrop, fileType]);

  // Use useDropzone only for drag/drop detection and input management
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
      onDrop, 
      accept,
      noClick: true, // Crucial: Prevent file dialog from opening on container click
      multiple: true 
  });
  
  // Drag and Drop Logic (No change here)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, fileId: string) => {
    e.dataTransfer.setData('fileId', fileId);
    e.dataTransfer.setData('fileType', fileType);
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('fileId');
    const draggedFileType = e.dataTransfer.getData('fileType');
    
    if (draggedFileType === fileType && draggedId !== targetId) {
        onFileReorder(draggedId, targetId, fileType);
    }
  };

  const cameraAccept = 'image/jpeg,image/png';

  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          onFileDrop(Array.from(e.target.files), fileType);
          e.target.value = ''; 
      }
  };


  return (
    <div className="space-y-4">
      
      {/* Thumbnail Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {files.map(file => (
            <div
              key={file.id}
              className={`relative h-24 w-full cursor-grab 
                          border-2 border-transparent hover:border-${theme.primary}-500 
                          rounded-lg overflow-hidden transition-shadow duration-200`}
              draggable
              onDragStart={(e) => handleDragStart(e, file.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, file.id)}
              aria-label={`File thumbnail: ${file.file.name}. Drag to reorder.`}
            >
              <FilePreview file={file} />
              
              <button 
                className="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl-lg transition-colors"
                onClick={() => onRemoveFile(file.id, fileType)}
                aria-label={`Remove file: ${file.file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone Area and Buttons */}
      <div {...getRootProps()} className="pt-2"> 
        {/* Hidden input for select files -- REMOVED getInputProps() from container, placed here: */}
        <input {...getInputProps()} className="hidden" /> 

        <div className="grid grid-cols-2 gap-4">
            {/* Select Files Button */}
            <button
                type="button"
                onClick={open}
                className={`flex flex-col items-center justify-center h-28 p-4 rounded-lg text-lg font-bold transition-all duration-300
                            bg-gray-800 border ${theme.border} hover:bg-gray-700 hover:shadow-lg hover:shadow-${theme.primary}-500/20`}
                aria-label={`Select ${fileType === 'bolFiles' ? 'BOL' : 'Freight'} files`}
            >
                <Image size={32} className={`${theme.text}`} />
                <span>Select Files</span>
                <span className="text-xs text-gray-500 font-normal">
                    JPG or PNG only
                </span>
            </button>

            {/* Use Camera Button */}
            <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`flex flex-col items-center justify-center h-28 p-4 rounded-lg text-lg font-bold transition-all duration-300
                            bg-gray-800 border ${theme.border} hover:bg-gray-700 hover:shadow-lg hover:shadow-${theme.primary}-500/20`}
                aria-label={`Use camera for ${fileType === 'bolFiles' ? 'BOL' : 'Freight'} capture`}
            >
                <Camera size={32} className={`${theme.text}`} />
                <span>Use Camera</span>
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept={cameraAccept}
                    capture="environment" // Forces use of device camera
                    multiple={true}
                    onChange={handleCameraChange}
                    className="hidden"
                />
                <span className="text-xs text-gray-500 font-normal">
                    JPG or PNG only
                </span>
            </button>
        </div>

        {/* Dropzone Hint */}
        <div 
          className={`w-full text-center p-2 mt-2 text-sm text-gray-500 border border-dashed rounded
                      ${isDragActive ? `border-${theme.primary}-500 bg-${theme.primary}-900/10` : 'border-gray-800'}`}
        >
          {isDragActive 
            ? `Drop files here for ${fileType.replace('Files', '')}...` 
            : `(Or drag and drop files anywhere over the buttons)`}
        </div>
      </div>
    </div>
  );
};