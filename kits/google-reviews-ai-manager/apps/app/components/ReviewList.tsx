"use client";

import { useState, useEffect } from "react";
import { generateReply } from "../actions/orchestrate";
import { getGMBLocations, getGMBReviews, postGMBReply } from "../actions/gmb";
import { FiRefreshCw, FiMapPin, FiLogOut, FiCheckCircle, FiClock, FiStar, FiFilter, FiSearch, FiEdit2 } from "react-icons/fi";
import { BsMagic } from "react-icons/bs";

interface GMBReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string };
  starRating: string;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

function getRatingNumber(rating: string) {
  switch (rating) {
    case 'FIVE': return 5;
    case 'FOUR': return 4;
    case 'THREE': return 3;
    case 'TWO': return 2;
    case 'ONE': return 1;
    default: return 0;
  }
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function ReviewList() {
  const [locations, setLocations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<GMBReview[]>([]);
  const [accountName, setAccountName] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [replies, setReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState<Record<string, boolean>>({});

  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Filter state
  const [filterTab, setFilterTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadLocations() {
      try {
        const locData = await getGMBLocations();
        if (locData.error) {
          if (locData.error.includes("Unauthorized") || locData.error.includes("UNAUTHENTICATED")) {
            window.location.href = "/api/auth/signin";
            return;
          }
          setErrorMsg(locData.error);
          return;
        }

        if (locData.locations && locData.locations.length > 0) {
          setLocations(locData.locations);
          setAccountName(locData.accountName);
          
          if (locData.locations.length > 1) {
            setShowLocationModal(true);
          } else {
            selectLocation(locData.accountName, locData.locations[0].name);
          }
        } else {
          setErrorMsg("No Google My Business locations found for this account.");
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadLocations();
  }, []);

  const selectLocation = async (acc: string, locName: string) => {
    setLocationName(locName);
    setShowLocationModal(false);
    setLoadingReviews(true);
    try {
      const revData = await getGMBReviews(acc, locName);
      if (revData.error) {
        if (revData.error.includes("Unauthorized") || revData.error.includes("UNAUTHENTICATED")) {
          window.location.href = "/api/auth/signin";
          return;
        }
        setErrorMsg(revData.error);
      } else {
        setReviews(revData.reviews || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleGenerate = async (id: string, text: string, rating: number) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    const result = await generateReply(text || "No text provided.", rating.toString());
    if (result.reply) {
      setReplies(prev => ({ ...prev, [id]: result.reply }));
    } else {
      setReplies(prev => ({ ...prev, [id]: "Error: " + result.error }));
    }
    setLoading(prev => ({ ...prev, [id]: false }));
  };

  const handlePostReply = async (id: string) => {
    const textToPost = replies[id];
    if (!textToPost) return;

    setPosting(prev => ({ ...prev, [id]: true }));
    const result = await postGMBReply(accountName, locationName, id, textToPost);
    if (result.error) {
      if (result.error.includes("Unauthorized") || result.error.includes("UNAUTHENTICATED")) {
        window.location.href = "/api/auth/signin";
        return;
      }
      alert("Failed to post reply: " + result.error);
    } else {
      setReviews(prev => prev.map(r => r.reviewId === id ? { ...r, reviewReply: { comment: textToPost, updateTime: new Date().toISOString() } } : r));
      setReplies(prev => { const next = {...prev}; delete next[id]; return next; });
    }
    setPosting(prev => ({ ...prev, [id]: false }));
  };

  if (loadingInitial) {
    return <div className="mt-20 flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (errorMsg) {
    return (
      <div className="mt-10 p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 flex flex-col items-center">
        <h3 className="font-bold text-lg mb-2">Error connecting to Google</h3>
        <p className="mb-4">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Try Again</button>
      </div>
    );
  }

  const selectedLocData = locations.find(l => l.name === locationName);
  
  // Calculate Metrics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + getRatingNumber(r.starRating), 0) / totalReviews).toFixed(1) : "0";
  const repliedCount = reviews.filter(r => r.reviewReply).length;
  const awaitingCount = totalReviews - repliedCount;

  // Filter Reviews
  let filteredReviews = reviews.filter(r => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = r.reviewer?.displayName?.toLowerCase().includes(searchLower) || r.comment?.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
    
    if (filterTab === "Unanswered") return !r.reviewReply;
    if (filterTab === "Answered") return !!r.reviewReply;
    if (filterTab.endsWith("*")) {
      const stars = parseInt(filterTab.charAt(0));
      return getRatingNumber(r.starRating) === stars;
    }
    return true;
  });

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-800">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8 bg-blue-600 rounded-lg p-1" onError={(e) => e.currentTarget.style.display='none'} />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Google Reviews</h1>
          {selectedLocData && (
            <span className="ml-4 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Connected
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 bg-white">
            <FiMapPin className="text-gray-500" /> Location
          </button>
          <button onClick={() => selectLocation(accountName, locationName)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 bg-white">
            <FiRefreshCw className="text-gray-500" /> Refresh
          </button>
          <a href="/api/auth/signout" className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 bg-white">
            <FiLogOut /> Disconnect
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><FiStar className="text-yellow-400" /> Total Reviews</div>
            <div className="text-3xl font-bold text-gray-900">{totalReviews}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><FiStar className="text-blue-500" /> Avg. Rating</div>
            <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><FiCheckCircle className="text-green-500" /> Replied</div>
            <div className="text-3xl font-bold text-gray-900">{repliedCount}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><FiClock className="text-orange-500" /> Awaiting Reply</div>
            <div className="text-3xl font-bold text-gray-900">{awaitingCount}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm mb-6 flex items-center justify-between">
          <div className="flex items-center px-3 border-r border-gray-200 w-1/3">
            <FiSearch className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or review text..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full ml-2 py-2 outline-none text-sm bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto px-3">
            <FiFilter className="text-gray-400 mr-2" />
            {['All', 'Unanswered', 'Answered', '5*', '4*', '3*', '2*', '1*'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Feed */}
        {loadingReviews ? (
          <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">No reviews found matching your criteria.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredReviews.map((review) => {
              const ratingNum = getRatingNumber(review.starRating);
              const authorName = review.reviewer?.displayName || "Anonymous";
              
              return (
                <div key={review.reviewId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-all hover:shadow-md">
                  
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {getInitials(authorName)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{authorName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex text-yellow-400 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < ratingNum ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {ratingNum === 5 ? "Excellent" : ratingNum >= 3 ? "Good" : "Needs Improvement"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.reviewReply && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
                        <FiCheckCircle /> Replied
                      </span>
                    )}
                  </div>

                  {/* Review Content */}
                  <p className="text-gray-700 text-base leading-relaxed mb-6">
                    {review.comment || <span className="italic text-gray-400">No written feedback provided.</span>}
                  </p>

                  {/* Existing Reply */}
                  {review.reviewReply && replies[review.reviewId] === undefined && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4 relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center"><img src="/logo.svg" className="h-4 w-4" onError={(e) => e.currentTarget.style.display='none'} /></div>
                        <span className="font-semibold text-gray-800 text-sm">Your Reply</span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{review.reviewReply.comment}</p>
                    </div>
                  )}

                  {/* Editing AI Draft */}
                  {replies[review.reviewId] !== undefined && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-4 shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <BsMagic className="text-blue-600" />
                        <span className="font-bold text-blue-800 text-sm">AI Drafted Reply</span>
                        <span className="text-xs text-blue-500 ml-auto">You can edit this before publishing</span>
                      </div>
                      <textarea
                        value={replies[review.reviewId]}
                        onChange={(e) => setReplies(prev => ({ ...prev, [review.reviewId]: e.target.value }))}
                        className="w-full p-3 border border-blue-300 rounded-md text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-y"
                      />
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={() => handlePostReply(review.reviewId)}
                          disabled={posting[review.reviewId]}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                          {posting[review.reviewId] ? "Publishing..." : "Publish to Google"}
                        </button>
                        <button 
                          onClick={() => setReplies(prev => { const next = {...prev}; delete next[review.reviewId]; return next; })}
                          className="text-gray-500 px-4 py-2 rounded-md text-sm hover:bg-gray-100 font-medium transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    {replies[review.reviewId] === undefined && (
                      <button 
                        onClick={() => handleGenerate(review.reviewId, review.comment, ratingNum)}
                        disabled={loading[review.reviewId]}
                        className="flex items-center gap-2 text-red-500 border border-red-200 bg-red-50 px-4 py-2 rounded-md text-sm hover:bg-red-100 disabled:opacity-50 transition-all font-semibold shadow-sm"
                      >
                        <BsMagic /> {loading[review.reviewId] ? "Drafting..." : "AI Reply"}
                      </button>
                    )}
                    {review.reviewReply && replies[review.reviewId] === undefined && (
                      <button 
                        onClick={() => setReplies(prev => ({ ...prev, [review.reviewId]: review.reviewReply!.comment }))}
                        className="flex items-center gap-2 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 text-sm font-medium transition-all"
                      >
                        <FiEdit2 /> Edit Reply
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Location Selector Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Select your Business Profile</h2>
                <button onClick={() => locations.length > 0 && locationName ? setShowLocationModal(false) : null} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-gray-500 text-sm">We found multiple locations in your Google account. Please select the one that corresponds to this dashboard.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3 bg-gray-50">
              {locations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => selectLocation(accountName, loc.name)}
                  className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${locationName === loc.name ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}`}
                >
                  <div className="h-10 w-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-900 truncate">{loc.title}</h3>
                    <p className="text-xs text-gray-500 truncate mt-1">{loc.storefrontAddress?.addressLines?.join(", ") || "No address provided"}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">{accountName.split('/')[1]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
