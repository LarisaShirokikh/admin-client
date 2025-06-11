'use client';

import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
    const { user, isSuperuser } = useAuth();

    return (
        <div>
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Главная</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Добро пожаловать в административную панель
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">📦</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Продукты</div>
                            <div className="text-2xl font-bold text-gray-900">1,247</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 font-semibold">🏷️</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Бренды</div>
                            <div className="text-2xl font-bold text-gray-900">42</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-semibold">📁</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Категории</div>
                            <div className="text-2xl font-bold text-gray-900">18</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span className="text-yellow-600 font-semibold">📊</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">Каталоги</div>
                            <div className="text-2xl font-bold text-gray-900">7</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User info */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Информация о пользователе
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID:</span>
                                <span className="font-medium">{user?.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Имя пользователя:</span>
                                <span className="font-medium">{user?.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium">{user?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Статус:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {user?.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Права:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${isSuperuser ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {isSuperuser ? 'Суперадминистратор' : 'Администратор'}
                                </span>
                            </div>
                            {user?.last_login && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Последний вход:</span>
                                    <span className="font-medium">
                                        {new Date(user.last_login).toLocaleString('ru-RU')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* System status */}
                <div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Статус системы
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                                <span className="text-sm text-gray-600">API подключено</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                                <span className="text-sm text-gray-600">База данных</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                                <span className="text-sm text-gray-600">Кеш Redis</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                                <span className="text-sm text-gray-600">Очередь задач</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    // test
}