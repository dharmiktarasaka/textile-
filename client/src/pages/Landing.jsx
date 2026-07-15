import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, CheckCircle2, ChevronRight, ArrowRight, Store, Settings, Layers, Scissors, Truck, RefreshCw, Star, Info, Phone, MessageSquare, Loader2, Building } from 'lucide-react';
import apiClient, { BACKEND_BASE } from '../api/apiClient';
import useAuthStore from '../store/authStore';
import bgVideo from '../assets/bg-final.mp4';

const Landing = () => {
  const navigate = useNavigate();
  const { token, company } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Enquiry modal states
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const predefinedCategories = [
    { name: 'Fabric Waste', desc: 'Roll leftovers, cutting scraps, stock lots' },
    { name: 'Yarn Waste', desc: 'Cotton, synthetic thread, bobbin wastes' },
    { name: 'Thread Waste', desc: 'Hanks, spools, synthetic/natural thread scrap' },
    { name: 'Fibre Waste', desc: 'Raw cotton fibers, synthetic staples' },
    { name: 'Hosiery Cutting Waste', desc: 'Knit clips, cotton-lycra blend cuttings' },
    { name: 'Denim Waste', desc: 'Indigo denim cuttings, scrap borders' }
  ];

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        // Load categories
        const catRes = await apiClient.get('/categories');
        setCategories(catRes.data.categories || []);

        // Load public latest listings & featured sellers
        const [listingsRes, sellersRes] = await Promise.all([
          apiClient.get('/listings/public/latest'),
          apiClient.get('/listings/public/sellers')
        ]);
        setLatestListings(listingsRes.data.listings || []);
        setFeaturedSellers(sellersRes.data.companies || []);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (locationQuery) params.append('city', locationQuery);
    navigate(`/marketplace?${params.toString()}`);
  };

  const handleNicheClick = (nicheName, catId) => {
    const params = new URLSearchParams();
    if (catId) {
      params.append('categoryId', catId);
    } else {
      params.append('search', nicheName);
    }
    navigate(`/marketplace?${params.toString()}`);
  };

  const handleRequestContact = async (product) => {
    if (!token) {
      alert('Please sign in or register to request seller contact details.');
      navigate('/login');
      return;
    }
    if (company?.verificationStatus !== 'VERIFIED') {
      alert('Your company profile is pending verification. Contact access is locked until verified.');
      navigate('/pending-approval');
      return;
    }
    try {
      await apiClient.post('/contact-requests', {
        listingId: product._id,
        message: 'We are requesting contact details to discuss trade for this lot.',
      });
      alert('Contact request submitted successfully! Awaiting seller approval.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit contact request.');
    }
  };

  const handleOpenEnquiry = (product) => {
    if (!token) {
      alert('Please sign in or register to send direct trade inquiries.');
      navigate('/login');
      return;
    }
    if (company?.verificationStatus !== 'VERIFIED') {
      alert('Your company profile is pending verification. Please wait for admin approval.');
      navigate('/pending-approval');
      return;
    }
    setSelectedProduct(product);
    setEnquiryMessage(`Hello, we are interested in your B2B waste product listing "${product.title}". Please quote your best price and supply terms.`);
    setEnquirySuccess(false);
    setShowEnquiryModal(true);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSubmittingEnquiry(true);
    try {
      await apiClient.post('/contact-requests', {
        listingId: selectedProduct._id,
        message: enquiryMessage,
      });
      setEnquirySuccess(true);
      setTimeout(() => {
        setShowEnquiryModal(false);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit B2B inquiry');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  // Map icons dynamically to category list
  const getCategoryIcon = (index) => {
    const icons = [
      <Layers className="h-6 w-6" />,
      <Scissors className="h-6 w-6" />,
      <Store className="h-6 w-6" />,
      <Settings className="h-6 w-6" />,
      <Truck className="h-6 w-6" />,
      <RefreshCw className="h-6 w-6" />
    ];
    return icons[index % icons.length];
  };

  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-3.5 w-3.5 text-slate-200" />);
      }
    }
    return stars;
  };

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col justify-between">
      {/* Header / Navbar - Navy Blue */}
      <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-sky-400 text-xl">T</div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none text-slate-900">TextileWasteHub</span>
              <span className="text-[9px] uppercase tracking-widest text-sky-500 font-bold mt-1">B2B Directory</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {token ? (
              <Link to="/dashboard" className="bg-sky-500 hover:bg-blue-700 text-black px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-brand-primary/20 transition-all duration-150">
                Dashboard Portal
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-950 px-4 py-2 text-sm font-semibold transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all duration-150">
                  List Your Waste Product
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Big Search Bar */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-24 px-6 relative overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full inline-block">
            India's Premium B2B Textile Waste Search Engine
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Justdial for Textile Waste Trading
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Directly connect spinning mills, recyclers, and wholesalers. Real-time lists of fiber, fabric cuttings, yarn wastes, and surplus stocks.
          </p>

          {/* Big Search Bar & Location Filter */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto border border-slate-200">
            <div className="flex items-center w-full px-3 py-2.5 border-b md:border-b-0 md:border-r border-slate-100">
              <Search className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textile waste products (e.g. Cotton clips, Yarn)"
                className="w-full text-slate-800 text-sm focus:outline-none placeholder-slate-400"
              />
            </div>
            <div className="flex items-center w-full md:w-80 px-3 py-2.5">
              <MapPin className="h-5 w-5 text-sky-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City/State (e.g. Surat, Gujarat)"
                className="w-full text-slate-800 text-sm focus:outline-none placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white px-8 py-3.5 rounded-lg text-sm font-bold shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all flex items-center justify-center space-x-2 flex-shrink-0"
            >
              <span>Search Directory</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Main Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/marketplace"
              className="px-8 py-3.5 rounded-lg text-sm font-bold bg-white text-blue-950 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            >
              Find Waste Material
            </Link>
            <Link
              to={token ? "/create-listing" : "/signup"}
              className="px-8 py-3.5 rounded-lg text-sm font-bold bg-brand-primary hover:bg-sky-600 text-white transition-all shadow-md shadow-sky-500/20"
            >
              List Your Waste Product
            </Link>
          </div>
        </div>
      </section>

      {/* Category cards - Specific lists requested by user */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900">Explore Textile Waste Directories</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Browse through active segment categories listing bulk industrial scraps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {predefinedCategories.map((cat, i) => {
            // Check if backend loaded categories match
            const loadedCat = categories.find(c => c.name.toLowerCase().includes(cat.name.toLowerCase().replace(' waste', '')));
            return (
              <div
                key={i}
                onClick={() => handleNicheClick(cat.name, loadedCat?._id)}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200 group cursor-pointer flex items-start space-x-4"
              >
                <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-sky-600 group-hover:bg-sky-50 transition-colors flex-shrink-0">
                  {getCategoryIcon(i)}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-base flex items-center">
                    <span>{cat.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-1 text-sky-500" />
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Latest Uploaded Waste Products */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">Latest Uploaded Waste Products</h2>
              <p className="text-xs text-slate-500 mt-1">Direct listings updated in real-time by registered spinning mills and traders.</p>
            </div>
            <Link to="/marketplace" className="inline-flex items-center space-x-1 text-xs text-sky-600 hover:underline font-bold">
              <span>View Full Directory</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          ) : latestListings.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center text-xs text-slate-400 border border-slate-200">
              No recent listings found. Check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestListings.map((product) => (
                <div key={product._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row group">
                  {/* Photo Thumbnail */}
                  <div className="sm:w-48 bg-slate-100 relative h-48 sm:h-auto overflow-hidden border-r border-slate-100 flex-shrink-0">
                    {product.photoUrls && product.photoUrls[0] ? (
                      <Link to={`/listings/${product._id}`} className="block w-full h-full">
                        <img
                          src={product.photoUrls[0].startsWith('http') ? product.photoUrls[0] : `${BACKEND_BASE}/uploads/${product.photoUrls[0]}`}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    ) : (
                      <Link to={`/listings/${product._id}`} className="block w-full h-full">
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-100 text-xs hover:bg-slate-200 transition-colors">
                          No Photo
                        </div>
                      </Link>
                    )}
                    <span className="absolute top-3 left-3 text-[9px] font-bold text-white bg-navy-950/80 px-2 py-0.5 rounded border border-navy-900 backdrop-blur-sm uppercase">
                      {product.categoryId?.name || 'Waste'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Link to={`/listings/${product._id}`}>
                          <h3 className="font-bold text-sm text-navy-900 line-clamp-1 hover:text-sky-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>
                        <span className="inline-flex items-center space-x-0.5 text-sky-600 text-[9px] font-bold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Verified</span>
                        </span>
                      </div>

                      {/* Ratings stars fallbacks */}
                      <div className="flex items-center space-x-1.5 text-[10px]">
                        <div className="flex items-center">
                          {renderStars(product.ratingAvg || 4.5)}
                        </div>
                        <span className="text-slate-400">({product.reviewCount || 10})</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Quantity Available</p>
                          <p className="font-bold text-navy-900 text-xs">{product.fields?.quantityKg || product.quantity || 'N/A'} KG</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Expected Price</p>
                          <p className="font-bold text-sky-600 text-xs">
                            {product.fields?.priceExpectationPerKg ? `₹${product.fields.priceExpectationPerKg}/KG` : 'Negotiable'}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center space-x-1 pt-1.5">
                        <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{product.fields?.location || product.companyId?.city}, {product.companyId?.state}</span>
                      </div>

                      <p className="text-[9px] text-slate-400">
                        Seller: <span className="font-semibold text-slate-500">{product.companyId?.name}</span>
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="flex space-x-2 pt-4 border-t border-slate-100 mt-4">
                      <Link
                        to={`/listings/${product._id}`}
                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded text-center text-[10px] transition-colors shadow-sm flex items-center justify-center space-x-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={() => handleOpenEnquiry(product)}
                        className="flex-1 bg-brand-primary hover:bg-sky-600 text-white font-bold py-2 rounded text-center text-[10px] transition-colors shadow-sm"
                      >
                        Send Inquiry
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Verified Sellers */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-navy-900">Featured Verified B2B Sellers</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Audit-passed textile mills and processing plants certified for direct secure trading.
          </p>
        </div>

        {featuredSellers.length === 0 ? (
          <div className="bg-slate-50 py-12 rounded-xl text-center text-xs text-slate-400 border border-slate-200">
            Verifying corporate sellers. Check back shortly!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSellers.map((seller) => (
              <div key={seller._id} className="bg-white border border-slate-200 p-6 rounded-xl text-center space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-2 flex flex-col items-center">
                  <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <Building className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{seller.name}</h3>
                  
                  <span className="inline-flex items-center space-x-1 bg-sky-50 text-sky-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-sky-100">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Verified Mill</span>
                  </span>

                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{seller.companyType || 'TEXTILE HUB'}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-center space-x-1 text-xs text-slate-600 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{seller.city}, {seller.state}</span>
                  </div>
                  <button
                    onClick={() => handleNicheClick(seller.name)}
                    className="w-full bg-brand-primary hover:bg-navy-800 text-white font-bold py-2 rounded text-[10px] transition-colors"
                  >
                    View Listings
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Info Callout */}
      <section className="bg-brand-primary text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">Closed Gated B2B Waste Exchange Pipeline</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
            1. Sellers list industrial scraps → 2. Admin audits company tax documentation → 3. Products become visible on the directory → 4. Buyers query & request seller contact access → 5. Sellers approve requests → 6. Direct phone/emails unlock for direct B2B trading.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-navy-900 py-12 px-6 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© 2026 TextileWasteHub. India's B2B Textile Waste Search Directory. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <Link to="/login" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/login" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-white transition-colors">Compliance Rules</Link>
          </div>
        </div>
      </footer>

      {/* Enquiry Modal */}
      {showEnquiryModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-navy-900 flex items-center space-x-1.5">
                <Send className="h-4.5 w-4.5 text-sky-600" />
                <span>Send Enquiry / Ask Best Price</span>
              </h3>
              <button onClick={() => setShowEnquiryModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto" />
                <h4 className="font-bold text-navy-900 text-sm">Enquiry Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Your purchase requirements have been forwarded. Contact info will unlock once the seller accepts the request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <p className="font-bold text-navy-900">{selectedProduct.title}</p>
                  <p className="text-slate-500 mt-1">Seller Mill: {selectedProduct.companyId?.name}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inquiry Details</label>
                  <textarea
                    rows={4}
                    required
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-sky-400 focus:ring-1 focus:ring-sky-200 focus:outline-none rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end space-x-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEnquiry}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 disabled:opacity-50"
                  >
                    {submittingEnquiry ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Submit Direct Inquiry</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
