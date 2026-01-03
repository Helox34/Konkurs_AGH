document.addEventListener("DOMContentLoaded", () => {
    
    // Animacje wejścia
    const elements = document.querySelectorAll('.fade-in-stagger');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 150}ms`;
    });

    // --- LOGIKA SZYFRU CEZARA ---
    const plainInput = document.getElementById('plainInput');
    const cipherOutput = document.getElementById('cipherOutput');
    const shiftSlider = document.getElementById('shiftKey');
    const shiftValueDisplay = document.getElementById('shiftValue');

    function caesarCipher(str, shift) {
        // Upewniamy się, że shift jest w zakresie 0-25
        shift = shift % 26;
        
        // Konwersja na wielkie litery dla prostoty
        str = str.toUpperCase();
        
        let result = '';

        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);

            // Sprawdź czy to litera A-Z (ASCII 65-90)
            if (charCode >= 65 && charCode <= 90) {
                // Wzór: E(x) = (x + k) mod 26
                // 1. Zamiana ASCII na 0-25 (A=0, B=1...)
                let x = charCode - 65;
                
                // 2. Dodanie przesunięcia
                let newX = x + shift;
                
                // 3. Modulo 26 (reszta z dzielenia)
                let modX = newX % 26;
                
                // 4. Powrót na ASCII
                result += String.fromCharCode(modX + 65);
            } else {
                // Jeśli to nie litera (np. spacja, liczba), przepisz bez zmian
                result += str[i];
            }
        }
        return result;
    }

    // Funkcja aktualizująca widok
    function updateCipher() {
        const text = plainInput.value;
        const shift = parseInt(shiftSlider.value);
        
        // Aktualizuj wyświetlaną liczbę klucza
        shiftValueDisplay.innerText = shift;
        
        // Wykonaj szyfrowanie
        const encrypted = caesarCipher(text, shift);
        
        // Wstaw wynik
        cipherOutput.value = encrypted;
    }

    // Nasłuchiwanie zdarzeń (pisanie lub przesuwanie suwaka)
    plainInput.addEventListener('input', updateCipher);
    shiftSlider.addEventListener('input', updateCipher);

    // Wywołanie na start (żeby coś było widać od razu)
    updateCipher();
});