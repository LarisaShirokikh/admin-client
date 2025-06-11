// src/lib/utils/toast.ts
// Утилиты для быстрого создания тостов

export const toastMessages = {
    // Общие сообщения
    loading: 'Загрузка...',
    success: 'Операция выполнена успешно',
    error: 'Произошла ошибка',

    // Продукты
    product: {
        created: 'Продукт создан',
        updated: 'Продукт обновлен',
        deleted: 'Продукт удален',
        statusChanged: 'Статус продукта изменен',
        bulkUpdated: (count: number) => `Обновлено ${count} продуктов`,
        loadError: 'Ошибка при загрузке продуктов',
        deleteError: 'Ошибка при удалении продукта',
        permissionError: 'Недостаточно прав для выполнения операции'
    },

    // Категории
    category: {
        created: 'Категория создана',
        updated: 'Категория обновлена',
        deleted: 'Категория удалена',
        statusChanged: 'Статус категории изменен'
    },

    // Бренды
    brand: {
        created: 'Бренд создан',
        updated: 'Бренд обновлен',
        deleted: 'Бренд удален',
        statusChanged: 'Статус бренда изменен'
    },

    // Формы
    form: {
        validationError: 'Проверьте правильность заполнения полей',
        saveSuccess: 'Данные сохранены',
        saveError: 'Ошибка при сохранении данных'
    },

    // Аутентификация
    auth: {
        loginSuccess: 'Вход выполнен успешно',
        loginError: 'Ошибка входа',
        logoutSuccess: 'Выход выполнен',
        sessionExpired: 'Сессия истекла, войдите заново'
    }
};

// Хук с предустановленными сообщениями
export function useQuickToast() {
    // Этот хук будет использоваться в компонентах для быстрого доступа к сообщениям
    return {
        messages: toastMessages
    };
}

// Примеры использования в компонентах:
// const { showToast } = useToast();
// const { messages } = useQuickToast();

// showToast('success', messages.product.created);
// showToast('error', messages.product.deleteError);
// showToast('success', messages.product.bulkUpdated(5));