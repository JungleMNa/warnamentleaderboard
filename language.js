// Language Translations
const translations = {
    en: {
        nav: {
            home: 'HOME',
            events: 'EVENTS',
            leaderboard: 'LEADERBOARD'
        },
        home: {
            title: 'WARNAMENT LEADERBOARD',
            subtitle: 'Join events',
            viewEvents: 'VIEW EVENTS',
            leaderboard: 'LEADERBOARD',
            competitiveEvents: 'Fun & Friendly Events',
            competitiveEventsDesc: 'Participate in regular events to test your skills against other players.',
            rankings: 'Rankings',
            rankingsDesc: 'Climb the leaderboard and establish yourself as one of the top strategic commanders.',
            strategicWarfare: 'Strategic Warfare',
            strategicWarfareDesc: 'Master the art of conquest in deep grand strategy battles that take only minutes to start.',
            readyTitle: 'Ready to Join the Battle?',
            readyDesc: 'Check out our upcoming events and register now',
            browseEvents: 'BROWSE EVENTS'
        },
        events: {
            title: 'UPCOMING EVENTS',
            subtitle: 'Join events and prove your skills',
            activeUpcoming: 'Active & Upcoming Events',
            noEvents: 'NO EVENTS AVAILABLE',
            noEventsDesc: 'Check back soon for upcoming events',
            details: 'DETAILS',
            enter: 'ENTER',
            live: 'LIVE',
            upcoming: 'UPCOMING',
            enterEvent: 'Enter Event',
            discordUsername: 'Discord Username',
            register: 'REGISTER'
        },
        leaderboard: {
            title: 'GLOBAL LEADERBOARD',
            subtitle: 'Top commanders ranked by event performance',
            allTime: 'ALL TIME',
            thisMonth: 'THIS MONTH',
            thisWeek: 'THIS WEEK',
            rank: 'RANK',
            player: 'PLAYER',
            wins: 'WINS',
            points: 'POINTS'
        }
    },
    ru: {
        nav: {
            home: 'ГЛАВНАЯ',
            events: 'СОБЫТИЯ',
            leaderboard: 'ТАБЛИЦА ЛИДЕРОВ'
        },
        home: {
            title: 'ТАБЛИЦА ЛИДЕРОВ WARNAMENT',
            subtitle: 'Присоединяйтесь к событиям и докажите своё стратегическое мастерство',
            viewEvents: 'ПОСМОТРЕТЬ СОБЫТИЯ',
            leaderboard: 'ТАБЛИЦА ЛИДЕРОВ',
            competitiveEvents: 'Весёлые и Дружеские События',
            competitiveEventsDesc: 'Участвуйте в регулярных событиях, чтобы проверить свои навыки против других игроков.',
            rankings: 'Рейтинги',
            rankingsDesc: 'Поднимайтесь по таблице лидеров и станьте одним из лучших стратегических командиров.',
            strategicWarfare: 'Стратегическая Война',
            strategicWarfareDesc: 'Освойте искусство завоевания в глубоких стратегических сражениях, которые начинаются за считанные минуты.',
            readyTitle: 'Готовы присоединиться к битве?',
            readyDesc: 'Ознакомьтесь с предстоящими событиями и зарегистрируйтесь сейчас',
            browseEvents: 'ПРОСМОТРЕТЬ СОБЫТИЯ'
        },
        events: {
            title: 'ПРЕДСТОЯЩИЕ СОБЫТИЯ',
            subtitle: 'Присоединяйтесь к событиям и покажите свои навыки',
            activeUpcoming: 'Активные и Предстоящие События',
            noEvents: 'НЕТ ДОСТУПНЫХ СОБЫТИЙ',
            noEventsDesc: 'Вернитесь позже для предстоящих событий',
            details: 'ПОДРОБНЕЕ',
            enter: 'ВОЙТИ',
            live: 'В ЭФИРЕ',
            upcoming: 'СКОРО',
            enterEvent: 'Войти в Событие',
            discordUsername: 'Имя пользователя Discord',
            register: 'ЗАРЕГИСТРИРОВАТЬСЯ'
        },
        leaderboard: {
            title: 'ГЛОБАЛЬНАЯ ТАБЛИЦА ЛИДЕРОВ',
            subtitle: 'Лучшие командиры по результатам событий',
            allTime: 'ВСЁ ВРЕМЯ',
            thisMonth: 'ЭТОТ МЕСЯЦ',
            thisWeek: 'ЭТА НЕДЕЛЯ',
            rank: 'РАНГ',
            player: 'ИГРОК',
            wins: 'ПОБЕДЫ',
            points: 'ОЧКИ'
        }
    }
};

// Get current language from localStorage or default to 'en'
let currentLang = localStorage.getItem('language') || 'en';

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
    setupLanguageToggle();
});

// Setup language toggle button
function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? 'RU' : 'EN';
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ru' : 'en';
            setLanguage(currentLang);
            langToggle.textContent = currentLang === 'en' ? 'RU' : 'EN';
            localStorage.setItem('language', currentLang);
        });
    }
}

// Set language for all elements with data-i18n attribute
function setLanguage(lang) {
    document.documentElement.lang = lang;
    
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let translation = translations[lang];
        
        // Navigate through nested objects
        for (const k of keys) {
            translation = translation[k];
            if (!translation) break;
        }
        
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Reload events to update dynamic content
    if (typeof loadEvents === 'function') {
        loadEvents();
    }
}

// Export for use in other files
window.i18n = {
    t: (key) => {
        const keys = key.split('.');
        let translation = translations[currentLang];
        for (const k of keys) {
            translation = translation[k];
            if (!translation) return key;
        }
        return translation;
    },
    getCurrentLang: () => currentLang
};
