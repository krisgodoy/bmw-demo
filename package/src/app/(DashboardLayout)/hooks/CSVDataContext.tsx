'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface CSVData {
  [key: string]: string | number | boolean;
}

interface CSVDataContextType {
  csvData: CSVData[];
  setCsvData: (data: CSVData[]) => void;
  headers: string[];
  setHeaders: (headers: string[]) => void;
  clearStoredData: () => void;
}

// LocalStorage keys
const CSV_DATA_KEY = 'csv_data';
const CSV_HEADERS_KEY = 'csv_headers';

const CSVDataContext = createContext<CSVDataContextType | undefined>(undefined);

export const CSVDataProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage if available
  const [csvData, setCsvData] = useState<CSVData[]>(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem(CSV_DATA_KEY);
      return storedData ? JSON.parse(storedData) : [];
    }
    return [];
  });
  
  const [headers, setHeaders] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storedHeaders = localStorage.getItem(CSV_HEADERS_KEY);
      return storedHeaders ? JSON.parse(storedHeaders) : [];
    }
    return [];
  });

  // Update localStorage when data changes
  useEffect(() => {
    if (csvData.length > 0) {
      localStorage.setItem(CSV_DATA_KEY, JSON.stringify(csvData));
    }
  }, [csvData]);

  useEffect(() => {
    if (headers.length > 0) {
      localStorage.setItem(CSV_HEADERS_KEY, JSON.stringify(headers));
    }
  }, [headers]);

  // Function to clear stored data
  const clearStoredData = () => {
    localStorage.removeItem(CSV_DATA_KEY);
    localStorage.removeItem(CSV_HEADERS_KEY);
    setCsvData([]);
    setHeaders([]);
  };

  return (
    <CSVDataContext.Provider value={{ csvData, setCsvData, headers, setHeaders, clearStoredData }}>
      {children}
    </CSVDataContext.Provider>
  );
};

export const useCSVData = () => {
  const context = useContext(CSVDataContext);
  if (context === undefined) {
    throw new Error('useCSVData must be used within a CSVDataProvider');
  }
  return context;
}; 