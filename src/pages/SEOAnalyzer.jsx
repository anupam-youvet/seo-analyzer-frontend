import React, { useState } from "react";
import {
  Loader2,
  Globe,
  BarChart3,
  FileText,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import Markdown from "react-markdown";
// Markdown component will be handled with dangerouslySetInnerHTML for now

const SEOAnalyzer = () => {
  const [formData, setFormData] = useState({
    url: "",
    apiKey: "",
    contentTopic: "",
    generationType: "FAQ",
    maxTokens: 1500,
    temperature: 0.7,
  });

  const [state, setState] = useState({
    scrapedContent: "",
    seoAnalysis: "",
    seoAnalysisData: null, // Add this to store parsed SEO analysis
    generatedContent: "",
    loading: {
      scraping: false,
      analyzing: false,
      generating: false,
    },
    metrics: null,
    errors: {},
  });

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

  const updateLoading = (key, value) => {
    setState((prev) => ({
      ...prev,
      loading: { ...prev.loading, [key]: value },
    }));
  };

  const setError = (key, message) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [key]: message },
    }));
  };

  const clearError = (key) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [key]: null },
    }));
  };

  const handleScrape = async () => {
    if (!formData.url) {
      setError("scrape", "Please enter a URL");
      return;
    }

    clearError("scrape");
    updateLoading("scraping", true);

    try {
      const response = await fetch(`${API_BASE_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape website");
      }

      setState((prev) => ({
        ...prev,
        scrapedContent: data.content,
        metrics: {
          characters: data.characterCount,
          words: data.wordCount,
          sentences: data.sentenceCount,
        },
      }));
    } catch (error) {
      setError("scrape", error.message);
    } finally {
      updateLoading("scraping", false);
    }
  };

  const handleAnalyzeSEO = async () => {
    if (!formData.apiKey) {
      setError("analyze", "Please enter your OpenAI API key");
      return;
    }

    if (!state.scrapedContent) {
      setError("analyze", "Please scrape content first");
      return;
    }

    clearError("analyze");
    updateLoading("analyzing", true);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-seo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: state.scrapedContent,
          apiKey: formData.apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze SEO");
      }

      // Parse the SEO analysis if it's a JSON string
      let parsedAnalysis = null;
      try {
        parsedAnalysis =
          typeof data.analysis === "string"
            ? JSON.parse(data.analysis)
            : data.analysis;
      } catch (e) {
        console.log("Analysis is not JSON, using as is");
      }

      setState((prev) => ({
        ...prev,
        seoAnalysis: data.analysis,
        seoAnalysisData: parsedAnalysis,
      }));
    } catch (error) {
      setError("analyze", error.message);
    } finally {
      updateLoading("analyzing", false);
    }
  };

  const handleGenerateContent = async () => {
    if (!formData.apiKey || !formData.contentTopic) {
      setError("generate", "Please provide API key and content topic");
      return;
    }

    if (!state.seoAnalysis) {
      setError("generate", "Please complete SEO analysis first");
      return;
    }

    clearError("generate");
    updateLoading("generating", true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoData: state.seoAnalysis,
          contentTopic: formData.contentTopic,
          generationType: formData.generationType,
          apiKey: formData.apiKey,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      setState((prev) => ({
        ...prev,
        generatedContent: data.content,
      }));
    } catch (error) {
      setError("generate", error.message);
    } finally {
      updateLoading("generating", false);
    }
  };

  const StatusMessage = ({ type, message }) => {
    const styles = {
      success: "bg-slate-800 border border-green-500/20 text-green-400",
      error: "bg-slate-800 border border-red-500/20 text-red-400",
      info: "bg-slate-800 border border-blue-500/20 text-blue-400",
    };

    const icons = {
      success: <Check className="w-4 h-4" />,
      error: <X className="w-4 h-4" />,
      info: <AlertCircle className="w-4 h-4" />,
    };

    return (
      <div
        className={`rounded-2xl p-4 my-4 flex items-center gap-3 ${styles[type]} shadow-lg`}
      >
        {icons[type]}
        <span className="font-medium">{message}</span>
      </div>
    );
  };

  const MetricCard = ({ value, label }) => (
    <div className="bg-slate-800 rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:scale-105 border border-slate-700/50 shadow-2xl">
      <div className="text-3xl font-bold text-blue-400 mb-2">
        {value?.toLocaleString()}
      </div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
    </div>
  );

  // Get content topics from SEO analysis
  const getContentTopics = () => {
    if (
      state.seoAnalysisData?.SEOAnalysis?.NewKeywordTargets?.ContentTopicsToAdd
    ) {
      return state.seoAnalysisData.SEOAnalysis.NewKeywordTargets
        .ContentTopicsToAdd;
    }
    return [];
  };

  const contentTopics = getContentTopics();
  const hasContentTopics = contentTopics.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            SEO Analyzer
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Transform your content strategy with AI-powered SEO analysis and
            intelligent content generation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700/50 sticky top-8">
              <h3 className="text-lg font-bold text-slate-200 mb-6">
                Configuration Panel
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        apiKey: e.target.value,
                      }))
                    }
                    placeholder="sk-..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={formData.generationType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        generationType: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FAQ">FAQ</option>
                    <option value="Blog Post">Blog Post</option>
                    <option value="Product Description">
                      Product Description
                    </option>
                    <option value="Landing Page Content">
                      Landing Page Content
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content Length: {formData.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="2000"
                    step="100"
                    value={formData.maxTokens}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxTokens: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Creativity Level: {formData.temperature}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        temperature: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-500"
                  />
                </div>

                {formData.apiKey && (
                  <StatusMessage
                    type="success"
                    message="✅ API Key Connected"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Step 1: Website Scraping */}
            <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  1
                </div>
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                  <Globe className="w-6 h-6" />
                  Website Content Extraction
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-3">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://www.example.com/your-smart-wifi-page"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleScrape}
                  disabled={state.loading.scraping}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.loading.scraping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Extract Content"
                  )}
                </button>
              </div>

              {state.errors.scrape && (
                <StatusMessage
                  type="error"
                  message={`❌ ${state.errors.scrape}`}
                />
              )}

              {state.scrapedContent && !state.loading.scraping && (
                <>
                  <StatusMessage
                    type="success"
                    message="✅ Content extracted successfully! Ready for analysis."
                  />

                  {state.metrics && (
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <MetricCard
                        value={state.metrics.characters}
                        label="Characters"
                      />
                      <MetricCard value={state.metrics.words} label="Words" />
                      <MetricCard
                        value={state.metrics.sentences}
                        label="Sentences"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 2: SEO Analysis */}
            {state.scrapedContent && (
              <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                  <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                    <BarChart3 className="w-6 h-6" />
                    SEO Performance Analysis
                  </h2>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleAnalyzeSEO}
                    disabled={state.loading.analyzing}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {state.loading.analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Analyze SEO"
                    )}
                  </button>
                </div>

                {state.errors.analyze && (
                  <StatusMessage
                    type="error"
                    message={`❌ ${state.errors.analyze}`}
                  />
                )}

                {state.seoAnalysis && !state.loading.analyzing && (
                  <>
                    <StatusMessage
                      type="success"
                      message="✅ SEO analysis completed! Insights generated."
                    />
                    <textarea
                      value={state.seoAnalysis}
                      readOnly
                      className="w-full h-80 p-4 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 text-sm font-mono resize-none focus:outline-none"
                    />
                  </>
                )}
              </div>
            )}

            {/* Step 3: Content Generation */}
            {state.seoAnalysis && (
              <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                  <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    AI Content Generation
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="md:col-span-3">
                    {hasContentTopics ? (
                      <div>
                        <select
                          value={formData.contentTopic}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              contentTopic: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>
                            Select an option
                          </option>
                          {contentTopics.map((topic, index) => (
                            <option
                              key={index}
                              value={topic}
                              selected={index === 0}
                            >
                              {topic}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Content Topic
                        </label>
                        <input
                          type="text"
                          value={formData.contentTopic}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              contentTopic: e.target.value,
                            }))
                          }
                          placeholder="Content Topic"
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateContent}
                    disabled={
                      state.loading.generating || !formData.contentTopic
                    }
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {state.loading.generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Generate Content"
                    )}
                  </button>
                </div>

                {state.errors.generate && (
                  <StatusMessage
                    type="error"
                    message={`❌ ${state.errors.generate}`}
                  />
                )}

                {state.generatedContent && !state.loading.generating && (
                  <>
                    <StatusMessage
                      type="success"
                      message="✅ Content generated successfully! Ready to use."
                    />
                    <Markdown>{state.generatedContent}</Markdown>
                    {/* <textarea
                      value={state.generatedContent}
                      readOnly
                      className="w-full h-96 p-4 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 text-sm resize-none focus:outline-none"
                    /> */}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-700">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            🔥 Smart WiFi SEO Analyzer
          </div>
          <div className="text-slate-400">
            Powered by OpenAI GPT-4 • Built with React & Node.js • Made with ❤️
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOAnalyzer;
