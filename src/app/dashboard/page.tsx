'use client';

import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
    const { user, isSuperuser } = useAuth();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Заголовок */}
            <h1 className="text-xl font-medium mb-6 border-b pb-2">Панель управления</h1>

            {/* Статистика */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-gray-600">Продукты</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold">42</div>
                    <div className="text-sm text-gray-600">Бренды</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold">18</div>
                    <div className="text-sm text-gray-600">Категории</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold">7</div>
                    <div className="text-sm text-gray-600">Каталоги</div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="grid grid-cols-2 gap-8">
                {/* Пользователь */}
                <div>
                    <h2 className="font-medium mb-3">Пользователь</h2>
                    <div className="space-y-2 text-sm">
                        <div>ID: {user?.id}</div>
                        <div>Логин: {user?.username}</div>
                        <div>Email: {user?.email}</div>
                        <div>
                            Статус: {user?.is_active ? 'Активен' : 'Неактивен'}
                        </div>
                        <div>
                            Права: {isSuperuser ? 'Суперадминистратор' : 'Администратор'}
                        </div>
                        {user?.last_login && (
                            <div>
                                Последний вход: {new Date(user.last_login).toLocaleString('ru-RU')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Система */}
                <div>
                    <h2 className="font-medium mb-3">Система</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            API
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            База данных
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Redis
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                            Очередь задач
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}