/* --- BAZA DANYCH: MATH BATTLE --- */
const mathDB = [
    // Stałe Matematyczne
    { 
        name: "Liczba PI (π)", 
        val: 3.14159, 
        img: "https://placehold.co/400x300/10b981/ffffff?text=π",
        desc: "Stosunek obwodu koła do jego średnicy. Jest liczbą niewymierną."
    },
    { 
        name: "Liczba Eulera (e)", 
        val: 2.71828, 
        img: "https://placehold.co/400x300/3b82f6/ffffff?text=e",
        desc: "Podstawa logarytmu naturalnego. Kluczowa w analizie matematycznej."
    },
    { 
        name: "Złota Liczba (φ)", 
        val: 1.61803, 
        img: "https://placehold.co/400x300/f59e0b/ffffff?text=φ",
        desc: "Określa złoty podział. Występuje powszechnie w przyrodzie i sztuce."
    },
    { 
        name: "Pierwiastek z 2", 
        val: 1.41421, 
        img: "https://placehold.co/400x300/ef4444/ffffff?text=√2",
        desc: "Długość przekątnej kwadratu o boku 1. Pierwsza odkryta liczba niewymierna."
    },
    
    // Wartości Trygonometryczne
    { 
        name: "Sinus 30°", 
        val: 0.5, 
        img: "https://placehold.co/400x300/8b5cf6/ffffff?text=sin(30°)",
        desc: "Sinus kąta 30 stopni wynosi dokładnie 1/2."
    },
    { 
        name: "Sinus 45°", 
        val: 0.7071, 
        img: "https://placehold.co/400x300/8b5cf6/ffffff?text=sin(45°)",
        desc: "Wynosi √2/2. Ważna wartość w trójkątach prostokątnych."
    },
    { 
        name: "Tangens 45°", 
        val: 1.0, 
        img: "https://placehold.co/400x300/8b5cf6/ffffff?text=tg(45°)",
        desc: "Tangens 45 stopni wynosi dokładnie 1, bo przyprostokątne są równe."
    },

    // Logarytmy i Potęgi
    { 
        name: "Logarytm dziesiętny z 100", 
        val: 2.0, 
        img: "https://placehold.co/400x300/ec4899/ffffff?text=log(100)",
        desc: "Do jakiej potęgi trzeba podnieść 10, aby otrzymać 100? Do drugiej (10² = 100)."
    },
    { 
        name: "2 do potęgi 10", 
        val: 1024, 
        img: "https://placehold.co/400x300/ec4899/ffffff?text=2^10",
        desc: "Podstawowa wartość w informatyce (1 Kilobajt = 1024 bajty w systemie binarnym)."
    },
    { 
        name: "Silnia z 5 (5!)", 
        val: 120, 
        img: "https://placehold.co/400x300/ec4899/ffffff?text=5!",
        desc: "Iloczyn liczb od 1 do 5: 1 * 2 * 3 * 4 * 5 = 120."
    },
    
    // Ciekawostki
    { 
        name: "Kąt pełny (stopnie)", 
        val: 360, 
        img: "https://placehold.co/400x300/10b981/ffffff?text=360°",
        desc: "Koło dzieli się na 360 stopni. Liczba ta ma wiele dzielników."
    }
];

const ui = {
    elements: {
        left: { 
            img: document.getElementById('img-left'), 
            name: document.getElementById('name-left'), 
            val: document.getElementById('val-left'),
            desc: document.getElementById('desc-left') 
        },
        right: { 
            img: document.getElementById('img-right'), 
            name: document.getElementById('name-right'), 
            val: document.getElementById('val-right'), 
            btns: document.getElementById('buttons-area'), 
            res: document.getElementById('result-area'),
            desc: document.getElementById('desc-right')
        },
        score: document.getElementById('current-score'),
        best: document.getElementById('best-score'),
        modal: document.getElementById('game-over'),
        msg: document.getElementById('loss-msg'),
        final: document.getElementById('final-score-val')
    },

    init() {
        this.elements.best.textContent = localStorage.getItem('math_highscore') || 0;
        
        // Zabezpieczenie przed brakiem obrazków
        const fallback = "https://placehold.co/400x300?text=Brak+IMG";
        this.elements.left.img.onerror = () => { this.elements.left.img.src = fallback; };
        this.elements.right.img.onerror = () => { this.elements.right.img.src = fallback; };
    }
};

const game = {
    state: { left: null, right: null, score: 0, isAnimating: false },

    init() {
        ui.init();
        this.state.left = this.getRandom();
        this.state.right = this.getSimilar(this.state.left);
        this.render();
    },

    getRandom(exclude) {
        let item;
        do { item = mathDB[Math.floor(Math.random() * mathDB.length)]; } while (exclude && item.name === exclude.name);
        return item;
    },

    getSimilar(baseItem) {
        // Dobieramy losowo drugą wartość
        return this.getRandom(baseItem);
    },

    formatNumber(num) {
        // Usuwanie zbędnych zer na końcu dla liczb zmiennoprzecinkowych
        return parseFloat(num).toLocaleString('pl-PL', { maximumFractionDigits: 5 });
    },

    render() {
        const { left, right } = this.state;
        
        // Render Lewa Strona
        ui.elements.left.img.src = left.img;
        ui.elements.left.name.textContent = left.name;
        ui.elements.left.val.textContent = this.formatNumber(left.val);
        ui.elements.left.desc.textContent = left.desc;

        // Render Prawa Strona
        ui.elements.right.img.src = right.img;
        ui.elements.right.name.textContent = right.name;
        ui.elements.right.val.textContent = "???";
        ui.elements.right.desc.textContent = right.desc;
        
        ui.elements.right.btns.classList.remove('hidden');
        ui.elements.right.res.classList.add('hidden');
        ui.elements.right.val.style.color = "#FFD700";
    },

    guess(dir) {
        if (this.state.isAnimating) return;
        this.state.isAnimating = true;
        
        const correct = (dir === 'higher' && this.state.right.val >= this.state.left.val) ||
                        (dir === 'lower' && this.state.right.val <= this.state.left.val);
        
        this.reveal(correct);
    },

    reveal(correct) {
        ui.elements.right.btns.classList.add('hidden');
        ui.elements.right.res.classList.remove('hidden');
        
        // Animacja liczby
        const el = ui.elements.right.val;
        el.textContent = this.formatNumber(this.state.right.val);
        
        if (correct) {
            el.style.color = "#10b981"; // Zielony
            setTimeout(() => this.next(), 1500);
        } else {
            el.style.color = "#ef4444"; // Czerwony
            setTimeout(() => this.over(), 2000);
        }
    },

    next() {
        this.state.score++;
        ui.elements.score.textContent = this.state.score;
        this.state.left = this.state.right;
        this.state.right = this.getSimilar(this.state.left);
        this.render();
        this.state.isAnimating = false;
    },

    over() {
        const best = parseInt(localStorage.getItem('math_highscore') || 0);
        if (this.state.score > best) {
            localStorage.setItem('math_highscore', this.state.score);
            ui.elements.msg.innerHTML = `Nowy rekord!<br>Prawidłowa wartość: <strong>${this.formatNumber(this.state.right.val)}</strong>`;
        } else {
            ui.elements.msg.innerHTML = `Błąd! <br>Prawidłowa wartość: <strong>${this.formatNumber(this.state.right.val)}</strong>`;
        }
        ui.elements.final.textContent = this.state.score;
        ui.elements.modal.classList.remove('hidden');
    },

    restart() {
        this.state.score = 0;
        ui.elements.score.textContent = "0";
        ui.elements.best.textContent = localStorage.getItem('math_highscore') || 0;
        ui.elements.modal.classList.add('hidden');
        
        this.state.left = this.getRandom();
        this.state.right = this.getSimilar(this.state.left);
        this.render();
        this.state.isAnimating = false;
    }
};

game.init();