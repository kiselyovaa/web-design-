export class Coin {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.game = game;
        this.collected = false;
        this.respawnTimer = null;
        this.animationFrame = 0;
        this.bounceOffset = 0;
        this.bounceDirection = 1;
        
        this.colors = {
            main: '#F39C12',
            shine: '#F7DC6F',
            shadow: '#B9770E'
        };
    }

    update() {
        if (!this.collected) {
            // Анимация подпрыгивания
            this.animationFrame++;
            this.bounceOffset = Math.sin(this.animationFrame * 0.1) * 3;
            
            // Вращательная анимация
            this.rotation = this.animationFrame * 0.05;
        }
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            
            // Запускаем таймер респавна через 10 секунд
            this.respawnTimer = setTimeout(() => {
                this.respawn();
            }, 10000);
        }
    }

    respawn(newX = null, newY = null) {
        this.collected = false;
        this.animationFrame = 0;
        this.bounceOffset = 0;
        
        if (newX !== null && newY !== null) {
            this.x = newX;
            this.y = newY;
        }
        
        if (this.respawnTimer) {
            clearTimeout(this.respawnTimer);
            this.respawnTimer = null;
        }
    }

    draw(ctx) {
        if (this.collected) return;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + this.bounceOffset;

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + this.height + 2, this.width / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Основная монета
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        // Градиент для блеска
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, this.colors.shine);
        gradient.addColorStop(0.7, this.colors.main);
        gradient.addColorStop(1, this.colors.shadow);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Внутренний круг
        ctx.fillStyle = this.colors.shadow;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Блики
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-this.width / 6, -this.width / 6, this.width / 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Анимация сбора (если нужно)
        this.drawCollectionEffect(ctx);
    }

    drawCollectionEffect(ctx) {
        // Можно добавить эффекты при сборе, например, частицы
    }

    // Для коллизий
    getBounds() {
        return {
            x: this.x,
            y: this.y + this.bounceOffset,
            width: this.width,
            height: this.height
        };
    }
}