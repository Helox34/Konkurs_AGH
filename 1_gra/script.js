document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Elementy Interfejsu (UI)
    const overlay = document.getElementById('overlay');
    const msgTitle = document.getElementById('msgTitle');
    const msgText = document.getElementById('msgText');
    const actionBtn = document.getElementById('actionBtn');
    const movesContainer = document.getElementById('movesContainer');
    const diffButtons = document.querySelectorAll('.diff-btn');
    const diffContainer = document.querySelector('.difficulty-container');
    
    // Elementy Wyników
    const scoreP_el = document.getElementById('scorePlayer');
    const areaP_el = document.getElementById('areaPlayer');
    const scoreC_el = document.getElementById('scoreCPU');
    const areaC_el = document.getElementById('areaCPU');

    // Konfiguracja Gry
    const MAX_MOVES = 5; // Liczba ruchów na rundę
    let movesLeft = MAX_MOVES;
    let round = 1;
    let scorePlayer = 0;
    let scoreCPU = 0;
    let gameState = 'START'; // Możliwe stany: START, PLAYING, WAITING, RESULT, END
    
    // Domyślny poziom trudności
    let currentDifficulty = 'MEDIUM'; 

    // Tablica przechowująca bazy: {x, y, owner: 'P' (Player) lub 'C' (CPU)}
    let bases = [];
    
    const width = canvas.width;
    const height = canvas.height;

    // --- 1. OBSŁUGA PRZYCISKÓW TRUDNOŚCI ---
    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Usuń klasę 'active' ze wszystkich przycisków
            diffButtons.forEach(b => b.classList.remove('active'));
            // Dodaj do klikniętego
            btn.classList.add('active');
            // Zapisz wybrany poziom
            currentDifficulty = btn.getAttribute('data-level');
        });
    });

    // --- 2. FUNKCJE RYSOWANIA ---

    // Aktualizacja kropek oznaczających liczbę ruchów
    function updateMovesUI() {
        movesContainer.innerHTML = '';
        for(let i=0; i<MAX_MOVES; i++) {
            const dot = document.createElement('div');
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.borderRadius = '50%';
            // Niebieskie = dostępne, Szare = zużyte
            dot.style.background = i < movesLeft ? '#3b82f6' : '#334155';
            dot.style.display = 'inline-block';
            dot.style.margin = '0 3px';
            movesContainer.appendChild(dot);
        }
    }

    // Czyszczenie planszy i rysowanie siatki
    function clearCanvas() {
        // Tło
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Siatka
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for(let i=0; i<width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
        for(let i=0; i<height; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }
    }

    // Rysowanie samych baz (kropek graczy)
    function drawBases() {
        bases.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); // Promień bazy
            ctx.fillStyle = b.owner === 'P' ? '#3b82f6' : '#ec4899';
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();
            
            // Biała obwódka dla kontrastu
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }

    // GŁÓWNA FUNKCJA WIZUALIZACJI TERYTORIUM (WORONOJ)
    function drawTerritories() {
        if (bases.length === 0) return 0;
        
        // Czyścimy tło (żeby usunąć stare kropki terytorium)
        clearCanvas();

        // Liczba próbek - im więcej, tym dokładniejsza mapa (4000 jest ok dla wydajności)
        const samples = 4000; 
        let pCount = 0;
        let cCount = 0;

        for(let i=0; i<samples; i++) {
            // Losujemy punkt na mapie
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            
            // Szukamy najbliższej bazy dla tego punktu
            let minDist = Infinity;
            let owner = null;

            for (let b of bases) {
                // Odległość euklidesowa (bez pierwiastka dla szybkości)
                const d = (rx - b.x)**2 + (ry - b.y)**2;
                if (d < minDist) {
                    minDist = d;
                    owner = b.owner;
                }
            }

            // Rysujemy "mgiełkę" terytorium
            // Używamy fillRect(..., 4, 4) dla większych, wyraźniejszych punktów
            // Używamy opacity 0.5 dla lepszej widoczności
            if (owner === 'P') {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // Wyraźny Niebieski
                pCount++;
            } else {
                ctx.fillStyle = 'rgba(236, 72, 153, 0.5)'; // Wyraźny Różowy
                cCount++;
            }
            ctx.fillRect(rx, ry, 4, 4);
        }

        // Rysujemy bazy na wierzchu
        drawBases();

        // Obliczamy procenty
        const total = pCount + cCount;
        const pPerc = total === 0 ? 0 : Math.round((pCount / total) * 100);
        const cPerc = total === 0 ? 0 : 100 - pPerc;
        
        // Aktualizacja liczb w interfejsie
        areaP_el.innerText = pPerc + "%";
        areaC_el.innerText = cPerc + "%";
        
        return pPerc; // Zwracamy wynik gracza do logiki gry
    }

    // --- 3. LOGIKA RUCHÓW (GRACZ I AI) ---

    // Ruch Gracza
    function playerMove(x, y) {
        bases.push({x, y, owner: 'P'});
        movesLeft--;
        updateMovesUI();
        drawTerritories();
        
        gameState = 'WAITING'; // Blokada klikania podczas tury CPU
        
        // Jeśli zostały ruchy (dla obu stron), oddaj turę CPU
        if (movesLeft >= 0) {
            setTimeout(cpuMove, 600); // Małe opóźnienie dla naturalności
        }
    }

    // Ruch Komputera (AI)
    function cpuMove() {
        // AI analizuje mapę w zależności od poziomu trudności
        let attempts = 1; 

        if(currentDifficulty === 'EASY') attempts = 1;      // Losowo (1 strzał)
        if(currentDifficulty === 'MEDIUM') attempts = 15;   // 15 prób
        if(currentDifficulty === 'HARD') attempts = 100;    // 100 prób (szuka najlepszej dziury)

        let bestCandidate = null;
        let maxDistSum = -1;

        // Algorytm: Szukamy punktu, który jest NAJDALEJ od jakiejkolwiek innej bazy.
        // To pozwala AI zajmować puste przestrzenie.
        for(let i=0; i<attempts; i++) {
            const cx = Math.random() * (width - 40) + 20; // Margines 20px od krawędzi
            const cy = Math.random() * (height - 40) + 20;
            
            let distToNearest = Infinity;
            
            if(bases.length === 0) {
                distToNearest = 100; // Pierwszy ruch losowo
            } else {
                for(let b of bases) {
                    const d = Math.sqrt((cx - b.x)**2 + (cy - b.y)**2);
                    if(d < distToNearest) distToNearest = d;
                }
            }

            // Jeśli ten punkt jest dalej od innych niż poprzedni kandydat -> wybierz go
            if(distToNearest > maxDistSum) {
                maxDistSum = distToNearest;
                bestCandidate = {x: cx, y: cy};
            }
        }

        // Dodaj bazę CPU
        bases.push({x: bestCandidate.x, y: bestCandidate.y, owner: 'C'});
        
        // Sprawdź czy to koniec rundy
        if(movesLeft === 0) {
            const finalScore = drawTerritories();
            finishRound(finalScore);
        } else {
            drawTerritories();
            gameState = 'PLAYING'; // Oddaj sterowanie graczowi
        }
    }

    // --- 4. ZARZĄDZANIE STANEM GRY ---

    // Koniec rundy
    function finishRound(playerPercent) {
        gameState = 'RESULT';
        
        setTimeout(() => {
            if(playerPercent > 50) {
                scorePlayer++;
                scoreP_el.innerText = scorePlayer;
                showOverlay("Runda dla Ciebie!", true);
            } else {
                scoreCPU++;
                scoreC_el.innerText = scoreCPU;
                showOverlay("Runda dla CPU!", false);
            }
        }, 500);
    }

    // Wyświetlanie ekranu z komunikatem
    function showOverlay(title, isWin) {
        msgTitle.innerText = title;
        msgTitle.style.color = isWin ? '#3b82f6' : '#ec4899';
        
        // Ukryj wybór poziomu w trakcie przerwy między rundami
        diffContainer.style.display = 'none';

        if(scorePlayer >= 3 || scoreCPU >= 3) {
            endGame(); // Koniec meczu (Best of 5)
        } else {
            msgText.innerText = `Stan meczu: ${scorePlayer} - ${scoreCPU}`;
            actionBtn.innerText = "Następna Runda";
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'all';
            round++;
        }
    }

    // Koniec całego meczu
    function endGame() {
        gameState = 'END';
        if(scorePlayer > scoreCPU) {
            msgTitle.innerText = "ZWYCIĘSTWO!";
            msgTitle.style.color = '#10b981';
            msgText.innerText = "Jesteś mistrzem strategii.";
        } else {
            msgTitle.innerText = "PORAŻKA";
            msgTitle.style.color = '#ef4444';
            msgText.innerText = "Algorytm okazał się lepszy.";
        }
        actionBtn.innerText = "Menu Główne"; // Lub "Zagraj od nowa"
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    }

    // Start nowej rundy
    function startNewRound() {
        bases = [];
        movesLeft = MAX_MOVES;
        updateMovesUI();
        clearCanvas();
        areaP_el.innerText = "0%";
        areaC_el.innerText = "0%";
        
        // Ukryj overlay
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        gameState = 'PLAYING';
    }

    // Pełny reset (powrót do ekranu startowego)
    function fullReset() {
        scorePlayer = 0;
        scoreCPU = 0;
        round = 1;
        scoreP_el.innerText = '0';
        scoreC_el.innerText = '0';
        
        // Pokaż znowu wybór trudności
        diffContainer.style.display = 'flex';
        msgTitle.innerText = "Nowa Gra";
        msgText.innerText = "Wybierz poziom trudności:";
        msgTitle.style.color = 'white';
        actionBtn.innerText = "START";

        startNewRound();
        
        // Zatrzymaj na overlayu startowym
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        gameState = 'START';
    }

    // --- 5. OBSŁUGA WEJŚCIA (INPUT) ---

    // Kliknięcie przycisku START / DALEJ
    actionBtn.addEventListener('click', () => {
        if(gameState === 'START' || gameState === 'RESULT') {
            startNewRound();
        } else if (gameState === 'END') {
            fullReset();
        }
    });

    // Kliknięcie na planszę (stawianie bazy)
    canvas.addEventListener('mousedown', (e) => {
        if(gameState !== 'PLAYING') return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Sprawdź, czy nie stawiamy bazy zbyt blisko innej (min. 20px)
        for(let b of bases) {
            const dist = Math.sqrt((x - b.x)**2 + (y - b.y)**2);
            if(dist < 20) return; // Zignoruj kliknięcie
        }

        playerMove(x, y);
    });

    // Inicjalizacja początkowa
    clearCanvas();
    updateMovesUI();
});