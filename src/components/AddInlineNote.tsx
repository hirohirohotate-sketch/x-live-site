'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddInlineNoteProps {
    broadcastId: string;
    variant?: 'prominent' | 'compact';
}

export default function AddInlineNote({
    broadcastId,
    variant = 'compact',
}: AddInlineNoteProps) {
    const router = useRouter();
    const [body, setBody] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!body.trim()) {
            setMessage({ type: 'error', text: 'メモの本文を入力してください' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/notes/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    broadcast_id: broadcastId,
                    body: body.trim(),
                    tags: tags.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (data.error === 'duplicate note') {
                    setMessage({
                        type: 'error',
                        text: '同じメモが既に追加されています（1分以内）',
                    });
                } else {
                    setMessage({
                        type: 'error',
                        text: `エラー: ${data.error || '保存に失敗しました'}`,
                    });
                }
                return;
            }

            // 成功時
            setBody('');
            setTags('');
            setMessage({ type: 'success', text: '✅ 追加しました' });

            // ページを更新してメモ一覧を再取得
            router.refresh();

            // 成功メッセージを3秒後に消す
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error adding note:', error);
            setMessage({ type: 'error', text: 'エラー: ネットワークエラーが発生しました' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isProminent = variant === 'prominent';

    return (
        <div
            className={`bg-white rounded-lg border ${isProminent
                    ? 'border-blue-200 shadow-md p-8'
                    : 'border-gray-200 shadow-sm p-6'
                }`}
        >
            <h3
                className={`font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isProminent ? 'text-xl' : 'text-lg'
                    }`}
            >
                <span>📝</span>
                このアーカイブにメモを追加
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* メモ本文 */}
                <div>
                    <label htmlFor="note-body" className="block text-sm font-medium text-gray-700 mb-1">
                        メモ
                    </label>
                    <textarea
                        id="note-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="配信の感想や、気になったポイントをメモしましょう..."
                        rows={isProminent ? 4 : 3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={isSubmitting}
                    />
                </div>

                {/* タグ */}
                <div>
                    <label htmlFor="note-tags" className="block text-sm font-medium text-gray-700 mb-1">
                        タグ（任意・カンマ区切り）
                    </label>
                    <input
                        id="note-tags"
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="例: 雑談, ゲーム実況, 初見歓迎"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                    />
                </div>

                {/* メッセージ */}
                {message && (
                    <div
                        className={`px-4 py-2 rounded-lg text-sm ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* 送信ボタン */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !body.trim()}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${isSubmitting || !body.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? '追加中...' : '追加する'}
                    </button>
                </div>
            </form>
        </div>
    );
}
