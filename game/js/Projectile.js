export class Projectile {
    constructor(x, y, dx, dy, damage = 1, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.width = 8;
        this.height = 8;
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.lifetime = 180; // 3 секунды при 60 FPS
        this.active = true;
        this.color = isPlayer ? '#2ECC71' : '#E74C3C';
    }

    update() {
        if (!this.active) return;

        this.x += this.dx;
        this.y += this.dy;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Эффект свечения для игровых снарядов
        if (this.isPlayer) {
            ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getBounds() {
        return {
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            width: this.width,
            height: this.height
        };
    }
}