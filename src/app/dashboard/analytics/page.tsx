'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3, Eye, MousePointerClick, Monitor, TrendingUp,
    ArrowUpRight, ArrowDownRight, Users, Clock,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { analyticsApi } from '@/lib/api/analytics';

const COLORS = {
    view: '#10b981',
    impression: '#8b5cf6',
    interaction: '#f59e0b',
    primary: '#3b82f6',
};

export default function AnalyticsPage() {
    const [days, setDays] = useState(7);

    const { data: summary, isLoading: loadingSummary } = useQuery({
        queryKey: ['analytics-summary', days],
        queryFn: () => analyticsApi.getSummary(days),
    });

    const { data: topProducts = [], isLoading: loadingTop } = useQuery({
        queryKey: ['analytics-top', days],
        queryFn: () => analyticsApi.getTopProducts(days, 10),
    });

    const { data: rankings = [] } = useQuery({
        queryKey: ['analytics-rankings'],
        queryFn: () => analyticsApi.getRankings(10),
    });

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!summary?.daily) return [];
        const map = new Map<string, { date: string; views: number; impressions: number; interactions: number; total: number }>();

        summary.daily.forEach((item: { date: string; event_type: string; count: number }) => {
            if (!map.has(item.date)) {
                const d = new Date(item.date);
                const label = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
                map.set(item.date, { date: label, views: 0, impressions: 0, interactions: 0, total: 0 });
            }
            const entry = map.get(item.date)!;
            if (item.event_type === 'view') entry.views = item.count;
            if (item.event_type === 'impression') entry.impressions = item.count;
            if (item.event_type === 'interaction') entry.interactions = item.count;
            entry.total = entry.views + entry.impressions + entry.interactions;
        });

        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v);
    }, [summary]);

    // Pie data
    const pieData = useMemo(() => {
        if (!summary?.totals) return [];
        return [
            { name: 'Просмотры', value: summary.totals.view || 0, color: COLORS.view },
            { name: 'Показы', value: summary.totals.impression || 0, color: COLORS.impression },
            { name: 'Взаимодействия', value: summary.totals.interaction || 0, color: COLORS.interaction },
        ].filter(d => d.value > 0);
    }, [summary]);

    // Top products bar data
    const topBarData = useMemo(() => {
        return topProducts.slice(0, 8).map((p: any) => ({
            name: p.name.length > 25 ? p.name.slice(0, 25) + '...' : p.name,
            views: p.views,
            impressions: p.impressions,
            interactions: p.interactions,
        }));
    }, [topProducts]);

    const totalViews = summary?.totals?.view || 0;
    const totalImpressions = summary?.totals?.impression || 0;
    const totalInteractions = summary?.totals?.interaction || 0;
    const totalAll = totalViews + totalImpressions + totalInteractions;
    const ctr = totalImpressions > 0 ? ((totalViews / totalImpressions) * 100).toFixed(1) : '0';

    if (loadingSummary) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Загрузка аналитики...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                        Аналитика
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Статистика посещений и взаимодействий</p>
                </div>
                <div className="flex items-center gap-2">
                    {[1, 7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${days === d
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'bg-white border text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {d === 1 ? 'Сегодня' : `${d} дн`}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-5 gap-4">
                <KpiCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    label="Всего событий"
                    value={totalAll}
                    color="blue"
                />
                <KpiCard
                    icon={<Eye className="w-5 h-5" />}
                    label="Просмотры страниц"
                    value={totalViews}
                    color="green"
                    subtitle="детальные просмотры"
                />
                <KpiCard
                    icon={<Monitor className="w-5 h-5" />}
                    label="Показы карточек"
                    value={totalImpressions}
                    color="purple"
                    subtitle="в каталоге"
                />
                <KpiCard
                    icon={<MousePointerClick className="w-5 h-5" />}
                    label="Взаимодействия"
                    value={totalInteractions}
                    color="orange"
                    subtitle="клики, галерея"
                />
                <KpiCard
                    icon={<Users className="w-5 h-5" />}
                    label="Сессий"
                    value={summary?.unique_sessions || 0}
                    color="slate"
                    subtitle={`CTR ${ctr}%`}
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-3 gap-4">
                {/* Area chart - main */}
                <div className="col-span-2 bg-white rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Динамика по дням</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.view} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.view} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gImpressions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.impression} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.impression} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gInteractions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.interaction} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.interaction} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                                    labelStyle={{ fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="views" name="Просмотры" stroke={COLORS.view} fill="url(#gViews)" strokeWidth={2} />
                                <Area type="monotone" dataKey="impressions" name="Показы" stroke={COLORS.impression} fill="url(#gImpressions)" strokeWidth={2} />
                                <Area type="monotone" dataKey="interactions" name="Взаимодействия" stroke={COLORS.interaction} fill="url(#gInteractions)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">Нет данных за выбранный период</div>
                    )}
                </div>

                {/* Pie chart */}
                <div className="bg-white rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Распределение событий</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => typeof v === 'number' ? v.toLocaleString('ru') : v} />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">Нет данных</div>
                    )}
                </div>
            </div>

            {/* Two columns: Top products + Rankings */}
            <div className="grid grid-cols-2 gap-4">
                {/* Top products chart */}
                <div className="bg-white rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Топ товаров по активности
                    </h3>
                    {topBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={topBarData} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                                <Bar dataKey="views" name="Просмотры" fill={COLORS.view} radius={[0, 2, 2, 0]} stackId="a" />
                                <Bar dataKey="impressions" name="Показы" fill={COLORS.impression} radius={[0, 2, 2, 0]} stackId="a" />
                                <Bar dataKey="interactions" name="Клики" fill={COLORS.interaction} radius={[0, 4, 4, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">Нет данных</div>
                    )}
                </div>

                {/* Rankings table */}
                <div className="bg-white rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Рейтинг товаров
                    </h3>
                    <div className="space-y-2">
                        {rankings.length === 0 && (
                            <div className="text-center py-12 text-gray-400">Нет данных о рейтинге</div>
                        )}
                        {rankings.map((r: any, idx: number) => {
                            const maxScore = rankings[0]?.ranking_score || 1;
                            const pct = (r.ranking_score / maxScore) * 100;
                            return (
                                <div key={r.product_id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        idx === 1 ? 'bg-gray-100 text-gray-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-50 text-gray-400'
                                        }`}>
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{r.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-500 w-10 text-right">
                                                {r.ranking_score.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">{r.impressions_count} показов</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Detailed top products table */}
            {topProducts.length > 0 && (
                <div className="bg-white rounded-lg overflow-hidden">
                    <div className="px-5 py-4">
                        <h3 className="text-sm font-semibold text-gray-700">Детальная статистика по товарам</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">#</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Товар</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Просмотры</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Показы</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Клики</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">CTR</th>
                                <th className="text-right px-5 py-3 font-medium text-gray-500">Всего</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((p: any, idx: number) => {
                                const productCtr = p.impressions > 0 ? ((p.views / p.impressions) * 100).toFixed(1) : '\u2014';
                                return (
                                    <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 text-gray-400 font-mono">{idx + 1}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-gray-900 truncate max-w-sm">{p.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{p.slug}</div>
                                        </td>
                                        <td className="text-right px-5 py-3">
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <Eye className="w-3 h-3" />
                                                {p.views}
                                            </span>
                                        </td>
                                        <td className="text-right px-5 py-3">
                                            <span className="text-purple-600">{p.impressions}</span>
                                        </td>
                                        <td className="text-right px-5 py-3">
                                            <span className="text-orange-600">{p.interactions}</span>
                                        </td>
                                        <td className="text-right px-5 py-3">
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${productCtr !== '\u2014' && parseFloat(productCtr) > 10
                                                ? 'bg-green-50 text-green-700'
                                                : 'text-gray-500'
                                                }`}>
                                                {productCtr}{productCtr !== '\u2014' ? '%' : ''}
                                            </span>
                                        </td>
                                        <td className="text-right px-5 py-3 font-bold text-gray-900">{p.total_events}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function KpiCard({ icon, label, value, color, subtitle }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    subtitle?: string;
}) {
    const styles: Record<string, { bg: string; icon: string; border: string }> = {
        blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-100' },
        green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-100' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
        orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
        slate: { bg: 'bg-slate-50', icon: 'text-slate-500', border: 'border-slate-100' },
    };
    const s = styles[color] || styles.blue;

    return (
        <div className={`bg-white border rounded-lg p-4 ${s.border}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${s.bg} ${s.icon}`}>{icon}</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('ru')}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
    );
}