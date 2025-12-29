import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'egov-xml-editor-draft';
const AUTOSAVE_INTERVAL = 2000; // Auto-save mỗi 2 giây

export const useAutosave = (files, selectedFile, toast) => {
  const saveTimeoutRef = useRef(null);

  // Load draft từ localStorage khi component mount
  const loadDraft = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return null;

      const parsed = JSON.parse(savedData);

      // Validate data structure
      if (!parsed.version || parsed.version !== '1.0') {
        throw new Error('Incompatible draft version');
      }

      if (!parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Invalid draft data structure');
      }

      // Convert base64 back to Uint8Array
      const restoredFiles = {};
      for (const [path, fileData] of Object.entries(parsed.files)) {
        if (!fileData.contentBase64) {
          throw new Error('Missing file content');
        }

        // Decode base64 to Uint8Array
        const binaryString = atob(fileData.contentBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        restoredFiles[path] = {
          path: fileData.path,
          content: bytes,
          type: fileData.type,
          isEditable: fileData.isEditable
        };
      }

      return {
        files: restoredFiles,
        selectedFile: parsed.selectedFile || null,
        timestamp: parsed.timestamp
      };
    } catch (error) {
      console.error('Failed to load draft:', error);
      // Clear invalid draft
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  // Save draft to localStorage
  const saveDraft = (filesToSave, selectedFileToSave) => {
    try {
      // Don't save if no files
      if (!filesToSave || Object.keys(filesToSave).length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Convert Uint8Array to base64 for storage
      const filesToStore = {};
      for (const [path, fileData] of Object.entries(filesToSave)) {
        if (!fileData.content) continue;

        // Convert Uint8Array to base64
        let binary = '';
        const bytes = new Uint8Array(fileData.content);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        filesToStore[path] = {
          path: fileData.path,
          contentBase64: base64,
          type: fileData.type,
          isEditable: fileData.isEditable
        };
      }

      const dataToSave = {
        version: '1.0',
        files: filesToStore,
        selectedFile: selectedFileToSave,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save draft:', error);
      // If quota exceeded, clear old draft
      if (error.name === 'QuotaExceededError') {
        localStorage.removeItem(STORAGE_KEY);
        if (toast) {
          toast.showWarning('ストレージ容量不足のため、下書き保存に失敗しました');
        }
      }
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Auto-save effect
  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(files, selectedFile);
    }, AUTOSAVE_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [files, selectedFile]);

  return {
    loadDraft,
    saveDraft,
    clearDraft
  };
};
