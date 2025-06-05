/**
 * 赛博朋克风格数独游戏 - 游戏逻辑与界面交互
 */

// 游戏状态变量
let sudokuGenerator;
let currentPuzzle;
let currentSolution;
let selectedCell = null;
let playerGrid = [];
let gameStartTime;
let gameTimer;
let currentDifficulty = 3;
let moveHistory = [];

// DOM 元素
const sudokuGridElement = document.querySelector('.sudoku-grid');
const numberPadElement = document.querySelector('.number-pad');
const timerValueElement = document.querySelector('.timer-value');
const difficultyValueElement = document.querySelector('.difficulty-value');
const progressFillElement = document.querySelector('.progress-fill');
const newGameButton = document.getElementById('new-game');
const hintButton = document.getElementById('hint');
const undoButton = document.getElementById('undo');
const eraseButton = document.getElementById('erase');
const difficultyButtons = document.querySelectorAll('.difficulty-button');
const completionModal = document.getElementById('completion-modal');
const completionTimeElement = document.getElementById('completion-time');
const completionDifficultyElement = document.getElementById('completion-difficulty');
const newGameModalButton = document.getElementById('new-game-modal');

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建数独生成器实例
    sudokuGenerator = new SudokuGenerator();
    
    // 创建数字按钮
    createNumberPad();
    
    // 添加事件监听器
    setupEventListeners();
    
    // 创建背景动画
    createBackgroundAnimation();
    
    // 开始新游戏
    startNewGame();
});

/**
 * 创建数字按钮面板
 */
function createNumberPad() {
    numberPadElement.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const button = document.createElement('button');
        button.className = 'number-button';
        button.textContent = i;
        button.dataset.number = i;
        numberPadElement.appendChild(button);
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 数字按钮点击事件
    numberPadElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('number-button')) {
            const number = parseInt(e.target.dataset.number);
            if (selectedCell && !selectedCell.classList.contains('given')) {
                enterNumber(number);
            }
        }
    });
    
    // 新游戏按钮
    newGameButton.addEventListener('click', startNewGame);
    newGameModalButton.addEventListener('click', () => {
        completionModal.classList.remove('active');
        startNewGame();
    });
    
    // 提示按钮
    hintButton.addEventListener('click', getHint);
    
    // 撤销按钮
    undoButton.addEventListener('click', undoMove);
    
    // 擦除按钮
    eraseButton.addEventListener('click', eraseCell);
    
    // 难度按钮
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const level = parseInt(button.dataset.level);
            setDifficulty(level);
        });
    });
    
    // 键盘输入
    document.addEventListener('keydown', (e) => {
        if (selectedCell && !selectedCell.classList.contains('given')) {
            if (e.key >= '1' && e.key <= '9') {
                enterNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                eraseCell();
            }
        }
        
        // 方向键移动选择
        if (selectedCell) {
            const row = parseInt(selectedCell.dataset.row);
            const col = parseInt(selectedCell.dataset.col);
            
            switch (e.key) {
                case 'ArrowUp':
                    selectCell(Math.max(0, row - 1), col);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    selectCell(Math.min(8, row + 1), col);
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    selectCell(row, Math.max(0, col - 1));
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    selectCell(row, Math.min(8, col + 1));
                    e.preventDefault();
                    break;
            }
        }
    });
}

/**
 * 开始新游戏
 */
function startNewGame() {
    // 生成新的数独谜题
    const result = sudokuGenerator.generate(currentDifficulty);
    currentPuzzle = result.puzzle;
    currentSolution = result.solution;
    
    // 初始化玩家网格
    playerGrid = JSON.parse(JSON.stringify(currentPuzzle));
    
    // 清空移动历史
    moveHistory = [];
    
    // 创建数独网格
    createSudokuGrid();
    
    // 更新难度显示
    difficultyValueElement.textContent = currentDifficulty;
    
    // 重置进度条
    updateProgressBar();
    
    // 重置并启动计时器
    resetTimer();
    startTimer();
    
    // 添加故障艺术效果
    setTimeout(addGlitchEffect, 500);
}

/**
 * 创建数独网格
 */
function createSudokuGrid() {
    sudokuGridElement.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const value = currentPuzzle[row][col];
            if (value !== 0) {
                cell.textContent = value;
                cell.classList.add('given');
            }
            
            // 添加点击事件
            cell.addEventListener('click', () => {
                selectCell(row, col);
            });
            
            sudokuGridElement.appendChild(cell);
        }
    }
}

/**
 * 选择单元格
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 */
function selectCell(row, col) {
    // 移除之前选择的单元格的选中状态
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    
    // 选择新单元格
    selectedCell = sudokuGridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    selectedCell.classList.add('selected');
    
    // 添加霓虹光效果
    addCellGlowEffect(selectedCell);
}

/**
 * 输入数字到选中的单元格
 * @param {number} number - 要输入的数字
 */
function enterNumber(number) {
    if (!selectedCell || selectedCell.classList.contains('given')) {
        return;
    }
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    
    // 保存移动历史
    moveHistory.push({
        row,
        col,
        previousValue: playerGrid[row][col]
    });
    
    // 更新玩家网格
    playerGrid[row][col] = number;
    
    // 更新单元格显示
    selectedCell.textContent = number;
    selectedCell.classList.add('player');
    
    // 检查输入是否正确
    const isCorrect = sudokuGenerator.checkCell(row, col, number);
    if (!isCorrect) {
        selectedCell.classList.add('error');
        addShakeEffect(selectedCell);
        setTimeout(() => {
            selectedCell.classList.remove('error');
        }, 1000);
    } else {
        addCorrectInputEffect(selectedCell);
    }
    
    // 更新进度条
    updateProgressBar();
    
    // 检查游戏是否完成
    checkCompletion();
}

/**
 * 擦除选中单元格的数字
 */
function eraseCell() {
    if (!selectedCell || selectedCell.classList.contains('given')) {
        return;
    }
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    
    // 保存移动历史
    moveHistory.push({
        row,
        col,
        previousValue: playerGrid[row][col]
    });
    
    // 更新玩家网格
    playerGrid[row][col] = 0;
    
    // 更新单元格显示
    selectedCell.textContent = '';
    selectedCell.classList.remove('player');
    
    // 更新进度条
    updateProgressBar();
}

/**
 * 撤销上一步操作
 */
function undoMove() {
    if (moveHistory.length === 0) {
        return;
    }
    
    const lastMove = moveHistory.pop();
    const { row, col, previousValue } = lastMove;
    
    // 更新玩家网格
    playerGrid[row][col] = previousValue;
    
    // 更新单元格显示
    const cell = sudokuGridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (previousValue === 0) {
        cell.textContent = '';
        cell.classList.remove('player');
    } else {
        cell.textContent = previousValue;
        cell.classList.add('player');
    }
    
    // 选择该单元格
    selectCell(row, col);
    
    // 更新进度条
    updateProgressBar();
}

/**
 * 获取提示
 */
function getHint() {
    const hint = sudokuGenerator.getHint(playerGrid);
    if (!hint) {
        return;
    }
    
    const { row, col, value } = hint;
    
    // 保存移动历史
    moveHistory.push({
        row,
        col,
        previousValue: playerGrid[row][col]
    });
    
    // 更新玩家网格
    playerGrid[row][col] = value;
    
    // 更新单元格显示
    const cell = sudokuGridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.textContent = value;
    cell.classList.add('player');
    
    // 选择该单元格
    selectCell(row, col);
    
    // 添加提示效果
    addHintEffect(cell);
    
    // 更新进度条
    updateProgressBar();
    
    // 检查游戏是否完成
    checkCompletion();
}

/**
 * 设置难度级别
 * @param {number} level - 难度级别 (1-5)
 */
function setDifficulty(level) {
    currentDifficulty = level;
    
    // 更新难度按钮状态
    difficultyButtons.forEach(button => {
        if (parseInt(button.dataset.level) === level) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // 更新难度显示
    difficultyValueElement.textContent = level;
}

/**
 * 更新进度条
 */
function updateProgressBar() {
    let filledCells = 0;
    let totalCells = 81;
    let givenCells = 0;
    
    // 计算已填充的单元格数量和初始给定的单元格数量
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (playerGrid[row][col] !== 0) {
                filledCells++;
            }
            if (currentPuzzle[row][col] !== 0) {
                givenCells++;
            }
        }
    }
    
    // 计算进度百分比（不包括初始给定的单元格）
    const playerFilledCells = filledCells - givenCells;
    const cellsToFill = totalCells - givenCells;
    const progressPercentage = (playerFilledCells / cellsToFill) * 100;
    
    // 更新进度条
    progressFillElement.style.width = `${progressPercentage}%`;
}

/**
 * 检查游戏是否完成
 */
function checkCompletion() {
    const isComplete = sudokuGenerator.validateSolution(playerGrid);
    if (isComplete) {
        // 停止计时器
        stopTimer();
        
        // 显示完成动画
        showCompletionAnimation();
        
        // 更新完成弹窗信息
        completionTimeElement.textContent = timerValueElement.textContent;
        completionDifficultyElement.textContent = currentDifficulty;
        
        // 显示完成弹窗
        setTimeout(() => {
            completionModal.classList.add('active');
        }, 1500);
    }
}

/**
 * 重置计时器
 */
function resetTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    gameStartTime = new Date();
    timerValueElement.textContent = '00:00';
}

/**
 * 启动计时器
 */
function startTimer() {
    gameTimer = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - gameStartTime) / 1000);
        
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        
        timerValueElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

/**
 * 停止计时器
 */
function stopTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
}

/**
 * 添加单元格发光效果
 * @param {HTMLElement} cell - 单元格元素
 */
function addCellGlowEffect(cell) {
    cell.style.boxShadow = `0 0 10px var(--neon-purple), 0 0 20px var(--neon-purple)`;
    setTimeout(() => {
        cell.style.boxShadow = '';
    }, 500);
}

/**
 * 添加正确输入效果
 * @param {HTMLElement} cell - 单元格元素
 */
function addCorrectInputEffect(cell) {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'radial-gradient(circle, rgba(57, 255, 20, 0.3) 0%, rgba(57, 255, 20, 0) 70%)';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.5s ease';
    
    cell.appendChild(overlay);
    
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            cell.removeChild(overlay);
        }, 500);
    }, 300);
}

/**
 * 添加提示效果
 * @param {HTMLElement} cell - 单元格元素
 */
function addHintEffect(cell) {
    cell.style.color = 'var(--neon-green)';
    cell.style.textShadow = '0 0 5px var(--neon-green), 0 0 10px var(--neon-green)';
    
    setTimeout(() => {
        cell.style.color = '';
        cell.style.textShadow = '';
    }, 1500);
}

/**
 * 添加抖动效果
 * @param {HTMLElement} element - 要添加效果的元素
 */
function addShakeEffect(element) {
    element.classList.add('glitch');
    setTimeout(() => {
        element.classList.remove('glitch');
    }, 300);
}

/**
 * 添加故障艺术效果
 */
function addGlitchEffect() {
    const title = document.querySelector('.neon-text');
    title.classList.add('glitch');
    
    setTimeout(() => {
        title.classList.remove('glitch');
        
        // 随机添加故障效果
        setInterval(() => {
            if (Math.random() < 0.1) {
                title.classList.add('glitch');
                setTimeout(() => {
                    title.classList.remove('glitch');
                }, 300);
            }
        }, 5000);
    }, 300);
}

/**
 * 显示完成动画
 */
function showCompletionAnimation() {
    // 创建波纹效果
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'var(--neon-green)';
    ripple.style.boxShadow = '0 0 10px var(--neon-green), 0 0 20px var(--neon-green)';
    ripple.style.zIndex = '10';
    ripple.style.opacity = '1';
    ripple.style.transition = 'all 1.5s cubic-bezier(0, 0.55, 0.45, 1)';
    
    sudokuGridElement.appendChild(ripple);
    
    // 扩展波纹
    setTimeout(() => {
        ripple.style.width = '200%';
        ripple.style.height = '200%';
        ripple.style.opacity = '0';
    }, 50);
    
    // 移除波纹
    setTimeout(() => {
        sudokuGridElement.removeChild(ripple);
    }, 1500);
    
    // 添加单元格完成效果
    const cells = sudokuGridElement.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.classList.add('complete');
            setTimeout(() => {
                cell.classList.remove('complete');
            }, 1000);
        }, index * 20);
    });
}

/**
 * 创建背景动画
 */
function createBackgroundAnimation() {
    const bgParticles = document.querySelector('.bg-particles');
    
    // 创建数据流效果
    for (let i = 0; i < 20; i++) {
        const dataStream = document.createElement('div');
        dataStream.className = 'data-stream';
        dataStream.style.position = 'absolute';
        dataStream.style.top = `${Math.random() * 100}%`;
        dataStream.style.left = `${Math.random() * 100}%`;
        dataStream.style.width = '1px';
        dataStream.style.height = `${20 + Math.random() * 80}px`;
        dataStream.style.background = `rgba(0, 236, 255, ${0.1 + Math.random() * 0.3})`;
        dataStream.style.boxShadow = '0 0 5px rgba(0, 236, 255, 0.5)';
        dataStream.style.transform = 'rotate(90deg)';
        dataStream.style.opacity = '0';
        
        bgParticles.appendChild(dataStream);
        
        // 动画
        animateDataStream(dataStream);
    }
}

/**
 * 动画数据流
 * @param {HTMLElement} element - 数据流元素
 */
function animateDataStream(element) {
    // 随机位置
    element.style.top = `${Math.random() * 100}%`;
    element.style.left = `${Math.random() * 100}%`;
    element.style.height = `${20 + Math.random() * 80}px`;
    
    // 显示
    element.style.opacity = '1';
    
    // 淡出
    setTimeout(() => {
        element.style.opacity = '0';
        
        // 重新动画
(Content truncated due to size limit. Use line ranges to read in chunks)