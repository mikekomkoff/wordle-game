const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

let currentAttempt = 0;
let currentLetter = 0;
let gameOver = false;
let dailyWord = '';
let guesses = [];
let keyboardState = {};

const board = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const message = document.getElementById('message');

// Инициализация
function init() {
    dailyWord = getDailyWord();
    guesses = [];
    keyboardState = {};
    currentAttempt = 0;
    currentLetter = 0;
    gameOver = false;
    createBoard();
    createKeyboard();
    loadStats();
    checkDailyGame();
}

function createBoard() {
    board.innerHTML = '';
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.dataset.row = r;
        for (let c = 0; c < WORD_LENGTH; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.col = c;
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function createKeyboard() {
    keyboard.innerHTML = '';
    const rowData = [
        'й ц у к е н г ш щ з х ъ'.split(' '),
        'ф ы в а п р о л д ж э'.split(' '),
        ['Backspace', ...'я ч с м и т ь б ю'.split(' '), 'Enter']
    ];

    rowData.forEach((keys, idx) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        keys.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'key';
            if (key === 'Enter' || key === 'Backspace') {
                btn.classList.add('wide');
                btn.textContent = key === 'Backspace' ? '⌫' : 'Ввод';
            } else {
                btn.textContent = key.toUpperCase();
            }
            btn.dataset.key = key;
            btn.addEventListener('click', () => handleKey(key));
            rowDiv.appendChild(btn);
        });
        keyboard.appendChild(rowDiv);
    });
}

function getCurrentRow() {
    return document.querySelector(`.row[data-row="${currentAttempt}"]`);
}

function getTile(row, col) {
    return row.querySelector(`.tile[data-col="${col}"]`);
}

function handleKey(key) {
    if (gameOver) return;

    if (key === 'Enter') {
        submitGuess();
    } else if (key === 'Backspace') {
        deleteLetter();
    } else if (currentLetter < WORD_LENGTH) {
        addLetter(key);
    }
}

// ========== ТЕСТЫ ==========
function runTests() {
    console.log('=== Запуск тестов Вордли ===');
    let pass = 0, fail = 0;
    const check = (condition, description) => {
        if (condition) {
            console.log('  PASS: ' + description);
            pass++;
        } else {
            console.error('  FAIL: ' + description);
            fail++;
        }
    };

    const savedDailyWord = dailyWord;

    // 1. WORDS не пустой
    check(typeof WORDS !== 'undefined' && WORDS.length > 0, 'Словарь WORDS определён и не пуст');
    check(WORDS.every(w => w.length === 5), 'Все слова WORDS ровно 5 букв');

    // 2. getDailyWord возвращает слово из словаря
    const words = [];
    for (let i = 0; i < 100; i++) words.push(getDailyWord());
    check(words.every(w => WORDS.includes(w)), 'getDailyWord всегда возвращает слово из WORDS');
    check(words.every(w => w.length === 5), 'getDailyWord возвращает слова ровно 5 букв');

    // 3. getPuzzleNumber — положительное число
    const pn = getPuzzleNumber();
    check(Number.isFinite(pn) && pn >= 0, 'getPuzzleNumber даёт неотрицательное число');

    // 4. evaluateGuess возвращает массив длины WORD_LENGTH
    dailyWord = WORDS[0];
    const testResults = evaluateGuess(WORDS[0]);
    check(Array.isArray(testResults), 'evaluateGuess returns array');
    check(testResults.length === WORD_LENGTH, 'evaluateGuess returns array of length WORD_LENGTH');
    check(testResults.every(r => r === 'correct'), 'Exact match yields all correct');

    // 5. Тест повторяющихся букв
    dailyWord = 'ABABA';
    const repResult = evaluateGuess('ABABB');
    check(repResult[0] === 'correct', 'repeated: pos 0 correct');
    check(repResult[1] === 'correct', 'repeated: pos 1 correct');
    check(repResult[2] === 'correct', 'repeated: pos 2 correct');
    check(repResult[3] === 'correct', 'repeated: pos 3 correct');
    check(repResult[4] === 'absent', 'repeated: pos 4 absent');

    // 6. Буква есть, но не на своём месте
    dailyWord = 'АБВГД';
    const misResult = evaluateGuess('ГДАБВ');
    check(misResult.every(r => r === 'present' || r === 'correct'), 'All chars present or correct when all are in word');

    // 7. Keyboard and board exists
    check(board !== null, 'board element exists');
    check(keyboard !== null, 'keyboard element exists');

    dailyWord = savedDailyWord;

    console.log(`=== Results: ${pass} passed, ${fail} failed ===`);
}
// =========================

function updateSubmitButton() {
    const btn = document.querySelector('.key[data-key="Enter"]');
    if (!btn) return;
    if (currentLetter === WORD_LENGTH && !gameOver) {
        btn.classList.add('ready');
    } else {
        btn.classList.remove('ready');
    }
}

function addLetter(key) {
    const row = getCurrentRow();
    const tile = getTile(row, currentLetter);
    tile.textContent = key.toUpperCase();
    tile.classList.add('filled');
    currentLetter++;
    updateSubmitButton();
}

function deleteLetter() {
    if (currentLetter === 0) return;
    currentLetter--;
    const row = getCurrentRow();
    const tile = getTile(row, currentLetter);
    tile.textContent = '';
    tile.classList.remove('filled');
    updateSubmitButton();
}

function submitGuess() {
    if (currentLetter !== WORD_LENGTH) return;

    const row = getCurrentRow();
    let guess = '';
    for (let c = 0; c < WORD_LENGTH; c++) {
        guess += getTile(row, c).textContent;
    }

    const result = evaluateGuess(guess);
    animateRow(row, result);
    updateKeyboard(guess, result);

    guesses.push({ word: guess, result });

    if (guess === dailyWord) {
        gameOver = true;
        setTimeout(() => showResult(true), 1000);
    } else {
        currentAttempt++;
        currentLetter = 0;
        if (currentAttempt >= MAX_ATTEMPTS) {
            gameOver = true;
            setTimeout(() => showResult(false), 500);
        }
    }
}

function evaluateGuess(guess) {
    const wordArr = dailyWord.split('');
    const result = Array(WORD_LENGTH).fill('absent');
    const used = Array(WORD_LENGTH).fill(false);

    // First pass: correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === wordArr[i]) {
            result[i] = 'correct';
            used[i] = true;
        }
    }

    // Second pass: present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (result[i] === 'correct') continue;
        for (let j = 0; j < WORD_LENGTH; j++) {
            if (!used[j] && guess[i] === wordArr[j]) {
                result[i] = 'present';
                used[j] = true;
                break;
            }
        }
    }

    return result;
}

function animateRow(row, result) {
    const tiles = row.querySelectorAll('.tile');
    tiles.forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add(result[i], 'flip');
        }, i * 150);
    });
}

function updateKeyboard(guess, result) {
    const letters = guess.split('');
    letters.forEach((letter, i) => {
        const key = letter.toLowerCase();
        const btn = document.querySelector(`.key[data-key="${key}"]`);
        if (!btn) return;

        const current = keyboardState[key] || '';
        // Priority: correct > present > absent
        if (result[i] === 'correct') {
            keyboardState[key] = 'correct';
        } else if (result[i] === 'present' && current !== 'correct') {
            keyboardState[key] = 'present';
        } else if (!current) {
            keyboardState[key] = 'absent';
        }

        btn.className = 'key';
        if (keyboardState[key]) {
            btn.classList.add(keyboardState[key]);
        }
    });
}

function shakeRow(row) {
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 400);
}

let messageTimeout = null;

function showMessage(text) {
    if (messageTimeout) clearTimeout(messageTimeout);
    message.textContent = text;
    message.classList.add('visible');
    messageTimeout = setTimeout(() => {
        message.classList.remove('visible');
    }, 4000);
}

function showResult(won) {
    const modal = document.getElementById('result-modal');
    const content = document.getElementById('result-content');

    saveGame(won);

    let html = '';
    if (won) {
        html += `<div class="result-title">🎉 Поздравляю!</div>`;
    } else {
        html += `<div class="result-title">😔 В следующий раз повезёт</div>`;
    }

    html += `<div class="result-word">${dailyWord}</div>`;

    // Show guess grid
    html += `<div class="result-grid">`;
    guesses.forEach(g => {
        html += `<div class="result-row">`;
        g.result.forEach(r => {
            html += `<div class="result-tile ${r}"></div>`;
        });
        html += `</div>`;
    });
    html += `</div>`;

    if (won) {
        html += `<div class="result-info">Угадано за ${guesses.length} ${getAttemptWord(guesses.length)}</div>`;
    }

    content.innerHTML = html;
    modal.classList.remove('hidden');
    showShareButton();
}

function getAttemptWord(n) {
    if (n === 1) return 'попытку';
    if (n >= 2 && n <= 4) return 'попытки';
    return 'попыток';
}

// Статистика
function getStats() {
    try {
        return JSON.parse(localStorage.getItem('wordle_stats')) || {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
    } catch {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
    }
}

function saveGame(won) {
    const stats = getStats();
    stats.gamesPlayed++;

    if (won) {
        stats.gamesWon++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[guesses.length - 1]++;
    } else {
        stats.currentStreak = 0;
    }

    localStorage.setItem('wordle_stats', JSON.stringify(stats));
    localStorage.setItem('wordle_last_played', new Date().toDateString());
    loadStats();
}

function loadStats() {
    const stats = getStats();
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('win-rate').textContent = stats.gamesPlayed > 0
        ? Math.round(stats.gamesWon / stats.gamesPlayed * 100) + '%'
        : '0%';
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('max-streak').textContent = stats.maxStreak;

    const dist = document.getElementById('distribution-bars');
    const maxBar = Math.max(...stats.guessDistribution, 1);
    dist.innerHTML = '';
    stats.guessDistribution.forEach((count, i) => {
        const row = document.createElement('div');
        row.className = 'bar-row';
        row.innerHTML = `
            <span class="bar-label">${i + 1}</span>
            <div class="bar-fill" style="width: ${Math.max(count / maxBar * 100, 5)}%">${count || ''}</div>
        `;
        dist.appendChild(row);
    });
}

function checkDailyGame() {
    const lastPlayed = localStorage.getItem('wordle_last_played');
    const today = new Date().toDateString();
    if (lastPlayed === today) {
        gameOver = true;
        showMessage('Вы уже играли сегодня. Заходите завтра!');
        showShareButton();
    }
}

function shareResult() {
    let text = `Вордли ${getPuzzleNumber()} ${guesses.length}/${MAX_ATTEMPTS}\n\n`;
    guesses.forEach(g => {
        g.result.forEach(r => {
            text += r === 'correct' ? '🟦' : r === 'present' ? '⬜' : '⬛';
        });
        text += '\n';
    });

    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.switchInlineQuery) {
        Telegram.WebApp.switchInlineQuery(text, ['users', 'groups', 'channels']);
    } else if (navigator.share) {
        navigator.share({ text }).catch(() => {
            navigator.clipboard.writeText(text).then(() => {
                showMessage('Результат скопирован!');
            });
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('Результат скопирован!');
        });
    }
}

function showShareButton() {
    document.getElementById('share-bottom').classList.remove('hidden');
}

// Модальные окна
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.add('hidden');
    });
});

document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.add('hidden');
    });
});

function openRules() { document.getElementById('rules-modal').classList.remove('hidden'); }
function openStats() { loadStats(); document.getElementById('stats-modal').classList.remove('hidden'); }
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('wordle-dark', isDark);
    const icon = isDark ? '☀️' : '🌙';
    document.getElementById('theme-btn').textContent = icon;
    document.getElementById('theme-btn-mobile').textContent = icon;
}

function toggleColorblind() {
    const isCb = document.body.classList.toggle('colorblind');
    localStorage.setItem('wordle-colorblind', isCb);
    document.getElementById('cb-btn').style.opacity = isCb ? '1' : '0.5';
    document.getElementById('cb-btn-mobile').style.opacity = isCb ? '1' : '0.5';
}

document.getElementById('rules-btn').addEventListener('click', openRules);
document.getElementById('rules-btn-mobile').addEventListener('click', openRules);
document.getElementById('stats-btn').addEventListener('click', openStats);
document.getElementById('stats-btn-mobile').addEventListener('click', openStats);
document.getElementById('theme-btn').addEventListener('click', toggleTheme);
document.getElementById('theme-btn-mobile').addEventListener('click', toggleTheme);
document.getElementById('cb-btn').addEventListener('click', toggleColorblind);
document.getElementById('cb-btn-mobile').addEventListener('click', toggleColorblind);

if (document.body.classList.contains('dark')) {
    document.getElementById('theme-btn').textContent = '☀️';
    document.getElementById('theme-btn-mobile').textContent = '☀️';
}

if (localStorage.getItem('wordle-colorblind') === 'true') {
    document.body.classList.add('colorblind');
    document.getElementById('cb-btn').style.opacity = '1';
    document.getElementById('cb-btn-mobile').style.opacity = '1';
} else {
    document.getElementById('cb-btn').style.opacity = '0.5';
    document.getElementById('cb-btn-mobile').style.opacity = '0.5';
}

// Клавиатура
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleKey('Enter');
    } else if (e.key === 'Backspace') {
        handleKey('Backspace');
    } else {
        const key = e.key.toUpperCase();
        if (key >= 'А' && key <= 'Я' || key === 'Ё') {
            handleKey(key === 'Ё' ? 'е' : key.toLowerCase());
        }
    }
});

// Запуск
init();
runTests();

// Service Worker
let swRegistration = null;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
        swRegistration = reg;
    }).catch(() => {});
}

// Уведомления о новом слове
function setupNewWordNotification() {
    if (!('Notification' in window)) return;
    if (gameOver) return;

    const lastPlayed = localStorage.getItem('wordle_last_played');
    const today = new Date().toDateString();
    if (lastPlayed === today) return;

    const asked = localStorage.getItem('wordle_notif_asked');
    if (!asked) {
        setTimeout(() => {
            Notification.requestPermission().then(perm => {
                localStorage.setItem('wordle_notif_asked', '1');
                if (perm === 'granted') showNewWordNotification();
            });
        }, 3000);
    } else if (Notification.permission === 'granted') {
        showNewWordNotification();
    }
}

function showNewWordNotification() {
    const lastPlayed = localStorage.getItem('wordle_last_played');
    const today = new Date().toDateString();
    if (lastPlayed === today) return;

    if (swRegistration && swRegistration.active) {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const delay = midnight - now;

        swRegistration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            delay: delay
        });
    }

    new Notification('Вордли', {
        body: 'Новое слово дня уже ждёт тебя!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🟦</text></svg>'
    });
}

setupNewWordNotification();
