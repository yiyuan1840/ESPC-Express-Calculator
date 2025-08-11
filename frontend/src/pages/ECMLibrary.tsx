import { useState, useEffect } from 'react';
import { Lightbulb, Zap, Shield, Settings, Gauge } from 'lucide-react';

interface ECM {
  id: number;
  name: string;
  category: string;
  description: string;
  estimated_savings_percent: number;
  implementation_cost: number;
  payback_years: number;
  is_template: number;
}

const ECMLibrary = () => {
  const [ecms, setECMs] = useState<ECM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchECMs();
  }, []);

  const fetchECMs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/ecms');
      if (response.ok) {
        const data = await response.json();
        setECMs(data);
      }
    } catch (error) {
      console.error('Error fetching ECMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(ecms.map(ecm => ecm.category))];
  const filteredECMs = selectedCategory === 'All' 
    ? ecms 
    : ecms.filter(ecm => ecm.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Lighting': return <Lightbulb className="h-5 w-5" />;
      case 'HVAC': return <Settings className="h-5 w-5" />;
      case 'Controls': return <Gauge className="h-5 w-5" />;
      case 'Envelope': return <Shield className="h-5 w-5" />;
      case 'Motors': return <Zap className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading ECM Library...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ECM Library</h1>
          <p className="text-gray-600">
            Browse available Energy Conservation Measures (ECMs) and their estimated savings
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ECMs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredECMs.map((ecm) => (
            <div key={ecm.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(ecm.category)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ecm.name}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {ecm.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">
                {ecm.description}
              </p>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Energy Savings:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {ecm.estimated_savings_percent}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Implementation Cost:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${ecm.implementation_cost.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Payback Period:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {ecm.payback_years} years
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredECMs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No ECMs found for the selected category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ECMLibrary;