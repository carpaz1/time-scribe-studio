
import React from 'react';
import TimelineEditor from '@/components/timeline/TimelineEditor';
import { CompileRequest } from '@/types/timeline';

const Index = () => {
  console.log('Index component initializing...');
  
  const handleExport = (data: CompileRequest) => {
    console.log('Timeline export:', data);
    // Handle the export data as needed
  };

  console.log('Index component rendering TimelineEditor');

  // Add error boundary logging
  React.useEffect(() => {
    console.log('Index component mounted successfully');
    
    // Check if we're in a valid state
    const body = document.body;
    console.log('Document body classes:', body.className);
    console.log('Document ready state:', document.readyState);
    
    return () => {
      console.log('Index component unmounting');
    };
  }, []);

  return (
    <div className="w-full h-screen relative">
      <TimelineEditor onExport={handleExport} />
    </div>
  );
};

export default Index;
