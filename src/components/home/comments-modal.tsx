'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Heart, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http, unwrap } from '@/lib/api/http';
import { useAuthStore } from '@/store/auth-store';

interface CommentItem {
    id: number;
    user: {
        name: string;
        avatar?: string;
    };
    content: string;
    created_at?: string;
    likes_count?: number;
    is_liked?: boolean;
    parent_id?: number;
}

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reelId: number;
}

// ⚠️ آدرس لایک کامنت. اگر در بک‌اند آدرس دیگری دارد همین‌جا عوض کنید.
const commentLikeUrl = (reelId: number, commentId: number) =>
    `/user/reels/${reelId}/comments/${commentId}/like`;

// فاصله از پایین برای منوی ناوبری اپ. اگر می‌خواهید روی منو را هم بپوشاند، 'pb-0' بگذارید.
const BOTTOM_OFFSET_CLASS = 'pb-16';

/* ------------------------------ Helpers ------------------------------ */

const faNumber = new Intl.NumberFormat('fa-IR');
const toFa = (n: number) => faNumber.format(n);

function timeAgo(value?: string): string {
    if (!value) return '';
    const t = Date.parse(value);
    // اگر فرمت تاریخ قابل تبدیل نبود (مثلاً بک‌اند متن آماده فرستاده)، همان را نشان بده
    if (Number.isNaN(t)) return value;
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return 'همین الان';
    const m = Math.floor(s / 60);
    if (m < 60) return `${toFa(m)} دقیقه پیش`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${toFa(h)} ساعت پیش`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${toFa(d)} روز پیش`;
    if (d < 30) return `${toFa(Math.floor(d / 7))} هفته پیش`;
    if (d < 365) return `${toFa(Math.floor(d / 30))} ماه پیش`;
    return `${toFa(Math.floor(d / 365))} سال پیش`;
}

// پاسخ بک‌اند ممکن است آرایه، {items} یا {data} باشد؛ ساختار را حفظ می‌کنیم
function readList(res: any): CommentItem[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
    return [];
}

function writeList(res: any, list: CommentItem[]) {
    if (!res || Array.isArray(res)) return list;
    if (Array.isArray(res.items)) return { ...res, items: list };
    if (Array.isArray(res.data)) return { ...res, data: list };
    return list;
}

/* ------------------------------ Avatar ------------------------------ */

const Avatar = memo(function Avatar({
                                        src,
                                        name,
                                        size,
                                    }: {
    src?: string;
    name?: string;
    size: number;
}) {
    const [failed, setFailed] = useState(false);
    return (
        <div
            className="relative rounded-full overflow-hidden shrink-0 bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {src && !failed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt=""
                    width={size}
                    height={size}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{name?.[0] || 'U'}</span>
            )}
        </div>
    );
});

/* ------------------------------ Comment row ------------------------------ */

interface CommentRowProps {
    comment: CommentItem;
    rootId: number;
    isReply?: boolean;
    highlighted?: boolean;
    onReply: (comment: CommentItem, rootId: number) => void;
    onToggleLike: (comment: CommentItem) => void;
}

const CommentRow = memo(function CommentRow({
                                                comment,
                                                rootId,
                                                isReply = false,
                                                highlighted = false,
                                                onReply,
                                                onToggleLike,
                                            }: CommentRowProps) {
    const likes = comment.likes_count ?? 0;
    const pending = comment.id < 0; // کامنتی که هنوز به سرور نرسیده

    return (
        <div
            style={{ paddingInlineStart: isReply ? 64 : 16, paddingInlineEnd: 16 }}
            className={`flex items-start gap-3 py-2.5 transition-colors ${pending ? 'opacity-60' : ''} ${
                highlighted ? 'bg-zinc-100' : ''
            }`}
        >
            <Avatar src={comment.user?.avatar} name={comment.user?.name} size={isReply ? 28 : 36} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-zinc-900 truncate">
                        {comment.user?.name || 'کاربر'}
                    </span>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                        {pending ? 'در حال ارسال...' : timeAgo(comment.created_at)}
                    </span>
                </div>

                <p className="text-[13px] text-zinc-800 mt-0.5 leading-6 whitespace-pre-wrap break-words">
                    {comment.content}
                </p>

                <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-zinc-400">
                    {!pending && (
                        <button
                            type="button"
                            onClick={() => onReply(comment, rootId)}
                            className="hover:text-zinc-600 transition cursor-pointer"
                        >
                            پاسخ
                        </button>
                    )}
                    {likes > 0 && <span>{toFa(likes)} لایک</span>}
                </div>
            </div>

            {!pending && (
                <button
                    type="button"
                    onClick={() => onToggleLike(comment)}
                    aria-label={comment.is_liked ? 'حذف لایک' : 'لایک'}
                    className="shrink-0 p-1 -m-1 cursor-pointer active:scale-90 transition-transform"
                >
                    <Heart
                        className={`w-[18px] h-[18px] transition-colors ${
                            comment.is_liked ? 'text-red-500 fill-red-500' : 'text-zinc-400'
                        }`}
                    />
                </button>
            )}
        </div>
    );
});

/* ------------------------------ Skeleton ------------------------------ */

function CommentsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                        <div className="h-2.5 w-28 rounded bg-zinc-200" />
                        <div className="h-2.5 w-full rounded bg-zinc-100" />
                        <div className="h-2.5 w-2/3 rounded bg-zinc-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ------------------------------ Modal ------------------------------ */

export default function CommentsModal({ isOpen, onClose, reelId }: CommentsModalProps) {
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; name: string; rootId: number; mention: string } | null>(null);
    const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

    const [mounted, setMounted] = useState(isOpen);
    const [shown, setShown] = useState(false);

    const accessToken = useAuthStore((s) => s.accessToken);
    const me = useAuthStore((s) => (s as any).user) as any;
    const queryClient = useQueryClient();

    // reelId را هنگام بسته شدن نگه می‌داریم تا انیمیشن بسته شدن محتوای ریل دیگری را نشان ندهد
    const activeReelIdRef = useRef(reelId);
    if (isOpen) activeReelIdRef.current = reelId;
    const rid = activeReelIdRef.current;
    const queryKey = useMemo(() => ['reel-comments', rid], [rid]);

    const sheetRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const drag = useRef({ startY: 0, dy: 0, active: false });

    /* ---------- باز و بسته شدن با انیمیشن ---------- */
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
            return () => cancelAnimationFrame(id);
        }
        setShown(false);
        const t = setTimeout(() => {
            setMounted(false);
            setText('');
            setReplyTo(null);
            setExpanded(new Set());
        }, 300);
        return () => clearTimeout(t);
    }, [isOpen]);

    // قفل اسکرول صفحه پشت مودال + بستن با Escape
    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, onClose]);

    /* ---------- دریافت کامنت‌ها ---------- */
    const { data: response, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await http.get(`/user/reels/${rid}/comments`);
            return unwrap(res.data);
        },
        enabled: isOpen && Boolean(rid),
        staleTime: 1000 * 30,
    });

    const comments = useMemo(() => readList(response), [response]);
    const totalCount: number = (response as any)?.meta?.total ?? comments.length;

    // گروه‌بندی: کامنت‌های اصلی + پاسخ‌های هر کدام (مثل اینستاگرام یک سطح)
    const { roots, repliesByRoot } = useMemo(() => {
        const byId = new Map<number, CommentItem>();
        for (const c of comments) byId.set(c.id, c);

        const rootOf = (c: CommentItem): CommentItem => {
            let cur = c;
            let guard = 0;
            while (cur.parent_id && byId.has(cur.parent_id) && guard++ < 20) {
                cur = byId.get(cur.parent_id)!;
            }
            return cur;
        };

        const rootList: CommentItem[] = [];
        const map = new Map<number, CommentItem[]>();
        for (const c of comments) {
            if (!c.parent_id || !byId.has(c.parent_id)) {
                rootList.push(c);
                continue;
            }
            const root = rootOf(c);
            if (root.id === c.id) {
                rootList.push(c);
                continue;
            }
            const arr = map.get(root.id);
            if (arr) arr.push(c);
            else map.set(root.id, [c]);
        }
        return { roots: rootList, repliesByRoot: map };
    }, [comments]);

    /* ---------- ارسال کامنت (Optimistic) ---------- */
    const addComment = useMutation({
        mutationFn: async ({ content, parent_id }: { content: string; parent_id: number }) => {
            const res = await http.post(`/user/home/reels/${rid}/comments`, { content, parent_id });
            return unwrap(res.data);
        },
        onMutate: async ({ content, parent_id }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            const temp: CommentItem = {
                id: -Date.now(),
                user: {
                    name: me?.name || me?.user_name || 'شما',
                    avatar: me?.avatar || me?.profile_image || me?.avatar_url,
                },
                content,
                created_at: new Date().toISOString(),
                likes_count: 0,
                is_liked: false,
                parent_id: parent_id || undefined,
            };
            queryClient.setQueryData(queryKey, (old: any) => {
                const list = readList(old);
                return writeList(old, parent_id ? [...list, temp] : [temp, ...list]);
            });
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx) queryClient.setQueryData(queryKey, ctx.previous);
            alert('خطا در ارسال نظر. لطفاً دوباره تلاش کنید.');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    /* ---------- لایک کامنت (Optimistic) ---------- */
    const likeComment = useMutation({
        mutationFn: async ({ id, like }: { id: number; like: boolean }) => {
            const res = await http.post(commentLikeUrl(rid, id), { action: like ? 'like' : 'unlike' });
            return unwrap(res.data);
        },
        onMutate: async ({ id, like }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old: any) =>
                writeList(
                    old,
                    readList(old).map((c) =>
                        c.id === id
                            ? {
                                ...c,
                                is_liked: like,
                                likes_count: Math.max(0, (c.likes_count ?? 0) + (like ? 1 : -1)),
                            }
                            : c,
                    ),
                ),
            );
            return { previous };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx) queryClient.setQueryData(queryKey, ctx.previous);
        },
    });

    /* ---------- هندلرها ---------- */
    const replyToRef = useRef<typeof replyTo>(null);
    replyToRef.current = replyTo;

    // مثل اینستاگرام: کامنت هدف هایلایت می‌شود، @نام داخل فیلد می‌آید و فیلد فوکوس می‌گیرد
    const handleReply = useCallback((comment: CommentItem, rootId: number) => {
        const name = comment.user?.name || 'کاربر';
        const mention = `@${name} `;
        const prevMention = replyToRef.current?.mention;
        setReplyTo({ id: comment.id, name, rootId, mention });
        setText((t) => (t.trim() === '' || t === prevMention ? mention : t));
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (!el) return;
            el.focus();
            const end = el.value.length;
            el.setSelectionRange(end, end);
        });
    }, []);

    const cancelReply = useCallback(() => {
        const mention = replyToRef.current?.mention;
        setText((t) => (t === mention ? '' : t));
        setReplyTo(null);
    }, []);

    const { mutate: mutateLike } = likeComment;
    const handleToggleLike = useCallback(
        (comment: CommentItem) => {
            if (!accessToken) {
                alert('لطفاً برای لایک کردن وارد حساب کاربری خود شوید.');
                return;
            }
            mutateLike({ id: comment.id, like: !comment.is_liked });
        },
        [accessToken, mutateLike],
    );

    const toggleExpanded = useCallback((rootId: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(rootId)) next.delete(rootId);
            else next.add(rootId);
            return next;
        });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const content = text.trim();
        if (!content || (replyTo && content === replyTo.mention.trim())) return;

        if (!accessToken) {
            alert('لطفاً برای ارسال نظر وارد حساب کاربری خود شوید.');
            return;
        }

        addComment.mutate({ content, parent_id: replyTo?.id ?? 0 });

        // مثل اینستاگرام: فوراً پاک می‌شود و پاسخ‌های آن کامنت باز می‌شود
        if (replyTo) {
            const rootId = replyTo.rootId;
            setExpanded((prev) => new Set(prev).add(rootId));
        } else {
            listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setText('');
        setReplyTo(null);
    };

    /* ---------- کشیدن هدر به پایین برای بستن ---------- */
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        const el = sheetRef.current;
        if (!el) return;
        drag.current = { startY: e.clientY, dy: 0, active: true };
        e.currentTarget.setPointerCapture(e.pointerId);
        el.style.transition = 'none';
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current.active || !sheetRef.current) return;
        const dy = Math.max(0, e.clientY - drag.current.startY);
        drag.current.dy = dy;
        sheetRef.current.style.transform = `translateY(${dy}px)`;
    };

    const onPointerUp = () => {
        if (!drag.current.active || !sheetRef.current) return;
        const { dy } = drag.current;
        drag.current.active = false;
        sheetRef.current.style.transition = '';
        sheetRef.current.style.transform = '';
        if (dy > 120) onClose();
    };

    if (!mounted) return null;

    const myAvatar = me?.avatar || me?.profile_image || me?.avatar_url;
    const canSend = text.trim().length > 0 && !(replyTo && text.trim() === replyTo.mention.trim());

    return (
        <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="نظرات"
            className={`fixed inset-0 z-50 flex items-end justify-center ${BOTTOM_OFFSET_CLASS}`}
        >
            {/* پس‌زمینه */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
                    shown ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* شیت */}
            <div
                ref={sheetRef}
                className={`relative z-10 w-full max-w-md h-[72dvh] bg-white rounded-t-[28px] flex flex-col shadow-2xl overflow-hidden will-change-transform transition-transform duration-300 ease-out ${
                    shown ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {/* هدر (قابل کشیدن) */}
                <div
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="relative shrink-0 touch-none select-none border-b border-zinc-100"
                >
                    <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-300" />
                    <div className="relative flex items-center justify-center h-14">
                        <h2 className="text-[15px] font-bold text-zinc-900">
                            نظرات ({toFa(totalCount)})
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="بستن"
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 transition flex items-center justify-center cursor-pointer"
                        >
                            <X className="w-[18px] h-[18px] text-zinc-700" />
                        </button>
                    </div>
                </div>

                {/* لیست کامنت‌ها */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto overscroll-contain py-2"
                >
                    {isLoading ? (
                        <div className="px-4 pt-2">
                            <CommentsSkeleton />
                        </div>
                    ) : roots.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-1 text-zinc-400 py-10">
                            <p className="text-sm font-semibold text-zinc-600">هنوز نظری ثبت نشده</p>
                            <p className="text-xs">اولین نفری باشید که نظر می‌دهد.</p>
                        </div>
                    ) : (
                        roots.map((root) => {
                            const replies = repliesByRoot.get(root.id);
                            const isOpenReplies = expanded.has(root.id);
                            return (
                                <div key={root.id}>
                                    <CommentRow
                                        comment={root}
                                        highlighted={replyTo?.id === root.id}
                                        rootId={root.id}
                                        onReply={handleReply}
                                        onToggleLike={handleToggleLike}
                                    />

                                    {replies && replies.length > 0 && (
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpanded(root.id)}
                                                style={{ paddingInlineStart: 64 }}
                                                className="flex items-center gap-3 py-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 transition cursor-pointer"
                                            >
                                                <span className="w-6 h-px bg-zinc-300" />
                                                {isOpenReplies
                                                    ? 'پنهان کردن پاسخ‌ها'
                                                    : `مشاهده ${toFa(replies.length)} پاسخ`}
                                            </button>

                                            {isOpenReplies && (
                                                <div>
                                                    {replies.map((reply) => (
                                                        <CommentRow
                                                            key={reply.id}
                                                            comment={reply}
                                                            highlighted={replyTo?.id === reply.id}
                                                            rootId={root.id}
                                                            isReply
                                                            onReply={handleReply}
                                                            onToggleLike={handleToggleLike}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* نوار «در حال پاسخ به» */}
                {replyTo && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-100 border-t border-zinc-200/70 text-xs text-zinc-500 shrink-0">
                        <span className="truncate">
                            در حال پاسخ دادن به <b className="text-zinc-800">{replyTo.name}</b>
                        </span>
                        <button
                            type="button"
                            onClick={cancelReply}
                            aria-label="لغو پاسخ"
                            className="p-1 text-zinc-500 hover:text-red-500 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* فرم ارسال */}
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-3 px-4 py-2.5 bg-white border-t border-zinc-100 shrink-0"
                >
                    <Avatar src={myAvatar} name={me?.name} size={36} />

                    <div className="flex-1 flex items-center bg-zinc-100 rounded-full ps-4 pe-1.5 py-1.5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={replyTo ? `پاسخ به ${replyTo.name}...` : 'افزودن نظر...'}
                            enterKeyHint="send"
                            autoComplete="off"
                            maxLength={500}
                            className="flex-1 min-w-0 bg-transparent text-[13px] text-zinc-900 placeholder:text-zinc-400 py-1.5 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!canSend}
                            aria-label="ارسال"
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
                                canSend
                                    ? 'bg-amber-900 text-white hover:bg-amber-800 cursor-pointer active:scale-95'
                                    : 'bg-amber-900/40 text-white/80 cursor-not-allowed'
                            }`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}