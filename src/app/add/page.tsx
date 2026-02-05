'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AddBroadcastFormData, AddBroadcastResponse } from '@/types/add';

export default function AddPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<AddBroadcastFormData>({
        broadcast_url: '',
        x_username: '',
        tags: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<AddBroadcastResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data: AddBroadcastResponse = await response.json();

            if (data.success) {
                setSuccess(data);
                // フォームをリセット
                setFormData({
                    broadcast_url: '',
                    x_username: '',
                    tags: '',
                });
            } else {
                setError(data.error || 'An error occurred');
            }
        } catch (err) {
            setError('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* ヘッダー */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        アーカイブを追加
                    </h1>
                    <p className="text-gray-600">
                        Xのライブ配信アーカイブURLを追加して、棚を育てましょう。
                    </p>
                </div>

                {/* フォーム */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* broadcast_url */}
                        <div>
                            <label
                                htmlFor="broadcast_url"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                アーカイブURL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="broadcast_url"
                                value={formData.broadcast_url}
                                onChange={(e) =>
                                    setFormData({ ...formData, broadcast_url: e.target.value })
                                }
                                placeholder="https://x.com/i/broadcasts/1234..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                例: https://x.com/i/broadcasts/1234567890
                            </p>
                        </div>

                        {/* x_username */}


                        {/* note_body */}


                        {/* x_username (Required) */}
                        <div className="mb-4">
                            <label
                                htmlFor="x_username"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                配信者のユーザー名
                            </label>
                            <input
                                type="text"
                                id="x_username"
                                value={formData.x_username}
                                onChange={(e) =>
                                    setFormData({ ...formData, x_username: e.target.value })
                                }
                                placeholder="@username または username"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* tags */}
                        <div>
                            <label
                                htmlFor="tags"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                タグ（任意）
                            </label>
                            <input
                                type="text"
                                id="tags"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({ ...formData, tags: e.target.value })
                                }
                                placeholder="ゲーム, 雑談, 歌枠"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                カンマ区切りで入力してください（最大10個）
                            </p>
                        </div>

                        {/* エラー表示 */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* 成功表示 */}
                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                                <p className="text-sm text-green-800 font-medium">
                                    ✓ アーカイブを追加しました！
                                </p>
                                {success.warning && (
                                    <p className="text-sm text-yellow-700">
                                        ⚠ {success.warning}
                                    </p>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <a
                                        href={`/b/${success.broadcast_id}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        アーカイブページを見る →
                                    </a>
                                    <span className="text-gray-400">|</span>
                                    <a href="/" className="text-sm text-blue-600 hover:underline">
                                        ホームに戻る →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* 送信ボタン */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.broadcast_url}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? '追加中...' : 'アーカイブを追加'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
