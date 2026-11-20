"use client";

import * as React from "react";
import { Pencil, X } from "lucide-react";
import { useAvatars, useUpdateAvatar } from "@/hooks/use-profile";
import type { Avatar, ProfileData } from "@/types/profile";
import { cn } from "@/lib/utils";
import { outlineBtn } from "./ui";

const avatarSrc = (a?: Avatar) => a?.media_url;

export function AvatarSection({ info }: { info: ProfileData["personal_info"] }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<number | null>(null);
  const avatars = useAvatars(open);
  const update = useUpdateAvatar();
  const current = info.avatar_url;
  const fullName = `${info.first_name} ${info.last_name}`.trim();

  const openPicker = () => {
    setSelected(null);
    setOpen(true);
  };

  const confirm = () => {
    if (selected == null) return;
    update.mutate(selected, { onSuccess: () => setOpen(false) });
  };

  return (
      <>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="size-28 overflow-hidden rounded-full border border-[color:var(--pf-border)] bg-[color:var(--pf-muted)] sm:size-32">
              {current ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current} alt="تصویر پروفایل" className="size-full object-cover" />
              ) : (
                  <span className="flex size-full items-center justify-center text-3xl font-semibold text-[color:var(--pf-brand-text)]">
                {info.first_name?.[0] ?? "؟"}
              </span>
              )}
            </div>
            <button
                type="button"
                onClick={openPicker}
                aria-label="ویرایش تصویر"
                className="absolute bottom-0 end-0 flex size-9 items-center justify-center rounded-full border border-[color:var(--pf-border)] bg-[color:var(--pf-card)] text-[color:var(--pf-brand-text)]"
            >
              <Pencil className="size-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <h2 className="text-xl font-semibold text-[color:var(--pf-text)]">{fullName || "کاربر"}</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              {info.badge && (
                  <span className="rounded-full bg-[color:var(--pf-brand-soft)] px-3 py-1 text-[color:var(--pf-brand-text)]">
                {info.badge}
              </span>
              )}
              {info.location && (
                  <span className="text-[color:var(--pf-text-muted)]">{info.location}</span>
              )}
            </div>
            <button type="button" onClick={openPicker} className={cn(outlineBtn, "h-11 px-5")}>
              تغییر تصویر
            </button>
          </div>
        </div>

        {open && (
            <div
                className="fixed inset-0 z-[100] flex items-end justify-center bg-[color:var(--pf-overlay)] p-0 sm:items-center sm:p-4"
                onClick={() => setOpen(false)}
            >
              <div
                  role="dialog"
                  aria-modal="true"
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-[color:var(--pf-card)] p-5 sm:max-w-lg sm:rounded-3xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-[color:var(--pf-text)]">انتخاب تصویر</h3>
                  <button onClick={() => setOpen(false)} aria-label="بستن" className="text-[color:var(--pf-text-muted)]">
                    <X className="size-5" />
                  </button>
                </div>

                {avatars.isLoading && <p className="py-8 text-center text-sm text-[color:var(--pf-text-faint)]">در حال بارگذاری...</p>}
                {avatars.isError && <p className="py-8 text-center text-sm text-[color:var(--pf-danger)]">دریافت تصاویر ناموفق بود</p>}

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {(avatars.data ?? []).map((a) => (
                      <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelected(a.id)}
                          className={cn(
                              "aspect-square overflow-hidden rounded-full border-2 transition",
                              selected === a.id
                                  ? "border-[color:var(--pf-brand)] ring-2 ring-[color:var(--pf-ring)]"
                                  : "border-transparent hover:border-[color:var(--pf-border)]"
                          )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarSrc(a)} alt="" className="size-full object-cover" />
                      </button>
                  ))}
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={() => setOpen(false)} className={cn(outlineBtn, "h-11")}>
                    انصراف
                  </button>
                  <button
                      type="button"
                      disabled={selected == null || update.isPending}
                      onClick={confirm}
                      className="inline-flex h-11 items-center rounded-xl bg-[color:var(--pf-brand)] px-6 text-sm text-[color:var(--pf-on-brand)] disabled:opacity-60"
                  >
                    {update.isPending ? "در حال ذخیره..." : "تایید"}
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  );
}