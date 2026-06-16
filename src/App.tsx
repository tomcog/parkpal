import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import NationalParkCard from "./components/NationalParkCard";
import AuthScreen from "./components/AuthScreen";
import { nationalParks } from "./data/nationalParks";
import { parkImages } from "./data/parkImages";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { Drawer, DrawerContent } from "./components/ui/drawer";
import { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover";
import { Search, X, CircleUser, LocateFixed, Loader2, AlertCircle, PencilLine, LogIn, LogOut, Route as RouteIcon, Check, ChevronDown } from "lucide-react";
import { supabase } from "./utils/supabase/client";
import { ButtonStandard } from "./components/ButtonStandard";
import { UpdateToast } from "./components/UpdateToast";
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
      <UpdateToast />
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
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "a") e.currentTarget.select(); }}
                  className="w-full h-[44px] pl-[42px] pr-3 bg-[#f3f3f5] border border-transparent rounded-[4px] text-[16px] text-[#0a0a0a] placeholder:text-[#99A1AF] focus:outline-none focus:border-brand-accent focus:bg-white transition-colors"
                />
              </div>
              {(() => {
                const sortOptions: { value: SortType; label: string; triggerLabel: string }[] = [
                  { value: "alphabetical", label: "A to Z", triggerLabel: "A to Z" },
                  { value: "state", label: "By State", triggerLabel: "by State" },
                  { value: "distance", label: "By Distance", triggerLabel: "by Distance" },
                ];
                const selectSort = (value: SortType) => {
                  setSortOrder(value);
                  if (value === "distance" && !userCoords && navigator.geolocation) {
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
                };
                const activeTriggerLabel = sortOptions.find((o) => o.value === sortOrder)?.triggerLabel;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <ButtonStandard theme="white" className="flex-shrink-0" title="Sort parks">
                        {activeTriggerLabel}
                        <ChevronDown className="w-4 h-4 text-[#99A1AF] flex-shrink-0" />
                      </ButtonStandard>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-fit min-w-[130px] p-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => selectSort(option.value)}
                          className="flex w-full items-center gap-2 rounded-[4px] px-2 py-2 text-[14px] text-[#0a0a0a] hover:bg-[#f3f3f5] transition-colors"
                        >
                          <span className="flex-1 text-left">{option.label}</span>
                          {sortOrder === option.value && <Check className="w-4 h-4 text-brand-accent flex-shrink-0" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                );
              })()}
              {(() => {
                const filterOptions: { value: FilterType; label: string }[] = [
                  { value: "all", label: "All Parks" },
                  { value: "visited", label: "Visited" },
                  { value: "to-go", label: "To go" },
                ];
                const activeLabel = filterOptions.find((o) => o.value === filter)?.label;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <ButtonStandard theme="white" className="w-[110px] flex-shrink-0 justify-between" title="Filter parks">
                        {activeLabel}
                        <ChevronDown className="w-4 h-4 text-[#99A1AF] flex-shrink-0" />
                      </ButtonStandard>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[160px] p-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFilter(option.value)}
                          className="flex w-full items-center gap-2 rounded-[4px] px-2 py-2 text-[14px] text-[#0a0a0a] hover:bg-[#f3f3f5] transition-colors"
                        >
                          <span className="flex-1 text-left">{option.label}</span>
                          {filter === option.value && <Check className="w-4 h-4 text-brand-accent flex-shrink-0" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                );
              })()}
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
