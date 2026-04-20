import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

interface AddressAutocompleteProps {
  apiKey: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: ReactNode;
  onEnter?: () => void;
}

// Configure the Maps JS loader once per page load.
let mapsConfigured = false;
function configureMaps(apiKey: string) {
  if (mapsConfigured) return;
  setOptions({ key: apiKey, v: "weekly" });
  mapsConfigured = true;
}

// Cached references to the Places library and an active session token. A
// session token groups autocomplete keystrokes + a final place selection into
// a single billable session, which is much cheaper than per-character billing.
let placesLib: google.maps.PlacesLibrary | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

async function ensurePlacesLoaded(apiKey: string): Promise<google.maps.PlacesLibrary> {
  if (placesLib) return placesLib;
  configureMaps(apiKey);
  placesLib = (await importLibrary("places")) as google.maps.PlacesLibrary;
  sessionToken = new placesLib.AutocompleteSessionToken();
  return placesLib;
}

// One suggestion as we render it in the dropdown.
interface DisplaySuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  // Hold the raw prediction so we can call .toPlace() on selection.
  raw: google.maps.places.PlacePrediction;
}

export default function AddressAutocomplete({
  apiKey,
  value,
  onChange,
  placeholder,
  icon,
  onEnter,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<DisplaySuggestion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track whether the latest value change came from a user keystroke vs.
  // programmatic (e.g. selection): we only want to fetch on keystrokes.
  const userEditedRef = useRef(false);

  // Dropdown is derived, not stored, so the fetch effect doesn't need to
  // synchronously clear state when the input empties.
  const open = !dismissed && value.trim().length > 0 && suggestions.length > 0;

  // Debounced fetch — runs only for non-empty user keystrokes.
  useEffect(() => {
    if (!userEditedRef.current) return;
    if (!value.trim()) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const places = await ensurePlacesLoaded(apiKey);
        const { suggestions: rawSuggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            sessionToken: sessionToken ?? undefined,
            includedRegionCodes: ["us"],
          });
        if (cancelled) return;
        const display: DisplaySuggestion[] = [];
        for (const s of rawSuggestions) {
          const p = s.placePrediction;
          if (!p) continue;
          display.push({
            placeId: p.placeId ?? "",
            mainText: p.mainText?.text ?? p.text?.text ?? "",
            secondaryText: p.secondaryText?.text ?? "",
            raw: p,
          });
        }
        setSuggestions(display);
        setHighlightedIndex(-1);
      } catch (e) {
        console.error("[AddressAutocomplete] fetch failed:", e);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value, apiKey]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setDismissed(true);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    async (suggestion: DisplaySuggestion) => {
      try {
        const place = suggestion.raw.toPlace();
        await place.fetchFields({ fields: ["formattedAddress"] });
        const formatted =
          place.formattedAddress ??
          [suggestion.mainText, suggestion.secondaryText].filter(Boolean).join(", ");
        userEditedRef.current = false;
        onChange(formatted);
        setSuggestions([]);
        setDismissed(true);
        setHighlightedIndex(-1);
        // Start a new session for the next autocomplete.
        if (placesLib) {
          sessionToken = new placesLib.AutocompleteSessionToken();
        }
      } catch (e) {
        console.error("[AddressAutocomplete] place fetch failed:", e);
      }
    },
    [onChange],
  );

  return (
    <div ref={containerRef} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none flex items-center justify-center">
        {icon}
      </span>
      <input
        value={value}
        onChange={(e) => {
          userEditedRef.current = true;
          setDismissed(false);
          onChange(e.target.value);
        }}
        onFocus={() => setDismissed(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            if (open && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
              e.preventDefault();
              handleSelect(suggestions[highlightedIndex]);
            } else {
              onEnter?.();
            }
          } else if (e.key === "Escape") {
            setDismissed(true);
          }
        }}
        placeholder={placeholder}
        className="w-full h-[44px] pl-10 pr-3 bg-[#f3f3f5] border border-transparent rounded-[4px] text-[16px] text-[#0a0a0a] placeholder:text-[#99A1AF] focus:outline-none focus:border-brand-accent focus:bg-white transition-colors"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-[4px] shadow-lg overflow-hidden z-[10000] max-h-[280px] overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={s.placeId || `${s.mainText}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // Use mousedown so the input's onBlur (if any) doesn't fire first.
                  e.preventDefault();
                  handleSelect(s);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`w-full text-left px-3 py-2 transition-colors ${
                  i === highlightedIndex ? "bg-[#f3f3f5]" : "hover:bg-[#f3f3f5]"
                }`}
              >
                <p className="text-[14px] text-[#0a0a0a] font-medium truncate">{s.mainText}</p>
                {s.secondaryText && (
                  <p className="text-[12px] text-gray-500 truncate">{s.secondaryText}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
