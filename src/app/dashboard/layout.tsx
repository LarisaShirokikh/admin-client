'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    Home,
    Package,
    Tag,
    FolderOpen,
    Layers,
    Video,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Download
} from 'lucide-react';
import { ToastProvider } from '@/lib/contexts/ToastContext';

const navigation = [
    { name: 'Главная', href: '/dashboard', icon: Home },
    { name: 'Продукты', href: '/dashboard/products', icon: Package },
    { name: 'Бренды', href: '/dashboard/brands', icon: Tag },
    { name: 'Категории', href: '/dashboard/categories', icon: FolderOpen },
    { name: 'Скрайпер', href: '/dashboard/scraper', icon: Download },
    { name: 'Каталоги', href: '/dashboard/catalogs', icon: Layers },
    { name: 'Видео', href: '/dashboard/videos', icon: Video },
    { name: 'Настройки', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout, isSuperuser } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="h-full">
            {/* Mobile sidebar */}
            <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />

                <div className="fixed inset-0 flex">
                    <div className="relative mr-16 flex w-full max-w-xs flex-1">
                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                            <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>

                        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                            <div className="flex h-16 shrink-0 items-center">
                                <h1 className="text-xl font-bold text-gray-900">Doors Admin</h1>
                            </div>
                            <nav className="flex flex-1 flex-col">
                                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <ul role="list" className="-mx-2 space-y-1">
                                            {navigation.map((item) => {
                                                const isActive = pathname === item.href;
                                                return (
                                                    <li key={item.name}>
                                                        <Link
                                                            href={item.href}
                                                            className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive
                                                                ? 'bg-gray-50 text-indigo-600'
                                                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                                                                }`}
                                                            onClick={() => setSidebarOpen(false)}
                                                        >
                                                            <item.icon className="h-6 w-6 shrink-0" />
                                                            {item.name}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
                    <div className="flex h-16 shrink-0 items-center">
                        <h1 className="text-xl font-bold text-gray-900">Doors Admin</h1>
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <li key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive
                                                        ? 'bg-gray-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <item.icon className="h-6 w-6 shrink-0" />
                                                    {item.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>

                            {/* User info and logout */}
                            <li className="-mx-6 mt-auto">
                                <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 border-t border-gray-200">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{user?.username}</div>
                                        <div className="text-xs text-gray-500">
                                            {isSuperuser ? 'Суперадмин' : 'Администратор'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        title="Выйти"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar for mobile */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Separator */}
                    <div className="h-6 w-px bg-gray-200 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                            {/* Current page indicator */}
                            <div className="flex items-center text-sm text-gray-500">
                                {navigation.find(item => item.href === pathname)?.name || 'Страница'}
                            </div>
                        </div>

                        <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
                            <div className="hidden sm:flex sm:items-center sm:gap-x-2">
                                <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                                <div className="text-xs text-gray-500">
                                    {isSuperuser ? 'Суперадмин' : 'Администратор'}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-x-2 text-sm text-gray-700 hover:text-red-600 transition-colors lg:hidden"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:block">Выйти</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    <ToastProvider>
                        <div className="px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </ToastProvider>
                </main>
            </div>
        </div>
    );
}