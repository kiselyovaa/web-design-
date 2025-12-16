export class InputHandler {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Клавиши вниз
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Предотвращение прокрутки страницы при использовании пробела
            if (event.code === 'Space') {
                event.preventDefault();
            }
        });

        // Клавиши вверх
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Обработка потери фокуса (останавливаем все движения)
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }
}