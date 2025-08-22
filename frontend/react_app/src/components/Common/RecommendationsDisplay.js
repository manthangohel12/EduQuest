import React, { useState } from 'react';
import { ExternalLink, Play, BookOpen, Globe, GraduationCap, Info, ChevronDown, ChevronUp } from 'lucide-react';

const RecommendationsDisplay = ({ recommendations, title = "Learning Resources", onResourceClick }) => {
  const [expandedSections, setExpandedSections] = useState({
    wikipedia: true,
    youtube: true,
    web_resources: true,
    educational_resources: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleResourceClick = (resource, type) => {
    if (onResourceClick) {
      onResourceClick(resource, type);
    } else {
      // Default behavior: open in new tab
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'wikipedia':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'youtube':
        return <Play className="w-5 h-5 text-red-600" />;
      case 'web_resources':
        return <Globe className="w-5 h-5 text-green-600" />;
      case 'educational_resources':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSectionTitle = (type) => {
    switch (type) {
      case 'wikipedia':
        return 'Wikipedia Articles';
      case 'youtube':
        return 'YouTube Videos';
      case 'web_resources':
        return 'Web Resources';
      case 'educational_resources':
        return 'Educational Platforms';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getSectionColor = (type) => {
    switch (type) {
      case 'wikipedia':
        return 'border-blue-200 bg-blue-50';
      case 'youtube':
        return 'border-red-200 bg-red-50';
      case 'web_resources':
        return 'border-green-200 bg-green-50';
      case 'educational_resources':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!recommendations || recommendations.total_recommendations === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No learning resources found for this content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          {title}
        </h3>
        <div className="text-sm text-gray-500">
          {recommendations.total_recommendations} resources found
        </div>
      </div>

      {/* Summary */}
      {recommendations.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 whitespace-pre-line">{recommendations.summary}</p>
          </div>
        </div>
      )}

      {/* Key Concepts */}
      {recommendations.key_concepts && recommendations.key_concepts.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Topics:</h4>
          <div className="flex flex-wrap gap-2">
            {recommendations.key_concepts.slice(0, 8).map((concept, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resource Sections */}
      {Object.entries(recommendations).map(([key, resources]) => {
        if (key === 'summary' || key === 'key_concepts' || key === 'content_type' || key === 'total_recommendations') {
          return null;
        }

        if (!Array.isArray(resources) || resources.length === 0) {
          return null;
        }

        const isExpanded = expandedSections[key];
        const sectionColor = getSectionColor(key);

        return (
          <div key={key} className={`border rounded-lg ${sectionColor}`}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-opacity-75 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getSectionIcon(key)}
                <h4 className="font-medium text-gray-900">{getSectionTitle(key)}</h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                  {resources.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleResourceClick(resource, key)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail/Icon */}
                      {resource.thumbnail && key === 'youtube' ? (
                        <img
                          src={resource.thumbnail}
                          alt={resource.title}
                          className="w-20 h-15 object-cover rounded-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-15 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                          {getSectionIcon(key)}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {resource.title}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {resource.description}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {resource.channel && (
                            <span className="flex items-center gap-1">
                              <span>Channel:</span>
                              <span className="font-medium">{resource.channel}</span>
                            </span>
                          )}
                          {resource.platform && (
                            <span className="flex items-center gap-1">
                              <span>Platform:</span>
                              <span className="font-medium">{resource.platform}</span>
                            </span>
                          )}
                          {resource.domain && (
                            <span className="flex items-center gap-1">
                              <span>Domain:</span>
                              <span className="font-medium">{resource.domain}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResourceClick(resource, key);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecommendationsDisplay;

