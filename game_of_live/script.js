/* --- KONFIGURACJA --- */
const config = {
    cellSize: 15,    // Wielkość komórki w pikselach
    cellColor: '#22d3ee',
    gridColor: 'rgba(255, 255, 255, 0.05)',
    deadColor: 'transparent'
};

const ui = {
    canvas: document.getElementById('gridCanvas'),
    ctx: document.getElementById('gridCanvas').getContext('2d'),
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnClear: document.getElementById('btn-clear'),
    btnRandom: document.getElementById('btn-random'),
    speedRange: document.getElementById('speed-range'),
    statPop: document.getElementById('stat-pop'),
    statGen: document.getElementById('stat-gen')
};

const simulation = {
    rows: 0,
    cols: 0,
    grid: [],
    nextGrid: [],
    isRunning: false,
    intervalId: null,
    generation: 0,
    population: 0,
    speed: 100,

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupEvents();
        this.draw();
    },

    resize() {
        // Dopasuj canvas do kontenera
        const parent = ui.canvas.parentElement;
        ui.canvas.width = parent.clientWidth - 40;
        ui.canvas.height = parent.clientHeight - 80;
        
        this.cols = Math.floor(ui.canvas.width / config.cellSize);
        this.rows = Math.floor(ui.canvas.height / config.cellSize);

        // Reset siatki przy zmianie rozmiaru
        this.resetGrid();
    },

    resetGrid() {
        this.grid = new Array(this.rows).fill(null).map(() => new Array(this.cols).fill(0));
        this.nextGrid = new Array(this.rows).fill(null).map(() => new Array(this.cols).fill(0));
        this.generation = 0;
        this.draw();
        this.updateStats();
    },

    randomize() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = Math.random() > 0.85 ? 1 : 0; // 15% szans na życie
            }
        }
        this.generation = 0;
        this.draw();
        this.updateStats();
    },

    // --- LOGIKA GRY (KLUCZOWE) ---
    computeNextGen() {
        let pop = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const neighbors = this.countNeighbors(r, c);
                const state = this.grid[r][c];

                // Zasady Conwaya:
                if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                    this.nextGrid[r][c] = 0; // Śmierć
                } else if (state === 0 && neighbors === 3) {
                    this.nextGrid[r][c] = 1; // Narodziny
                } else {
                    this.nextGrid[r][c] = state; // Bez zmian
                }

                if (this.nextGrid[r][c] === 1) pop++;
            }
        }

        // Zamiana tablic (swap)
        let temp = this.grid;
        this.grid = this.nextGrid;
        this.nextGrid = temp;

        this.generation++;
        this.population = pop;
        this.draw();
        this.updateStats();
    },

    countNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const r = row + i;
                const c = col + j;

                // Zawijanie krawędzi (Torus) - opcjonalne, tutaj po prostu ignorujemy krawędzie
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    count += this.grid[r][c];
                }
            }
        }
        return count;
    },

    // --- RYSOWANIE ---
    draw() {
        ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

        // Rysuj komórki
        ui.ctx.fillStyle = config.cellColor;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 1) {
                    ui.ctx.fillRect(
                        c * config.cellSize, 
                        r * config.cellSize, 
                        config.cellSize - 1, 
                        config.cellSize - 1
                    );
                }
            }
        }
        
        // (Opcjonalnie) Rysuj siatkę - można pominąć dla wydajności przy dużych siatkach
        /*
        ui.ctx.strokeStyle = config.gridColor;
        ui.ctx.beginPath();
        for (let r=0; r<=this.rows; r++) {
            ui.ctx.moveTo(0, r*config.cellSize);
            ui.ctx.lineTo(this.cols*config.cellSize, r*config.cellSize);
        }
        for (let c=0; c<=this.cols; c++) {
            ui.ctx.moveTo(c*config.cellSize, 0);
            ui.ctx.lineTo(c*config.cellSize, this.rows*config.cellSize);
        }
        ui.ctx.stroke();
        */
    },

    updateStats() {
        ui.statGen.textContent = this.generation;
        ui.statPop.textContent = this.population;
    },

    // --- STEROWANIE ---
    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    },

    start() {
        this.isRunning = true;
        ui.btnStart.classList.add('hidden');
        ui.btnPause.classList.remove('hidden');
        
        // Pętla interwału
        clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.computeNextGen(), 500 - this.speed);
    },

    pause() {
        this.isRunning = false;
        ui.btnStart.classList.remove('hidden');
        ui.btnPause.classList.add('hidden');
        clearInterval(this.intervalId);
    },

    clear() {
        this.pause();
        this.resetGrid();
    },

    // --- INTERAKCJA MYSZKĄ ---
    handleInput(e) {
        const rect = ui.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const c = Math.floor(x / config.cellSize);
        const r = Math.floor(y / config.cellSize);

        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            this.grid[r][c] = 1; // Rysowanie (ożywianie)
            this.draw();
        }
    },

    // --- PRESETY (WZORCE) ---
    loadPreset(name) {
        this.clear();
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);

        if (name === 'glider') {
            const pattern = [[0,1], [1,2], [2,0], [2,1], [2,2]];
            pattern.forEach(([r, c]) => this.grid[cy + r - 10][cx + c - 10] = 1);
        }
        else if (name === 'pulsar') {
            // Prosty oscylator (Pasek)
            this.grid[cy][cx] = 1;
            this.grid[cy][cx-1] = 1;
            this.grid[cy][cx+1] = 1;
        }
        else if (name === 'gun') {
            // Gosper Glider Gun (uproszczony)
            // Wymaga dużej siatki, tu wstawimy "R-pentomino" (generuje chaos)
            const pattern = [[0,1], [0,2], [1,0], [1,1], [2,1]];
            pattern.forEach(([r, c]) => this.grid[cy + r][cx + c] = 1);
        }
        this.draw();
    },

    setupEvents() {
        ui.btnStart.onclick = () => this.start();
        ui.btnPause.onclick = () => this.pause();
        ui.btnRandom.onclick = () => this.randomize();
        ui.btnClear.onclick = () => this.clear();

        ui.speedRange.oninput = (e) => {
            this.speed = parseInt(e.target.value);
            if (this.isRunning) this.start(); // Restart z nową prędkością
        };

        // Rysowanie myszką
        let isDrawing = false;
        ui.canvas.onmousedown = (e) => { isDrawing = true; this.handleInput(e); };
        ui.canvas.onmousemove = (e) => { if (isDrawing) this.handleInput(e); };
        window.onmouseup = () => { isDrawing = false; };
        
        // Dotyk (mobile)
        ui.canvas.ontouchstart = (e) => { e.preventDefault(); isDrawing = true; };
        ui.canvas.ontouchmove = (e) => {
            if(!isDrawing) return;
            // Przeliczanie dotyku na współrzędne jest trudniejsze, 
            // w wersji prostej można pominąć 'move' na mobile
        };
    }
};

/* START */
simulation.init();