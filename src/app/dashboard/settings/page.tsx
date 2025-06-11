'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
    Settings,
    User,
    Bell,
    Key,
    Info,
    Save,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    RefreshCw,
    Download,
    Plus,
} from 'lucide-react';
import { ApiKey, NotificationSettings, PasswordChangeRequest, SystemInfo, SystemSettings, UserProfile, UserProfileUpdate } from '@/types/settings';
import { settingsApi } from '@/lib/api/settings';
import { useToast } from '@/lib/contexts/ToastContext';

// test

type TabType = 'profile' | 'system' | 'notifications' | 'api-keys' | 'system-info';

export default function SettingsPage() {
    const { isSuperuser } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Состояния данных
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

    // Формы
    const [profileForm, setProfileForm] = useState<UserProfileUpdate>({});
    const [passwordForm, setPasswordForm] = useState<PasswordChangeRequest>({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [newApiKey, setNewApiKey] = useState('');
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    const tabs = [
        { id: 'profile', name: 'Профиль', icon: User },
        { id: 'system', name: 'Система', icon: Settings, adminOnly: true },
        { id: 'notifications', name: 'Уведомления', icon: Bell },
        { id: 'api-keys', name: 'API ключи', icon: Key, adminOnly: true },
        { id: 'system-info', name: 'Информация', icon: Info, adminOnly: true },
    ].filter(tab => !tab.adminOnly || isSuperuser);

    // Загрузка данных при смене вкладки
    useEffect(() => {
        loadTabData();
    }, [activeTab]);

    const loadTabData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'profile':
                    const profileData = await settingsApi.getProfile();
                    setProfile(profileData);
                    setProfileForm({
                        username: profileData.username,
                        email: profileData.email,
                        first_name: profileData.first_name,
                        last_name: profileData.last_name
                    });
                    break;

                case 'system':
                    if (isSuperuser) {
                        const systemData = await settingsApi.getSystemSettings();
                        setSystemSettings(systemData);
                    }
                    break;

                case 'notifications':
                    const notificationData = await settingsApi.getNotificationSettings();
                    setNotificationSettings(notificationData);
                    break;

                case 'api-keys':
                    if (isSuperuser) {
                        const keysData = await settingsApi.getApiKeys();
                        setApiKeys(keysData);
                    }
                    break;

                case 'system-info':
                    if (isSuperuser) {
                        const infoData = await settingsApi.getSystemInfo();
                        setSystemInfo(infoData);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error loading settings data:', error);
            showToast('error', 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    // Сохранение профиля
    const saveProfile = async () => {
        try {
            const updatedProfile = await settingsApi.updateProfile(profileForm);
            setProfile(updatedProfile);
            showToast('success', 'Профиль обновлен');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('error', 'Ошибка обновления профиля');
        }
    };

    // Смена пароля
    const changePassword = async () => {
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            showToast('error', 'Пароли не совпадают');
            return;
        }

        try {
            await settingsApi.changePassword(passwordForm);
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            showToast('success', 'Пароль изменен');
        } catch (error) {
            console.error('Error changing password:', error);
            showToast('error', 'Ошибка смены пароля');
        }
    };

    // Сохранение системных настроек
    const saveSystemSettings = async () => {
        if (!systemSettings) return;

        try {
            const updated = await settingsApi.updateSystemSettings(systemSettings);
            setSystemSettings(updated);
            showToast('success', 'Настройки системы обновлены');
        } catch (error) {
            console.error('Error updating system settings:', error);
            showToast('error', 'Ошибка обновления настроек');
        }
    };

    // Сохранение настроек уведомлений
    const saveNotificationSettings = async () => {
        if (!notificationSettings) return;

        try {
            const updated = await settingsApi.updateNotificationSettings(notificationSettings);
            setNotificationSettings(updated);
            showToast('success', 'Настройки уведомлений обновлены');
        } catch (error) {
            console.error('Error updating notification settings:', error);
            showToast('error', 'Ошибка обновления настроек');
        }
    };

    // Создание API ключа
    const createApiKey = async () => {
        if (!newApiKey.trim()) {
            showToast('error', 'Введите название ключа');
            return;
        }

        try {
            const apiKey = await settingsApi.createApiKey({ name: newApiKey });
            setApiKeys(prev => [...prev, apiKey]);
            setNewApiKey('');
            setShowApiKeyModal(false);
            showToast('success', 'API ключ создан');
        } catch (error) {
            console.error('Error creating API key:', error);
            showToast('error', 'Ошибка создания ключа');
        }
    };

    // Удаление API ключа
    const deleteApiKey = async (id: number) => {
        if (!confirm('Удалить API ключ?')) return;

        try {
            await settingsApi.deleteApiKey(id);
            setApiKeys(prev => prev.filter(key => key.id !== id));
            showToast('success', 'API ключ удален');
        } catch (error) {
            console.error('Error deleting API key:', error);
            showToast('error', 'Ошибка удаления ключа');
        }
    };

    // Копирование в буфер обмена
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('success', 'Скопировано в буфер обмена');
    };

    // Создание резервной копии
    const createBackup = async () => {
        try {
            const result = await settingsApi.createBackup();
            showToast('success', `Резервная копия создана: ${result.filename}`);
        } catch (error) {
            console.error('Error creating backup:', error);
            showToast('error', 'Ошибка создания резервной копии');
        }
    };

    // Очистка кэша
    const clearCache = async () => {
        try {
            await settingsApi.clearCache();
            showToast('success', 'Кэш очищен');
        } catch (error) {
            console.error('Error clearing cache:', error);
            showToast('error', 'Ошибка очистки кэша');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="h-7 w-7 text-gray-600" />
                    Настройки
                </h1>
                <p className="text-gray-600 mt-1">
                    Управление профилем и системными настройками
                </p>
            </div>

            {/* Вкладки */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Контент вкладок */}
            <div className="bg-white rounded-lg shadow p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {/* Профиль */}
                        {activeTab === 'profile' && profile && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900">Профиль пользователя</h3>

                                {/* Основная информация */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Имя пользователя</label>
                                        <input
                                            type="text"
                                            value={profileForm.username || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            value={profileForm.email || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Имя</label>
                                        <input
                                            type="text"
                                            value={profileForm.first_name || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                                        <input
                                            type="text"
                                            value={profileForm.last_name || ''}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={saveProfile}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Сохранить профиль
                                </button>

                                {/* Смена пароля */}
                                <div className="border-t pt-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Смена пароля</h4>

                                    <div className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Текущий пароль</label>
                                            <div className="mt-1 relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={passwordForm.current_password}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
                                            <input
                                                type="password"
                                                value={passwordForm.new_password}
                                                onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Подтвердите пароль</label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirm_password}
                                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <button
                                            onClick={changePassword}
                                            disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                        >
                                            Изменить пароль
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Системные настройки */}
                        {activeTab === 'system' && systemSettings && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900">Системные настройки</h3>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Название сайта</label>
                                        <input
                                            type="text"
                                            value={systemSettings.site_name}
                                            onChange={(e) => setSystemSettings(prev => prev ? ({ ...prev, site_name: e.target.value }) : null)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Максимальный размер загрузки (MB)</label>
                                        <input
                                            type="number"
                                            value={systemSettings.max_upload_size}
                                            onChange={(e) => setSystemSettings(prev => prev ? ({ ...prev, max_upload_size: parseInt(e.target.value) }) : null)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Максимум видео в час</label>
                                        <input
                                            type="number"
                                            value={systemSettings.max_videos_per_hour}
                                            onChange={(e) => setSystemSettings(prev => prev ? ({ ...prev, max_videos_per_hour: parseInt(e.target.value) }) : null)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="auto_activate"
                                            checked={systemSettings.auto_activate_uploads}
                                            onChange={(e) => setSystemSettings(prev => prev ? ({ ...prev, auto_activate_uploads: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="auto_activate" className="ml-2 block text-sm text-gray-900">
                                            Автоматически активировать загрузки
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="maintenance_mode"
                                            checked={systemSettings.maintenance_mode}
                                            onChange={(e) => setSystemSettings(prev => prev ? ({ ...prev, maintenance_mode: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
                                            Режим обслуживания
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={saveSystemSettings}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Сохранить настройки
                                </button>
                            </div>
                        )}

                        {/* Уведомления */}
                        {activeTab === 'notifications' && notificationSettings && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900">Настройки уведомлений</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="email_notifications"
                                            checked={notificationSettings.email_notifications}
                                            onChange={(e) => setNotificationSettings(prev => prev ? ({ ...prev, email_notifications: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                                            Email уведомления
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="upload_notifications"
                                            checked={notificationSettings.upload_notifications}
                                            onChange={(e) => setNotificationSettings(prev => prev ? ({ ...prev, upload_notifications: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="upload_notifications" className="ml-2 block text-sm text-gray-900">
                                            Уведомления о загрузках
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="error_notifications"
                                            checked={notificationSettings.error_notifications}
                                            onChange={(e) => setNotificationSettings(prev => prev ? ({ ...prev, error_notifications: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="error_notifications" className="ml-2 block text-sm text-gray-900">
                                            Уведомления об ошибках
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="daily_reports"
                                            checked={notificationSettings.daily_reports}
                                            onChange={(e) => setNotificationSettings(prev => prev ? ({ ...prev, daily_reports: e.target.checked }) : null)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="daily_reports" className="ml-2 block text-sm text-gray-900">
                                            Ежедневные отчеты
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={saveNotificationSettings}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Сохранить настройки
                                </button>
                            </div>
                        )}

                        {/* API ключи */}
                        {activeTab === 'api-keys' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">API ключи</h3>
                                    <button
                                        onClick={() => setShowApiKeyModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Создать ключ
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {apiKeys.map((apiKey) => (
                                        <div key={apiKey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900">{apiKey.name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Создан: {new Date(apiKey.created_at).toLocaleDateString('ru-RU')}
                                                </p>
                                                <p className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded mt-2">
                                                    {apiKey.key}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => copyToClipboard(apiKey.key)}
                                                    className="p-2 text-gray-400 hover:text-gray-600"
                                                    title="Копировать"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteApiKey(apiKey.id)}
                                                    className="p-2 text-red-400 hover:text-red-600"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Системная информация */}
                        {activeTab === 'system-info' && systemInfo && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">Системная информация</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={createBackup}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Бэкап
                                        </button>
                                        <button
                                            onClick={clearCache}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Очистить кэш
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Система</h4>
                                        <dl className="space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Версия:</dt>
                                                <dd className="text-sm text-gray-900">{systemInfo.version}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Среда:</dt>
                                                <dd className="text-sm text-gray-900">{systemInfo.environment}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Время работы:</dt>
                                                <dd className="text-sm text-gray-900">{systemInfo.uptime}</dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">База данных</h4>
                                        <dl className="space-y-2">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Продукты:</dt>
                                                <dd className="text-sm text-gray-900">{systemInfo.database_stats.total_products}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Видео:</dt>
                                                <dd className="text-sm text-gray-900">{systemInfo.database_stats.total_videos}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Размер:</dt>
                                                <dd className="text-sm text-gray-900">{systemInfo.database_stats.database_size}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Модальное окно создания API ключа */}
            {showApiKeyModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowApiKeyModal(false)} />

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex items-center">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <Key className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Создать API ключ
                                        </h3>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        placeholder="Название ключа"
                                        value={newApiKey}
                                        onChange={(e) => setNewApiKey(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={createApiKey}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Создать
                                </button>
                                <button
                                    onClick={() => setShowApiKeyModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}