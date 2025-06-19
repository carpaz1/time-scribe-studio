
import React, { useState } from 'react';
import TimelineEditor from '@/components/timeline/TimelineEditor';
import GPUOptimizationGuide from '@/components/optimization/GPUOptimizationGuide';
import { CompileRequest } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Index = () => {
  const [showOptimizationGuide, setShowOptimizationGuide] = useState(false);

  const handleExport = (data: CompileRequest) => {
    console.log('Timeline export:', data);
    // Handle the export data as needed
  };

  return (
    <div className="w-full h-screen relative">
      <TimelineEditor onExport={handleExport} />
      
      {/* Optimization Guide Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOptimizationGuide(!showOptimizationGuide)}
          className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Performance Tips
        </Button>
      </div>

      {/* Optimization Guide Overlay */}
      {showOptimizationGuide && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <GPUOptimizationGuide onClose={() => setShowOptimizationGuide(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
