import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import NationalParkCard from "./components/NationalParkCard";
import AuthScreen from "./components/AuthScreen";
import { nationalParks } from "./data/nationalParks";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Progress } from "./components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { Search, X, MapPin, CircleUser, LocateFixed, Loader2, AlertCircle, ListStart } from "lucide-react";
import { supabase } from "./utils/supabase/client";
import NounNationalPark from "./imports/NounNationalPark19895091";

const GOOGLE_MAPS_API_KEY = "AIzaSyDljWXxLD0ofXyh00bCYNtF1cW4YOXm48k";

function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const parkImages: Record<string, string> = {
  "acadia": "https://images.unsplash.com/photo-1609697992606-4d6ec6d6178a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkaWElMjBuYXRpb25hbCUyMHBhcmt8ZW58MXx8fHwxNzYyOTI3NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "american-samoa": "https://images.unsplash.com/photo-1600903304891-5c9e67d87712?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbiUyMHNhbW9hJTIwdHJvcGljYWwlMjBiZWFjaHxlbnwxfHx8fDE3NjI5Mjc4MTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "arches": "https://images.unsplash.com/photo-1556251999-2b4dbcc08d30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoZXMlMjBuYXRpb25hbCUyMHBhcmslMjB1dGFofGVufDF8fHx8MTc2MjkyNzUwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  "badlands": "https://images.unsplash.com/photo-1631558109716-503b8f38be7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRsYW5kcyUyMHNvdXRoJTIwZGFrb3RhfGVufDF8fHx8MTc2MjkyNzUwOHww&ixlib=rb-4.1.0&q=80&w=1080",
  "big-bend": "https://images.unsplash.com/photo-1680402809298-6e42df410af8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWclMjBiZW5kJTIwdGV4YXMlMjBkZXNlcnR8ZW58MXx8fHwxNzYyOTI3NTExfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "biscayne": "https://images.unsplash.com/photo-1660151186907-8cdf0a347d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXNjYXluZSUyMGJheSUyMGNvcmFsJTIwcmVlZnxlbnwxfHx8fDE3NjI5Mjc4MTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "black-canyon": "https://images.unsplash.com/photo-1639243987646-7c2cce1d5327?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGNhbnlvbiUyMGd1bm5pc29ufGVufDF8fHx8MTc2MjkyNzgxOHww&ixlib=rb-4.1.0&q=80&w=1080",
  "bryce-canyon": "https://images.unsplash.com/photo-1517040414285-12bdaf61b161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicnljZSUyMGNhbnlvbiUyMGhvb2Rvb3N8ZW58MXx8fHwxNzYyOTI3NTA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "canyonlands": "https://images.unsplash.com/photo-1712247296010-3ea5882550b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW55b25sYW5kcyUyMG1lc2ElMjBhcmNofGVufDF8fHx8MTc2MjkyNzUwOXww&ixlib=rb-4.1.0&q=80&w=1080",
  "capitol-reef": "https://images.unsplash.com/photo-1680964005996-ad66e78d3cd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXBpdG9sJTIwcmVlZiUyMHV0YWh8ZW58MXx8fHwxNzYyOTI3NTEwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "carlsbad-caverns": "https://images.unsplash.com/photo-1637047868520-b0081dd1c11a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJsc2JhZCUyMGNhdmVybnMlMjBjYXZlfGVufDF8fHx8MTc2MjkyNzUxMXww&ixlib=rb-4.1.0&q=80&w=1080",
  "channel-islands": "https://images.unsplash.com/photo-1694028723643-c29e04a95e44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFubmVsJTIwaXNsYW5kcyUyMGNhbGlmb3JuaWF8ZW58MXx8fHwxNzYyOTI3ODE5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "congaree": "https://images.unsplash.com/photo-1675113757305-113b913bd7ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25nYXJlZSUyMGZvcmVzdCUyMHN3YW1wfGVufDF8fHx8MTc2MjkyNzgxOXww&ixlib=rb-4.1.0&q=80&w=1080",
  "crater-lake": "https://images.unsplash.com/photo-1731707485055-d6b3c5e04c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmF0ZXIlMjBsYWtlJTIwb3JlZ29uJTIwYmx1ZXxlbnwxfHx8fDE3NjI5Mjc1MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "cuyahoga-valley": "https://images.unsplash.com/photo-1717181638086-c3327e283c03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXlhaG9nYSUyMHZhbGxleSUyMHdhdGVyZmFsbHxlbnwxfHx8fDE3NjI5Mjc4MTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "death-valley": "https://images.unsplash.com/photo-1656870679467-2e7e98ebf482?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWF0aCUyMHZhbGxleSUyMHNhbmQlMjBkdW5lc3xlbnwxfHx8fDE3NjI5Mjc1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "denali": "https://images.unsplash.com/photo-1689694085532-4f7c3d51a20d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5hbGklMjBtb3VudGFpbiUyMGFsYXNrYXxlbnwxfHx8fDE3NjI5MTgxNTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "dry-tortugas": "https://images.unsplash.com/photo-1725329079863-03a4e086ded8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcnklMjB0b3J0dWdhcyUyMGZvcnQlMjBqZWZmZXJzb258ZW58MXx8fHwxNzYyOTI3ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "everglades": "https://images.unsplash.com/photo-1639418779045-68b6520fc732?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVyZ2xhZGVzJTIwd2V0bGFuZHN8ZW58MXx8fHwxNzYyOTI3NTA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "gates-arctic": "https://images.unsplash.com/photo-1577583916000-f87179b7d967?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXRlcyUyMGFyY3RpYyUyMGFsYXNrYSUyMHdpbGRlcm5lc3N8ZW58MXx8fHwxNzYyOTI3ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "gateway-arch": "https://images.unsplash.com/photo-1666213847499-5f2ed4e972b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXRld2F5JTIwYXJjaCUyMHN0JTIwbG91aXN8ZW58MXx8fHwxNzYyOTI3ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "glacier": "https://images.unsplash.com/photo-1597098544686-5d6284eaeccd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFjaWVyJTIwbmF0aW9uYWwlMjBwYXJrJTIwbW9udGFuYXxlbnwxfHx8fDE3NjI5Mjc1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "glacier-bay": "https://images.unsplash.com/photo-1549402213-f13647c11c84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFjaWVyJTIwYmF5JTIwYWxhc2thfGVufDF8fHx8MTc2MjkyNzgyMXww&ixlib=rb-4.1.0&q=80&w=1080",
  "grand-canyon": "https://images.unsplash.com/photo-1719859064507-bc77178c4eb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuZCUyMGNhbnlvbiUyMGFyaXpvbmF8ZW58MXx8fHwxNzYyODc5Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "grand-teton": "https://images.unsplash.com/photo-1627845652047-b03e2b59fe5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuZCUyMHRldG9uJTIwbW91bnRhaW5zfGVufDF8fHx8MTc2MjkyNzUwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  "great-basin": "https://images.unsplash.com/photo-1659023695756-5311381658ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVhdCUyMGJhc2luJTIwYnJpc3RsZWNvbmUlMjBwaW5lfGVufDF8fHx8MTc2MjkyNzgyMXww&ixlib=rb-4.1.0&q=80&w=1080",
  "great-sand-dunes": "https://images.unsplash.com/photo-1615244896230-8fb51d91c3b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVhdCUyMHNhbmQlMjBkdW5lcyUyMGNvbG9yYWRvfGVufDF8fHx8MTc2MjkyNzgyMnww&ixlib=rb-4.1.0&q=80&w=1080",
  "great-smoky": "https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVhdCUyMHNtb2t5JTIwbW91bnRhaW5zfGVufDF8fHx8MTc2MjkyNzUwNHww&ixlib=rb-4.1.0&q=80&w=1080",
  "guadalupe-mountains": "https://images.unsplash.com/photo-1648224776132-163d99ca6b38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndWFkYWx1cGUlMjBtb3VudGFpbnMlMjB0ZXhhc3xlbnwxfHx8fDE3NjI5Mjc4MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "haleakala": "https://images.unsplash.com/photo-1546527848-5f786ed0f030?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWxlYWthbGElMjBjcmF0ZXIlMjBoYXdhaWl8ZW58MXx8fHwxNzYyOTI3ODIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "hawaii-volcanoes": "https://images.unsplash.com/photo-1704168382809-6f1ef716e884?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXdhaWklMjB2b2xjYW5vZXMlMjBsYXZhfGVufDF8fHx8MTc2MjkyNzgyNHww&ixlib=rb-4.1.0&q=80&w=1080",
  "hot-springs": "https://images.unsplash.com/photo-1695149488901-bf67cbd1c616?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3QlMjBzcHJpbmdzJTIwYXJrYW5zYXMlMjBiYXRoaG91c2V8ZW58MXx8fHwxNzYyOTI3ODIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "indiana-dunes": "https://images.unsplash.com/photo-1605245154655-43666255c29d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW5hJTIwZHVuZXMlMjBsYWtlJTIwbWljaGlnYW58ZW58MXx8fHwxNzYyOTI3ODIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "isle-royale": "https://images.unsplash.com/photo-1597687953947-2df10a5c9e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc2xlJTIwcm95YWxlJTIwbWljaGlnYW4lMjBsYWtlfGVufDF8fHx8MTc2MjkyNzgyNHww&ixlib=rb-4.1.0&q=80&w=1080",
  "joshua-tree": "https://images.unsplash.com/photo-1686002836836-40fc999bbecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqb3NodWElMjB0cmVlJTIwZGVzZXJ0fGVufDF8fHx8MTc2MjkyNzUwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  "katmai": "https://images.unsplash.com/photo-1517103068540-6a70e8c0022f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYXRtYWklMjBiZWFycyUyMHNhbG1vbnxlbnwxfHx8fDE3NjI5Mjc4MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "kenai-fjords": "https://images.unsplash.com/photo-1626754150554-b0c5f01f0dd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrZW5haSUyMGZqb3JkcyUyMGdsYWNpZXJ8ZW58MXx8fHwxNzYyOTI3ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "kings-canyon": "https://images.unsplash.com/photo-1669352311123-085520652a65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraW5ncyUyMGNhbnlvbiUyMGNhbGlmb3JuaWF8ZW58MXx8fHwxNzYyOTI3NTExfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "kobuk-valley": "https://images.unsplash.com/photo-1548842402-fc17b264ecce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb2J1ayUyMHZhbGxleSUyMHNhbmQlMjBkdW5lc3xlbnwxfHx8fDE3NjI5Mjc4MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "lake-clark": "https://images.unsplash.com/photo-1705869339742-f569122ac785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWtlJTIwY2xhcmslMjBhbGFza2A8ZW58MXx8fHwxNzYyOTI3ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "lassen-volcanic": "https://images.unsplash.com/photo-1653892065208-53c42d2c692e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzZW4lMjB2b2xjYW5pYyUyMGNhbGlmb3JuaWF8ZW58MXx8fHwxNzYyOTI3ODI2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "mammoth-cave": "https://images.unsplash.com/photo-1662494195774-66b8815e3dd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW1tb3RoJTIwY2F2ZSUyMGZvcm1hdGlvbnN8ZW58MXx8fHwxNzYyOTI3NTExfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "mesa-verde": "https://images.unsplash.com/photo-1623107061821-ee462b5c7ea5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXNhJTIwdmVyZGUlMjBjbGlmZiUyMGR3ZWxsaW5nc3xlbnwxfHx8fDE3NjI5Mjc1MTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "mount-rainier": "https://images.unsplash.com/photo-1708732841412-346a7fe57813?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudCUyMHJhaW5pZXIlMjB3aWxkZmxvd2Vyc3xlbnwxfHx8fDE3NjI5Mjc1MDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "new-river-gorge": "https://images.unsplash.com/photo-1666214043271-c27f346d5a66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjByaXZlciUyMGdvcmdlJTIwYnJpZGdlfGVufDF8fHx8MTc2MjkyNzgyNnww&ixlib=rb-4.1.0&q=80&w=1080",
  "north-cascades": "https://images.unsplash.com/photo-1675026544266-0bf2fa9debdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aCUyMGNhc2NhZGVzJTIwbW91bnRhaW5zfGVufDF8fHx8MTc2MjkyNzgyNnww&ixlib=rb-4.1.0&q=80&w=1080",
  "olympic": "https://images.unsplash.com/photo-1516572882656-dc5249697fc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbHltcGljJTIwbmF0aW9uYWwlMjBwYXJrfGVufDF8fHx8MTc2MjkyNzUwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  "petrified-forest": "https://images.unsplash.com/photo-1605034514647-252d0ec86d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXRyaWZpZWQlMjBmb3Jlc3QlMjBhcml6b25hfGVufDF8fHx8MTc2MjkyNzUxMXww&ixlib=rb-4.1.0&q=80&w=1080",
  "pinnacles": "https://images.unsplash.com/photo-1613063318748-257fe2c32374?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5uYWNsZXMlMjBuYXRpb25hbCUyMHBhcmslMjBjYWxpZm9ybmlhfGVufDF8fHx8MTc2MjkyNzgyN3ww&ixlib=rb-4.1.0&q=80&w=1080",
  "redwood": "https://images.unsplash.com/photo-1734186612777-beecc595797a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWR3b29kJTIwdHJlZXMlMjBjYWxpZm9ybmlhfGVufDF8fHx8MTc2MjkyNzUxMHww&ixlib=rb-4.1.0&q=80&w=1080",
  "rocky-mountain": "https://images.unsplash.com/photo-1600542158543-1faed2d1c05d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2NreSUyMG1vdW50YWluJTIwbmF0aW9uYWwlMjBwYXJrfGVufDF8fHx8MTc2MjkyNzUwNHww&ixlib=rb-4.1.0&q=80&w=1080",
  "saguaro": "https://images.unsplash.com/photo-1742146534755-d988fcbe6ec3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWd1YXJvJTIwY2FjdHVzJTIwYXJpem9uYXxlbnwxfHx8fDE3NjI5Mjc4Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "sequoia": "https://images.unsplash.com/photo-1661047721684-2b0aba158bbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXF1b2lhJTIwdHJlZXMlMjBnaWFudHxlbnwxfHx8fDE3NjI5Mjc1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "shenandoah": "https://images.unsplash.com/photo-1634442795837-2ccd6c7d5f01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGVuYW5kb2FoJTIwbW91bnRhaW5zJTIwdmlyZ2luaWF8ZW58MXx8fHwxNzYyOTI3NTA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "theodore-roosevelt": "https://images.unsplash.com/photo-1596112849212-c5e23f4747e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVvZG9yZSUyMHJvb3NldmVsdCUyMGJhZGxhbmRzfGVufDF8fHx8MTc2MjkyNzgyN3ww&ixlib=rb-4.1.0&q=80&w=1080",
  "virgin-islands": "https://images.unsplash.com/photo-1716997338016-93b456b3ea8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJnaW4lMjBpc2xhbmRzJTIwYmVhY2glMjBjYXJpYmJlYW58ZW58MXx8fHwxNzYyOTI3ODI4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "voyageurs": "https://images.unsplash.com/photo-1649837456937-fe79d7889123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b3lhZ2V1cnMlMjBuYXRpb25hbCUyMHBhcmslMjBsYWtlfGVufDF8fHx8MTc2MjkyNzgyOHww&ixlib=rb-4.1.0&q=80&w=1080",
  "white-sands": "https://images.unsplash.com/photo-1738202465232-380a31f86326?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNhbmRzJTIwbmV3JTIwbWV4aWNvfGVufDF8fHx8MTc2MjkyNzgyOHww&ixlib=rb-4.1.0&q=80&w=1080",
  "wind-cave": "https://images.unsplash.com/photo-1600023989475-a90a185e1f19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kJTIwY2F2ZSUyMHNvdXRoJTIwZGFrb3RhfGVufDF8fHx8MTc2MjkyNzgyOXww&ixlib=rb-4.1.0&q=80&w=1080",
  "wrangell-st-elias": "https://images.unsplash.com/photo-1637055979530-305ce6d90554?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cmFuZ2VsbCUyMHN0JTIwZWxpYXMlMjBhbGFza2A8ZW58MXx8fHwxNzYyOTI3ODI5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "yellowstone": "https://images.unsplash.com/photo-1677116825823-97c47cf7b33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5ZWxsb3dzdG9uZSUyMGdleXNlcnxlbnwxfHx8fDE3NjI4ODQxMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "yosemite": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3NlbWl0ZSUyMHZhbGxleXxlbnwxfHx8fDE3NjI4Nzk2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "zion": "https://images.unsplash.com/photo-1443632864897-14973fa006cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx6aW9uJTIwbmF0aW9uYWwlMjBwYXJrfGVufDF8fHx8MTc2Mjg2NTYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
};

type FilterType = "all" | "visited" | "to-go";
type SortType = "alphabetical" | "state";
type AuthState = "loading" | "auth-screen" | "app";

interface ParkData {
  visited: boolean;
  note: string;
  visitedDate?: string;
  photoUrl?: string;
}

const GUEST_KEY = "parkpal_guest_mode";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const [parkData, setParkData] = useState<Map<string, ParkData>>(new Map());
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortType>("alphabetical");
  const [openParkId, setOpenParkId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [nearestPark, setNearestPark] = useState<{ park: (typeof nationalParks)[0]; distanceMiles: number } | null>(null);
  const [nearestDialogOpen, setNearestDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [headerImageOverrides, setHeaderImageOverrides] = useState<Map<string, string>>(() => {
    try {
      const stored = localStorage.getItem("parkpal_header_images");
      return stored ? new Map(Object.entries(JSON.parse(stored))) : new Map();
    } catch { return new Map(); }
  });

  // ── Filtered/sorted park list ─────────────────────────────────────────────
  const filteredParks = nationalParks
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
      if (sortOrder === "alphabetical") return a.name.localeCompare(b.name);
      const sc = a.state.localeCompare(b.state);
      return sc !== 0 ? sc : a.name.localeCompare(b.name);
    });

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setAuthState("app");
      } else if (localStorage.getItem(GUEST_KEY)) {
        setIsGuest(true);
        setAuthState("app");
      } else {
        setAuthState("auth-screen");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        setAuthState("app");
      } else if (!localStorage.getItem(GUEST_KEY)) {
        setUser(null);
        setAuthState("auth-screen");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load data when entering app ───────────────────────────────────────────
  useEffect(() => {
    if (authState !== "app") return;

    const load = async () => {
      setDataLoading(true);

      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from("park_visits")
          .select("park_id, visited, note, visited_date, photo_url, header_photo_url")
          .eq("user_id", user.id);

        if (error) {
          console.error("Supabase load error:", error);
          setSaveError(`Failed to load your data: ${error.message}`);
        } else if (data) {
          const map = new Map<string, ParkData>();
          const headerOverrides = new Map<string, string>();
          for (const row of data) {
            if (row.visited) {
              map.set(row.park_id, {
                visited: row.visited,
                note: row.note ?? "",
                visitedDate: row.visited_date ?? undefined,
                photoUrl: row.photo_url ?? undefined,
              });
            }
            if (row.header_photo_url) {
              headerOverrides.set(row.park_id, row.header_photo_url);
            }
          }
          setParkData(map);
          setHeaderImageOverrides(headerOverrides);
        }
      } else {
        // Guest: load from localStorage
        const local = localStorage.getItem("parkData_guest");
        if (local) {
          try {
            setParkData(new Map(Object.entries(JSON.parse(local))));
          } catch { /* ignore */ }
        }
      }

      setDataLoading(false);
    };

    load();
  }, [authState, user]);

  // ── Persist guest data to localStorage ───────────────────────────────────
  useEffect(() => {
    if (!isGuest || dataLoading) return;
    localStorage.setItem("parkData_guest", JSON.stringify(Object.fromEntries(parkData)));
  }, [parkData, isGuest, dataLoading]);

  // ── Supabase upsert helper ────────────────────────────────────────────────
  const upsertPark = useCallback(async (parkId: string, data: ParkData) => {
    if (!user) return;
    const { error } = await supabase.from("park_visits").upsert({
      user_id: user.id,
      park_id: parkId,
      visited: data.visited,
      note: data.note,
      visited_date: data.visitedDate ?? null,
      photo_url: data.photoUrl || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,park_id" });
    if (error) {
      console.error("Supabase upsert error:", error);
      setSaveError(`Failed to save: ${error.message}`);
    }
  }, [user]);

  // ── Park data mutations ───────────────────────────────────────────────────
  const toggleVisited = useCallback(async (parkId: string) => {
    const current = parkData.get(parkId);
    if (current?.visited) {
      setParkData((prev) => { const next = new Map(prev); next.delete(parkId); return next; });
      if (user) {
        const { error } = await supabase.from("park_visits").delete().match({ user_id: user.id, park_id: parkId });
        if (error) {
          console.error("Supabase delete error:", error);
          setSaveError(`Failed to save: ${error.message}`);
        }
      }
    } else {
      const updated: ParkData = { visited: true, note: current?.note ?? "", visitedDate: current?.visitedDate };
      setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
      upsertPark(parkId, updated);
    }
  }, [user, parkData, upsertPark]);

  const updateParkNote = useCallback((parkId: string, note: string) => {
    const current = parkData.get(parkId);
    if (!current?.visited) return;
    const updated = { ...current, note };
    setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
    upsertPark(parkId, updated);
  }, [parkData, upsertPark]);

  const updateParkDate = useCallback((parkId: string, date: string) => {
    const current = parkData.get(parkId);
    if (!current?.visited) return;
    const updated = { ...current, visitedDate: date };
    setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
    upsertPark(parkId, updated);
  }, [parkData, upsertPark]);

  const updateParkPhoto = useCallback((parkId: string, photoUrl: string) => {
    const current = parkData.get(parkId);
    if (!current?.visited) return;
    const updated = { ...current, photoUrl: photoUrl || undefined };
    setParkData((prev) => { const next = new Map(prev); next.set(parkId, updated); return next; });
    upsertPark(parkId, updated);
  }, [parkData, upsertPark]);

  const upsertHeaderImage = useCallback(async (parkId: string, url: string) => {
    if (!user) return;
    const { error } = await supabase.from("park_visits").upsert({
      user_id: user.id,
      park_id: parkId,
      header_photo_url: url,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,park_id" });
    if (error) {
      console.error("Header image upsert error:", error);
      setSaveError(`Failed to save header image: ${error.message}`);
    }
  }, [user]);

  const updateHeaderImage = useCallback((parkId: string, url: string) => {
    setHeaderImageOverrides((prev) => { const next = new Map(prev); next.set(parkId, url); return next; });
    upsertHeaderImage(parkId, url);
  }, [upsertHeaderImage]);

  // ── Persist header image overrides to localStorage ────────────────────────
  useEffect(() => {
    localStorage.setItem("parkpal_header_images", JSON.stringify(Object.fromEntries(headerImageOverrides)));
  }, [headerImageOverrides]);

  // ── Letter-key jump navigation ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (openParkId) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!/^[a-zA-Z]$/.test(e.key)) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      const letter = e.key.toLowerCase();
      const match = filteredParks.find((p) => p.name.toLowerCase().startsWith(letter));
      if (!match) return;
      document.getElementById(`park-card-${match.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredParks, openParkId]);

  const handleSignOut = async () => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    setParkData(new Map());
    if (user) {
      await supabase.auth.signOut();
    } else {
      setAuthState("auth-screen");
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, "1");
    setIsGuest(true);
    setAuthState("app");
  };

  const handleFindNearest = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
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
      () => setLocating(false),
      { timeout: 10000 },
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
    return <AuthScreen onContinueAsGuest={handleContinueAsGuest} />;
  }

  // ── Main app ──────────────────────────────────────────────────────────────

  const visitedCount = Array.from(parkData.values()).filter(d => d.visited).length;
  const totalCount = nationalParks.length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1270px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">

            {/* Logo + user icon */}
            <div className="flex items-start justify-between">
              <div className="h-[64px] w-fit">
                <NounNationalPark />
              </div>
              <div className="flex flex-col items-end gap-[10px]">
                <button
                  onClick={() => setUserMenuOpen(true)}
                  className="p-1 text-gray-400 hover:text-brand-accent transition-colors"
                  aria-label="Account"
                >
                  <CircleUser className="w-6 h-6" />
                </button>
                <button
                  onClick={handleFindNearest}
                  disabled={locating}
                  className="p-1 text-brand-accent hover:opacity-70 transition-opacity disabled:opacity-50"
                  aria-label="Find nearest national park"
                  title="Find nearest national park"
                >
                  {locating
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : <LocateFixed className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* User menu dialog */}
            <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DialogContent className="max-w-[280px] p-6 flex flex-col gap-4 [&>button]:hidden">
                <DialogTitle className="text-center font-semibold text-[18px]">
                  {user ? user.email?.split("@")[0] : "Guest"}
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-gray-500">
                  {user ? user.email : "Browsing without an account"}
                </DialogDescription>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                    className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white rounded-[4px]"
                  >
                    Sign out
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full rounded-[4px]"
                  >
                    Continue
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

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
                  <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" aria-label="Clear search">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                )}
                <Input
                  placeholder="Search parks"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "a") e.currentTarget.select(); }}
                  className="pl-10 rounded-[4px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "alphabetical" ? "state" : "alphabetical")}
                size="sm"
                className={`px-3 h-9 rounded-[4px] flex-shrink-0 ${sortOrder === "state" ? "bg-brand-accent border-brand-accent hover:bg-brand-accent/90" : "bg-white hover:bg-gray-50"}`}
                title={sortOrder === "alphabetical" ? "Sort by State" : "Sort A-Z"}
              >
                <MapPin className={`w-4 h-4 ${sortOrder === "state" ? "text-white" : "text-black"}`} />
              </Button>
              <Button
                variant="outline"
                onClick={() => { if (filter === "all") setFilter("visited"); else if (filter === "visited") setFilter("to-go"); else setFilter("all"); }}
                size="sm"
                className={`rounded-[4px] h-9 flex-shrink-0 w-[94px] gap-[6px] ${filter === "visited" ? "bg-brand-accent text-white border-brand-accent hover:bg-brand-accent/90 hover:text-white" : filter === "to-go" ? "bg-black text-white border-black hover:bg-gray-800 hover:text-white" : "hover:bg-white"}`}
              >
                <ListStart className="w-4 h-4 flex-shrink-0" />
                {filter === "all" ? "All" : filter === "visited" ? "Visited" : "To go"}
              </Button>
            </div>

            {/* Stats */}
            {filter === "visited" ? (
              <div>
                <p className="leading-[normal] not-italic text-black">
                  <span className="opacity-[0.5]">Showing {visitedCount} </span>
                  <span className="text-brand-accent">visited</span>
                  <span className="opacity-[0.5]"> of {totalCount} parks</span>
                </p>
                <Progress value={(visitedCount / totalCount) * 100} className="h-2 mt-2" indicatorClassName="bg-brand-accent" />
              </div>
            ) : filter === "to-go" ? (
              <div>
                <p className="leading-[normal] not-italic text-black">
                  <span className="opacity-[0.5]">Showing {totalCount - visitedCount} </span>
                  <span className="text-black">to go</span>
                  <span className="opacity-[0.5]"> of {totalCount} parks</span>
                </p>
                <Progress value={(visitedCount / totalCount) * 100} className="h-2 mt-2" indicatorClassName="bg-brand-accent" />
              </div>
            ) : (
              <p className="leading-[normal] not-italic text-gray-500">
                {dataLoading ? "Loading..." : filteredParks.length === totalCount && !searchQuery
                  ? <>Showing all {totalCount} national parks{sortOrder === "state" && <span className="text-brand-accent"> by state</span>}</>
                  : <>Showing {filteredParks.length} of {totalCount} parks{sortOrder === "state" && <span className="text-brand-accent"> by state</span>}</>}
              </p>
            )}
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
              onClick={() => setSaveError(null)}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-[1270px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParks.map((park) => (
            <div key={park.id} id={`park-card-${park.id}`}>
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
