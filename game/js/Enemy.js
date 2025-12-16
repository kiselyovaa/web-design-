export class Enemy {
    constructor(x, y, type = 'patrol') {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.speed = type === 'patrol' ? 1.5 : 2;
        this.direction = 1; // 1 вправо, -1 влево
        this.health = type === 'patrol' ? 2 : 1;
        this.color = this.getColorByType();
        this.patrolDistance = 150;
        this.startX = x;
        this.isActive = true;
        this.animationFrame = 0;
        this.attackCooldown = 0;
    }

    getColorByType() {
        switch (this.type) {
            case 'patrol':
                return '#E74C3C';
            case 'chaser':
                return '#8E44AD';
            case 'shooter':
                return '#3498DB';
            case 'boss':
                return '#F39C12';
            default:
                return '#E74C3C';
        }
    }

    update(player) {
        if (!this.isActive) return;

        this.animationFrame++;
        
        switch (this.type) {
            case 'patrol':
                this.updatePatrol();
                break;
            case 'chaser':
                this.updateChaser(player);
                break;
            case 'shooter':
                this.updateShooter(player);
                break;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    updatePatrol() {
        this.x += this.speed * this.direction;
        
        // Разворот при достижении границы патрулирования
        if (this.x > this.startX + this.patrolDistance || this.x < this.startX - this.patrolDistance) {
            this.direction *= -1;
        }
    }

    updateChaser(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 300) { // Дистанция преследования
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed * 0.5;
        }
    }

    updateShooter(player) {
        // Стрельба в игрока
        if (this.attackCooldown === 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 400) {
                this.attackCooldown = 60; // 1 секунда при 60 FPS
                return { 
                    x: this.x + this.width/2, 
                    y: this.y + this.height/2,
                    dx: dx/distance * 5,
                    dy: dy/distance * 5,
                    damage: 1
                };
            }
        }
        return null;
    }

    takeDamage(amount = 1) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isActive = false;
            return true; // Враг уничтожен
        }
        return false;
    }

    draw(ctx) {
        if (!this.isActive) return;

        // Анимация пульсации
        const pulse = Math.sin(this.animationFrame * 0.1) * 2;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - pulse, this.y - pulse, this.width + pulse*2, this.height + pulse*2);
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
        ctx.fillRect(this.x + this.width - 14, this.y + 8, 6, 6);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 10, this.y + 10, 2, 2);
        ctx.fillRect(this.x + this.width - 12, this.y + 10, 2, 2);
        
        // Индикатор здоровья
        if (this.health > 1) {
            ctx.fillStyle = '#2ECC71';
            ctx.fillRect(this.x, this.y - 5, (this.width / this.health) * this.health, 3);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}