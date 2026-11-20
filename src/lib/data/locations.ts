/**
 * استان‌ها و شهرها از فایل public/iran-locations.json خوانده می‌شوند.
 * ساختار فایل: [{ id, name, cities: [{ id, name, lat, lon }] }]
 */
export const LOCATIONS_URL = "/iran-locations.json";

export interface City {
    id: number;
    name: string;
    lat: number | null;
    lon: number | null;
}

export interface Province {
    id: number;
    name: string;
    cities: City[];
}

interface RawCity {
    id: number;
    name: string;
    lat?: string | null;
    lon?: string | null;
}
interface RawProvince {
    id: number;
    name: string;
    cities?: RawCity[];
}

const toNum = (v?: string | null) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

/** تبدیل مختصات رشته‌ای به عدد و حذف شهرهای با شناسه‌ی تکراری (اولین مورد می‌ماند) */
export function normalizeLocations(raw: RawProvince[]): Province[] {
    return raw.map((p) => {
        const seen = new Set<number>();
        const cities: City[] = [];
        for (const c of p.cities ?? []) {
            if (seen.has(c.id)) continue;
            seen.add(c.id);
            cities.push({ id: c.id, name: c.name.trim(), lat: toNum(c.lat), lon: toNum(c.lon) });
        }
        return { id: p.id, name: p.name.trim(), cities };
    });
}

export async function fetchLocations(): Promise<Province[]> {
    const res = await fetch(LOCATIONS_URL);
    if (!res.ok) throw new Error("locations file not found");
    return normalizeLocations((await res.json()) as RawProvince[]);
}

type Key = { id?: number | string | null; name?: string | null };

/** پیدا کردن استان با شناسه (ترجیحاً) یا نام */
export function findProvince(list: Province[], key: Key): Province | undefined {
    if (key.id != null && key.id !== "") {
        const byId = list.find((p) => p.id === Number(key.id));
        if (byId) return byId;
    }
    return key.name ? list.find((p) => p.name === key.name) : undefined;
}

/** پیدا کردن شهر داخل یک استان با شناسه (ترجیحاً) یا نام */
export function findCity(province: Province, key: Key): City | undefined {
    if (key.id != null && key.id !== "") {
        const byId = province.cities.find((c) => c.id === Number(key.id));
        if (byId) return byId;
    }
    return key.name ? province.cities.find((c) => c.name === key.name) : undefined;
}