
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

  return (
    <div className="w-full h-screen relative">
      <TimelineEditor onExport={handleExport} />
    </div>
  );
};

export default Index;
