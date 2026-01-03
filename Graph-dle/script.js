/* --- BAZA WIEDZY: MATEMATYKA --- */
const mathShapes = {
    // PODSTAWA
    "parabola": { name: ["Parabola"], desc: "Wykres funkcji kwadratowej. Symetryczna względem osi, ma ramiona i wierzchołek.", tier: "easy" },
    "sinusoida": { name: ["Sinusoida", "Sinus"], desc: "Wykres funkcji trygonometrycznej sin(x). Powtarzająca się fala przechodząca przez (0,0).", tier: "easy" },
    "hiperbola": { name: ["Hiperbola"], desc: "Wykres funkcji wymiernej (1/x). Składa się z dwóch oddzielnych gałęzi.", tier: "easy" },
    "okrag": { name: ["Okrąg"], desc: "Zbiór punktów równoodległych od środka. Równanie: x² + y² = r².", tier: "easy" },
    "modul": { name: ["Wartość bezwzględna"], desc: "Wykres y = |x|. Charakterystyczny kształt litery V.", tier: "easy" },

    // ROZSZERZENIE
    "elipsa": { name: ["Elipsa"], desc: "Spłaszczony okrąg. Suma odległości od dwóch ognisk jest stała.", tier: "hard" },
    "tangensoida": { name: ["Tangensoida", "Tangens"], desc: "Wykres funkcji tg(x). Rośnie w nieskończoność, przerywana asymptotami.", tier: "hard" },
    "wykladnicza": { name: ["Krzywa wykładnicza", "Funkcja wykładnicza"], desc: "Wykres y = a^x. Szybko rośnie (lub maleje), nigdy nie dotyka osi X.", tier: "hard" },
    "logarytmiczna": { name: ["Krzywa logarytmiczna", "Logarytm"], desc: "Odbicie funkcji wykładniczej. Rośnie coraz wolniej, zdefiniowana dla x > 0.", tier: "hard" },
    "gauss": { name: ["Krzywa Gaussa", "Rozkład normalny"], desc: "Krzywa dzwonowa. Kluczowa w statystyce i prawdopodobieństwie.", tier: "hard" },

    // EKSPERT (STUDIA/CIEKAWOSTKI)
    "mandelbrot": { name: ["Zbiór Mandelbrota"], desc: "Najsłynniejszy fraktal. Zbiór punktów C, dla których ciąg nie ucieka do nieskończoności.", tier: "expert" },
    "sierpinski": { name: ["Trójkąt Sierpińskiego"], desc: "Fraktal powstający przez usuwanie środkowego trójkąta z większych trójkątów.", tier: "expert" },
    "mobius": { name: ["Wstęga Möbiusa"], desc: "Powierzchnia jednostronna. Można ją zrobić skręcając pasek papieru o 180 stopni.", tier: "expert" },
    "torus": { name: ["Torus"], desc: "Bryła w kształcie obwarzanka. Powstaje przez obrót okręgu wokół osi.", tier: "expert" },
    "kardioida": { name: ["Kardioida", "Serce"], desc: "Krzywa w kształcie serca. Powstaje, gdy okrąg toczy się po drugim okręgu.", tier: "expert" }
};

// Generowanie puli dla poziomów
function getPool(difficulty) {
    const keys = Object.keys(mathShapes);
    if (difficulty === 'easy') return keys.filter(k => mathShapes[k].tier === 'easy');
    if (difficulty === 'hard') return keys.filter(k => mathShapes[k].tier === 'easy' || mathShapes[k].tier === 'hard');
    return keys; // expert ma wszystko
}

/* --- UI --- */
const ui = {
    elements: {
        screens: { menu: document.getElementById('menu'), game: document.getElementById('game') },
        img: document.getElementById('flag'),
        input: document.getElementById('guess'),
        msg: document.getElementById('message'),
        dotsBox: document.getElementById('attemptsDots'),
        round: document.getElementById('round'),
        score: document.getElementById('score'),
        progressBar: document.getElementById('progressBar'),
        suggestList: document.getElementById('suggestList'),
        hintBox: document.getElementById('hintBox'),
        hintText: document.getElementById('hintText'),
        hintBtn: document.getElementById('hintBtn'),
        backBtn: document.getElementById('backMenu')
    },

    init() { this.updateMenuScores(); },

    updateMenuScores() {
        ['easy', 'hard', 'expert'].forEach(mode => {
            const el = document.getElementById(`record-${mode}`);
            if (el) el.textContent = localStorage.getItem(`graph_best_${mode}`) || 0;
        });
    },

    showGame() {
        this.elements.screens.menu.classList.add('hidden');
        this.elements.screens.game.classList.remove('hidden');
        this.elements.screens.game.classList.add('fade-in');
    },

    showMenu() {
        this.updateMenuScores();
        this.elements.screens.game.classList.add('hidden');
        this.elements.screens.menu.classList.remove('hidden');
    },

    // Blur maleje z każdą próbą
    updateBlur(triesLeft, maxTries) {
        // Startujemy od np. 15px, kończymy na 0
        const px = (triesLeft / maxTries) * 15;
        this.elements.img.style.filter = `blur(${px}px)`;
    },

    setDots(total, used) {
        this.elements.dotsBox.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i < used ? ' used' : '');
            this.elements.dotsBox.appendChild(dot);
        }
    },

    toggleHint() {
        this.elements.hintBox.classList.remove('hidden');
        this.elements.hintBtn.classList.add('hidden'); // Ukryj przycisk po użyciu
    },

    resetHint() {
        this.elements.hintBox.classList.add('hidden');
        this.elements.hintBtn.classList.remove('hidden');
    },

    shakeInput() {
        this.elements.input.parentElement.classList.add('shake');
        setTimeout(() => this.elements.input.parentElement.classList.remove('shake'), 400);
    }
};

/* --- LOGIKA GRY --- */
const game = {
    config: { maxTries: 5, maxRounds: 5 },
    state: { 
        mode: null, round: 1, tries: 0, score: 0, 
        currentKey: null, pool: [] 
    },
    validNames: [],

    start(mode) {
        this.state.mode = mode;
        this.state.score = 0;
        this.state.round = 1;
        
        // Losowanie pytań
        const fullPool = getPool(mode);
        this.state.pool = this.shuffle(fullPool).slice(0, this.config.maxRounds);
        
        // Lista wszystkich nazw do podpowiedzi w inpucie
        this.validNames = [];
        Object.values(mathShapes).forEach(obj => {
            this.validNames.push(...obj.name);
        });
        this.validNames.sort();

        ui.elements.score.textContent = '0';
        ui.showGame();
        this.newRound();
    },

    newRound() {
        if (this.state.round > this.config.maxRounds) return this.endGame();

        this.state.currentKey = this.state.pool[this.state.round - 1];
        const currentObj = mathShapes[this.state.currentKey];
        
        this.state.tries = 0;

        // Reset UI
        ui.elements.input.value = '';
        ui.elements.input.disabled = false;
        ui.elements.backBtn.classList.add('hidden');
        ui.elements.round.textContent = this.state.round;
        ui.elements.msg.textContent = "Co to za wykres?";
        ui.elements.msg.style.color = "#94a3b8";
        ui.setDots(this.config.maxTries, 0);
        
        // Pasek postępu
        const progressPct = ((this.state.round - 1) / this.config.maxRounds) * 100;
        ui.elements.progressBar.style.width = `${progressPct}%`;

        // Hint (Definicja)
        ui.resetHint();
        ui.elements.hintText.textContent = currentObj.desc;

        // Obrazek (UWAGA: Zrób własne obrazki i nazwij je np. parabola.png w folderze img/)
        // Na razie placeholder
        ui.elements.img.src = `https://placehold.co/600x400/ffffff/000000?text=${this.state.currentKey.toUpperCase()}`;
        // ui.elements.img.src = `img/${this.state.currentKey}.png`; // Docelowo tak
        
        ui.updateBlur(this.config.maxTries, this.config.maxTries);
    },

    checkGuess() {
        const userVal = ui.elements.input.value.trim().toLowerCase();
        const currentObj = mathShapes[this.state.currentKey];
        const correctNames = currentObj.name.map(n => n.toLowerCase());

        this.state.tries++;
        ui.setDots(this.config.maxTries, this.state.tries);

        if (correctNames.includes(userVal)) {
            // SUKCES
            const points = (this.config.maxTries - this.state.tries) + 1;
            this.state.score += points;
            ui.elements.score.textContent = this.state.score;

            ui.elements.msg.textContent = `Brawo! To ${currentObj.name[0]}`;
            ui.elements.msg.style.color = "var(--success)";
            
            // Pokaż definicję jako nagrodę edukacyjną
            ui.toggleHint();
            
            ui.elements.img.style.filter = 'none'; // Wyostrz
            this.nextRoundDelay();
        } else {
            // BŁĄD
            if (this.state.tries >= this.config.maxTries) {
                ui.elements.msg.textContent = `Porażka! To: ${currentObj.name[0]}`;
                ui.elements.msg.style.color = "var(--danger)";
                ui.elements.img.style.filter = 'none';
                ui.toggleHint(); // Pokaż definicję, żeby się nauczył
                this.nextRoundDelay();
            } else {
                ui.elements.msg.textContent = "Pudło! Obraz się wyostrza...";
                ui.elements.msg.style.color = "var(--warning)";
                ui.shakeInput();
                // Zmniejsz blur
                ui.updateBlur(this.config.maxTries - this.state.tries, this.config.maxTries);
            }
        }
    },

    nextRoundDelay() {
        ui.elements.input.disabled = true;
        setTimeout(() => {
            this.state.round++;
            this.newRound();
        }, 2500); // Dłuższy czas, żeby przeczytać definicję
    },

    endGame() {
        ui.elements.progressBar.style.width = '100%';
        ui.elements.msg.textContent = `Koniec! Wynik: ${this.state.score}`;
        ui.elements.msg.style.color = "white";
        ui.elements.backBtn.classList.remove('hidden');

        // Zapis rekordu
        const key = `graph_best_${this.state.mode}`;
        const best = parseInt(localStorage.getItem(key) || 0);
        if (this.state.score > best) {
            localStorage.setItem(key, this.state.score);
        }
    },

    backToMenu() { ui.showMenu(); },

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }
};

/* --- START --- */
ui.init();
document.getElementById('checkBtn').addEventListener('click', () => game.checkGuess());
ui.elements.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') game.checkGuess(); });

// Podpowiedzi w inpucie
ui.elements.input.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    ui.elements.suggestList.innerHTML = '';
    if (val.length < 2) return;
    
    const matches = game.validNames.filter(n => n.toLowerCase().includes(val)).slice(0, 5);
    matches.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        li.onclick = () => {
            ui.elements.input.value = name;
            ui.elements.suggestList.innerHTML = '';
            ui.elements.input.focus();
        };
        ui.elements.suggestList.appendChild(li);
    });
});