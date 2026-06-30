// src/hooks/useUploader.ts (UPDATED SCRIPT TO FIX CRASH)

import { useState, useCallback, useEffect, useMemo, ChangeEvent } from 'react';
import type { FormState, FileState, UploadedFile, Status, ToastState } from '../types';
// NOTE: Ensure your geminiService uses process.env.GEMINI_API_KEY
import { generateDescription as callGeminiService } from '../services/geminiService'; 
import { THEMES, defaultTheme } from '../themes'; 
import { useQueue, QueuedJob } from './useQueue'; 
import { getFileRejectionReason } from '../utils/uploadFileRules';

// Import logos (you must ensure these paths are correct in your project structure)
import GREENLEAF_LOGO from '../assets/Greenleaf Xpress logo.png'; 
import BST_EXPEDITE_LOGO from '../assets/BST Expedite.png'; 

const GREENLEAF_LOGO_URL = GREENLEAF_LOGO;
const BST_EXPEDITE_LOGO_URL = BST_EXPEDITE_LOGO;

const initialState: FormState = {
  company: '', 
  driverName: '',
  loadNumber: '',
  bolNumber: '',
  puCity: '',
  puState: '', 
  delCity: '',
  delState: '', 
  description: '',
  bolDocType: '',
};

const initialFileState: FileState = {
  bolFiles: [],
  freightFiles: [],
};

export const useUploader = () => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [fileState, setFileState] = useState<FileState>(initialFileState);
  const [status, setStatus] = useState<Status>('idle');
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success' });
  const [validationError, setValidationError] = useState<string>('');
  
  const { saveJob } = useQueue(); 

  // --- Dynamic Theme Logic ---
  const currentTheme = useMemo(() => { 
    return THEMES[formState.company] || defaultTheme;
  }, [formState.company]);

  // --- Load Identifier Logic ---
  const loadIdentifierValue = useMemo(() => {
      if (formState.bolNumber.trim()) return `BOL #: ${formState.bolNumber.trim()}`;
      return '';
  }, [formState.bolNumber]);


  // --- Dynamic Header Logic (unchanged) ---
  const DynamicHeaderContent = useMemo(() => {
    switch (formState.company) {
      case 'Greenleaf Xpress':
        return { 
          type: 'logo', 
          src: GREENLEAF_LOGO_URL, 
          alt: 'Greenleaf Xpress Logo',
          className: 'h-40 w-auto mx-auto' 
        };
      case 'BST Expedite': 
        return { 
          type: 'logo', 
          src: BST_EXPEDITE_LOGO_URL, 
          alt: 'BST Expedite Logo',
          className: 'h-40 w-auto mx-auto' 
        };
      default:
        return { 
          type: 'title', 
          text: 'BOL / PHOTO UPLOAD',
          className: `text-3xl sm:text-4xl font-orbitron font-extrabold ${currentTheme.text} tracking-widest leading-snug` 
        };
    }
  }, [formState.company, currentTheme.text]);
  // --- End Dynamic Logo Logic ---

  // --- Form Validation Logic ---
  const isFormValid = useMemo(() => {
    return (
      formState.company !== '' &&
      formState.driverName !== '' &&
      formState.bolNumber.trim() !== '' &&
      formState.bolDocType !== '' &&
      (fileState.bolFiles.length > 0 || fileState.freightFiles.length > 0)
    );
  }, [formState, fileState]);


  // Effect to clean up object URLs
  useEffect(() => {
    return () => {
      [...fileState.bolFiles, ...fileState.freightFiles].forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
  }, [fileState.bolFiles, fileState.freightFiles]); 


  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  }, []);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(prev => (prev.message === message ? { message: '', type: 'success' } : prev)), 5500);
  }, []);

  // Centralized file drop/change handler
  const handleFileDrop = useCallback((files: File[], fileType: keyof FileState) => {
      const allCurrentFiles = [...fileState.bolFiles, ...fileState.freightFiles];
      const existingFileSignatures = new Set(
        allCurrentFiles.map(f => `${f.file.name}-${f.file.size}-${f.file.lastModified}`)
      );

      const newFiles: UploadedFile[] = [];
      for (const file of files as File[]) {
        const rejection = getFileRejectionReason(file);
        if (rejection) {
          showToast(rejection, 'warning');
          continue;
        }

        const signature = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingFileSignatures.has(signature)) {
          showToast(`File already added: ${file.name}`, 'warning');
        } else {
          newFiles.push({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            previewUrl: URL.createObjectURL(file),
          });
          existingFileSignatures.add(signature);
        }
      }
      
      setFileState(prevState => ({ ...prevState, [fileType]: [...prevState[fileType], ...newFiles] }));
  }, [fileState.bolFiles, fileState.freightFiles, showToast]);


  // --- File Management (unchanged logic) ---
  const handleRemoveFile = useCallback((fileId: string, fileType: keyof FileState) => {
    setFileState(prevState => {
      const fileToRemove = prevState[fileType].find(f => f.id === fileId);
      if(fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return {
        ...prevState,
        [fileType]: prevState[fileType].filter(f => f.id !== fileId)
      };
    });
  }, []);

  const handleFileReorder = useCallback((draggedId: string, targetId: string, fileType: keyof FileState) => {
    setFileState(prevState => {
      const files = [...prevState[fileType]];
      const draggedIndex = files.findIndex(f => f.id === draggedId);
      const targetIndex = files.findIndex(f => f.id === targetId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = files.splice(draggedIndex, 1);
        files.splice(targetIndex, 0, removed);
      }
      return { ...prevState, [fileType]: files };
    });
  }, []);
  // --- End File Management ---

  const validateForm = () => {
    if (!formState.company) return "Please select a company.";
    if (!formState.driverName) return "Please enter the driver's name.";
    if (!formState.bolNumber.trim()) return "Please enter the BOL #.";
    if (!formState.bolDocType) return "Please select a BOL Type (Pickup or Delivery)."; 
    if (fileState.bolFiles.length === 0 && fileState.freightFiles.length === 0) return "Please upload at least one file.";
    return "";
  };

  const resetForm = () => {
    const company = formState.company;
    setFormState({...initialState, company});
    [...fileState.bolFiles, ...fileState.freightFiles].forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFileState(initialFileState);
    setValidationError('');
  };

  // Update handleSubmit for IndexedDB Queueing
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    setStatus('submitting'); 
    
    try {
      const jobFiles = [
        ...fileState.bolFiles.map(f => ({
          name: f.file.name,
          blob: f.file,
          type: f.file.type,
          category: 'bol' as const,
        })),
        ...fileState.freightFiles.map(f => ({
          name: f.file.name,
          blob: f.file,
          type: f.file.type,
          category: 'freight' as const,
        })),
      ];
      
      const jobData = {
          data: formState,
          files: jobFiles, // THIS is now guaranteed to be an array
          timestamp: Date.now(),
          id: Date.now()
      } as QueuedJob;

      await saveJob(jobData);
      
      showToast(`BOL ${formState.bolNumber.trim()} queued for sync!`, 'success');
      
      setStatus('success');
      resetForm(); 
    } catch (err) {
      console.error(err);
      showToast('Local queueing failed. Check browser storage.', 'error');
      setStatus('error');
    } finally {
        setTimeout(() => setStatus('idle'), 1000);
    }
  };

  // Update generateDescription to use the correct API key source
  const generateDescription = async (files: UploadedFile[]) => {
    setStatus('loading');
    setFormState(prev => ({ ...prev, description: 'AI is thinking...' }));
    try {
      const imageFiles = files.filter(f => f.file.type.startsWith('image/')).map(f => f.file);
      if(imageFiles.length === 0) {
        setFormState(prev => ({ ...prev, description: 'No images found to analyze.' }));
        setStatus('idle');
        return;
      }
      
      // Call the external service function
      const description = await callGeminiService(imageFiles); 
      
      setFormState(prev => ({ ...prev, description }));
      setStatus('success');
    } catch (err) {
      console.error(err);
      setFormState(prev => ({ ...prev, description: 'Failed to generate description. Check API key and network.' }));
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 1000);
    }
  };

  return {
    formState,
    fileState,
    status,
    toast,
    validationError,
    handleInputChange,
    handleRemoveFile,
    handleFileReorder,
    handleSubmit,
    generateDescription: generateDescription,
    DynamicHeaderContent, 
    currentTheme, 
    isFormValid, 
    loadIdentifierValue, 
    handleFileDrop, 
    showToast,
  };
};