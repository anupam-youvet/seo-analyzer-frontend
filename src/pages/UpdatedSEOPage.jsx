import React, { useState } from "react";
import {
  Loader2,
  Globe,
  BarChart3,
  FileText,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Download,
  Send,
  Edit,
  Eye,
  TrendingUp,
  Target,
  Link,
  Lightbulb,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
const initialState = {
  scrapedContent: "",
  seoAnalysis: "",
  seoAnalysisData: null,
  generatedContent: "",
  currentScreen: "analysis", // "analysis" or "generation"
  loading: {
    scraping: false,
    analyzing: false,
    generating: false,
  },
  metrics: null,
  errors: {},
  selectedImprovements: [],
  selectedKeywords: [],
};

const contentTypes = [
  "FAQ",
  "Blog Post",
  "Product Description",
  "Landing Page Content",
];

const UpdatedAnalyzer = () => {
  // Sample URLs array
  const sampleUrls = [
    "https://www.actcorp.in/wifipedia",
    "https://www.actcorp.in/blog/what-is-smart-wifi-and-how-it-works",
    "https://www.actcorp.in/blog/is-it-worth-buying-smart-wifi-router",
    "https://www.actcorp.in/blog/what-is-the-total-distance-covered-by-smart-wifi",
    "https://www.actcorp.in/blog/exploring-uses-wifi-smart-homes",
    "https://www.actcorp.in/blog/fast-wi-fi-connection-for-cricket-live-streaming",
  ];
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL;
  const OPENAI_KEY = import.meta.env.VITE_APP_OPENAI_API_KEY;
  const [formData, setFormData] = useState({
    url: "",
    apiKey: OPENAI_KEY,
    contentTopic: "",
    generationType: "FAQ",
    maxTokens: 1500,
    temperature: 0.7,
  });

  const [state, setState] = useState(initialState);

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
    const targetUrl = formData.url;
    if (!targetUrl) {
      setError("scrape", "Please select a URL");
      return;
    }

    clearError("scrape");
    updateLoading("scraping", true);

    try {
      const response = await fetch(`${API_BASE_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
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
          ranking: data.ranking || 3,
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
      setError("generate", "Please select content topic");
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
          selectedImprovements: state.selectedImprovements,
          selectedKeywords: state.selectedKeywords,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content");
      }
      console.log("data", data);

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

  const MetricCard = ({ value, label, icon: Icon }) => (
    <div className="bg-slate-800 rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:scale-105 border border-slate-700/50 shadow-2xl">
      {Icon && <Icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />}
      <div className="text-3xl font-bold text-blue-400 mb-2">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
    </div>
  );

  const getSEOData = () => {
    if (state.seoAnalysisData?.SEOAnalysis) {
      return state.seoAnalysisData.SEOAnalysis;
    }
    return null;
  };

  const seoData = getSEOData();

  const getContentSummary = () => {
    if (!state.generatedContent) return null;

    const content = state.generatedContent;
    const lines = content.split("\n").length;
    const words = content.split(/\s+/).length;
    const characters = content.length;
    const keywords = state.selectedKeywords || [];

    return { lines, words, characters, keywords: keywords.length };
  };

  const switchToGeneration = () => {
    setState((prev) => ({ ...prev, currentScreen: "generation" }));
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  const switchToAnalysis = () => {
    setState((prev) => ({ ...prev, currentScreen: "analysis" }));
  };

  if (state.currentScreen === "generation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={switchToAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Analysis
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Content Generation
            </h1>
            <div className="text-sm text-slate-400">URL: {formData.url}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Configuration Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700/50 sticky top-8">
                <h3 className="text-lg font-bold text-slate-200 mb-6">
                  Settings
                </h3>

                <div className="space-y-4">
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
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {contentTypes.map((type, index) => (
                        <option value={type} key={index}>
                          {type}
                        </option>
                      ))}
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
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Creativity: {formData.temperature}
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
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Content Topic Selection */}
              <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6" />
                  Select Content Topic
                </h2>

                {seoData?.NewKeywordTargets?.ContentTopicsToAdd?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seoData.NewKeywordTargets.ContentTopicsToAdd.map(
                      (topic, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-4 bg-slate-700 rounded-xl cursor-pointer hover:bg-slate-600 transition-colors"
                        >
                          <input
                            type="radio"
                            name="contentTopic"
                            value={topic}
                            checked={formData.contentTopic === topic}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                contentTopic: e.target.value,
                              }))
                            }
                            className="text-purple-500"
                          />
                          <span className="text-slate-200">{topic}</span>
                        </label>
                      )
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.contentTopic}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contentTopic: e.target.value,
                      }))
                    }
                    placeholder="Enter content topic"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              {/* Suggested Keywords Selection */}
              {seoData?.NewKeywordTargets?.SuggestedKeywords?.length > 0 && (
                <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                  <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6" />
                    Select Suggested Keywords
                  </h2>

                  <div className="space-y-3">
                    {seoData.NewKeywordTargets?.SuggestedKeywords.map(
                      (keyword, index) => (
                        <label
                          key={index}
                          className="flex items-start gap-3 p-4 bg-slate-700 rounded-xl cursor-pointer hover:bg-slate-600 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={state.selectedKeywords.includes(keyword)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setState((prev) => ({
                                  ...prev,
                                  selectedKeywords: [
                                    ...prev.selectedKeywords,
                                    keyword,
                                  ],
                                }));
                              } else {
                                setState((prev) => ({
                                  ...prev,
                                  selectedImprovements:
                                    prev.selectedKeywords.filter(
                                      (imp) => imp !== keyword
                                    ),
                                }));
                              }
                            }}
                            className="mt-1 text-purple-500"
                          />
                          <span className="text-slate-200 text-sm">
                            {keyword}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Improvements Selection */}
              {seoData?.Improvements && (
                <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                  <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6" />
                    Select Improvements to Implement
                  </h2>

                  <div className="space-y-3">
                    {seoData.Improvements.map((improvement, index) => (
                      <label
                        key={index}
                        className="flex items-start gap-3 p-4 bg-slate-700 rounded-xl cursor-pointer hover:bg-slate-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={state.selectedImprovements.includes(
                            improvement
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setState((prev) => ({
                                ...prev,
                                selectedImprovements: [
                                  ...prev.selectedImprovements,
                                  improvement,
                                ],
                              }));
                            } else {
                              setState((prev) => ({
                                ...prev,
                                selectedImprovements:
                                  prev.selectedImprovements.filter(
                                    (imp) => imp !== improvement
                                  ),
                              }));
                            }
                          }}
                          className="mt-1 text-purple-500"
                        />
                        <span className="text-slate-200 text-sm">
                          {improvement}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Content */}
              <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleGenerateContent}
                    disabled={state.loading.generating}
                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {state.loading.generating ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                    {state.loading.generating
                      ? "Generating..."
                      : "Generate Content"}
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
                      message="✅ Content generated successfully!"
                    />

                    {/* Content Summary */}
                    {getContentSummary() && (
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <MetricCard
                          value={getContentSummary().lines}
                          label="Lines"
                        />
                        <MetricCard
                          value={getContentSummary().words}
                          label="Words"
                        />
                        <MetricCard
                          value={getContentSummary().characters}
                          label="Characters"
                        />
                        <MetricCard
                          value={getContentSummary().keywords}
                          label="Keywords Used"
                        />
                      </div>
                    )}

                    {/* Generated Content Display */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6 shadow-md">
                      {/* <article className="prose prose-invert prose-slate max-w-none text-slate-100 leading-relaxed dark:prose-invert">
                        <Markdown
                          children={state?.generatedContent}
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        />
                      </article> */}
                      <div
                        className="prose prose-invert max-w-none text-slate-100 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: state.generatedContent,
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center">
                      {/* <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download as DOC
                      </button> */}
                      <button className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold text-white transition-colors flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send for Evaluation
                      </button>
                      <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-semibold text-white transition-colors flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Content
                      </button>
                      <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-white transition-colors flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Publish
                      </button>
                      <button
                        onClick={() => {
                          setState(initialState);
                        }}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold text-white transition-colors flex items-center gap-2"
                      >
                        <Link className="w-4 h-4" />
                        Analyze New URL
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            SEO Analyser and Content Generator
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Transform your content strategy with intelligent SEO analysis and
            AI-driven content optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* API Configuration Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700/50 sticky top-8">
              <h3 className="text-lg font-bold text-slate-200 mb-6">
                API Configuration
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
            {/* Step 1: URL Selection & Content Extraction */}
            <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  1
                </div>
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                  <Globe className="w-6 h-6" />
                  URL Selection & Content Extraction
                </h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select URL
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="md:col-span-3">
                    <select
                      value={formData.url}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }));
                        setState(initialState);
                      }}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a URL...</option>
                      {sampleUrls.map((url, index) => (
                        <option key={index} value={url}>
                          {url}
                        </option>
                      ))}
                    </select>
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
                    message="✅ Content extracted successfully!"
                  />

                  {state.metrics && (
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      <MetricCard
                        value={state.metrics.characters}
                        label="Characters"
                      />
                      <MetricCard value={state.metrics.words} label="Words" />
                      <MetricCard
                        value={state.metrics.sentences}
                        label="Sentences"
                      />
                      <MetricCard
                        value={state.metrics.ranking}
                        label="Current Ranking"
                      />
                    </div>
                  )}
                </>
              )}

              {state.loading.scraping && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              )}
            </div>

            {/* Step 2: SEO Analysis */}
            {state.scrapedContent && (
              <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      2
                    </div>
                    <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                      <BarChart3 className="w-6 h-6" />
                      SEO Analysis
                    </h2>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Perform Analysis
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="md:col-span-3">
                      <input
                        type="url"
                        value={formData.url}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={handleAnalyzeSEO}
                      disabled={state.loading.analyzing}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {state.loading.analyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Analyze SEO"
                      )}
                    </button>
                  </div>
                </div>

                {state.errors.analyze && (
                  <StatusMessage
                    type="error"
                    message={`❌ ${state.errors.analyze}`}
                  />
                )}

                {state.seoAnalysis && !state.loading.analyzing && seoData && (
                  <>
                    <StatusMessage
                      type="success"
                      message="✅ SEO analysis completed!"
                    />
                    <textarea
                      value={state.seoAnalysis}
                      readOnly
                      className="w-full h-80 p-4 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 text-sm font-mono resize-none focus:outline-none"
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                      {/* Left Column - Current Status */}
                      <div className="space-y-6">
                        <div className="bg-slate-700 rounded-2xl p-6">
                          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Current SEO Status
                          </h3>

                          <div className="mb-4">
                            <div className=" text-sm font-medium text-white-300 mb-2">
                              SEO Score
                            </div>
                            <div className="text-3xl font-bold text-blue-400">
                              {seoData.SEOScore}/100
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-white-300 mb-2">
                              Current Keywords
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {seoData.CurrentKeywords?.map(
                                (keyword, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-600 rounded-full text-xs text-white"
                                  >
                                    {keyword}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Suggestions */}
                      <div className="space-y-6">
                        <div className="bg-slate-700 rounded-2xl p-6">
                          <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Suggested Changes
                          </h3>

                          {seoData.NewKeywordTargets?.SuggestedKeywords && (
                            <div className="mb-4">
                              <div className="font-medium text-white-300 mb-2">
                                Suggested Keywords
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {seoData.NewKeywordTargets.SuggestedKeywords.map(
                                  (keyword, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-purple-600 rounded-full text-xs text-white"
                                    >
                                      {keyword}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {seoData.NewKeywordTargets?.ContentTopicsToAdd && (
                            <div>
                              <div className="font-medium text-white-300 mb-2">
                                Suggested Content Topics
                              </div>
                              <div className="space-y-2">
                                {seoData.NewKeywordTargets.ContentTopicsToAdd.map(
                                  (topic, index) => (
                                    <div
                                      key={index}
                                      className="px-3 py-2 bg-pink-600/20 border border-pink-500/30 rounded-lg text-xs text-pink-200"
                                    >
                                      {topic}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Suggested Improvements Box */}
                    {seoData.Improvements && (
                      <div className="bg-slate-700 rounded-2xl p-6 mt-6">
                        <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Suggested Improvements
                        </h3>
                        <div className="space-y-3">
                          {seoData.Improvements.map((improvement, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-slate-600 rounded-lg"
                            >
                              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="text-slate-200 text-sm">
                                {improvement}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generate Content Button */}
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={switchToGeneration}
                        className="px-16 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 rounded-3xl font-bold text-white text-2xl transition-all duration-300 hover:scale-105 shadow-2xl flex items-center gap-4"
                      >
                        <FileText className="w-8 h-8" />
                        Handover to Second Agent
                      </button>
                    </div>
                  </>
                )}

                {state.loading.analyzing && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default UpdatedAnalyzer;
