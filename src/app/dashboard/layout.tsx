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
    Download,
    Contact
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
    { name: 'Посты', href: '/dashboard/posts', icon: Contact },
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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>

                {/* Header */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white">
                    <span className="text-lg font-semibold text-gray-900">Doors Admin</span>
                    <button
                        className="lg:hidden p-1 rounded-md hover:bg-gray-100"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${isActive
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                            <p className="text-xs text-gray-500">
                                {isSuperuser ? 'Суперадминистратор' : 'Администратор'}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                            title="Выйти"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>
                    <div className="ml-4 flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {navigation.find(item => item.href === pathname)?.name || 'Страница'}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700">{user?.username}</span>
                        <button
                            onClick={logout}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <ToastProvider>
                        <div className="p-6">
                            {children}
                        </div>
                    </ToastProvider>
                </main>
            </div>
        </div>
    );
}