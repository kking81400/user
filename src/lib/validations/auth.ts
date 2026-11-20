import { z } from "zod";
import { IR_PHONE_REGEX } from "@/lib/utils";

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "شماره تلفن را وارد کنید")
    .regex(IR_PHONE_REGEX, "شماره موبایل معتبر نیست"),
});
export type PhoneFormValues = z.infer<typeof phoneSchema>;

export const registerSchema = z.object({
  phone: z
    .string()
    .min(1, "شماره تلفن را وارد کنید")
    .regex(IR_PHONE_REGEX, "شماره موبایل معتبر نیست"),
  first_name: z
    .string()
    .min(2, "نام باید حداقل ۲ حرف باشد")
    .max(50, "نام خیلی طولانی است"),
  last_name: z
    .string()
    .min(2, "نام خانوادگی باید حداقل ۲ حرف باشد")
    .max(50, "نام خانوادگی خیلی طولانی است"),
  gender: z.enum(["male", "female"]).optional(),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const OTP_LENGTH = 6;

export const otpSchema = z.object({
  code: z
    .string()
    .length(OTP_LENGTH, `کد تایید باید ${OTP_LENGTH} رقم باشد`)
    .regex(/^\d+$/, "کد تایید فقط باید عدد باشد"),
});
export type OtpFormValues = z.infer<typeof otpSchema>;
