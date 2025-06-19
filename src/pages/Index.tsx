
import React from 'react';
import TimelineEditor from '@/components/timeline/TimelineEditor';
import { CompileRequest } from '@/types/timeline';

const Index = () => {
  const handleExport = (data: CompileRequest) => {
    console.log('Timeline export:', data);
    // Handle the export data as needed
  };

  return (
    <div className="w-full h-screen relative">
      <TimelineEditor onExport={handleExport} />
    </div>
  );
};

export default Index;
