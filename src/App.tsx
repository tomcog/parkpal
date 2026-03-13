import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import NationalParkCard from "./components/NationalParkCard";
import AuthScreen from "./components/AuthScreen";
import { nationalParks } from "./data/nationalParks";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Progress } from "./components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { Drawer, DrawerContent } from "./components/ui/drawer";
import { Search, X, Map as MapIcon, CircleUser, LocateFixed, Loader2, AlertCircle, PencilLine, LogOut } from "lucide-react";
import { supabase } from "./utils/supabase/client";
import { ButtonStandard } from "./components/ButtonStandard";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortType>("alphabetical");
  const [openParkId, setOpenParkId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
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


  useEffect(() => {
    if (userMenuOpen && user) {
      setUsernameValue(user.user_metadata?.username || user.email?.split("@")[0] || "");
      setEditingUsername(false);
    }
  }, [userMenuOpen, user]);

  const handleSaveUsername = async () => {
    setEditingUsername(false);
    if (!user || !usernameValue.trim()) return;
    await supabase.auth.updateUser({ data: { username: usernameValue.trim() } });
  };

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
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location access.");
      return;
    }
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
              <button
                onClick={() => setUserMenuOpen(true)}
                className="p-1 text-gray-400 hover:text-brand-accent transition-colors"
                aria-label="Account"
              >
                <CircleUser className="w-6 h-6" />
              </button>
            </div>

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
                    <Button
                      variant="outline"
                      onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                      className="w-full h-11 rounded-[4px] text-lg font-semibold border-gray-400 gap-2"
                    >
                      <LogOut className="w-5 h-5 text-gray-500" />
                      Sign out
                    </Button>
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
                onClick={() => setSortOrder(sortOrder === "alphabetical" ? "state" : "alphabetical")}
                theme="white"
                icon={sortOrder === "state" ? (
                  <MapIcon className="w-5 h-5 text-[#99A1AF]" />
                ) : (
                  <svg viewBox="0 0 16.167 15.334" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                    <path d="M15.3104 8.34473C15.6399 8.39267 15.9282 8.60289 16.0722 8.91016C16.2364 9.26141 16.1827 9.6767 15.9345 9.97461L13.1356 13.334H15.1669C15.7189 13.3343 16.1669 13.7819 16.1669 14.334C16.1667 14.8859 15.7188 15.3337 15.1669 15.334H10.9999C10.612 15.334 10.2593 15.109 10.0946 14.7578C9.93014 14.4065 9.98304 13.9914 10.2313 13.6934L13.0311 10.334H10.9999C10.4477 10.334 10.0001 9.88612 9.9999 9.33398C9.9999 8.7817 10.4476 8.33398 10.9999 8.33398H15.1669L15.3104 8.34473ZM4.3329 0C4.88508 0 5.33273 0.447865 5.3329 1V11.9189L6.95986 10.293C7.3504 9.9029 7.98354 9.90264 8.37392 10.293C8.76414 10.6834 8.76396 11.3165 8.37392 11.707L5.03994 15.04C5.01612 15.0639 4.99085 15.0861 4.96474 15.1074C4.92768 15.1378 4.88859 15.1643 4.84853 15.1885C4.7775 15.2314 4.70114 15.2657 4.62001 15.29C4.61061 15.2929 4.60116 15.2953 4.59169 15.2979C4.57004 15.3036 4.54847 15.3101 4.52626 15.3145C4.39735 15.3398 4.26447 15.3393 4.13564 15.3135C4.12344 15.311 4.11154 15.3076 4.09951 15.3047C4.07886 15.2998 4.05834 15.2944 4.03798 15.2881C4.02475 15.284 4.01191 15.279 3.99892 15.2744C3.98388 15.2691 3.96882 15.2639 3.954 15.2578C3.93004 15.248 3.90667 15.2372 3.88369 15.2256C3.87758 15.2225 3.87119 15.22 3.86513 15.2168C3.85391 15.2108 3.84289 15.2046 3.83193 15.1982C3.78624 15.1717 3.742 15.1418 3.70009 15.1074C3.6742 15.0862 3.6495 15.0637 3.62587 15.04L0.292865 11.707C-0.0976031 11.3165 -0.0976404 10.6835 0.292865 10.293C0.683393 9.90273 1.31649 9.90259 1.70693 10.293L3.3329 11.9189V1C3.33308 0.447902 3.78078 6.05239e-05 4.3329 0ZM13.0829 0C13.9006 5.66018e-05 14.6854 0.325168 15.2636 0.90332C15.8416 1.48139 16.1667 2.26557 16.1669 3.08301V6C16.1669 6.5521 15.7189 6.99971 15.1669 7C14.6146 7 14.1669 6.55228 14.1669 6V5.33398H11.9999V6C11.9999 6.55221 11.5521 6.99988 10.9999 7C10.4476 7 9.9999 6.55228 9.9999 6V3.08301C10.0001 2.26549 10.3251 1.4814 10.9032 0.90332C11.4814 0.325328 12.2654 8.61697e-05 13.0829 0ZM13.0829 2C12.7958 2.00009 12.5203 2.11446 12.3173 2.31738C12.1143 2.52039 12.0001 2.79592 11.9999 3.08301V3.33398H14.1669V3.08301C14.1667 2.796 14.0524 2.52038 13.8495 2.31738C13.6464 2.1143 13.3701 2.00006 13.0829 2Z" fill="#99A1AF"/>
                  </svg>
                )}
                className="w-[44px] px-0 flex-shrink-0"
                title={sortOrder === "alphabetical" ? "Sort by State" : "Sort A-Z"}
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
              const sortLabel = sortOrder === "state" ? "by state" : "alphabetically";
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
