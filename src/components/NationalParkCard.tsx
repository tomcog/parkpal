import { MapPin, X, Calendar, Camera, Loader2, SwitchCamera, RefreshCw, ImagePlus } from "lucide-react";
import { memo, useId, useState, useRef, lazy, Suspense, type CSSProperties } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Button, ButtonRound, Card, Checkbox, InputTextarea, Modal, Tag } from "@tomcoggia/ui";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { parkAbbreviations } from "../data/parkAbbreviations";
import { stateAbbreviations } from "../data/stateAbbreviations";
import { parkThumbnails } from "../data/parkThumbnails";
import { format } from "date-fns";
import { supabase } from "../utils/supabase/client";
import { resizeUnsplashUrl } from "../utils/imageSize";

// The VISITED tag is brand chrome on a photo, so it takes the brand fill
// through Tag's own hooks rather than its default raised/muted pairing.
const visitedTagStyle = {
  "--ui-tag-bg": "var(--ui-brand)",
  "--ui-tag-text": "var(--ui-text-on-brand)",
  "--ui-tag-text-hover": "var(--ui-text-on-brand)",
} as CSSProperties;

const CalendarComponent = lazy(() => import("./ui/calendar").then((m) => ({ default: m.Calendar })));

interface NationalParkCardProps {
  id: string;
  name: string;
  state: string;
  established: string;
  description: string;
  imageUrl: string;
  imageQuery: string;
  isVisited: boolean;
  note: string;
  visitedDate?: string;
  photoUrl?: string;
  userId: string | null;
  onToggleVisited: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onUpdateDate: (id: string, date: string) => void;
  onUpdatePhoto: (id: string, url: string) => void;
  onUpdateHeaderImage: (id: string, url: string) => void;
  facts: string[];
  trivia: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** This card is the one being opened or closed. Only it carries the
      park-vt-* hooks the park sheet transition names (see index.css), since
      every named element is lifted above the page during a transition. */
  isTransitionTarget: boolean;
}

function NationalParkCardInner({
  id,
  name,
  state,
  established,
  description,
  imageUrl,
  imageQuery,
  isVisited,
  note,
  visitedDate,
  photoUrl,
  userId,
  onToggleVisited,
  onUpdateNote,
  onUpdateDate,
  onUpdatePhoto,
  onUpdateHeaderImage,
  facts,
  trivia,
  isOpen,
  onOpenChange,
  isTransitionTarget,
}: NationalParkCardProps) {
  // While the sheet is open the hooks move to it, so each name exists exactly
  // once in both the before and after snapshots.
  const cardIsNamed = isTransitionTarget && !isOpen;
  const thumbnailUrls = parkThumbnails[id] || [imageUrl, imageUrl, imageUrl, imageUrl];

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const photoPickerTitleId = useId();
  const [pickerPhotos, setPickerPhotos] = useState<string[]>(thumbnailUrls);
  const [isFetchingPickerPhotos, setIsFetchingPickerPhotos] = useState(false);
  const [pickerPhotoPool, setPickerPhotoPool] = useState<string[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(thumbnailUrls);
  const [isFetchingGalleryPhotos, setIsFetchingGalleryPhotos] = useState(false);
  const [galleryPhotoPool, setGalleryPhotoPool] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visitPhotoInputRef = useRef<HTMLInputElement>(null);

  const pickRandom4 = (pool: string[]) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(4, shuffled.length));
  };

  const fetchUnsplashPool = async (): Promise<string[]> => {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return [];
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(imageQuery)}&per_page=20&page=1&orientation=landscape&client_id=${accessKey}`
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return (data.results ?? []).map((r: { urls: { regular: string } }) => r.urls.regular);
  };

  const handleRefreshPickerPhotos = async () => {
    if (isFetchingPickerPhotos) return;

    if (pickerPhotoPool.length > 0) {
      setPickerPhotos(pickRandom4(pickerPhotoPool));
      return;
    }

    setIsFetchingPickerPhotos(true);
    try {
      const urls = await fetchUnsplashPool();
      if (urls.length > 0) {
        setPickerPhotoPool(urls);
        setPickerPhotos(pickRandom4(urls));
      }
    } catch { /* ignore */ } finally {
      setIsFetchingPickerPhotos(false);
    }
  };

  const handleRefreshGalleryPhotos = async () => {
    if (isFetchingGalleryPhotos) return;

    if (galleryPhotoPool.length > 0) {
      setGalleryPhotos(pickRandom4(galleryPhotoPool));
      return;
    }

    setIsFetchingGalleryPhotos(true);
    try {
      const urls = await fetchUnsplashPool();
      if (urls.length > 0) {
        setGalleryPhotoPool(urls);
        setGalleryPhotos(pickRandom4(urls));
      }
    } catch { /* ignore */ } finally {
      setIsFetchingGalleryPhotos(false);
    }
  };

  const deletePhoto = async (url: string) => {
    if (!userId) return;
    // Extract storage path from URL
    const match = url.match(/park-photos\/(.+)$/);
    if (!match) return;
    await supabase.storage.from("park-photos").remove([match[1]]);
  };

  const handleDeletePhoto = async () => {
    if (!photoUrl) return;
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    setIsUploading(true);
    await deletePhoto(photoUrl);
    onUpdatePhoto(id, "");
    setIsUploading(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset input so the same file can be re-selected
    event.target.value = "";
    if (!file) return;

    if (!userId) {
      alert("Sign in to upload photos");
      return;
    }

    setIsUploading(true);

    try {
      // Delete previous header photo if it was a user upload (Supabase storage URL)
      await deletePhoto(imageUrl);

      // Resize image
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );
      if (!blob) throw new Error("Failed to process image");

      const path = `${userId}/${id}/header-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("park-photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("park-photos").getPublicUrl(path);
      onUpdateHeaderImage(id, data.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Failed to upload photo: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVisitPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!userId) {
      alert("Sign in to upload photos");
      return;
    }

    setIsUploading(true);

    try {
      if (photoUrl) await deletePhoto(photoUrl);

      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );
      if (!blob) throw new Error("Failed to process image");

      const path = `${userId}/${id}/visit-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("park-photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("park-photos").getPublicUrl(path);
      onUpdatePhoto(id, data.publicUrl);
    } catch (err) {
      console.error("Visit photo upload error:", err);
      alert(`Failed to upload photo: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <SheetPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
        <SheetPrimitive.Trigger asChild>
          <Card
            variant="float1"
            className={`overflow-clip relative cursor-pointer transition-shadow hover:[box-shadow:var(--ui-shadow-float-2)] flex flex-col h-full ${cardIsNamed ? "park-vt-card" : ""}`}
            data-name="card.national_park"
          >
            <div className="relative h-[150px] w-full">
              <ImageWithFallback
                alt={name}
                className={`absolute inset-0 max-w-none object-cover pointer-events-none size-full ${cardIsNamed ? "park-vt-image" : ""}`}
                src={resizeUnsplashUrl(imageUrl, 480)}
                loading="lazy"
                decoding="async"
              />
              {isVisited && (
                <Tag className="absolute top-[12px] right-[12px]" style={visitedTagStyle}>
                  VISITED
                </Tag>
              )}
            </div>
            <div className="flex flex-col gap-2 p-4 flex-1">
              <p className="leading-[normal] not-italic text-black font-bold text-[18px]">{name}</p>
              <p className="leading-[normal] not-italic opacity-[0.5] text-black">{state}</p>
              <p className="leading-[1.3] not-italic text-black text-[14px]">{description}</p>
            </div>
          </Card>
        </SheetPrimitive.Trigger>

        <SheetPrimitive.Portal>
        {/* Opened and closed as a View Transition (utils/parkTransition.ts);
            the animation is in index.css under "Park sheet transition". */}
        <SheetPrimitive.Overlay className="park-overlay" />
        <SheetPrimitive.Content
          className="park-sheet park-vt-card flex flex-col"
          aria-describedby={undefined}
          // Escape inside the photo picker belongs to the picker, not the sheet.
          onEscapeKeyDown={(e) => { if (photoPickerOpen) e.preventDefault(); }}
          // Focus the sheet itself on open, not its first button. Radix would
          // otherwise focus Close, and its focus ring made it look larger than
          // the other hero buttons, with a double ring. Tab still reaches Close
          // first and Escape still closes.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus({ preventScroll: true });
          }}
        >
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <input type="file" ref={visitPhotoInputRef} onChange={handleVisitPhotoUpload} accept="image/*" className="hidden" />

          <div className="flex-1 overflow-y-auto">
            <div className="h-[250px] w-full">
              <div className="relative h-full w-full">
                <ImageWithFallback
                  alt={name}
                  className="absolute inset-0 max-w-none object-cover pointer-events-none size-full park-vt-image"
                  src={resizeUnsplashUrl(imageUrl, 800)}
                  decoding="async"
                />
                <div className="absolute bottom-[-12px] left-0 w-full px-4 text-white font-bold text-[clamp(36px,14vw,72px)] text-right leading-none whitespace-nowrap">
                  {parkAbbreviations[id]?.toUpperCase() || ""} {stateAbbreviations[state]?.toUpperCase() || ""}
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/50 rounded-full" />
                {/* Over the hero photo: outline-light. Figma 890:1695 / 890:1688. */}
                <ButtonRound
                  size="lg"
                  variant="outline-light"
                  icon={<X />}
                  onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
                  className="absolute top-4 left-4 z-10"
                  aria-label="Close"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-4 z-10">
                  <ButtonRound
                    size="lg"
                    variant="outline-light"
                    icon={<SwitchCamera />}
                    onClick={(e) => { e.stopPropagation(); setPhotoPickerOpen(true); }}
                    aria-label="Change header photo"
                  />
                  <ButtonRound
                    size="lg"
                    variant="outline-light"
                    icon={isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!userId) { alert("Sign in to upload photos"); return; }
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    aria-label="Upload your photo"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 park-vt-body">
            <SheetPrimitive.Title className="sr-only">{name}</SheetPrimitive.Title>

            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="font-bold text-black text-[20px] flex-1">{name}</h2>
              <div className="flex items-center gap-2 text-gray-500 flex-shrink-0 whitespace-nowrap">
                <span>Est. {established}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 py-1">
                <Checkbox
                  size="xl"
                  label="Visited"
                  checked={isVisited}
                  onChange={() => onToggleVisited(id)}
                />
              </div>

              {isVisited && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div>
                    <Button variant="tertiary" size="md" icon={<Calendar />} onClick={() => setCalendarOpen(true)} className="whitespace-nowrap">
                      {visitedDate
                        ? `Visited ${format(new Date(visitedDate), "MM/dd/yyyy")}`
                        : "Select date visited"}
                    </Button>

                    <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <DialogContent className="w-auto max-w-fit p-0 top-[254px] translate-y-0 [&>button]:hidden">
                        <DialogTitle className="sr-only">Select Visit Date</DialogTitle>
                        <DialogDescription className="sr-only">Choose the date you visited {name}</DialogDescription>
                        <Suspense fallback={<div className="w-[280px] h-[320px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}>
                          <CalendarComponent
                            mode="single"
                            selected={visitedDate ? new Date(visitedDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                onUpdateDate(id, date.toISOString());
                                setCalendarOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </Suspense>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div>
                    {photoUrl ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="tertiary" tone="danger" size="md" icon={<X />}
                          onClick={handleDeletePhoto} disabled={isUploading}
                          aria-label="Delete photo" title="Delete photo"
                        />
                        <Button
                          variant="secondary" size="md" icon={<Camera />} className="whitespace-nowrap"
                          onClick={() => visitPhotoInputRef.current?.click()}
                          loading={isUploading}
                        >
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary" size="md" icon={<Camera />} className="whitespace-nowrap"
                        onClick={() => userId ? visitPhotoInputRef.current?.click() : alert("Sign in to upload photos")}
                        loading={isUploading}
                      >
                        {userId ? "Upload photo" : "Sign in to upload"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isVisited && photoUrl && (
                <>
                  <div
                    className="mb-4 relative rounded-md overflow-hidden aspect-video w-full bg-gray-100 border border-gray-200 cursor-zoom-in group"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img src={photoUrl} alt={`My photo from ${name}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                    <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-black/90 flex flex-col items-center justify-center shadow-2xl [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:w-10 [&>button]:h-10 [&>button]:bg-black/50 [&>button]:rounded-full [&>button]:top-4 [&>button]:right-4">
                      <DialogTitle className="sr-only">Photo from {name}</DialogTitle>
                      <DialogDescription className="sr-only">Full screen view of your uploaded photo</DialogDescription>
                      <div className="w-full h-full flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
                        <img src={photoUrl} alt={`My photo from ${name}`} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} decoding="async" />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {isVisited && (
                <InputTextarea
                  label="Visit note"
                  hideLabel
                  autoResize
                  rows={4}
                  placeholder="Tap to add a note about your visit."
                  className="park-note"
                  value={note}
                  onChange={(e) => onUpdateNote(id, e.target.value)}
                />
              )}
            </div>

            <div className="mb-6">
              <p className="leading-[1.3] text-black opacity-75">{description}</p>
            </div>

            <div className="mb-6">
              <Button asChild variant="tertiary" size="lg" icon={<MapPin />}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " National Park")}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  Map
                </a>
              </Button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Facts</h3>
              <ul className="space-y-2">
                {facts.map((fact, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-ui-brand mt-1">•</span>
                    <span className="opacity-75">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Trivia</h3>
              <ul className="space-y-2">
                {trivia.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-ui-brand mt-1">•</span>
                    <span className="opacity-75">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              {import.meta.env.VITE_UNSPLASH_ACCESS_KEY && (
                <div className="flex justify-end mb-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    icon={<RefreshCw />}
                    onClick={handleRefreshGalleryPhotos}
                    loading={isFetchingGalleryPhotos}
                  >
                    Refresh photos
                  </Button>
                </div>
              )}
              <div className="flex flex-col gap-4">
                {galleryPhotos.map((url, index) => (
                  <div key={index} className="w-full overflow-hidden rounded-md">
                    <img
                      src={resizeUnsplashUrl(url, 720)}
                      alt={`${name} photo ${index + 1}`}
                      className="object-cover w-full h-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

          {/* Rendered inside the sheet: Radix locks pointer events and focus to
              the sheet, and Modal's native <dialog> is not portalled. */}
          <Modal
            open={photoPickerOpen}
            onClose={() => setPhotoPickerOpen(false)}
            // Name the dialog by the heading text alone, not the Close button inside it.
            aria-labelledby={photoPickerTitleId}
            title={
              <span className="flex items-center gap-3">
                <ButtonRound
                  size="md"
                  icon={<X />}
                  onClick={() => setPhotoPickerOpen(false)}
                  aria-label="Close"
                />
                <span id={photoPickerTitleId}>Choose a photo</span>
              </span>
            }
            actions={
              import.meta.env.VITE_UNSPLASH_ACCESS_KEY ? (
                <Button
                  variant="tertiary"
                  size="md"
                  icon={<RefreshCw />}
                  onClick={handleRefreshPickerPhotos}
                  loading={isFetchingPickerPhotos}
                >
                  Rotate photos
                </Button>
              ) : undefined
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {pickerPhotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { onUpdateHeaderImage(id, url); setPhotoPickerOpen(false); }}
                  className={`aspect-video rounded-md overflow-hidden transition-all hover:ring-2 ring-ui-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-action ${imageUrl === url ? "ring-2" : ""}`}
                  aria-label={`Use ${name} photo option ${i + 1}`}
                >
                  <img src={resizeUnsplashUrl(url, 360)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </Modal>
        </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      </SheetPrimitive.Root>
    </>
  );
}

const NationalParkCard = memo(NationalParkCardInner);
export default NationalParkCard;
