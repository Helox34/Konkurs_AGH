document.addEventListener("DOMContentLoaded", () => {
    
    // UI Elements
    const overlay = document.getElementById('overlay');
    const msgTitle = document.getElementById('msgTitle');
    const msgText = document.getElementById('msgText');
    const actionBtn = document.getElementById('actionBtn');
    const diffButtons = document.querySelectorAll('.diff-btn');
    const diffContainer = document.querySelector('.difficulty-container');

    const scoreDisplay = document.getElementById('scoreDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const timerBar = document.getElementById('timerBar');
    
    const cipherDisplay = document.getElementById('cipherDisplay');
    const statusMessage = document.getElementById('statusMessage');
    const decoderSlider = document.getElementById('decoderSlider');
    const shiftValue = document.getElementById('shiftValue');
    const submitBtn = document.getElementById('submitBtn');

    // Baza słów (różne poziomy)
    const wordBank = {
        EASY: ["KOD", "AGH", "BIT", "NET", "WEB", "LAN", "PLIK", "DANE"],
        MEDIUM: ["SYSTEM", "HACKER", "ACCESS", "SERVER", "ROUTER", "PYTHON", "CIPHER", "LOGIKA"],
        HARD: ["FIREWALL", "SECURITY", "PROTOCOL", "DATABASE", "ENCRYPTION", "ALGORITHM", "MAINFRAME"]
    };

    // Game State
    let currentDifficulty = 'MEDIUM';
    let currentWord = ""; // Oryginalne słowo (JAWNE)
    let currentShift = 0; // O ile przesunęliśmy szyfrując (Klucz zagadki)
    let userShift = 0;    // Ile ustawił użytkownik
    
    let wordsSolved = 0;
    const wordsToWin = 5;
    let timeLeft = 100;
    let timerInterval;
    let isPlaying = false;

    // --- 1. FUNKCJE SZYFRUJĄCE ---

    // Funkcja Cezara (przesuwa tekst o 'shift')
    function caesar(text, shift) {
        let result = "";
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            // Obsługa tylko liter A-Z (ASCII 65-90)
            if (code >= 65 && code <= 90) {
                // Konwertuj na 0-25
                let x = code - 65;
                // Przesuń
                let newX = (x + shift) % 26;
                // Jeśli ujemne (przy odszyfrowywaniu), dodaj 26
                if (newX < 0) newX += 26;
                // Wróć na ASCII
                result += String.fromCharCode(newX + 65);
            } else {
                result += text[i]; // Znaki specjalne bez zmian
            }
        }
        return result;
    }

    // --- 2. LOGIKA ROZGRYWKI ---

    function nextRound() {
        if (!isPlaying) return;
        
        // 1. Wylosuj słowo
        const words = wordBank[currentDifficulty];
        currentWord = words[Math.floor(Math.random() * words.length)];
        
        // 2. Wylosuj przesunięcie (Szyfr) - minimum 1, max 25
        currentShift = Math.floor(Math.random() * 24) + 1;
        
        // 3. Zaszyfruj słowo, żeby wyświetlić "krzaczki"
        // Ale uwaga: Wyświetlamy zaszyfrowane słowo.
        // Suwak użytkownika będzie dodawany do zaszyfrowanego tekstu.
        // Żeby po przesunięciu suwaka np. na 5 otrzymać oryginał,
        // musimy tak to ustawić, żeby (encrypted + userShift) % 26 == original.
        
        // Prościej: Wyświetlamy tekst przesunięty o 'currentShift'.
        // Użytkownik ma suwak, który wizualnie zmienia tekst.
        // Tekst na ekranie = caesar(currentWord, currentShift + userShift)
        // Zadaniem użytkownika jest znaleźć taki 'userShift', żeby wynik był czytelny.
        
        // Reset suwaka
        userShift = 0; // Startujemy od 0 (czyli widzimy zaszyfrowane)
        decoderSlider.value = 0;
        // Losowo ustawiamy suwak na środku, żeby gracz musiał szukać? 
        // Nie, niech startuje od 0, ale tekst jest zaszyfrowany o 'currentShift'.
        
        updateScreen();
        statusMessage.innerText = "SZUKANIE CZĘSTOTLIWOŚCI...";
        statusMessage.className = "status-message";
    }

    function updateScreen() {
        // To co widzi użytkownik to Oryginał przesunięty o (Szyfr + Jego Suwak)
        // Ale chwila. Jeśli Szyfr to +3 (A->D), to żeby odzyskać A, musimy odjąć 3.
        // Suwak w naszej grze działa jako "Przesuń dalej".
        // Zróbmy tak: Tekst bazowy jest ZASZYFROWANY.
        // Suwak dodaje kolejne przesunięcie.
        // Jeśli tekst jest przesunięty o +3, to żeby go naprawić, trzeba go przesunąć o +23 (bo 26-3).
        
        const encryptedBase = caesar(currentWord, currentShift);
        const visualText = caesar(encryptedBase, userShift);
        
        cipherDisplay.innerText = visualText;
        shiftValue.innerText = userShift;
    }

    function checkAnswer() {
        // Sprawdź czy aktualnie wyświetlany tekst to oryginał
        const currentVisibleText = cipherDisplay.innerText;
        
        if (currentVisibleText === currentWord) {
            // SUKCES
            wordsSolved++;
            scoreDisplay.innerText = `${wordsSolved}/${wordsToWin}`;
            statusMessage.innerText = "DOSTĘP PRZYZNANY";
            statusMessage.className = "status-message success";
            
            // Bonusowy czas
            timeLeft += 15;
            if(timeLeft > 100) timeLeft = 100;
            
            if (wordsSolved >= wordsToWin) {
                gameOver(true);
            } else {
                setTimeout(nextRound, 800);
            }
        } else {
            // BŁĄD - kara czasowa
            timeLeft -= 15;
            statusMessage.innerText = "BŁĘDNY KLUCZ! -15% CZASU";
            statusMessage.style.color = "red";
            
            // Animacja błędu
            cipherDisplay.style.color = "red";
            setTimeout(() => {
                cipherDisplay.style.color = "var(--accent)";
                statusMessage.style.color = "#64748b";
            }, 500);
        }
    }

    function startGame() {
        wordsSolved = 0;
        scoreDisplay.innerText = "0/" + wordsToWin;
        levelDisplay.innerText = currentDifficulty;
        isPlaying = true;
        
        // Aktywuj kontrolki
        decoderSlider.disabled = false;
        submitBtn.disabled = false;
        
        // UI
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        // Start Czasu
        timeLeft = 100;
        clearInterval(timerInterval);
        
        // Szybkość czasu zależna od poziomu
        let speed = 50;
        if(currentDifficulty === 'HARD') speed = 30;

        timerInterval = setInterval(() => {
            timeLeft -= 0.2;
            timerBar.style.width = `${timeLeft}%`;
            
            if(timeLeft <= 0) {
                gameOver(false);
            }
        }, speed);

        nextRound();
    }

    function gameOver(win) {
        isPlaying = false;
        clearInterval(timerInterval);
        
        decoderSlider.disabled = true;
        submitBtn.disabled = true;

        msgTitle.innerText = win ? "SYSTEM ZŁAMANY" : "WYKRYTO WŁAMANIE";
        msgTitle.style.color = win ? "#10b981" : "#ef4444";
        msgText.innerText = win ? "Uzyskano pełny dostęp do danych." : "Połączenie przerwane przez serwer.";
        actionBtn.innerText = "RESTART SYSTEMU";
        
        // Pokaż menu
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        diffContainer.style.display = 'flex';
    }

    // --- 3. INPUTY ---

    decoderSlider.addEventListener('input', (e) => {
        userShift = parseInt(e.target.value);
        updateScreen();
    });

    submitBtn.addEventListener('click', checkAnswer);

    // Obsługa wyboru poziomu
    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.getAttribute('data-level');
        });
    });

    actionBtn.addEventListener('click', startGame);

});