'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { scraperApi, scraperUtils, ScraperType } from '@/lib/api/scraper';
import {
    Download,
    Play,
    Square,
    Eye,
    AlertCircle,
    Clock,
    RefreshCw,
    ExternalLink,
    Trash2,
    Activity,
    RotateCw,  // Заменяем Sync на RotateCw
    CheckCircle,
    XCircle
} from 'lucide-react';
import { useToast } from '@/lib/contexts/ToastContext';

// Обновленные типы скрайперов с использованием ScraperType
const SCRAPER_TYPES = [
    {
        id: 'labirint' as ScraperType,
        name: 'Лабиринт Дорс',
        description: 'Парсинг каталогов дверей Лабиринт Дорс',
        color: 'bg-blue-500',
        placeholder: 'https://labirintdoors.ru/katalog/...',
        examples: [
            'https://labirintdoors.ru/katalog/royal',
            'https://labirintdoors.ru/katalog/classic'
        ]
    },
    {
        id: 'bunker' as ScraperType,
        name: 'Bunker Doors',
        description: 'Парсинг каталогов дверей Bunkerdoors.ru',
        color: 'bg-green-500',
        placeholder: 'https://bunkerdoors.ru/prod/...',
        examples: [
            'https://bunkerdoors.ru/prod/bunker-hit/bn-02',
            'https://bunkerdoors.ru/prod/bunker-premium/'
        ]
    },
    {
        id: 'intecron' as ScraperType,
        name: 'Интекрон',
        description: 'Парсинг каталогов дверей Intecron-msk.ru',
        color: 'bg-purple-500',
        placeholder: 'https://intecron-msk.ru/catalog/intekron/...',
        examples: [
            'https://intecron-msk.ru/catalog/intekron/sparta_white/',
            'https://intecron-msk.ru/catalog/intekron/sparta_black/'
        ]
    },
    {
        id: 'as-doors' as ScraperType,
        name: 'AS-Doors',
        description: 'Парсинг каталогов дверей AS-doors.ru',
        color: 'bg-orange-500',
        placeholder: 'https://as-doors.ru/onstock/...',
        examples: [
            'https://as-doors.ru/onstock/',
            'https://as-doors.ru/catalog/metallicheskie-dveri/'
        ]
    }
];

// Обновленные интерфейсы
interface TaskResult {
    message?: string;
    processed_items?: number;
    errors?: string[];
}

interface Task {
    id: string;
    taskId?: string; // API task ID
    type: string;
    status: 'running' | 'completed' | 'failed' | 'pending';
    urls: string[];
    startTime: Date;
    progress?: number;
    result?: TaskResult;
    error?: string;
}

interface SystemStatus {
    ready: boolean;
    user_tasks: number;
    max_user_tasks: number;
    total_tasks: number;
    max_total_tasks: number;
    can_start_task: boolean;
    issues: Array<{
        type: string;
        message: string;
        action: string;
    }>;
}

export default function ScraperPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();
    const [activeTasks, setActiveTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [syncing, setSyncing] = useState<boolean>(false);

    // Состояние для каждого скрайпера
    const [scraperStates, setScraperStates] = useState<{ [key: string]: { urls: string[], showExamples: boolean } }>(() => {
        const initialStates: { [key: string]: { urls: string[], showExamples: boolean } } = {};
        SCRAPER_TYPES.forEach(scraper => {
            initialStates[scraper.id] = { urls: [''], showExamples: false };
        });
        return initialStates;
    });

    // Загрузка статуса системы
    const loadSystemStatus = useCallback(async () => {
        try {
            const response = await scraperApi.checkReadiness();
            setSystemStatus({
                ready: response.ready,
                user_tasks: response.limits.user_tasks,
                max_user_tasks: response.limits.max_user_tasks,
                total_tasks: response.limits.total_tasks,
                max_total_tasks: response.limits.max_total_tasks,
                can_start_task: response.limits.can_start_task,
                issues: response.issues
            });

            // Автоматически очищаем локальные задачи если на сервере их нет
            if (response.limits.total_tasks === 0 && activeTasks.length > 0) {
                console.log('No active tasks on server, clearing local tasks');
                setActiveTasks([]);
                showToast('info', 'Список задач синхронизирован с сервером');
            }
        } catch (error) {
            console.error('Error loading system status:', error);
        }
    }, [activeTasks.length, showToast]);

    // Проверка статусов активных задач
    const checkTaskStatuses = useCallback(async () => {
        const tasksToUpdate = activeTasks.filter(task =>
            task.taskId && (task.status === 'running' || task.status === 'pending')
        );

        for (const task of tasksToUpdate) {
            try {
                const status = await scraperApi.getScraperStatus(task.taskId!);

                setActiveTasks(prev => prev.map(t => {
                    if (t.id === task.id) {
                        return {
                            ...t,
                            status: status.status === 'SUCCESS' ? 'completed' :
                                status.status === 'FAILURE' ? 'failed' :
                                    status.status === 'PENDING' ? 'pending' : 'running',
                            progress: status.progress,
                            result: status.result,
                            error: status.error
                        };
                    }
                    return t;
                }));

                // Если задача завершена, показываем уведомление
                if (status.status === 'SUCCESS' || status.status === 'FAILURE') {
                    const taskName = task.type;
                    if (status.status === 'SUCCESS') {
                        showToast('success', `Задача "${taskName}" завершена успешно`);
                    } else {
                        showToast('error', `Задача "${taskName}" завершилась с ошибкой`);
                    }
                }
            } catch (error) {
                console.error(`Error checking status for task ${task.id}:`, error);
            }
        }
    }, [activeTasks, showToast]);

    // Автоматическое обновление статусов
    useEffect(() => {
        // Загружаем статус системы при загрузке
        loadSystemStatus();

        // Периодическое обновление
        const interval = setInterval(() => {
            loadSystemStatus();
            checkTaskStatuses();
        }, 10000); // Каждые 10 секунд

        return () => clearInterval(interval);
    }, [loadSystemStatus, checkTaskStatuses]);

    // Ручная синхронизация с сервером
    const syncWithServer = async () => {
        setSyncing(true);
        try {
            const syncResult = await scraperApi.syncTasks();
            await loadSystemStatus();

            showToast('success', `Синхронизация завершена. Задач пользователя: ${syncResult.after.user_tasks}, всего: ${syncResult.after.total_tasks}`);

            // Если на сервере нет активных задач, очищаем локальные
            if (syncResult.after.total_tasks === 0) {
                setActiveTasks([]);
            }
        } catch (error) {
            console.error('Error syncing with server:', error);
            showToast('error', 'Ошибка синхронизации с сервером');
        } finally {
            setSyncing(false);
        }
    };

    // Очистить мои задачи
    const cleanupMyTasks = async () => {
        setSyncing(true);
        try {
            const result = await scraperApi.cleanupMyTasks();
            await loadSystemStatus();
            setActiveTasks([]); // Очищаем локальные задачи
            showToast('success', `Очищено ${result.cleaned_tasks} задач`);
        } catch (error) {
            console.error('Error cleaning up tasks:', error);
            showToast('error', 'Ошибка очистки задач');
        } finally {
            setSyncing(false);
        }
    };

    // Добавить URL
    const addUrl = (scraperId: string) => {
        setScraperStates(prev => ({
            ...prev,
            [scraperId]: {
                ...prev[scraperId],
                urls: [...prev[scraperId].urls, '']
            }
        }));
    };

    // Удалить URL
    const removeUrl = (scraperId: string, index: number) => {
        setScraperStates(prev => ({
            ...prev,
            [scraperId]: {
                ...prev[scraperId],
                urls: prev[scraperId].urls.filter((_, i) => i !== index)
            }
        }));
    };

    // Обновить URL
    const updateUrl = (scraperId: string, index: number, value: string) => {
        setScraperStates(prev => ({
            ...prev,
            [scraperId]: {
                ...prev[scraperId],
                urls: prev[scraperId].urls.map((url, i) => i === index ? value : url)
            }
        }));
    };

    // Использовать пример
    const applyExample = (scraperId: string, exampleUrl: string) => {
        const emptyIndex = scraperStates[scraperId].urls.findIndex(url => url === '');
        if (emptyIndex !== -1) {
            updateUrl(scraperId, emptyIndex, exampleUrl);
        } else {
            setScraperStates(prev => ({
                ...prev,
                [scraperId]: {
                    ...prev[scraperId],
                    urls: [...prev[scraperId].urls, exampleUrl]
                }
            }));
        }
    };

    // ОБНОВЛЕННАЯ функция запуска скрайпера с проверкой готовности
    const startScraper = async (scraperId: ScraperType) => {
        // Сначала проверяем готовность системы
        await loadSystemStatus();

        if (systemStatus && !systemStatus.can_start_task) {
            if (systemStatus.issues.length > 0) {
                showToast('warning', systemStatus.issues[0].message);
                return;
            }
            showToast('warning', 'Система не готова к запуску новых задач');
            return;
        }

        const scraper = SCRAPER_TYPES.find(s => s.id === scraperId);
        if (!scraper) return;

        const inputUrls = scraperStates[scraperId].urls.filter(url => url.trim() !== '');
        if (inputUrls.length === 0) {
            showToast('warning', 'Добавьте хотя бы один URL');
            return;
        }

        // Нормализуем URL
        const normalizedUrls = scraperUtils.normalizeUrls(scraperId, inputUrls);

        // Валидируем URL
        const { valid, invalid } = scraperUtils.validateUrls(scraperId, normalizedUrls);

        if (invalid.length > 0) {
            showToast('warning', `Найдены некорректные URL: ${invalid.join(', ')}. Будут использованы только валидные URL.`);
            console.warn('Invalid URLs:', invalid);
        }

        if (valid.length === 0) {
            showToast('error', 'Нет валидных URL для парсинга');
            return;
        }

        setLoading(prev => ({ ...prev, [scraperId]: true }));

        try {
            console.log(`Starting ${scraper.name} scraper with URLs:`, valid);
            const response = await scraperApi.startScraper(scraperId, valid);

            // Добавляем задачу в список активных
            const newTask: Task = {
                id: `task_${Date.now()}`,
                taskId: response.task_id,
                type: scraper.name,
                status: 'running',
                urls: valid,
                startTime: new Date(),
                progress: 0
            };

            setActiveTasks(prev => [...prev, newTask]);

            // Очищаем поля
            setScraperStates(prev => ({
                ...prev,
                [scraperId]: { ...prev[scraperId], urls: [''] }
            }));

            // Обновляем статус системы
            await loadSystemStatus();

            showToast('success', `Скрайпер "${scraper.name}" запущен успешно!`);

        } catch (error: unknown) {
            console.error('Error starting scraper:', error);

            // Обрабатываем ошибки лимитов
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { detail?: string };
                        status?: number;
                    };
                };
                if (axiosError.response?.status === 429) {
                    showToast('warning', 'Превышен лимит задач. Дождитесь завершения текущих задач или используйте синхронизацию.');
                    return;
                }

                // Обрабатываем другие HTTP ошибки
                if (axiosError.response?.data?.detail) {
                    showToast('error', axiosError.response.data.detail);
                    return;
                }
            }

            // Обрабатываем обычные ошибки
            if (error instanceof Error) {
                showToast('error', `Ошибка запуска скрайпера: ${error.message}`);
            } else {
                showToast('error', 'Неизвестная ошибка при запуске скрайпера');
            }
        } finally {
            setLoading(prev => ({ ...prev, [scraperId]: false }));
        }
    };

    // Остановить задачу (пока только локально)
    const stopTask = (taskId: string) => {
        setActiveTasks(prev => prev.filter(task => task.id !== taskId));
    };

    // Показать детали задачи
    const showTaskDetails = async (task: Task) => {
        if (!task.taskId) {
            alert('ID задачи не найден');
            return;
        }

        try {
            const status = await scraperApi.getScraperStatus(task.taskId);
            const details = `
Статус: ${status.status}
Прогресс: ${status.progress || 0}%
${status.error ? `Ошибка: ${status.error}` : ''}
${status.result ? `Результат: ${JSON.stringify(status.result, null, 2)}` : ''}
            `;
            alert(details);
        } catch (error: unknown) {
            console.error('Error getting task details:', error);

            let errorMessage = 'Ошибка получения данных о задаче';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { detail?: string };
                        status?: number;
                    };
                };
                if (axiosError.response?.data?.detail) {
                    errorMessage = axiosError.response.data.detail;
                }
            }

            alert(errorMessage);
        }
    };

    // Получить активные задачи (для суперадмина)
    const loadActiveTasks = async () => {
        if (!isSuperuser) {
            showToast('error', 'Нет прав для просмотра активных задач');
            return;
        }

        try {
            const response = await scraperApi.getActiveTasks();
            console.log('Active tasks:', response);
            showToast('success', `Найдено ${response.total_active_tasks} активных задач`);
        } catch (error: unknown) {
            console.error('Error loading active tasks:', error);

            let errorMessage = 'Ошибка при загрузке активных задач';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { detail?: string };
                        status?: number;
                    };
                };
                if (axiosError.response?.data?.detail) {
                    errorMessage = axiosError.response.data.detail;
                } else if (axiosError.response?.status) {
                    errorMessage = `Ошибка сервера: ${axiosError.response.status}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            showToast('error', errorMessage);
        }
    };

    // Отменить все задачи (для суперадмина)
    const cancelAllTasks = async () => {
        if (!isSuperuser) {
            showToast('error', 'Нет прав для отмены задач');
            return;
        }

        try {
            const response = await scraperApi.cancelAllTasks();
            showToast('success', `Отменено задач: ${response.cancelled_tasks}`);
            setActiveTasks([]); // Очищаем локальный список
            await loadSystemStatus(); // Обновляем статус
        } catch (error: unknown) {
            console.error('Error cancelling tasks:', error);

            let errorMessage = 'Ошибка при отмене задач';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { detail?: string };
                        status?: number;
                    };
                };
                if (axiosError.response?.data?.detail) {
                    errorMessage = axiosError.response.data.detail;
                } else if (axiosError.response?.status) {
                    errorMessage = `Ошибка сервера: ${axiosError.response.status}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            showToast('error', errorMessage);
        }
    };

    const toggleExamples = (scraperId: string) => {
        setScraperStates(prev => ({
            ...prev,
            [scraperId]: {
                ...prev[scraperId],
                showExamples: !prev[scraperId].showExamples
            }
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Download className="h-7 w-7 text-blue-600" />
                        Скрайпер каталогов
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Парсинг товаров из внешних каталогов
                    </p>
                </div>

                {/* Кнопки управления */}
                <div className="flex flex-wrap gap-2">
                    {/* Синхронизация */}
                    <button
                        onClick={syncWithServer}
                        disabled={syncing}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                        <RotateCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        Синхронизировать
                    </button>

                    {/* Очистить мои задачи */}
                    <button
                        onClick={cleanupMyTasks}
                        disabled={syncing}
                        className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Очистить мои задачи
                    </button>

                    {isSuperuser && (
                        <>
                            <button
                                onClick={loadActiveTasks}
                                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                                <Activity className="h-4 w-4" />
                                Активные задачи
                            </button>
                            <button
                                onClick={cancelAllTasks}
                                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                                <Square className="h-4 w-4" />
                                Отменить все
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Статус системы */}
            {systemStatus && (
                <div className={`rounded-lg border p-4 ${systemStatus.ready ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-3">
                        {systemStatus.ready ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                            <XCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-4 text-sm">
                                <span className={`font-medium ${systemStatus.ready ? 'text-green-900' : 'text-yellow-900'}`}>
                                    {systemStatus.ready ? 'Система готова' : 'Система не готова'}
                                </span>
                                <span className="text-gray-600">
                                    Ваши задачи: {systemStatus.user_tasks}/{systemStatus.max_user_tasks}
                                </span>
                                <span className="text-gray-600">
                                    Всего задач: {systemStatus.total_tasks}/{systemStatus.max_total_tasks}
                                </span>
                            </div>
                            {systemStatus.issues.length > 0 && (
                                <div className="mt-1 text-sm text-yellow-800">
                                    {systemStatus.issues.map(issue => issue.message).join('; ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Активные задачи */}
            {activeTasks.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Активные задачи ({activeTasks.length})
                    </h3>
                    <div className="space-y-3">
                        {activeTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{task.type}</span>
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {task.status === 'running' ? 'Выполняется' :
                                                task.status === 'completed' ? 'Завершено' :
                                                    task.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                                        </span>
                                        {task.taskId && (
                                            <code className="text-xs bg-gray-200 px-1 rounded">
                                                {task.taskId.slice(0, 8)}
                                            </code>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {task.urls.length} URL • Запущено: {task.startTime.toLocaleTimeString('ru-RU')}
                                    </div>
                                    {task.status === 'running' && (
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${task.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    )}
                                    {task.error && (
                                        <div className="text-sm text-red-600 mt-1">
                                            Ошибка: {task.error}
                                        </div>
                                    )}
                                    {task.result && task.status === 'completed' && (
                                        <div className="text-sm text-green-600 mt-1">
                                            ✓ {task.result.message || `Обработано: ${task.result.processed_items || 0} товаров`}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => showTaskDetails(task)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Подробности"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => stopTask(task.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        title="Удалить из списка"
                                    >
                                        <Square className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Скрайперы */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {SCRAPER_TYPES.map((scraper) => (
                    <div key={scraper.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {/* Заголовок скрайпера */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 ${scraper.color} rounded-lg flex items-center justify-center`}>
                                <Download className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{scraper.name}</h3>
                                <p className="text-sm text-gray-600">{scraper.description}</p>
                            </div>
                        </div>

                        {/* Поля URL */}
                        <div className="space-y-3 mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                URL каталогов для парсинга
                            </label>
                            {scraperStates[scraper.id].urls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => updateUrl(scraper.id, index, e.target.value)}
                                        placeholder={scraper.placeholder}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                    {scraperStates[scraper.id].urls.length > 1 && (
                                        <button
                                            onClick={() => removeUrl(scraper.id, index)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Кнопки управления */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => addUrl(scraper.id)}
                                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                                + Добавить URL
                            </button>
                            <button
                                onClick={() => toggleExamples(scraper.id)}
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                                <ExternalLink className="h-3 w-3" />
                                {scraperStates[scraper.id].showExamples ? 'Скрыть примеры' : 'Показать примеры'}
                            </button>
                        </div>

                        {/* Примеры URL */}
                        {scraperStates[scraper.id].showExamples && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-2">Примеры URL:</div>
                                <div className="space-y-1">
                                    {scraper.examples.map((example, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <code className="text-gray-600 bg-white px-2 py-1 rounded">{example}</code>
                                            <button
                                                onClick={() => applyExample(scraper.id, example)}
                                                className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                                            >
                                                Использовать
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Кнопка запуска */}
                        <button
                            onClick={() => startScraper(scraper.id)}
                            disabled={Boolean(loading[scraper.id]) || (systemStatus ? !systemStatus.can_start_task : false)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${scraper.color} text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {Boolean(loading[scraper.id]) ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Запуск...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Запустить парсинг
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Информационный блок */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                            Как использовать скрайпер
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Добавьте один или несколько URL каталогов для парсинга</li>
                            <li>• Нажмите &quot;Запустить парсинг&quot; для начала обработки</li>
                            <li>• Отслеживайте прогресс в разделе &quot;Активные задачи&quot;</li>
                            <li>• Максимум 10 URL за одну задачу</li>
                            <li>• Максимум {systemStatus?.max_user_tasks || '2'} одновременных задач</li>
                            <li>• Используйте &quot;Синхронизировать&quot; если задачи не обновляются</li>
                            <li>• &quot;Очистить мои задачи&quot; для сброса счетчиков</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}