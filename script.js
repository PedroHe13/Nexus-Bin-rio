/* =========================================================================
 * MOTOR DE ÁUDIO (Synthesizer e Effects Web Audio API)
 * Esta classe é responsável por criar os sons processualmente no navegador, 
 * evitando a necessidade de carregar arquivos MP3 ou WAV externos.
 * ========================================================================= */
class AudioEngine {
    constructor() {
        this.ctx = null; // Contexto principal do áudio do navegador
        this.musicGain = null; // Controlador de volume da música
        this.sfxGain = null; // Controlador de volume dos efeitos sonoros
        
        // Configurações de estado de áudio (Volume de 0.0 a 1.0)
        this.musicVolume = 0.5; this.sfxVolume = 0.6; this.musicOn = true; this.musicPlaying = false;
        
        // Dados sequenciadores da trilha sonora (estilo chiptune em escala)
        this._musicTimer = null; this._musicStep = 0; this._unlocked = false;
        this.rootFreq = 220; // Frequência fundamental (Nota A3)
        this.scale = [0, 3, 5, 7, 10, 12, 15, 19]; // Escala musical relativa à raiz (em semitons)
        
        // Padrões de melodia e baixo (índices baseados no array 'scale')
        this.melodyPattern = [2, -1, 4, 2, 5, 4, 2, 0, 2, -1, 4, 6, 5, 4, 2, 0];
        this.bassPattern = [0, -1, -1, -1, 3, -1, -1, -1, 0, -1, -1, -1, 3, -1, -1, -1];
        
        // Velocidade/duração das notas da música de fundo
        this.stepDur = 0.19; 
    }
    
    // Assegura e inicializa o Web Audio Context apenas quando requerido
    _ensureCtx() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        // Conecta as vias de controle de volume à saída mestre do dispositivo
        this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVolume; this.musicGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.sfxVolume; this.sfxGain.connect(this.ctx.destination);
    }
    
    // O navegador bloqueia áudio automático. O método 'unlock' reativa o motor em resposta ao primeiro clique
    unlock() { 
        this._ensureCtx(); 
        if (!this.ctx) return; 
        if (this.ctx.state === 'suspended') this.ctx.resume(); 
        this._unlocked = true; 
        if (this.musicOn && !this.musicPlaying) this.startMusic(); 
    }
    
    // Controles de Volume externos
    setMusicVolume(v) { this.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v; }
    setSfxVolume(v) { this.sfxVolume = v; if (this.sfxGain) this.sfxGain.gain.value = v; }
    
    // Liga/Desliga a música (mute toggle)
    setMusicOn(on) { this.musicOn = on; if (!on) this.stopMusic(); else if (this._unlocked) this.startMusic(); }
    
    // Calcula a frequência em Hz dado um intervalo em semitons
    freqFor(semisFromRoot) { return this.rootFreq * Math.pow(2, semisFromRoot / 12); }
    
    // Função utilitária central para criar e agendar a execução de um bleep (nota sintética)
    _noteAt(gainNode, freq, time, dur, type, peak) {
        if (!this.musicOn && gainNode === this.sfxGain) return; 
        const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
        osc.type = type; // square, sine, sawtooth, triangle
        osc.frequency.setValueAtTime(freq, time);
        
        // Envelope ADSR super simples (Attack-Decay) para evitar estalos de som
        g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(peak, time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        
        osc.connect(g); g.connect(gainNode); osc.start(time); osc.stop(time + dur + 0.02);
    }
    
    // Dispara a rotina em looping que lê 'melodyPattern' e toca a trilha do menu/fundo
    startMusic() {
        this._ensureCtx(); if (!this.ctx || this.musicPlaying || !this.musicOn) return;
        this.musicPlaying = true; this._musicStep = 0;
        
        const scheduleNext = () => {
            if (!this.musicPlaying) return;
            const t = this.ctx.currentTime + 0.02; // lookahead time
            
            // Pega o índice musical com base no passo em que estamos no array
            const mDeg = this.melodyPattern[this._musicStep % this.melodyPattern.length];
            const bDeg = this.bassPattern[this._musicStep % this.bassPattern.length];
            
            // Agenda as notas de melodia e baixo base para tocarem juntas
            if (mDeg >= 0) this._noteAt(this.musicGain, this.freqFor(this.scale[mDeg % this.scale.length] + 12), t, this.stepDur * 0.9, 'triangle', 0.11);
            if (bDeg >= 0) this._noteAt(this.musicGain, this.freqFor(this.scale[bDeg % this.scale.length] - 12), t, this.stepDur * 1.6, 'square', 0.055);
            
            this._musicStep++; 
            this._musicTimer = setTimeout(scheduleNext, this.stepDur * 1000); // Chama novamente
        }; 
        scheduleNext();
    }
    
    // Para completamente a rotina sequenciadora
    stopMusic() { this.musicPlaying = false; if (this._musicTimer) clearTimeout(this._musicTimer); }
    
    // Efeitos Sonoros individuais criados através de _noteAt (Click, Tick, Sucesso, Erro, Fim)
    playClick() { this._ensureCtx(); if(this.ctx) this._noteAt(this.sfxGain, 720, this.ctx.currentTime, 0.06, 'square', 0.18); }
    playTick() { this._ensureCtx(); if(this.ctx) this._noteAt(this.sfxGain, 900, this.ctx.currentTime, 0.045, 'sine', 0.12); }
    playCorrect() { this._ensureCtx(); if(!this.ctx) return; const t = this.ctx.currentTime; [0, 4, 7, 12].forEach((s, i) => this._noteAt(this.sfxGain, this.freqFor(s + 12), t + i * 0.075, 0.16, 'triangle', 0.22)); }
    playWrong() { this._ensureCtx(); if(!this.ctx) return; const t = this.ctx.currentTime; this._noteAt(this.sfxGain, 180, t, 0.22, 'sawtooth', 0.18); this._noteAt(this.sfxGain, 140, t + 0.09, 0.24, 'sawtooth', 0.16); }
    playGameOver() { this._ensureCtx(); if(!this.ctx) return; const t = this.ctx.currentTime; [7, 4, 0, -5].forEach((s, i) => this._noteAt(this.sfxGain, this.freqFor(s), t + i * 0.16, 0.32, 'sawtooth', 0.18)); }
}

// Inicializa a engine e cria o listener global para destravar o som de fundo no 1º toque
window.audioEngine = new AudioEngine();
const unlockAudio = () => { if(window.audioEngine) window.audioEngine.unlock(); document.removeEventListener('click', unlockAudio); };
document.addEventListener('click', unlockAudio);

// Anexa efeito sonoro de 'click' a TODOS os botões gerados na tela
document.querySelectorAll('.btn').forEach(btn => btn.addEventListener('click', () => { if(window.audioEngine) window.audioEngine.playClick(); }));


/* =========================================================================
 * GESTÃO DE TELAS (NAVEGAÇÃO) E TEMAS
 * ========================================================================= */

// Esconde todas as divs de visualização (screens) e mostra apenas a id desejada (Página Ativa)
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    document.getElementById(screenId).scrollTop = 0; 
}

// Remove o tema atual (atributo) e seta o novo caso exista para forçar as regras CSS
function applyThemeClass(themeName) {
    document.body.removeAttribute('data-theme');
    if(themeName) document.body.setAttribute('data-theme', themeName);
}

// Aplica as cores via variavel de root com base nas escolhas feitas pelo usuário nos color-pickers
function applyCustomTheme() {
    applyThemeClass('');
    document.documentElement.style.setProperty('--bg-grad-1', document.getElementById('custom-c1').value);
    document.documentElement.style.setProperty('--bg-grad-2', document.getElementById('custom-c2').value);
    document.documentElement.style.setProperty('--bg-grad-3', document.getElementById('custom-c3').value);
    document.documentElement.style.setProperty('--bg-grad-4', document.getElementById('custom-c4').value);
}

// Aciona um tema preset via botão de opções
function applyPredefinedTheme(themeName) { applyThemeClass(themeName); }


/* =========================================================================
 * FUNÇÕES DE ACESSIBILIDADE E USUÁRIO (MENU DE CONFIGURAÇÕES)
 * ========================================================================= */
function toggleMusic() {
    const btn = document.getElementById('btn-music');
    if (window.audioEngine.musicOn) { window.audioEngine.setMusicOn(false); btn.innerText = "Ativar Música e Sons"; btn.style.background = "#00f2fe"; btn.style.color = "#000"; } 
    else { window.audioEngine.setMusicOn(true); btn.innerText = "Desativar Música e Sons"; btn.style.background = "#ff4d4d"; btn.style.color = "#fff"; }
}

function toggleTema() { 
    const body = document.body; const btn = document.getElementById('btn-contrast'); body.classList.toggle('alto-contraste');
    btn.innerText = body.classList.contains('alto-contraste') ? "Desativar Alto Contraste" : "Ativar Alto Contraste";
}

function toggleDyslexia() { 
    const body = document.body; const btn = document.getElementById('btn-dyslexia'); body.classList.toggle('fonte-dislexia');
    btn.innerText = body.classList.contains('fonte-dislexia') ? "Desativar Fonte para Dislexia" : "Ativar Fonte para Dislexia";
}

function toggleMotion() { 
    const body = document.body; const btn = document.getElementById('btn-motion'); body.classList.toggle('no-motion');
    btn.innerText = body.classList.contains('no-motion') ? "Ativar Animações" : "Desativar Animações";
}

// Aumenta ou diminui a classe que afeta o escalonamento em REM no CSS inteiro (+ e - global)
let currentFontLevel = 0;
function changeFontSize(step) {
    currentFontLevel += step; if (currentFontLevel < 0) currentFontLevel = 0; if (currentFontLevel > 4) currentFontLevel = 4;
    document.documentElement.className = document.documentElement.className.replace(/font-level-\d/g, '');
    if (currentFontLevel > 0) document.documentElement.classList.add('font-level-' + currentFontLevel);
}


/* =========================================================================
 * MÓDULOS DE ENSINO (CENTRAL DE ESTUDOS) E BLOCO DE NOTAS (CALC)
 * ========================================================================= */

// Reseta o estado da janela de "aulas" para exibir o menu inicial de escolhas (cards)
function resetLessonMenu() {
    document.getElementById('lesson-cards-container').style.display = 'flex';
    document.querySelectorAll('.lesson-content').forEach(l => l.style.display = 'none');
    document.getElementById('btn-back-lessons').style.display = 'none';
    document.getElementById('btn-back-main').style.display = 'block';
}

// Oculta todos os módulos de aula exceto aquele que o id foi passado por parâmetro
function openLesson(lessonId) {
    document.getElementById('lesson-cards-container').style.display = 'none';
    document.querySelectorAll('.lesson-content').forEach(l => l.style.display = 'none');
    document.getElementById(lessonId).style.display = 'block';
    document.getElementById('btn-back-lessons').style.display = 'block';
    document.getElementById('btn-back-main').style.display = 'none';
    document.getElementById('lesson-menu').scrollTop = 0;
}

// Alterna a exibição da calculadora / varal de auxílio na gameplay da partida
function toggleNotepad() {
    const notepad = document.getElementById('notepad-container');
    notepad.style.display = notepad.style.display === 'none' || notepad.style.display === '' ? 'block' : 'none';
}

/* 
 * Constrói de forma dinâmica os "quadradinhos" do Varal Base, 
 * mudando a estrutura conforme a base (Binário precisa de mais boxes em linha, 
 * Octal precisa de grupos de 3 bits, e Hexa de grupos de 4 bits).
 */
function buildCalculator() {
    const grid = document.getElementById('calc-grid');
    const title = document.getElementById('calc-title');
    const resContainer = document.getElementById('calc-result-container');
    grid.innerHTML = '';

    if (currentMode === 'Binário' || currentMode === '') {
        title.innerText = "Calculadora Varal (Base 2)";
        resContainer.innerHTML = 'Soma Decimal: <span id="calc-sum" style="color:#d90429;">0</span>';
        const pesos = [128, 64, 32, 16, 8, 4, 2, 1];
        let html = '<div style="display:flex; gap:8px; flex-wrap: wrap; justify-content:center;">';
        pesos.forEach((p) => {
            html += `<div class="varal-item">${p}<div class="varal-input bin-calc-input" data-peso="${p}" onclick="toggleVaral(this)"></div></div>`;
        });
        html += '</div>';
        grid.innerHTML = html;
    } else if (currentMode === 'Octal') {
        title.innerText = "Truque dos 3 Bits (Octal)";
        resContainer.innerHTML = 'Dígitos Octais: <span id="calc-sum" style="color:#d90429;">0 0</span>';
        let html = '';
        for(let g=0; g<2; g++){ // 2 blocos de 3 bits para ajudar a compor
            html += `<div style="display:flex; gap:8px; border: 2px dashed var(--border-color); padding: 8px; border-radius: 8px;">`;
            [4, 2, 1].forEach(p => {
                html += `<div class="varal-item">${p}<div class="varal-input oct-calc-input" data-group="${g}" data-peso="${p}" onclick="toggleVaral(this)"></div></div>`;
            });
            html += `</div>`;
        }
        grid.innerHTML = html;
    } else if (currentMode === 'Hexadecimal') {
        title.innerText = "Truque dos 4 Bits (Hexa)";
        resContainer.innerHTML = 'Dígitos Hexa: <span id="calc-sum" style="color:#d90429;">0 0</span>';
        let html = '';
        for(let g=0; g<2; g++){ // 2 blocos de 4 bits para ajudar a compor
            html += `<div style="display:flex; gap:8px; border: 2px dashed var(--border-color); padding: 8px; border-radius: 8px;">`;
            [8, 4, 2, 1].forEach(p => {
                html += `<div class="varal-item">${p}<div class="varal-input hex-calc-input" data-group="${g}" data-peso="${p}" onclick="toggleVaral(this)"></div></div>`;
            });
            html += `</div>`;
        }
        grid.innerHTML = html;
    }
}

// Evento disparado quando clica nos botões da calculadora para ativar "1" e desativar "0" ou branco
function toggleVaral(el) {
    if (window.audioEngine) window.audioEngine.playTick();
    if (el.innerText === "") el.innerText = "1";
    else if (el.innerText === "1") el.innerText = "0";
    else el.innerText = "";
    calcVaral(); // Re-calcula e re-renderiza resultados na interface
}

// Soma matemática das caixas ativadas na ferramenta "Varal/Calculadora" do jogo dependendo da base
function calcVaral() {
    if (currentMode === 'Binário' || currentMode === '') {
        let sum = 0;
        document.querySelectorAll('.bin-calc-input').forEach(inp => {
            if (inp.innerText === "1") sum += parseInt(inp.dataset.peso);
        });
        document.getElementById('calc-sum').innerText = sum;
    } else if (currentMode === 'Octal') {
        let g0 = 0, g1 = 0;
        document.querySelectorAll('.oct-calc-input').forEach(inp => {
            if (inp.innerText === "1") {
                if (inp.dataset.group === "0") g0 += parseInt(inp.dataset.peso);
                if (inp.dataset.group === "1") g1 += parseInt(inp.dataset.peso);
            }
        });
        document.getElementById('calc-sum').innerText = `${g0} ${g1}`;
    } else if (currentMode === 'Hexadecimal') {
        let g0 = 0, g1 = 0;
        document.querySelectorAll('.hex-calc-input').forEach(inp => {
            if (inp.innerText === "1") {
                if (inp.dataset.group === "0") g0 += parseInt(inp.dataset.peso);
                if (inp.dataset.group === "1") g1 += parseInt(inp.dataset.peso);
            }
        });
        // Hexadecimal necessita de formatação de strings em formato ABCDEF
        const toHex = val => val < 10 ? val : String.fromCharCode(65 + (val - 10));
        document.getElementById('calc-sum').innerText = `${toHex(g0)} ${toHex(g1)}`;
    }
}


/* =========================================================================
 * CORE DO JOGO - ESTADOS, PERGUNTAS E TEMPORIZADORES
 * ========================================================================= */

// Variáveis Globais (Gerenciam todo fluxo, pontuação e dificuldade da rodada atual)
let currentMode = ''; let gameType = '';
let score = 0, timeLeft = 30, timerInterval, expectedAnswer = '', currentQuizAnswer = -1;
let lives = 3, freeHints = 2, currentQuestionPoints = 10, currentHintLevel = 0;

// Abre o Modal com as configurações aplicáveis à base (sistema) clicado no menu de jogatina
function openMatchSettings(modeName) {
    currentMode = modeName; document.getElementById('modal-mode-title').innerText = "Base " + modeName;
    document.getElementById('opt-to-base').innerText = 'Decimal para ' + modeName;
    document.getElementById('opt-from-base').innerText = modeName + ' para Decimal';
    document.getElementById('match-settings-modal').style.display = 'flex';
    updateTorreTimeLimit(); toggleTorreSettings();
}
// Fecha o modal sem efetuar as alterações (Cancel)
function closeModal() { document.getElementById('match-settings-modal').style.display = 'none'; }
// Revela ou oculta form specificos da "Torre" caso seja selecionado no dropdown
function toggleTorreSettings() { document.getElementById('torre-settings').style.display = (document.getElementById('type-select').value === 'torre') ? 'block' : 'none'; }

// Ajusta o placeholder e os máximos de input dependendo da dificuldade escolhida na 'Torre'
function updateTorreTimeLimit() {
    let diff = document.getElementById('diff-select').value; let timeInput = document.getElementById('torre-time'); let msg = document.getElementById('torre-time-msg');
    if (diff === 'easy') { timeInput.max = 120; timeInput.placeholder = "Máx 120s"; msg.innerText = "(Fácil: Até 120s)"; if (timeInput.value > 120) timeInput.value = 120; } 
    else if (diff === 'medium') { timeInput.max = 90; timeInput.placeholder = "Máx 90s"; msg.innerText = "(Médio: Até 90s)"; if (timeInput.value > 90) timeInput.value = 90; } 
    else if (diff === 'hard') { timeInput.max = 60; timeInput.placeholder = "Máx 60s"; msg.innerText = "(Difícil: Até 60s)"; if (timeInput.value > 60) timeInput.value = 60; }
}

// Banco de dados em memória simples que carrega questões pro formato de "Quiz" (alternativas)
const quizQuestions = [
    { q: "Por que os computadores utilizam o sistema binário?", options: ["Usam 10 dígitos", "Sinais elétricos", "Fácil leitura"], ans: 1 },
    { q: "Quais dígitos formam o sistema Octal?", options: ["0 a 9", "0 a 8", "0 a 7"], ans: 2 },
    { q: "1 dígito em Octal se transforma em exatamente quantos bits?", options: ["2 bits", "3 bits", "4 bits"], ans: 1 },
    { q: "Qual letra representa o valor 13 em Hexadecimal?", options: ["C", "D", "E"], ans: 1 }
];

// Ocorre na pressão de START/INICIAR dentro do pop up config modal
function startGameFromModal() {
    closeModal();
    let diff = document.getElementById('diff-select').value; gameType = document.getElementById('type-select').value;
    
    // Regras de dificuldade predefinidas
    if (diff === 'easy') { lives = 5; timeLeft = 60; } else if (diff === 'medium') { lives = 3; timeLeft = 45; } else if (diff === 'hard') { lives = 1; timeLeft = 20; }
    score = 0; freeHints = 2; updateHintBtnText();
    
    // Configurações do HUD baseadas no modo (Ex: Modo Torre é 'Sem vidas' e 'Sem limite normal')
    if (gameType === 'torre') {
        lives = Infinity; let userTime = parseInt(document.getElementById('torre-time').value) || 60;
        let maxAllowed = (diff === 'easy') ? 120 : (diff === 'medium' ? 90 : 60);
        timeLeft = userTime > maxAllowed ? maxAllowed : (userTime < 30 ? 30 : userTime);
        document.getElementById('hearts-container').style.display = 'none'; document.getElementById('score').innerText = '???';
    } else {
        document.getElementById('hearts-container').style.display = 'block'; document.getElementById('score').innerText = score; updateHeartsDisplay();
    }
    document.getElementById('timer').innerText = timeLeft; 
    
    // Prepara as ferramentas, zera notas e starta a interface principal
    buildCalculator(); 
    document.getElementById('notepad-container').style.display = 'none';
    showScreen('game-screen'); nextQuestion();
    
    // Temporizador base: A cada segundo abate 1 da var timeLeft
    clearInterval(timerInterval); timerInterval = setInterval(updateTimer, 1000);
}

// UI update routine das vidas atuais do jogador
function updateHeartsDisplay() { if (lives !== Infinity) document.getElementById('hearts-container').innerText = '❤️'.repeat(lives); }

/* --- SISTEMA DE DICAS COMPLEXO (PROGRESSIVO) --- */
// Gerencia a perda de pontos, corações e níveis incrementais de pistas pra cada uso pelo jogador
function useHint() {
    if (currentHintLevel >= 3) {
        alert("Você já usou todas as dicas desta questão!"); return;
    }
    
    if (freeHints > 0) {
        // Uso inicial, não gasta recursos valiosos
        freeHints--; currentQuestionPoints = Math.max(1, currentQuestionPoints - 3); 
        currentHintLevel++; revealHint(); updateHintBtnText();
    } else {
        // Uso penalizado
        if (gameType === 'torre') {
            timeLeft -= 15; if (timeLeft <= 0) { endGame(false); return; } // Gasta segundos!
            currentHintLevel++; revealHint(); updateHintBtnText();
        } else {
            lives--; updateHeartsDisplay(); if (lives <= 0) { endGame(false); return; } // Gasta um coração real!
            currentHintLevel++; revealHint(); updateHintBtnText();
        }
    }
}

// Analisa a string esperada e fornece dicas de string com base no nível (progressivo 1, 2, 3)
function revealHint() {
    if (window.audioEngine) window.audioEngine.playTick();
    let tip = "";
    
    // Regras de dicas diferentes para Perguntas teóricas X Matemáticas
    if (gameType === 'quiz') {
        if (currentHintLevel === 1) tip = "Pense bem no contexto da pergunta...";
        else if (currentHintLevel === 2) tip = "Lembre-se do que aprendeu na Central de Estudos!";
        else tip = "A resposta correta é a Opção " + ["A", "B", "C"][currentQuizAnswer];
    } else {
        // Modo matemático
        if (currentHintLevel === 1) {
            tip = `A resposta tem ${expectedAnswer.length} dígitos e começa com '${expectedAnswer[0]}'.`;
        } else if (currentHintLevel === 2) {
            // Regra customizada pro sistema hexadecimal e letras especiais
            if (currentMode === 'Hexadecimal' && /[A-F]/.test(expectedAnswer)) {
                let letters = expectedAnswer.match(/[A-F]/g).filter((v, i, a) => a.indexOf(v) === i);
                let map = {A:10, B:11, C:12, D:13, E:14, F:15};
                let explanation = letters.map(l => `${l}=${map[l]}`).join(", ");
                tip = `Dica Hexa: Lembre-se, as letras valem números! (${explanation})`;
            } else {
                let half = expectedAnswer.substring(0, Math.max(1, Math.ceil(expectedAnswer.length/2)));
                tip = `Metade da resposta é: ${half}...`;
            }
        } else if (currentHintLevel >= 3) {
            let almost = expectedAnswer.substring(0, expectedAnswer.length - 1);
            tip = `Falta muito pouco! Começa com: ${almost}_`;
        }
    }
    
    // Apresenta na tela o HTML formatado da dica atual com as anteriores
    const hd = document.getElementById('hint-display');
    if (currentHintLevel === 1) hd.innerHTML = "💡 <strong>Dica 1:</strong> " + tip;
    else hd.innerHTML += "<br><br>💡 <strong>Dica " + currentHintLevel + ":</strong> " + tip;
    
    hd.style.display = 'block';
}

// Atualiza o texto do botão com a respectiva penalidade exigida (vidas ou segundos)
function updateHintBtnText() {
    let btn = document.getElementById('btn-hint');
    if (freeHints > 0) btn.innerText = `💡 DICA (Grátis: ${freeHints})`;
    else btn.innerText = (gameType === 'torre') ? `💡 DICA (-15s)` : `💡 DICA (-1 ❤️)`;
}


/* --- GERADORES DE QUESTÕES E MANIPULADOR DO JOGO --- */

// Puxa uma pergunta teórica preexistente do 'Banco de Dados' Array
function renderQuizQuestion() {
    document.getElementById('conversion-input-area').style.display = 'none'; document.getElementById('quiz-options').style.display = 'flex';
    let randomQ = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    document.getElementById('question-number').innerText = randomQ.q;
    for(let i=0; i<3; i++) document.getElementById('q-opt-'+i).innerText = randomQ.options[i];
    currentQuizAnswer = randomQ.ans;
}

// Rola os dados do problema matemático em si utilizando JS nativo .toString()
function renderConversionQuestion() {
    document.getElementById('conversion-input-area').style.display = 'block'; document.getElementById('quiz-options').style.display = 'none'; document.getElementById('answer-input').value = '';
    let num = Math.floor(Math.random() * 50) + 1; let dir = document.getElementById('dir-select').value;
    let goFromBaseToDec = (dir === 'from-base') || (dir === 'misto' && Math.random() > 0.5);

    if (currentMode === 'Binário') {
        if(!goFromBaseToDec) { document.getElementById('question-number').innerText = 'Dec p/ Binário: ' + num; expectedAnswer = num.toString(2); } 
        else { let bin = num.toString(2); document.getElementById('question-number').innerText = 'Binário p/ Dec: ' + bin; expectedAnswer = num.toString(); }
    } else if (currentMode === 'Hexadecimal') {
        if(!goFromBaseToDec) { document.getElementById('question-number').innerText = 'Dec p/ Hexa: ' + num; expectedAnswer = num.toString(16).toUpperCase(); } 
        else { let hex = num.toString(16).toUpperCase(); document.getElementById('question-number').innerText = 'Hexa p/ Dec: ' + hex; expectedAnswer = num.toString(); }
    } else if (currentMode === 'Octal') {
        if(!goFromBaseToDec) { document.getElementById('question-number').innerText = 'Dec p/ Octal: ' + num; expectedAnswer = num.toString(8); } 
        else { let oct = num.toString(8); document.getElementById('question-number').innerText = 'Octal p/ Dec: ' + oct; expectedAnswer = num.toString(); }
    }
    // Devolve o cursor piscando pro input numérico após criar a questão para agilidade do usuário
    document.getElementById('answer-input').focus();
}

// Reset dos pontos de dicas e caixas de ferramentas para um painel em branco da próxima etapa
function nextQuestion() {
    currentQuestionPoints = 10;
    currentHintLevel = 0;
    document.getElementById('hint-display').style.display = 'none';
    document.getElementById('hint-display').innerHTML = '';
    
    // Reseta a calculadora a cada questão para forçar ele aprender
    document.querySelectorAll('.varal-input').forEach(inp => inp.innerText = '');
    document.getElementById('calc-sum').innerText = (currentMode === 'Binário' || currentMode === '' ? '0' : '0 0');

    if (gameType === 'quiz') renderQuizQuestion();
    else if (gameType === 'sortido') renderConversionQuestion();
    else { if (Math.random() > 0.5) renderQuizQuestion(); else renderConversionQuestion(); }
}

// Analisadores de Resposta do usuário (Acesso ao input HTML)
function checkAnswer() { let userAns = document.getElementById('answer-input').value.trim().toUpperCase(); if (userAns === expectedAnswer) acertou(); else errou(); }
// Analisador para o quiz teórico que leva ID
function checkQuizAnswer(optIndex) { if (optIndex === currentQuizAnswer) acertou(); else errou(); }

// Rotina executada em caso afirmativo, gera recompensas no HUD
function acertou() {
    score += currentQuestionPoints; 
    if (gameType === 'torre') { window.audioEngine.playTick(); nextQuestion(); } 
    else {
        window.audioEngine.playCorrect(); document.body.classList.add('success-aura'); // Pisca a tela verde
        setTimeout(() => document.body.classList.remove('success-aura'), 500);
        document.getElementById('score').innerText = score; timeLeft += 3; nextQuestion(); // Recompensa em bônus
    }
}

// Rotina executada em erro, penalidades são aplicadas e tela pisca/tremeria
function errou() {
    if (gameType === 'torre') { window.audioEngine.playTick(); nextQuestion(); } 
    else {
        window.audioEngine.playWrong(); document.body.classList.add('error-aura', 'shake'); // CSS class treme
        setTimeout(() => { document.body.classList.remove('error-aura', 'shake'); lives--; updateHeartsDisplay(); if (lives <= 0) { endGame(false); return; } nextQuestion(); }, 500); 
    }
}

// Vincula a tecla ENTER como validação (send request da resposta digitada)
document.getElementById("answer-input").addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); checkAnswer(); } });

// Main loop da rotina de timeout. Avisa o encerramento da partida e mata o timer.
function updateTimer() { timeLeft--; document.getElementById('timer').innerText = timeLeft; if (timeLeft <= 0) endGame(false); }

// Roteador Final da Partida: Exibe tela de GO (Game Over) preenchendo score final
function endGame(desistiu = false) {
    clearInterval(timerInterval); document.body.classList.remove('error-aura', 'shake', 'success-aura'); // Remove efeitos impeditivos residuais
    if(!desistiu) window.audioEngine.playGameOver();
    document.getElementById('go-mode').innerText = currentMode + " - " + document.getElementById('type-select').options[document.getElementById('type-select').selectedIndex].text;
    document.getElementById('go-diff').innerText = document.getElementById('diff-select').options[document.getElementById('diff-select').selectedIndex].text;
    document.getElementById('go-score').innerText = score; showScreen('game-over-screen');
}


/* =========================================================================
 * GERAÇÃO DE PRINT (CERTIFICADO / COMPARTILHAMENTO) CANVAS
 * ========================================================================= */
// Desenha em um quadro virtual todas as variáveis e notas pra gerar um dowload de uma imagem PNG do placar
function saveScorePNG() {
    const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = 300; const ctx = canvas.getContext('2d');
    
    // Replicar o tema dinâmico atual para a imagem gerada (Cores)
    let bgGradient = ctx.createLinearGradient(0,0,500,300);
    bgGradient.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--bg-grad-1').trim());
    bgGradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--bg-grad-2').trim());
    
    // Retângulos e preenchimentos
    ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, canvas.width-10, canvas.height-10);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(15, 15, canvas.width-30, canvas.height-30);
    
    // Texto Título
    ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('NEXUS B1NÁR10', 250, 62);
    ctx.fillStyle = '#ffffff'; ctx.fillText('NEXUS B1NÁR10', 248, 60);
    
    // Títulos de Estado
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('FIM DE JOGO', 250, 110);
    
    // Metadados dinâmicos
    ctx.font = '18px sans-serif'; ctx.fillText('Modo: ' + document.getElementById('go-mode').innerText, 250, 150); ctx.fillText('Dificuldade: ' + document.getElementById('go-diff').innerText, 250, 180);
    
    // Placar grande em amarelo com contorno
    ctx.fillStyle = '#ffea00'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 4; ctx.font = 'bold 40px sans-serif'; ctx.strokeText('PONTOS: ' + score, 250, 240); ctx.fillText('PONTOS: ' + score, 250, 240);
    
    // Rotina de simulação de clique nativa p/ invocar o painel de download via navegador
    const link = document.createElement('a'); link.download = 'nexus-binario-score.png'; link.href = canvas.toDataURL('image/png'); link.click();
}
