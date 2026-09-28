import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { flushSync } from "react-dom";
import NationalParkCard from "./components/NationalParkCard";
import AuthScreen from "./components/AuthScreen";
import { nationalParks } from "./data/nationalParks";
import { parkImages } from "./data/parkImages";
import { Button, ButtonRound, InputSelect, InputText, Modal } from "@tomcoggia/ui";
import { Progress } from "./components/ui/progress";
import { Drawer, DrawerContent } from "./components/ui/drawer";
import { Search, X, CircleUser, LocateFixed, AlertCircle, PencilLine, LogIn, LogOut, Route as RouteIcon } from "lucide-react";
import { supabase } from "./utils/supabase/client";
import { UpdateToast } from "./components/UpdateToast";
import NounNationalPark from "./imports/NounNationalPark19895091";
import { useAuth } from "./hooks/useAuth";
import { useParkData } from "./hooks/useParkData";
import { runParkTransition } from "./utils/parkTransition";

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
  // The card the sheet opens from and closes back into. Kept after close, so
  // exactly one card at a time carries the transition hooks.
  const [transitionParkId, setTransitionParkId] = useState<string | null>(null);

  const openPark = useCallback((parkId: string | null) => {
    // Name the card before the transition's "before" snapshot is taken.
    if (parkId) flushSync(() => setTransitionParkId(parkId));
    runParkTransition(() => setOpenParkId(parkId));
  }, []);
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
      <div className="min-h-screen bg-[color-mix(in_srgb,var(--ui-brand)_8%,white)] flex items-center justify-center">
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
            <div className="flex items-start justify-between gap-2">
              {/* The logo's artwork is fixed-size, so on narrow phones it is
                  zoomed (which, unlike scale, also shrinks its layout box)
                  to leave room for the header icons. */}
              <div className="h-[64px] w-fit min-w-0 max-[400px]:[zoom:0.75]">
                <NounNationalPark />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ButtonRound
                  variant="ghost"
                  size="lg"
                  icon={<RouteIcon />}
                  onClick={() => setRouteFinderOpen(true)}
                  aria-label="Find parks along a route"
                  title="Parks along your route"
                />
                <ButtonRound
                  variant="ghost"
                  size="lg"
                  icon={<CircleUser />}
                  onClick={openUserMenu}
                  // Amber flags guest mode (data is device-local only), matching the guest banner.
                  className={isGuest ? "text-amber-500 hover:text-[var(--ui-text-on-action)]" : undefined}
                  aria-label="Account"
                />
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
                    openPark(parkId);
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
                    <ButtonRound size="lg" icon={<X />} onClick={() => setUserMenuOpen(false)} aria-label="Close" />
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
                          <ButtonRound
                            variant="ghost"
                            size="md"
                            icon={<PencilLine />}
                            onClick={() => setEditingUsername(true)}
                            className="flex-shrink-0"
                            aria-label="Edit username"
                          />
                          {editingUsername ? (
                            <InputText
                              label="Username"
                              value={usernameValue}
                              onChange={(e) => setUsernameValue(e.target.value)}
                              onBlur={handleSaveUsername}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") setEditingUsername(false); }}
                              autoFocus
                              className="w-48"
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
                  <Button variant="tertiary" size="xl" icon={<LocateFixed />} onClick={handleFindNearest} loading={locating}>
                    Show nearest park
                  </Button>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-4 w-full">
                    <Button size="xl" onClick={() => setUserMenuOpen(false)} className="w-full">
                      {user ? "Stay signed in" : "Continue as guest"}
                    </Button>
                    {isGuest ? (
                      <Button
                        variant="ghost"
                        size="xl"
                        icon={<LogIn />}
                        onClick={() => { setUserMenuOpen(false); goToAuthScreen(); }}
                        className="w-full"
                      >
                        Sign in
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xl"
                        icon={<LogOut />}
                        onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                        className="w-full"
                      >
                        Sign out
                      </Button>
                    )}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Nearest park result dialog */}
            <Modal
              open={nearestDialogOpen && nearestPark != null}
              onClose={() => setNearestDialogOpen(false)}
              title={nearestPark?.park.name ?? "Nearest National Park"}
              actions={
                <>
                  <Button variant="tertiary" size="md" onClick={() => setNearestDialogOpen(false)}>
                    Close
                  </Button>
                  <Button
                    size="md"
                    onClick={() => {
                      if (!nearestPark) return;
                      setFilter("all");
                      setSearchQuery("");
                      setNearestDialogOpen(false);
                      setUserMenuOpen(false);
                      openPark(nearestPark.park.id);
                    }}
                  >
                    View Park
                  </Button>
                </>
              }
            >
              {nearestPark && (
                <div className="flex flex-col gap-3">
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${nearestPark.park.lat},${nearestPark.park.lng}&zoom=7&size=640x280&scale=2&markers=color:0x22c55e%7C${nearestPark.park.lat},${nearestPark.park.lng}&key=${GOOGLE_MAPS_API_KEY}`}
                    alt={`Map showing ${nearestPark.park.name}`}
                    className="w-full h-[140px] object-cover rounded-[4px]"
                  />
                  <p>
                    Nearest national park · {nearestPark.park.state} ·{" "}
                    <span className="text-ui-brand font-semibold">
                      {nearestPark.distanceMiles.toLocaleString()} miles away
                    </span>
                  </p>
                </div>
              )}
            </Modal>

            {/* Search and filters: search gets its own row on phones, where
                sharing one with both selects left it a few characters wide. */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1 min-w-0">
                <InputText
                  ref={searchInputRef}
                  label="Search parks"
                  hideLabel
                  icon={<Search />}
                  autoFocus
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "a") e.currentTarget.select(); }}
                />
                {searchQuery && (
                  <ButtonRound
                    variant="ghost"
                    size="sm"
                    icon={<X />}
                    onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                    className="absolute right-1 top-1"
                    aria-label="Clear search"
                  />
                )}
              </div>
              <div className="flex gap-2">
              <InputSelect
                label="Sort parks"
                hideLabel
                value={sortOrder}
                onChange={(e) => {
                  const value = e.target.value as SortType;
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
                }}
                className="flex-1 sm:flex-none sm:w-[120px]"
              >
                <option value="alphabetical">A to Z</option>
                <option value="state">By State</option>
                <option value="distance">By Distance</option>
              </InputSelect>
              <InputSelect
                label="Filter parks"
                hideLabel
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="flex-1 sm:flex-none sm:w-[110px]"
              >
                <option value="all">All Parks</option>
                <option value="visited">Visited</option>
                <option value="to-go">To go</option>
              </InputSelect>
              </div>
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
                    {green && <span className="text-ui-brand font-medium">{green}</span>}
                    {after && <span className="text-[#9198A6] font-normal">{after}</span>}
                  </div>
                  <Progress value={(visitedCount / totalCount) * 100} className="h-2 mt-2" indicatorClassName="bg-ui-brand" />
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
            <ButtonRound
              variant="ghost"
              size="sm"
              icon={<X />}
              onClick={clearSaveError}
              className="flex-shrink-0"
              aria-label="Dismiss"
            />
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
                onOpenChange={(open) => openPark(open ? park.id : null)}
                isTransitionTarget={transitionParkId === park.id}
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
