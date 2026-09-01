// ==================== CLASSE DO JOGO ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        this.gameState = 'menu'; // menu, playing, gameOver, victory, phaseTransition
        this.currentPhase = 0;
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.correctItemsCollected = 0;
        this.lastSurvivalMilestone = 0;
        this.bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
        
        this.player = null;
        this.items = [];
        this.particles = [];
        this.comboTexts = [];
        this.scorePopups = [];
        
        this.spawnCounter = 0;
        this.spawnRate = 60;
        this.itemSpeed = 3;
        
        this.keys = {};
        this.setupControls();
        
        // Pré-carregar imagens
        preloadImages().then(() => {
            this.showMenu();
        }).catch(() => {
            this.showMenu();
        });
    }

    setupCanvas() {
        const container = document.getElementById('gameContainer');
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') this.handleSpacePress();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            this.handleCanvasClick(x);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            if (this.player) {
                this.player.targetX = Math.max(this.player.width / 2, 
                    Math.min(x, this.canvas.width - this.player.width / 2));
            }
        }, { passive: false });
    }

    handleCanvasClick(x) {
        if (this.gameState === 'playing' && this.player) {
            this.player.targetX = Math.max(this.player.width / 2, 
                Math.min(x, this.canvas.width - this.player.width / 2));
        }
    }

    handleSpacePress() {
        if (this.gameState === 'gameOver' || this.gameState === 'victory') {
            this.showMenu();
        }
    }

    showMenu() {
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.updateUI();
        this.hideAllScreens();
        document.getElementById('menuScreen').classList.add('active');
        document.getElementById('controlsHint').style.display = 'block';
    }

    showPhasesMenu() {
        this.hideAllScreens();
        document.getElementById('phasesMenuScreen').classList.add('active');
    }

    startPhase(phase) {
        this.currentPhase = phase;
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.correctItemsCollected = 0;
        this.items = [];
        this.particles = [];
        this.scorePopups = [];
        this.spawnCounter = 0;
        
        // Configuração de dificuldade por fase - Fases 1-2 fáceis, aumentando até 5
        const phases = {
            1: { spawnRate: 85, itemSpeed: 2, name: 'Papel 🔵' },      // Muito fácil
            2: { spawnRate: 75, itemSpeed: 2.3, name: 'Plástico 🔴' }, // Fácil
            3: { spawnRate: 60, itemSpeed: 2.8, name: 'Vidro 💚' },    // Médio
            4: { spawnRate: 50, itemSpeed: 3.3, name: 'Metal 🟡' },    // Difícil
            5: { spawnRate: 40, itemSpeed: 3.8, name: 'Orgânico 🟤' }, // Muito Difícil
            6: { spawnRate: 55, itemSpeed: 2.8, name: 'Sobrevivência 🎯' }
        };
        
        const config = phases[phase];
        this.spawnRate = config.spawnRate;
        this.itemSpeed = config.itemSpeed;
        
        this.player = new Bin(this.canvas.width / 2, this.canvas.height - 100, phase);
        this.gameState = 'phaseTransition';
        this.updateUI();
        this.showPhaseTransition();
    }

    continuePhase() {
        this.gameState = 'playing';
        this.hideAllScreens();
        document.getElementById('controlsHint').style.display = 'block';
    }

    showPhaseTransition() {
        const phases = ['', 'Papel 🔵', 'Plástico 🔴', 'Vidro 💚', 'Metal 🟡', 'Orgânico 🟤', 'Sobrevivência 🎯'];
        const descs = ['', 'Colete 100 pontos em Papel!', 'Colete 100 pontos em Plástico!', 
                      'Colete 100 pontos em Vidro!', 'Colete 100 pontos em Metal!',
                      'Colete 100 pontos em Orgânico!', 'Sobreviva ao máximo!'];
        
        document.getElementById('transitionTitle').textContent = `Fase ${this.currentPhase}`;
        document.getElementById('transitionDesc').textContent = descs[this.currentPhase];
        
        this.hideAllScreens();
        document.getElementById('phaseTransitionScreen').classList.add('active');
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        // Atualizar melhor pontuação se for modo sobrevivência
        if (this.currentPhase === 6) {
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('bestScore', this.bestScore);
                document.getElementById('bestScoreDisplay').style.display = 'block';
                document.getElementById('bestScoreValue').textContent = this.bestScore;
            } else if (this.bestScore > 0) {
                document.getElementById('bestScoreDisplay').style.display = 'block';
                document.getElementById('bestScoreValue').textContent = this.bestScore;
            }
            document.getElementById('gameOverMessage').textContent = `Modo Sobrevivência - Você atingiu ${this.score} pontos!`;
        } else {
            document.getElementById('gameOverMessage').textContent = `Você perdeu todas as vidas na Fase ${this.currentPhase}`;
            document.getElementById('bestScoreDisplay').style.display = 'none';
        }
        
        document.getElementById('finalScore').textContent = this.score;
        this.hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
        document.getElementById('controlsHint').style.display = 'none';
    }

    victory() {
        this.gameState = 'victory';
        const nextPhase = this.currentPhase + 1;
        
        document.getElementById('victoryMessage').textContent = `Você venceu a Fase ${this.currentPhase}!`;
        
        // Esconder botão Próxima Fase se for última fase
        const nextPhaseBtn = document.getElementById('nextPhaseBtn');
        if (this.currentPhase >= 5) {
            nextPhaseBtn.style.display = 'none';
        } else {
            nextPhaseBtn.style.display = 'block';
        }
        
        this.hideAllScreens();
        document.getElementById('victoryScreen').classList.add('active');
        document.getElementById('controlsHint').style.display = 'none';
    }

    nextPhase() {
        if (this.currentPhase < 5) {
            this.startPhase(this.currentPhase + 1);
        } else {
            this.showMenu();
        }
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }

    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('livesDisplay').textContent = this.lives;
        const phaseNames = ['', 'Papel 🔵', 'Plástico 🔴', 'Vidro 💚', 'Metal 🟡', 'Orgânico 🟤', 'Sobrevivência 🎯'];
        document.getElementById('phaseDisplay').textContent = `Fase ${this.currentPhase} - ${phaseNames[this.currentPhase]}`;
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Movimento do jogador
        const moveSpeed = 8;
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.x = Math.max(this.player.width / 2, this.player.x - moveSpeed);
            this.player.targetX = this.player.x;
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.x = Math.min(this.canvas.width - this.player.width / 2, this.player.x + moveSpeed);
            this.player.targetX = this.player.x;
        }

        // Movimento suave para toque/clique
        const distance = this.player.targetX - this.player.x;
        if (Math.abs(distance) > 2) {
            this.player.x += distance * 0.1;
        }

        // Spawn de itens
        this.spawnCounter++;
        if (this.spawnCounter > this.spawnRate) {
            this.spawnItem();
            this.spawnCounter = 0;
        }

        // Spawn dinâmico para modo sobrevivência - muda a cada 100 pontos
        if (this.currentPhase === 6 && this.score > 0 && this.score % 100 === 0 && this.score !== this.lastSurvivalMilestone) {
            this.lastSurvivalMilestone = this.score;
            this.player.changeTargetType();
        }

        // Atualizar itens
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += this.itemSpeed;

            // Colisão com o jogador
            if (this.checkCollision(item, this.player)) {
                this.handleCollision(item);
                this.items.splice(i, 1);
            } else if (item.y > this.canvas.height) {
                // Item caiu no chão
                if (item.type === this.player.targetType) {
                    this.loseLife('Lixo correto não coletado!');
                }
                this.items.splice(i, 1);
            }
        }

        // Atualizar partículas
        this.particles = this.particles.filter(p => !p.isDead());
        this.particles.forEach(p => p.update());

        // Atualizar popups de score
        this.scorePopups = this.scorePopups.filter(sp => sp.life > 0);
        this.scorePopups.forEach(sp => sp.life--);

        this.updateUI();

        // Verificar vitória (apenas para fases 1-5, não para modo sobrevivência)
        if (this.currentPhase !== 6 && this.score >= 100) {
            this.victory();
        }
        // Modo sobrevivência continua infinitamente
    }

    spawnItem() {
        const x = Math.random() * (this.canvas.width - 60) + 30;
        const type = this.getRandomItemType();
        this.items.push(new Item(x, -30, type));
    }

    getRandomItemType() {
        const types = ['paper', 'plastic', 'glass', 'metal', 'organic'];
        let weights;
        
        if (this.currentPhase === 1) {
            weights = [0.6, 0.15, 0.1, 0.1, 0.05];
        } else if (this.currentPhase === 2) {
            weights = [0.15, 0.6, 0.1, 0.1, 0.05];
        } else if (this.currentPhase === 3) {
            weights = [0.1, 0.15, 0.6, 0.1, 0.05];
        } else if (this.currentPhase === 4) {
            weights = [0.1, 0.1, 0.15, 0.6, 0.05];
        } else if (this.currentPhase === 5) {
            weights = [0.05, 0.1, 0.1, 0.15, 0.6];
        } else {
            // Modo sobrevivência - igual distribuição
            weights = [0.2, 0.2, 0.2, 0.2, 0.2];
        }
        
        const rand = Math.random();
        let sum = 0;
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (rand < sum) return types[i];
        }
        return types[types.length - 1];
    }

    checkCollision(item, bin) {
        const distance = Math.sqrt(Math.pow(item.x - bin.x, 2) + Math.pow(item.y - bin.y, 2));
        return distance < (item.size + bin.width / 2);
    }

    handleCollision(item) {
        if (item.type === this.player.targetType) {
            this.addScore(10);
            this.combo++;
            this.correctItemsCollected++;
            this.comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.1;
            
            if (this.combo > 1 && this.combo % 5 === 0) {
                this.showCombo(this.combo);
            }
            
            this.createParticles(item.x, item.y, '#4CAF50');
        } else {
            this.loseLife('Lixo incorreto coletado!');
            this.combo = 0;
            this.comboMultiplier = 1;
            this.createParticles(item.x, item.y, '#f44336');
        }
    }

    addScore(points) {
        const finalPoints = Math.floor(points * this.comboMultiplier);
        this.score += finalPoints;
        
        this.scorePopups.push({
            x: this.player.x,
            y: this.player.y - 50,
            life: 30,
            text: `+${finalPoints}`,
            color: this.comboMultiplier > 1 ? '#FFD700' : '#4CAF50'
        });
    }

    loseLife(reason) {
        this.lives--;
        this.flashCanvas();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    showCombo(comboCount) {
        const text = document.createElement('div');
        text.className = 'combo-display';
        text.textContent = `🔥 COMBO x${comboCount}!`;
        document.getElementById('gameContainer').appendChild(text);
        setTimeout(() => text.remove(), 800);
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const vx = Math.cos(angle) * (2 + Math.random() * 2);
            const vy = Math.sin(angle) * (2 + Math.random() * 2);
            this.particles.push(new Particle(x, y, vx, vy, color));
        }
    }

    flashCanvas() {
        document.getElementById('gameContainer').classList.add('flash-red');
        setTimeout(() => {
            document.getElementById('gameContainer').classList.remove('flash-red');
        }, 300);
    }

    draw() {
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            this.player.draw(this.ctx);
            
            this.items.forEach(item => item.draw(this.ctx));
            this.particles.forEach(p => p.draw(this.ctx));
            
            // Desenhar popups de score
            this.scorePopups.forEach(sp => {
                this.ctx.save();
                this.ctx.globalAlpha = sp.life / 30;
                this.ctx.fillStyle = sp.color;
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(sp.text, sp.x, sp.y - (30 - sp.life) * 2);
                this.ctx.restore();
            });
        }
    }

    drawBackground() {
        // Gradiente de céu
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Nuvens
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.drawCloud(100, 50, 50);
        this.drawCloud(300, 80, 40);
        this.drawCloud(600, 60, 55);
        this.drawCloud(800, 70, 45);

        // Piso
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);

        // Grama
        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < this.canvas.width; i += 30) {
            this.drawGrass(i, this.canvas.height - 80);
        }

        // Sol
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 60, 40, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const x1 = this.canvas.width - 80 + Math.cos(angle) * 55;
            const y1 = 60 + Math.sin(angle) * 55;
            const x2 = this.canvas.width - 80 + Math.cos(angle) * 70;
            const y2 = 60 + Math.sin(angle) * 70;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size, y - size / 2, size * 1.2, 0, Math.PI * 2);
        this.ctx.arc(x + size * 2, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGrass(x, y) {
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 15);
        this.ctx.lineTo(x - 5, y + 5);
        this.ctx.moveTo(x, y + 15);
        this.ctx.lineTo(x + 5, y + 5);
        this.ctx.stroke();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }
}

// ==================== CLASSE DO JOGADOR (LIXEIRA) ====================
class Bin {
    constructor(x, y, phase) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.width = 80;
        this.phase = phase;
        
        // Mapeamento correto de tipos por fase
        const phaseTypes = {
            1: 'paper',
            2: 'plastic',
            3: 'glass',
            4: 'metal',
            5: 'organic',
            6: 'plastic' // Inicia com plástico em sobrevivência
        };
        this.targetType = phaseTypes[phase];

        // Cores das lixeiras por fase
        const phaseColors = {
            1: '#1976D2',  // Azul - Papel
            2: '#D32F2F',  // Vermelho - Plástico
            3: '#388E3C',  // Verde - Vidro
            4: '#FBC02D',  // Amarelo - Metal
            5: '#5D4037',  // Marrom - Orgânico
            6: '#1976D2'   // Azul padrão - Sobrevivência
        };
        this.color = phaseColors[phase];
    }

    changeTargetType() {
        const types = ['paper', 'plastic', 'glass', 'metal', 'organic'];
        this.targetType = types[Math.floor(Math.random() * types.length)];
    }

    draw(ctx) {
        // No modo sobrevivência, mudar a cor da lixeira de acordo com o tipo
        let displayColor = this.color;
        if (this.phase === 6) {
            const colorMap = {
                'paper': '#1976D2',
                'plastic': '#D32F2F',
                'glass': '#388E3C',
                'metal': '#FBC02D',
                'organic': '#5D4037'
            };
            displayColor = colorMap[this.targetType] || this.color;
        }

        // Se tiver imagem, desenha ela, caso contrário usa o desenho programático
        const binImageKey = this.phase === 6 ? 'survival' : this.targetType;
        const binImageSrc = ImageConfig.bins[binImageKey];
        const { width: displayWidth, height: displayHeight } = ImageConfig.displaySizes.bins;
        
        if (ImageConfig.useImages && binImageSrc && ImageCache[binImageSrc]) {
            // Desenha a imagem redimensionada
            const img = ImageCache[binImageSrc];
            ctx.drawImage(img, this.x - displayWidth / 2, this.y, displayWidth, displayHeight);
        } else {
            // Desenho programático como fallback
            // Corpo da lixeira
            ctx.fillStyle = displayColor;
            ctx.fillRect(this.x - this.width / 2, this.y, this.width, 60);

            // Alça
            ctx.strokeStyle = displayColor;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y - 5, this.width / 2.5, Math.PI, 0, false);
            ctx.stroke();

            // Borda
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.width / 2, this.y, this.width, 60);

            // Símbolo de reciclagem
            this.drawRecycleSymbol(ctx, this.x, this.y + 30);

            // Tipo de lixo com emoji
            const typeEmojis = { 
                'paper': '📄', 
                'plastic': '🍾', 
                'glass': '🍷',
                'metal': '⚙️',
                'organic': '🍌'
            };
            
            // Em modo sobrevivência, mostra um ícone que corresponde ao tipo atual
            let displayEmoji = typeEmojis[this.targetType] || '🗑️';
            
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(displayEmoji, this.x, this.y + 38);
        }
    }

    drawRecycleSymbol(ctx, x, y) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==================== CLASSE DO ITEM ====================
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    draw(ctx) {
        this.rotation += this.rotationSpeed;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const itemImageSrc = ImageConfig.items[this.type];
        const { width: displayWidth, height: displayHeight } = ImageConfig.displaySizes.items;
        
        if (ImageConfig.useImages && itemImageSrc && ImageCache[itemImageSrc]) {
            // Desenha a imagem redimensionada a partir do centro
            const img = ImageCache[itemImageSrc];
            ctx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
        } else {
            // Desenho programático como fallback
            switch (this.type) {
                case 'paper':
                    this.drawPaper(ctx);
                    break;
                case 'plastic':
                    this.drawPlasticBottle(ctx);
                    break;
                case 'glass':
                    this.drawGlassBottle(ctx);
                    break;
                case 'metal':
                    this.drawCan(ctx);
                    break;
                case 'organic':
                    this.drawOrganic(ctx);
                    break;
            }
        }

        ctx.restore();
    }

    drawPlasticBottle(ctx) {
        // Garrafa PET vermelha com formato realista
        ctx.fillStyle = '#E74C3C';
        ctx.globalAlpha = 0.8;
        
        // Corpo principal da garrafa
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-9, 5);
        ctx.lineTo(-8, 15);
        ctx.lineTo(-5, 18);
        ctx.lineTo(5, 18);
        ctx.lineTo(8, 15);
        ctx.lineTo(9, 5);
        ctx.lineTo(8, 0);
        ctx.quadraticCurveTo(0, -3, -8, 0);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        
        // Gargalo (pescoço) da garrafa
        ctx.fillStyle = '#D32F2F';
        ctx.fillRect(-4, -12, 8, 12);
        
        // Boca/abertura
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(-4, -14, 8, 2);
        
        // Borda do gargalo
        ctx.strokeStyle = '#A93226';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-4, -12, 8, 12);
        
        // Brilho no plástico
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-4, 5, 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawPaper(ctx) {
        // Papel azul (guardanapo/folha)
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(-10, -12, 20, 24);
        ctx.strokeStyle = '#0D47A1';
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -12, 20, 24);
        // Linhas para parecer papel dobrado
        for (let i = -8; i < 10; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, -12);
            ctx.lineTo(i, 12);
            ctx.stroke();
        }
    }

    drawGlassBottle(ctx) {
        // Garrafa de vidro verde/translúcida
        ctx.fillStyle = '#2ECC71';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-7, -18, 14, 36);
        ctx.globalAlpha = 1;
        
        // Gargalo
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(-5, -22, 10, 6);
        
        // Borda e brilho
        ctx.strokeStyle = '#229954';
        ctx.lineWidth = 2;
        ctx.strokeRect(-7, -18, 14, 36);
        
        // Brilho no vidro
        ctx.strokeStyle = '#A9DFBF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawCan(ctx) {
        // Lata amarela
        ctx.fillStyle = '#FBC02D';
        ctx.fillRect(-8, -15, 16, 28);
        
        // Topo da lata
        ctx.fillStyle = '#FDD835';
        ctx.fillRect(-8, -15, 16, 4);
        
        // Aba de abertura
        ctx.fillStyle = '#F9A825';
        ctx.beginPath();
        ctx.moveTo(-3, -17);
        ctx.lineTo(-3, -19);
        ctx.lineTo(3, -19);
        ctx.lineTo(3, -17);
        ctx.lineTo(0, -15);
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#F57F17';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -15, 16, 28);
    }

    drawOrganic(ctx) {
        // Casca de fruta/orgânico
        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.quadraticCurveTo(10, -8, 10, 0);
        ctx.quadraticCurveTo(10, 8, 0, 12);
        ctx.quadraticCurveTo(-10, 8, -10, 0);
        ctx.quadraticCurveTo(-10, -8, 0, -15);
        ctx.fill();
        
        // Detalhes da casca
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.quadraticCurveTo(0, -5, 5, -10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(0, 5, 6, 0);
        ctx.stroke();
        
        // Pequeno caule/sementes
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-1, -17, 2, 3);
    }

    check_collision(bin_x, bin_y, bin_width) {
        const distance = Math.sqrt(Math.pow(this.x - bin_x, 2) + Math.pow(this.y - bin_y, 2));
        return distance < (this.size + bin_width / 2);
    }
}

// ==================== CLASSE DE PARTÍCULAS ====================
class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 30;
        this.maxLife = 30;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// ==================== INICIALIZAÇÃO ====================
const game = new Game();
game.start();
