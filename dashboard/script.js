// Конфигурация API
const API_CONFIG = {
    weather: {
        key: '6a7d745ce2e234ddf96233e012ff642a',
        url: 'https://api.openweathermap.org/data/2.5/weather'
    },
    currency: {
        url: 'https://api.exchangerate-api.com/v4/latest/RUB'
    },
    quotes: {
        // ⬇⬇⬇ ВСТАВЬТЕ СВОЙ API ДЛЯ ЦИТАТ ЗДЕСЬ ⬇⬇⬇
        url: 'https://api.forismatic.com/api/1.0/'
        // Альтернативные API для цитат:
        // url: 'https://quotes.rest/qod' - требуется ключ
        // url: 'https://zenquotes.io/api/random' - бесплатный
        // url: 'https://api.forismatic.com/api/1.0/' - бесплатный
        // ⬆⬆⬆ ВСТАВЬТЕ СВОЙ API ДЛЯ ЦИТАТ ЗДЕСЬ ⬆⬆⬆
    }
};

// Доступные виджеты (только валюты, погода и цитаты)
const AVAILABLE_WIDGETS = {
    weather: {
        name: 'Погода',
        type: 'weather',
        defaultSettings: { city: 'Москва', units: 'metric' }
    },
    currency: {
        name: 'Курсы валют',
        type: 'currency',
        defaultSettings: { currencies: ['USD', 'EUR'] }
    },
    quote: {
        name: 'Случайная цитата',
        type: 'quote',
        defaultSettings: {}
    }
};

class Dashboard {
    constructor() {
        this.widgets = [];
        this.draggedWidget = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.render();
        this.bindEvents();
        
        // Автоматически добавляем демо-виджеты если нет сохраненных
        if (this.widgets.length === 0) {
            setTimeout(() => {
                this.addWidget('weather');
                this.addWidget('currency');
                this.addWidget('quote');
            }, 500);
        }
    }

    bindEvents() {
        document.getElementById('addWidgetBtn').addEventListener('click', () => this.showWidgetModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideWidgetModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportConfig());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importConfig(e));

        // Drag & Drop
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }

    // Modal Management
    showWidgetModal() {
        const modal = document.getElementById('widgetModal');
        const widgetList = document.getElementById('widgetList');
        
        widgetList.innerHTML = Object.values(AVAILABLE_WIDGETS)
            .map(widget => `
                <div class="widget-option" data-type="${widget.type}">
                    <h3>${widget.name}</h3>
                    <p>Добавить виджет ${widget.name.toLowerCase()}</p>
                </div>
            `).join('');

        widgetList.querySelectorAll('.widget-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.addWidget(type);
                this.hideWidgetModal();
            });
        });

        modal.style.display = 'block';
    }

    hideWidgetModal() {
        document.getElementById('widgetModal').style.display = 'none';
    }

    // Widget Management
    addWidget(type, settings = null) {
        const widgetConfig = AVAILABLE_WIDGETS[type];
        if (!widgetConfig) return;

        const widget = {
            id: Date.now().toString(),
            type: type,
            name: widgetConfig.name,
            settings: settings || { ...widgetConfig.defaultSettings },
            data: null
        };

        this.widgets.push(widget);
        this.saveToStorage();
        this.render();
        this.loadWidgetData(widget.id);
    }

    removeWidget(id) {
        this.widgets = this.widgets.filter(widget => widget.id !== id);
        this.saveToStorage();
        this.render();
    }

    updateWidgetSettings(id, newSettings) {
        const widget = this.widgets.find(w => w.id === id);
        if (widget) {
            widget.settings = { ...widget.settings, ...newSettings };
            this.saveToStorage();
            this.loadWidgetData(id);
        }
    }

    // Data Loading
    async loadWidgetData(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (widgetElement) {
            this.showLoading(widgetElement);
        }

        try {
            let data;
            switch (widget.type) {
                case 'weather':
                    data = await this.fetchWeather(widget.settings.city);
                    break;
                case 'currency':
                    data = await this.fetchCurrencyRates();
                    break;
                case 'quote':
                    data = await this.fetchRandomQuote();
                    break;
                default:
                    data = null;
            }

            widget.data = data;
            this.saveToStorage();
            this.renderWidget(widget);
        } catch (error) {
            console.error('Error loading widget data:', error);
            this.showError(widgetElement, error.message);
        }
    }

    // API Methods
    async fetchWeather(city) {
        const response = await fetch(
            `${API_CONFIG.weather.url}?q=${city}&units=metric&appid=${API_CONFIG.weather.key}&lang=ru`
        );
        
        if (!response.ok) throw new Error('Не удалось загрузить данные о погоде');
        
        const data = await response.json();
        return {
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            city: data.name
        };
    }

    async fetchCurrencyRates() {
        const response = await fetch(API_CONFIG.currency.url);
        if (!response.ok) throw new Error('Не удалось загрузить курсы валют');
        
        const data = await response.json();
        return {
            rates: data.rates,
            date: data.date
        };
    }

    async fetchRandomQuote() {
        // ⬇⬇⬇ API для цитат - можно изменить на другое ⬇⬇⬇
        const response = await fetch(API_CONFIG.quotes.url);
        
        if (!response.ok) throw new Error('Не удалось загрузить цитату');
        
        const data = await response.json();
        
        // Обработка разных форматов ответа от API цитат
        if (data.content && data.author) {
            // Формат quotable.io
            return data;
        } else if (data.quoteText && data.quoteAuthor) {
            // Формат forismatic
            return {
                content: data.quoteText,
                author: data.quoteAuthor || 'Неизвестный автор'
            };
        } else if (data[0] && data[0].q && data[0].a) {
            // Формат zenquotes
            return {
                content: data[0].q,
                author: data[0].a
            };
        } else {
            throw new Error('Неизвестный формат данных цитаты');
        }
    }

    // Rendering
    render() {
        const dashboard = document.getElementById('dashboard');
        dashboard.innerHTML = this.widgets.map(widget => this.renderWidget(widget)).join('');
    }

    renderWidget(widget) {
        return `
            <div class="widget" data-widget-id="${widget.id}" draggable="true">
                <div class="widget-header">
                    <h3>${widget.name}</h3>
                    <div class="widget-controls">
                        <button class="refresh-btn" onclick="dashboard.loadWidgetData('${widget.id}')">↻</button>
                        <button class="settings-btn" onclick="dashboard.showSettings('${widget.id}')">⚙</button>
                        <button class="remove-btn" onclick="dashboard.removeWidget('${widget.id}')">×</button>
                    </div>
                </div>
                <div class="widget-content">
                    ${this.renderWidgetContent(widget)}
                </div>
            </div>
        `;
    }

    renderWidgetContent(widget) {
        if (!widget.data) {
            return this.renderLoading();
        }

        switch (widget.type) {
            case 'weather':
                return this.renderWeatherContent(widget);
            case 'currency':
                return this.renderCurrencyContent(widget);
            case 'quote':
                return this.renderQuoteContent(widget);
            default:
                return '<p>Виджет не поддерживается</p>';
        }
    }

    renderWeatherContent(widget) {
        const { temp, description, icon, city } = widget.data;
        return `
            <div class="weather-widget">
                <h2>${temp}°C</h2>
                <p>${description}</p>
                <p>${city}</p>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
            </div>
        `;
    }

    renderCurrencyContent(widget) {
        const { rates, date } = widget.data;
        const selectedCurrencies = widget.settings.currencies || ['USD', 'EUR'];
        
        return `
            <div class="currency-widget">
                <p><small>Обновлено: ${new Date(date).toLocaleDateString()}</small></p>
                ${selectedCurrencies.map(currency => `
                    <div class="currency-rate">
                        <span>${currency}/RUB</span>
                        <span>${(1 / rates[currency]).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderQuoteContent(widget) {
        const { content, author } = widget.data;
        return `
            <div class="quote-widget">
                <p class="quote-content">"${content}"</p>
                <p class="quote-author">- ${author}</p>
                <button onclick="dashboard.loadWidgetData('${widget.id}')" class="next-quote-btn">
                    Следующая цитата
                </button>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }

    showLoading(widgetElement) {
        const content = widgetElement.querySelector('.widget-content');
        if (content) {
            content.innerHTML = this.renderLoading();
        }
    }

    showError(widgetElement, message) {
        const content = widgetElement.querySelector('.widget-content');
        if (content) {
            content.innerHTML = `
                <div class="error">
                    <p>${message}</p>
                    <button onclick="dashboard.loadWidgetData('${widgetElement.dataset.widgetId}')">
                        Повторить
                    </button>
                </div>
            `;
        }
    }

    // Settings Management
    showSettings(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        let settingsHtml = '';
        switch (widget.type) {
            case 'weather':
                settingsHtml = `
                    <label>Город: </label>
                    <input type="text" id="weather-city" value="${widget.settings.city}">
                `;
                break;
            case 'currency':
                settingsHtml = `
                    <label>Валюты (через запятую): </label>
                    <input type="text" id="currency-list" value="${widget.settings.currencies.join(',')}">
                `;
                break;
        }

        if (settingsHtml) {
            const newSettings = prompt(`Настройки ${widget.name}:\n${settingsHtml}`);
            if (newSettings !== null) {
                this.handleSettingsInput(widgetId, widget.type);
            }
        }
    }

    handleSettingsInput(widgetId, type) {
        let newSettings = {};
        
        switch (type) {
            case 'weather':
                const city = document.getElementById('weather-city')?.value;
                if (city) newSettings = { city };
                break;
            case 'currency':
                const currenciesInput = document.getElementById('currency-list')?.value;
                if (currenciesInput) {
                    newSettings = { 
                        currencies: currenciesInput.split(',').map(c => c.trim().toUpperCase()) 
                    };
                }
                break;
        }

        if (Object.keys(newSettings).length > 0) {
            this.updateWidgetSettings(widgetId, newSettings);
        }
    }

    // Drag & Drop
    handleDragStart(e) {
        if (e.target.classList.contains('widget')) {
            this.draggedWidget = e.target;
            e.target.classList.add('dragging');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        const widget = e.target.closest('.widget');
        if (widget && widget !== this.draggedWidget) {
            widget.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const targetWidget = e.target.closest('.widget');
        
        if (this.draggedWidget && targetWidget && this.draggedWidget !== targetWidget) {
            const draggedId = this.draggedWidget.dataset.widgetId;
            const targetId = targetWidget.dataset.widgetId;
            
            this.reorderWidgets(draggedId, targetId);
        }
        
        this.clearDragStates();
    }

    handleDragEnd() {
        this.clearDragStates();
    }

    clearDragStates() {
        document.querySelectorAll('.widget').forEach(widget => {
            widget.classList.remove('dragging', 'drag-over');
        });
    }

    reorderWidgets(draggedId, targetId) {
        const draggedIndex = this.widgets.findIndex(w => w.id === draggedId);
        const targetIndex = this.widgets.findIndex(w => w.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedWidget] = this.widgets.splice(draggedIndex, 1);
            this.widgets.splice(targetIndex, 0, draggedWidget);
            this.saveToStorage();
            this.render();
        }
    }

    // Storage Management
    saveToStorage() {
        localStorage.setItem('dashboardConfig', JSON.stringify({
            widgets: this.widgets,
            version: '1.0'
        }));
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('dashboardConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.widgets = config.widgets || [];
                
                // Загружаем данные для всех виджетов
                this.widgets.forEach(widget => {
                    this.loadWidgetData(widget.id);
                });
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.widgets = [];
        }
    }

    // Export/Import
    exportConfig() {
        const config = {
            widgets: this.widgets,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                if (config.widgets) {
                    this.widgets = config.widgets;
                    this.saveToStorage();
                    this.render();
                    
                    // Перезагружаем данные
                    this.widgets.forEach(widget => {
                        this.loadWidgetData(widget.id);
                    });
                    
                    alert('Конфигурация успешно импортирована!');
                }
            } catch (error) {
                alert('Ошибка при импорте конфигурации');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}

// Инициализация приложения
const dashboard = new Dashboard();