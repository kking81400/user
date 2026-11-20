export interface Avatar {
  id: number;
  url?: string;
  image?: string;
}

/** پاسخ GET /user/home/profile/  (بعد از باز کردن data) */
export interface ProfileData {
  personal_info: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    location: string;
    badge: string;
  };
  order_stats: {
    active_orders: number;
    delivered_orders: number;
    returned_orders: number;
  };
}

/** مقادیری که فرم‌ها نگه می‌دارند (GET profile این‌ها را برنمی‌گرداند) */
export interface ExtraInfo {
  national_id?: string;
  birth_date?: string; // YYYY-MM-DD میلادی
  iban?: string;
  card_number?: string;
}

export interface PersonalInfoPayload {
  name: string;
  last_name: string;
  national_id: string;
  birth_date: string;
}

export interface FinancialInfoPayload {
  iban: string;
  card_number: string;
}


export interface Avatar {
  id: number;
  media_url: string;
  gender?: string;
  created_at?: string;
}

/** پاسخ GET /user/home/addresses */
export interface Address {
  id: number;
  title: string;
  phones: string;
  state_id?: number | string | null;
  state: string;
  city_id?: number | string | null;
  city: string;
  full_address: string;
  lat?: number | string | null;
  Lon?: number | string | null;
  postal_code: string;
  is_default?: boolean;
}

/** بدنه‌ی POST / PUT آدرس (نام فیلدها دقیقاً مطابق API، از جمله Lon با L بزرگ) */
export interface AddressPayload {
  title: string;
  phones: string;

  state: string;

  city: string;
  full_address: string;


  postal_code: string;
  is_default: boolean;
  state_id: number;
  city_id: number;
  lat: string;
  Lon: string;
}