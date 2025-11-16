import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const ReviewApplication: React.FC = () => {
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState('Juan Pérez');
  const [selectedPipeline, setSelectedPipeline] = useState('Pipeline Ejemplo Complejo');

  // Sample data - in a real app, this would come from an API
  const applications = [
    { name: 'Juan Pérez', ref: '4321' },
    { name: 'María García', ref: '4322' },
    { name: 'Carlos López', ref: '4323' },
    { name: 'Ana Martínez', ref: '4324' },
  ];

  const pipelines = [
    { name: 'Pipeline Ejemplo Complejo', nodes: 5 },
    { name: 'Loan Risk Pipeline v2', nodes: 8 },
    { name: 'Automatic Approval Pipeline v1', nodes: 3 },
    { name: 'High Value Pipeline v3', nodes: 6 },
  ];

  const selectedAppData = applications.find((app) => app.name === selectedApplication);
  const selectedPipelineData = pipelines.find((p) => p.name === selectedPipeline);

  const handleRunPipeline = () => {
    // In a real app, this would trigger the pipeline execution
    console.log('Running pipeline:', selectedPipeline, 'for application:', selectedApplication);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Back button and Title */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review a New Application</h2>
          <p className="text-gray-600">
            Select an application and pipeline to execute the loan processing workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input and Action Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Select Application Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Application</h3>
              <div className="relative">
                <select
                  value={selectedApplication}
                  onChange={(e) => setSelectedApplication(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                >
                  {applications.map((app) => (
                    <option key={app.ref} value={app.name}>
                      {app.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {selectedAppData && (
                  <div className="mt-2 text-sm text-gray-500">Ref: {selectedAppData.ref}</div>
                )}
              </div>
            </div>

            {/* Select Pipeline Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Pipeline</h3>
              <div className="relative">
                <select
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                >
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.name} value={pipeline.name}>
                      {pipeline.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {selectedPipelineData && (
                  <div className="mt-2 text-sm text-gray-500">
                    {selectedPipelineData.nodes} nodes
                  </div>
                )}
              </div>
            </div>

            {/* Run Pipeline Button */}
            <button
              onClick={handleRunPipeline}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Run Pipeline</span>
            </button>

            {/* Pipeline Execution Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Pipeline Execution</p>
                <p className="text-sm text-blue-800">
                  The pipeline will process the selected application through all configured rules
                  and return a final status.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Status/Instruction Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <svg
                    className="w-16 h-16 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Execute</h3>
                <p className="text-gray-600 max-w-md">
                  Select an application and pipeline, then click "Run Pipeline" to see the
                  execution results and logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewApplication;

