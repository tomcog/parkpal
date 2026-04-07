import { MapPin, X, Calendar, Camera, Loader2, SwitchCamera, RefreshCw, ImageUp } from "lucide-react";
import { useState, useRef } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { parkAbbreviations } from "../data/parkAbbreviations";
import { stateAbbreviations } from "../data/stateAbbreviations";
import { parkThumbnails } from "../data/parkThumbnails";
import { format } from "date-fns";
import { supabase } from "../utils/supabase/client";

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
}

export default function NationalParkCard({
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
}: NationalParkCardProps) {
  const thumbnailUrls = parkThumbnails[id] || [imageUrl, imageUrl, imageUrl, imageUrl];

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
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
      <Drawer open={isOpen} onOpenChange={onOpenChange} handleOnly>
        <DrawerTrigger asChild>
          <div
            className="bg-white overflow-clip relative rounded-[8px] shadow-[0px_16px_16px_-8px_rgba(12,12,13,0.1),0px_4px_4px_-4px_rgba(12,12,13,0.05)] cursor-pointer transition-all hover:shadow-[0px_20px_24px_-8px_rgba(12,12,13,0.15),0px_6px_6px_-4px_rgba(12,12,13,0.08)] flex flex-col h-full"
            data-name="card.national_park"
          >
            <div className="relative h-[150px] w-full">
              <ImageWithFallback
                alt={name}
                className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                src={imageUrl}
              />
              {isVisited && (
                <Badge className="absolute top-[12px] right-[12px] bg-brand-accent text-white border-none rounded-full text-[1.15em]">
                  VISITED
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-2 p-4 flex-1">
              <p className="leading-[normal] not-italic text-black font-bold text-[18px]">{name}</p>
              <p className="leading-[normal] not-italic opacity-[0.5] text-black">{state}</p>
              <p className="leading-[1.3] not-italic text-black text-[14px]">{description}</p>
            </div>
          </div>
        </DrawerTrigger>

        <DrawerContent className="!h-[100vh] !max-h-[100vh] !mt-0 !rounded-none !border-none !p-0 [&>div:first-child]:hidden">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <input type="file" ref={visitPhotoInputRef} onChange={handleVisitPhotoUpload} accept="image/*" className="hidden" />

          <div className="flex-1 overflow-y-auto">
            <div className="h-[250px] w-full">
              <div className="relative h-full w-full">
                <ImageWithFallback
                  alt={name}
                  className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                  src={imageUrl}
                />
                <div className="absolute bottom-[-12px] left-0 w-full px-4 text-white font-bold text-[72px] text-right leading-none">
                  {parkAbbreviations[id]?.toUpperCase() || ""} {stateAbbreviations[state]?.toUpperCase() || ""}
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/50 rounded-full" />
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
                  className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10 opacity-50 hover:opacity-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute top-4 right-4 flex flex-col gap-4 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhotoPickerOpen(true); }}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors opacity-50 hover:opacity-100"
                    aria-label="Change header photo"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!userId) { alert("Sign in to upload photos"); return; }
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors opacity-50 hover:opacity-100 disabled:opacity-30"
                    aria-label="Upload your photo"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
            <DrawerTitle className="sr-only">{name}</DrawerTitle>
            <DrawerDescription className="sr-only">Detailed information about {name}</DrawerDescription>

            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="font-bold text-black text-[20px] flex-1">{name}</h2>
              <div className="flex items-center gap-2 text-gray-500 flex-shrink-0 whitespace-nowrap">
                <span>Est. {established}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3 py-1">
                <Switch
                  id={`visited-${id}`}
                  checked={isVisited}
                  onCheckedChange={() => onToggleVisited(id)}
                  className="data-[state=checked]:bg-brand-accent"
                />
                <Label htmlFor={`visited-${id}`} className={`cursor-pointer text-[calc(1em+2px)] ${isVisited ? "text-brand-accent" : ""}`}>
                  Visited
                </Label>
              </div>

              {isVisited && (
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => setCalendarOpen(true)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none p-0"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>
                        {visitedDate
                          ? `Visited ${format(new Date(visitedDate), "MM/dd/yyyy")}`
                          : "Select date visited"}
                      </span>
                    </button>

                    <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <DialogContent className="w-auto max-w-fit p-0 top-[254px] translate-y-0 [&>button]:hidden">
                        <DialogTitle className="sr-only">Select Visit Date</DialogTitle>
                        <DialogDescription className="sr-only">Choose the date you visited {name}</DialogDescription>
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
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div>
                    {photoUrl ? (
                      <div className="flex items-center">
                        <Button
                          variant="outline" size="sm"
                          className="h-8 w-8 p-0 rounded-r-none border-r-0 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          onClick={handleDeletePhoto} disabled={isUploading} title="Delete photo"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="h-8 gap-2 text-xs text-gray-500 hover:text-gray-700 rounded-l-none border-l-0 pl-2"
                          onClick={() => visitPhotoInputRef.current?.click()} disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline" size="sm"
                        className="h-8 gap-2 text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => userId ? visitPhotoInputRef.current?.click() : alert("Sign in to upload photos")}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
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
                    <img src={photoUrl} alt={`My photo from ${name}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                    <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-black/90 flex flex-col items-center justify-center shadow-2xl [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:w-10 [&>button]:h-10 [&>button]:bg-black/50 [&>button]:rounded-full [&>button]:top-4 [&>button]:right-4">
                      <DialogTitle className="sr-only">Photo from {name}</DialogTitle>
                      <DialogDescription className="sr-only">Full screen view of your uploaded photo</DialogDescription>
                      <div className="w-full h-full flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
                        <img src={photoUrl} alt={`My photo from ${name}`} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {isVisited && (
                <Textarea
                  placeholder="Add a note about your visit..."
                  value={note}
                  onChange={(e) => onUpdateNote(id, e.target.value)}
                  className="min-h-[100px] rounded-[4px]"
                />
              )}
            </div>

            <div className="mb-6">
              <p className="leading-[1.3] text-black opacity-75">{description}</p>
            </div>

            <div className="mb-6">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " National Park")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#18A8F5] hover:text-[#18A8F5]/80 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span>Map</span>
              </a>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Facts</h3>
              <ul className="space-y-2">
                {facts.map((fact, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-brand-accent mt-1">•</span>
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
                    <span className="text-brand-accent mt-1">•</span>
                    <span className="opacity-75">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              {import.meta.env.VITE_UNSPLASH_ACCESS_KEY && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleRefreshGalleryPhotos}
                    disabled={isFetchingGalleryPhotos}
                    className="text-xs text-gray-400 hover:text-brand-accent transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingGalleryPhotos ? "animate-spin" : ""}`} />
                    {isFetchingGalleryPhotos ? "Loading…" : "Refresh photos"}
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-4">
                {galleryPhotos.map((url, index) => (
                  <div key={index} className="w-full overflow-hidden rounded-md">
                    <img src={url} alt={`${name} photo ${index + 1}`} className="object-cover w-full h-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </DrawerContent>
      </Drawer>
      <Dialog open={photoPickerOpen} onOpenChange={setPhotoPickerOpen}>
        <DialogContent className="max-w-[360px] p-5 [&>button]:hidden">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="font-semibold text-[16px]">Choose a photo</DialogTitle>
            {import.meta.env.VITE_UNSPLASH_ACCESS_KEY && (
              <button
                onClick={handleRefreshPickerPhotos}
                disabled={isFetchingPickerPhotos}
                className="p-1.5 rounded-full text-gray-400 hover:text-brand-accent hover:bg-gray-100 transition-colors disabled:opacity-30"
                title="Load new photos"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingPickerPhotos ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
          <DialogDescription className="sr-only">Select a header photo for {name}</DialogDescription>
          <div className="grid grid-cols-2 gap-2">
            {pickerPhotos.map((url, i) => (
              <button
                key={i}
                onClick={() => { onUpdateHeaderImage(id, url); setPhotoPickerOpen(false); }}
                className={`aspect-video rounded-md overflow-hidden transition-all hover:ring-2 ring-brand-accent ${imageUrl === url ? "ring-2" : ""}`}
              >
                <img src={url} alt={`${name} photo option ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setPhotoPickerOpen(false)}
            className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
