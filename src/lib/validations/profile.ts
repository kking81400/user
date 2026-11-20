import { z } from "zod";

const toEnglishDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export const normalizeDigits = toEnglishDigits;

export function isValidNationalId(value: string) {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return false;
  const check = Number(value[9]);
  const sum = value
    .slice(0, 9)
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const r = sum % 11;
  return r < 2 ? check === r : check === 11 - r;
}

export const personalInfoSchema = z.object({
  name: z.string().trim().min(2, "نام را وارد کنید"),
  last_name: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  national_id: z
    .string()
    .transform(toEnglishDigits)
    .refine(isValidNationalId, "کد ملی معتبر نیست"),
  birth_date: z.string().min(1, "تاریخ تولد را انتخاب کنید"),
});
export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const financialInfoSchema = z.object({
  iban: z
    .string()
    .transform((v) => toEnglishDigits(v).replace(/\s/g, "").toUpperCase())
    .refine((v) => /^IR\d{24}$/.test(v), "شماره شبا باید با IR شروع شود و ۲۴ رقم داشته باشد"),
  card_number: z
    .string()
    .transform((v) => toEnglishDigits(v).replace(/\s/g, ""))
    .refine((v) => /^\d{16}$/.test(v), "شماره کارت باید ۱۶ رقم باشد"),
});
export type FinancialInfoValues = z.infer<typeof financialInfoSchema>;

export const addressSchema = z.object({
  title: z.string().trim().min(2, "عنوان آدرس را وارد کنید"),
  phones: z
      .string()
      .transform(toEnglishDigits)
      .refine((v) => /^0\d{10}$/.test(v), "شماره تماس معتبر نیست (مثال: 09123456789)"),
  state_id: z.string().min(1, "استان را انتخاب کنید"),
  city_id: z.string().min(1, "شهر را انتخاب کنید"),
  full_address: z.string().trim().min(10, "آدرس دقیق را کامل‌تر وارد کنید"),
  postal_code: z
      .string()
      .transform(toEnglishDigits)
      .refine((v) => /^\d{10}$/.test(v), "کد پستی باید ۱۰ رقم باشد"),
  is_default: z.boolean(),
});
export type AddressValues = z.infer<typeof addressSchema>;

