import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import NationalParkCard from "./components/NationalParkCard";
import AuthScreen from "./components/AuthScreen";
import { nationalParks } from "./data/nationalParks";
import { parkImages } from "./data/parkImages";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { Drawer, DrawerContent } from "./components/ui/drawer";
import { Search, X, Map as MapIcon, CircleUser, LocateFixed, Loader2, AlertCircle, PencilLine, LogIn, LogOut, Route as RouteIcon } from "lucide-react";
import { supabase } from "./utils/supabase/client";
import { ButtonStandard } from "./components/ButtonStandard";
import NounNationalPark from "./imports/NounNationalPark19895091";
import { useAuth } from "./hooks/useAuth";
import { useParkData } from "./hooks/useParkData";

const RouteFinder = lazy(() => import("./components/RouteFinder"));

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


type FilterType = "all" | "visited" | "to-go";
type SortType = "alphabetical" | "state" | "distance";

export default function App() {
  const { authState, user, isGuest, continueAsGuest, signOut, goToAuthScreen } = useAuth();
  const {
    parkData,
    headerImageOverrides,
    dataLoading,
    saveError,
    toggleVisited,
    updateParkNote,
    updateParkDate,
    updateParkPhoto,
    updateHeaderImage,
    resetParkData,
    clearSaveError,
  } = useParkData({ active: authState === "app", user, isGuest });

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll-aware header: hides naturally as user scrolls down, slides back in
  // immediately when user scrolls up. Same pattern as NationalParkCard.
  const headerRef = useRef<HTMLElement>(null);
  const [headerTranslateY, setHeaderTranslateY] = useState(0);
  const [headerTransition, setHeaderTransition] = useState(false);
  const lastScrollTopRef = useRef(0);
  const scrollingUpRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const wasScrollingUp = scrollingUpRef.current;
      scrollingUpRef.current = scrollTop < lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;

      if (scrollTop <= 0) {
        // At top — fully visible, no transition needed.
        setHeaderTranslateY(0);
        setHeaderTransition(false);
      } else if (scrollingUpRef.current) {
        // Scrolling up — pop header in with a smooth transition.
        if (!wasScrollingUp) setHeaderTransition(true);
        setHeaderTranslateY(0);
      } else {
        // Scrolling down — track scroll 1:1 to feel like the header is part of the page.
        if (wasScrollingUp) setHeaderTransition(false);
        setHeaderTranslateY(-Math.min(scrollTop, headerHeight));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [sortOrder, setSortOrder] = useState<SortType>("alphabetical");
  const [openParkId, setOpenParkId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestPark, setNearestPark] = useState<{ park: (typeof nationalParks)[0]; distanceMiles: number } | null>(null);
  const [nearestDialogOpen, setNearestDialogOpen] = useState(false);
  const [routeFinderOpen, setRouteFinderOpen] = useState(false);

  // ── Filtered/sorted park list ─────────────────────────────────────────────
  const filteredParks = useMemo(() => {
    return nationalParks
      .filter((park) => {
        const isVisited = parkData.get(park.id)?.visited || false;
        if (filter === "visited" && !isVisited) return false;
        if (filter === "to-go" && isVisited) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const text = [park.name, park.state, park.description, ...park.facts, ...park.trivia].join(" ").toLowerCase();
          return text.includes(query);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "distance" && userCoords) {
          const da = haversineDistanceMiles(userCoords.lat, userCoords.lng, a.lat, a.lng);
          const db = haversineDistanceMiles(userCoords.lat, userCoords.lng, b.lat, b.lng);
          return da - db;
        }
        if (sortOrder === "alphabetical" || (sortOrder === "distance" && !userCoords)) return a.name.localeCompare(b.name);
        const sc = a.state.localeCompare(b.state);
        return sc !== 0 ? sc : a.name.localeCompare(b.name);
      });
  }, [parkData, filter, searchQuery, sortOrder, userCoords]);

  const openUserMenu = () => {
    if (user) {
      setUsernameValue(user.user_metadata?.username || user.email?.split("@")[0] || "");
      setEditingUsername(false);
    }
    setUserMenuOpen(true);
  };

  const handleSaveUsername = async () => {
    setEditingUsername(false);
    if (!user || !usernameValue.trim()) return;
    await supabase.auth.updateUser({ data: { username: usernameValue.trim() } });
  };

  const handleSignOut = async () => {
    resetParkData();
    await signOut();
  };

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setUserCoords({ lat: latitude, lng: longitude });
        let nearest = nationalParks[0];
        let minDist = haversineDistanceMiles(latitude, longitude, nearest.lat, nearest.lng);
        for (const park of nationalParks.slice(1)) {
          const d = haversineDistanceMiles(latitude, longitude, park.lat, park.lng);
          if (d < minDist) { minDist = d; nearest = park; }
        }
        setNearestPark({ park: nearest, distanceMiles: Math.round(minDist) });
        setNearestDialogOpen(true);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access was denied. Please allow location access in your browser settings and try again.");
        } else if (err.code === err.TIMEOUT) {
          alert("Location request timed out. Please try again.");
        } else {
          alert("Unable to determine your location. Please try again.");
        }
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  // ── Render loading ────────────────────────────────────────────────────────
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-[#f0ffed] flex items-center justify-center">
        <div className="h-[64px] w-fit opacity-70 animate-pulse">
          <NounNationalPark />
        </div>
      </div>
    );
  }

  if (authState === "auth-screen") {
    return <AuthScreen onContinueAsGuest={continueAsGuest} />;
  }

  // ── Main app ──────────────────────────────────────────────────────────────

  const visitedCount = Array.from(parkData.values()).filter(d => d.visited).length;
  const totalCount = nationalParks.length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header
        ref={headerRef}
        className="bg-white border-b border-gray-200 sticky top-0 z-20"
        style={{
          transform: `translateY(${headerTranslateY}px)`,
          transition: headerTransition ? "transform 300ms ease-out" : "none",
        }}
      >
        <div className="max-w-[1270px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">

            {/* Logo + user icon */}
            <div className="flex items-start justify-between">
              <div className="h-[64px] w-fit">
                <NounNationalPark />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRouteFinderOpen(true)}
                  className="p-1 text-gray-400 hover:text-brand-accent transition-colors"
                  aria-label="Find parks along a route"
                  title="Parks along your route"
                >
                  <RouteIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={openUserMenu}
                  className={`p-1 transition-colors ${isGuest ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-brand-accent"}`}
                  aria-label="Account"
                >
                  <CircleUser className="w-6 h-6" />
                </button>
              </div>
            </div>

            {routeFinderOpen && (
              <Suspense fallback={null}>
                <RouteFinder
                  open={routeFinderOpen}
                  onOpenChange={setRouteFinderOpen}
                  apiKey={GOOGLE_MAPS_API_KEY}
                  userId={user?.id ?? null}
                  onSelectPark={(parkId) => {
                    setFilter("all");
                    setSearchQuery("");
                    setOpenParkId(parkId);
                  }}
                />
              </Suspense>
            )}

            {/* User profile page */}
            <Drawer open={userMenuOpen} onOpenChange={setUserMenuOpen} modal={false}>
              <DrawerContent className="!h-[100vh] !max-h-[100vh] !mt-0 !rounded-none !border-none !p-0 [&>div:first-child]:hidden">
                <div className="flex flex-col gap-8 items-center p-8 h-full overflow-y-auto bg-white">
                  <p className="sr-only">User Profile</p>

                  {/* Close button */}
                  <div className="flex items-start w-full">
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors opacity-50 hover:opacity-100"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Logo */}
                  <div className="h-[64px] w-fit">
                    <NounNationalPark />
                  </div>

                  {/* User info */}
                  <div className="flex flex-col gap-4 items-center w-full">
                    {user ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingUsername(true)}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            aria-label="Edit username"
                          >
                            <PencilLine className="w-5 h-5" />
                          </button>
                          {editingUsername ? (
                            <input
                              value={usernameValue}
                              onChange={(e) => setUsernameValue(e.target.value)}
                              onBlur={handleSaveUsername}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") setEditingUsername(false); }}
                              autoFocus
                              className="text-2xl font-semibold text-[#313730] tracking-tight text-center border-b-2 border-brand-accent focus:outline-none bg-transparent w-48"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingUsername(true)}
                              className="text-2xl font-semibold text-[#313730] tracking-tight hover:opacity-70 transition-opacity"
                            >
                              {user.user_metadata?.username || user.email?.split("@")[0]}
                            </button>
                          )}
                        </div>
                        <p className="text-base font-medium text-gray-500 text-center">{user.email}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-semibold text-[#313730] tracking-tight">Guest</p>
                        <p className="text-base font-medium text-gray-500 text-center">Browsing without an account</p>
                      </>
                    )}
                  </div>

                  {/* Show nearest park */}
                  <button
                    onClick={handleFindNearest}
                    disabled={locating}
                    className="flex items-center justify-center gap-2 text-brand-accent font-semibold text-xl tracking-tight hover:opacity-70 transition-opacity disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="w-6 h-6 animate-spin" /> : <LocateFixed className="w-6 h-6" />}
                    Show nearest park
                  </button>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-4 w-full">
                    <Button
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full h-11 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-[4px] text-lg font-semibold"
                    >
                      {user ? "Stay signed in" : "Continue as guest"}
                    </Button>
                    {isGuest ? (
                      <Button
                        variant="outline"
                        onClick={() => { setUserMenuOpen(false); goToAuthScreen(); }}
                        className="w-full h-11 rounded-[4px] text-lg font-semibold border-gray-400 gap-2"
                      >
                        <LogIn className="w-5 h-5 text-gray-500" />
                        Sign in
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                        className="w-full h-11 rounded-[4px] text-lg font-semibold border-gray-400 gap-2"
                      >
                        <LogOut className="w-5 h-5 text-gray-500" />
                        Sign out
                      </Button>
                    )}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Nearest park result dialog */}
            <Dialog open={nearestDialogOpen} onOpenChange={setNearestDialogOpen}>
              <DialogContent className="max-w-[320px] p-0 overflow-hidden [&>button]:hidden">
                <DialogTitle className="sr-only">Nearest National Park</DialogTitle>
                <DialogDescription className="sr-only">The nearest national park to your current location</DialogDescription>
                {nearestPark && (
                  <>
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${nearestPark.park.lat},${nearestPark.park.lng}&zoom=7&size=640x280&scale=2&markers=color:0x22c55e%7C${nearestPark.park.lat},${nearestPark.park.lng}&key=${GOOGLE_MAPS_API_KEY}`}
                      alt={`Map showing ${nearestPark.park.name}`}
                      className="w-full h-[140px] object-cover"
                    />
                    <div className="p-5 flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Nearest National Park</p>
                        <p className="font-bold text-[18px] text-black leading-tight">{nearestPark.park.name}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{nearestPark.park.state}</p>
                      </div>
                      <p className="text-brand-accent font-semibold">
                        {nearestPark.distanceMiles.toLocaleString()} miles away
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setFilter("all");
                            setSearchQuery("");
                            setNearestDialogOpen(false);
                            setUserMenuOpen(false);
                            setOpenParkId(nearestPark.park.id);
                          }}
                          className="flex-1 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-[4px]"
                        >
                          View Park
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setNearestDialogOpen(false)}
                          className="rounded-[4px]"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Search and filters */}
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                {searchQuery ? (
                  <button onClick={() => setSearchQuery("")} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#717182] hover:text-gray-600 cursor-pointer" aria-label="Clear search">
                    <X className="w-6 h-6" />
                  </button>
                ) : (
                  <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-6 h-6 text-[#717182] pointer-events-none" />
                )}
                <input
                  ref={searchInputRef}
                  autoFocus
                  placeholder="Search national parks"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "a") e.currentTarget.select(); }}
                  className="w-full h-[44px] pl-[42px] pr-3 bg-[#f3f3f5] border border-transparent rounded-[4px] text-[16px] text-[#0a0a0a] placeholder:text-[#99A1AF] focus:outline-none focus:border-brand-accent focus:bg-white transition-colors"
                />
              </div>
              <ButtonStandard
                onClick={() => {
                  if (sortOrder === "alphabetical") {
                    setSortOrder("state");
                  } else if (sortOrder === "state") {
                    setSortOrder("distance");
                    if (!userCoords && navigator.geolocation) {
                      setLocating(true);
                      navigator.geolocation.getCurrentPosition(
                        ({ coords: { latitude, longitude } }) => {
                          setUserCoords({ lat: latitude, lng: longitude });
                          setLocating(false);
                        },
                        () => setLocating(false),
                        { enableHighAccuracy: false, timeout: 10000 }
                      );
                    }
                  } else {
                    setSortOrder("alphabetical");
                  }
                }}
                theme="white"
                icon={sortOrder === "state" ? (
                  <MapIcon className="w-5 h-5 text-[#99A1AF]" />
                ) : sortOrder === "distance" ? (
                  <LocateFixed className="w-5 h-5 text-[#99A1AF]" />
                ) : (
                  <svg viewBox="0 0 16.167 15.334" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                    <path d="M15.3104 8.34473C15.6399 8.39267 15.9282 8.60289 16.0722 8.91016C16.2364 9.26141 16.1827 9.6767 15.9345 9.97461L13.1356 13.334H15.1669C15.7189 13.3343 16.1669 13.7819 16.1669 14.334C16.1667 14.8859 15.7188 15.3337 15.1669 15.334H10.9999C10.612 15.334 10.2593 15.109 10.0946 14.7578C9.93014 14.4065 9.98304 13.9914 10.2313 13.6934L13.0311 10.334H10.9999C10.4477 10.334 10.0001 9.88612 9.9999 9.33398C9.9999 8.7817 10.4476 8.33398 10.9999 8.33398H15.1669L15.3104 8.34473ZM4.3329 0C4.88508 0 5.33273 0.447865 5.3329 1V11.9189L6.95986 10.293C7.3504 9.9029 7.98354 9.90264 8.37392 10.293C8.76414 10.6834 8.76396 11.3165 8.37392 11.707L5.03994 15.04C5.01612 15.0639 4.99085 15.0861 4.96474 15.1074C4.92768 15.1378 4.88859 15.1643 4.84853 15.1885C4.7775 15.2314 4.70114 15.2657 4.62001 15.29C4.61061 15.2929 4.60116 15.2953 4.59169 15.2979C4.57004 15.3036 4.54847 15.3101 4.52626 15.3145C4.39735 15.3398 4.26447 15.3393 4.13564 15.3135C4.12344 15.311 4.11154 15.3076 4.09951 15.3047C4.07886 15.2998 4.05834 15.2944 4.03798 15.2881C4.02475 15.284 4.01191 15.279 3.99892 15.2744C3.98388 15.2691 3.96882 15.2639 3.954 15.2578C3.93004 15.248 3.90667 15.2372 3.88369 15.2256C3.87758 15.2225 3.87119 15.22 3.86513 15.2168C3.85391 15.2108 3.84289 15.2046 3.83193 15.1982C3.78624 15.1717 3.742 15.1418 3.70009 15.1074C3.6742 15.0862 3.6495 15.0637 3.62587 15.04L0.292865 11.707C-0.0976031 11.3165 -0.0976404 10.6835 0.292865 10.293C0.683393 9.90273 1.31649 9.90259 1.70693 10.293L3.3329 11.9189V1C3.33308 0.447902 3.78078 6.05239e-05 4.3329 0ZM13.0829 0C13.9006 5.66018e-05 14.6854 0.325168 15.2636 0.90332C15.8416 1.48139 16.1667 2.26557 16.1669 3.08301V6C16.1669 6.5521 15.7189 6.99971 15.1669 7C14.6146 7 14.1669 6.55228 14.1669 6V5.33398H11.9999V6C11.9999 6.55221 11.5521 6.99988 10.9999 7C10.4476 7 9.9999 6.55228 9.9999 6V3.08301C10.0001 2.26549 10.3251 1.4814 10.9032 0.90332C11.4814 0.325328 12.2654 8.61697e-05 13.0829 0ZM13.0829 2C12.7958 2.00009 12.5203 2.11446 12.3173 2.31738C12.1143 2.52039 12.0001 2.79592 11.9999 3.08301V3.33398H14.1669V3.08301C14.1667 2.796 14.0524 2.52038 13.8495 2.31738C13.6464 2.1143 13.3701 2.00006 13.0829 2Z" fill="#99A1AF"/>
                  </svg>
                )}
                className="w-[44px] px-0 flex-shrink-0"
                title={sortOrder === "alphabetical" ? "Sort by State" : sortOrder === "state" ? "Sort by Distance" : "Sort A-Z"}
              />
              <ButtonStandard
                onClick={() => { if (filter === "all") setFilter("visited"); else if (filter === "visited") setFilter("to-go"); else setFilter("all"); }}
                theme="white"
                icon={
                  filter === "all" ? (
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none">
                      <rect x="8" y="3" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <rect x="8" y="9" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <rect x="8" y="15" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <path d="M1.5 2L4.5 4L1.5 6" stroke="#30BF17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : filter === "visited" ? (
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none">
                      <rect x="8" y="3" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <rect x="8" y="9" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <rect x="8" y="15" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <path d="M1.5 8L4.5 10L1.5 12" stroke="#30BF17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none">
                      <rect x="8" y="3" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <rect x="8" y="9" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <rect x="8" y="15" width="10.5" height="2" rx="1" fill="#99A1AF"/>
                      <path d="M1.5 14L4.5 16L1.5 18" stroke="#30BF17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                }
                className="w-[110px] flex-shrink-0 justify-start"
              >
                {filter === "all" ? "All Parks" : filter === "visited" ? "Visited" : "To go"}
              </ButtonStandard>
            </div>

            {/* Stats */}
            {(() => {
              const sortLabel = sortOrder === "state" ? "by state" : sortOrder === "distance" ? "by distance" : "alphabetically";
              let before = "";
              let green = "";
              let after = "";
              if (dataLoading) {
                before = "Loading...";
              } else if (filter === "visited") {
                before = `Showing ${visitedCount} of ${totalCount} parks`;
                green = "visited";
                after = sortLabel;
              } else if (filter === "to-go") {
                before = `Showing ${totalCount - visitedCount} of ${totalCount} parks`;
                green = "to go";
                after = sortLabel;
              } else {
                before = "Showing";
                green = searchQuery ? `${filteredParks.length} of ${totalCount}` : "all";
                after = `${searchQuery ? "" : `${totalCount} `}parks ${sortLabel}`;
              }
              return (
                <div>
                  <div className="flex gap-[4px] leading-[normal] flex-wrap">
                    <span className="text-[#9198A6] font-normal">{before}</span>
                    {green && <span className="text-brand-accent font-medium">{green}</span>}
                    {after && <span className="text-[#9198A6] font-normal">{after}</span>}
                  </div>
                  <Progress value={(visitedCount / totalCount) * 100} className="h-2 mt-2" indicatorClassName="bg-brand-accent" />
                </div>
              );
            })()}
          </div>
        </div>
      </header>

      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-[1270px] mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Your data could not be saved</p>
              <p className="text-xs text-red-600 mt-0.5 font-mono break-all">{saveError}</p>
            </div>
            <button
              onClick={clearSaveError}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isGuest && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-[1270px] mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800">
              You're browsing as a <span className="font-semibold">guest</span> — your data is saved locally on this device only.
            </p>
            <button
              onClick={goToAuthScreen}
              className="flex-shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      <main className="max-w-[1270px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParks.map((park) => (
            <div key={park.id} id={`park-card-${park.id}`} className="h-full">
              <NationalParkCard
                id={park.id}
                name={park.name}
                state={park.state}
                established={park.established}
                description={park.description}
                imageUrl={headerImageOverrides.get(park.id) ?? parkImages[park.id]}
                imageQuery={park.imageQuery}
                isVisited={parkData.get(park.id)?.visited || false}
                note={parkData.get(park.id)?.note || ""}
                visitedDate={parkData.get(park.id)?.visitedDate}
                photoUrl={parkData.get(park.id)?.photoUrl}
                userId={user?.id ?? null}
                onToggleVisited={toggleVisited}
                onUpdateNote={updateParkNote}
                onUpdateDate={updateParkDate}
                onUpdatePhoto={updateParkPhoto}
                onUpdateHeaderImage={updateHeaderImage}
                facts={park.facts}
                trivia={park.trivia}
                isOpen={openParkId === park.id}
                onOpenChange={(open) => setOpenParkId(open ? park.id : null)}
              />
            </div>
          ))}
        </div>
        {filteredParks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No parks found matching your filter.</p>
          </div>
        )}
      </main>
    </div>
  );
}
