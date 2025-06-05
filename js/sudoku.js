/**
 * 赛博朋克风格数独游戏 - 核心逻辑
 * 包含数独生成、验证和求解功能
 */

class SudokuGenerator {
    constructor() {
        this.size = 9; // 数独大小 (9x9)
        this.boxSize = 3; // 3x3 宫格大小
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.solution = Array(this.size).fill().map(() => Array(this.size).fill(0));
    }

    /**
     * 生成一个有效的数独谜题
     * @param {number} difficulty - 难度级别 (1-5)，影响挖空数量
     * @returns {Object} 包含谜题和解答的对象
     */
    generate(difficulty = 3) {
        // 清空网格
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        
        // 生成完整的解决方案
        this._fillGrid();
        
        // 保存完整解答
        this.solution = JSON.parse(JSON.stringify(this.grid));
        
        // 根据难度挖空
        this._removeNumbers(difficulty);
        
        return {
            puzzle: JSON.parse(JSON.stringify(this.grid)),
            solution: this.solution
        };
    }

    /**
     * 填充网格以创建有效的数独解决方案
     * 使用回溯算法
     * @returns {boolean} 是否成功填充
     */
    _fillGrid() {
        // 找到一个空单元格
        const emptyCell = this._findEmptyCell();
        if (!emptyCell) {
            return true; // 没有空单元格，填充完成
        }
        
        const [row, col] = emptyCell;
        
        // 创建1-9的随机排序数组
        const numbers = this._getShuffledNumbers();
        
        // 尝试每个数字
        for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i];
            
            // 检查数字是否有效
            if (this._isValid(row, col, num)) {
                // 放置数字
                this.grid[row][col] = num;
                
                // 递归填充剩余单元格
                if (this._fillGrid()) {
                    return true;
                }
                
                // 如果填充失败，回溯
                this.grid[row][col] = 0;
            }
        }
        
        return false; // 触发回溯
    }

    /**
     * 根据难度级别从解决方案中移除数字
     * @param {number} difficulty - 难度级别 (1-5)
     */
    _removeNumbers(difficulty) {
        // 根据难度确定要移除的单元格数量
        // 难度越高，移除的数字越多
        const cellsToRemove = {
            1: 30, // 简单
            2: 40, // 中等
            3: 45, // 困难
            4: 50, // 专家
            5: 55  // 极难
        }[difficulty] || 45;
        
        // 创建所有单元格的位置列表
        const positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }
        
        // 随机打乱位置
        this._shuffle(positions);
        
        // 移除数字，确保谜题仍然有唯一解
        let removed = 0;
        for (const [row, col] of positions) {
            // 暂存原始值
            const temp = this.grid[row][col];
            
            // 尝试移除
            this.grid[row][col] = 0;
            
            // 计算解的数量
            const solutions = this._countSolutions();
            
            // 如果不是唯一解，恢复数字
            if (solutions !== 1) {
                this.grid[row][col] = temp;
                continue;
            }
            
            removed++;
            if (removed >= cellsToRemove) {
                break;
            }
        }
    }

    /**
     * 计算当前谜题的解的数量
     * 使用回溯算法，最多计算到2个解（只需要知道是否唯一）
     * @returns {number} 解的数量 (0, 1, 或 2)
     */
    _countSolutions() {
        const tempGrid = JSON.parse(JSON.stringify(this.grid));
        let count = 0;
        
        const solve = () => {
            // 找到一个空单元格
            const emptyCell = this._findEmptyCell();
            if (!emptyCell) {
                count++; // 找到一个解
                return count >= 2; // 如果已经找到两个解，可以提前停止
            }
            
            const [row, col] = emptyCell;
            
            // 尝试1-9的每个数字
            for (let num = 1; num <= 9; num++) {
                if (this._isValid(row, col, num)) {
                    this.grid[row][col] = num;
                    
                    // 递归求解
                    if (solve()) {
                        return true; // 已找到两个解，提前停止
                    }
                    
                    // 回溯
                    this.grid[row][col] = 0;
                }
            }
            
            return false;
        };
        
        solve();
        
        // 恢复原始网格
        this.grid = tempGrid;
        
        return count;
    }

    /**
     * 查找网格中的空单元格
     * @returns {Array|null} [row, col] 或 null（如果没有空单元格）
     */
    _findEmptyCell() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    /**
     * 检查在指定位置放置数字是否有效
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} num - 要检查的数字
     * @returns {boolean} 是否有效
     */
    _isValid(row, col, num) {
        // 检查行
        for (let i = 0; i < this.size; i++) {
            if (this.grid[row][i] === num) {
                return false;
            }
        }
        
        // 检查列
        for (let i = 0; i < this.size; i++) {
            if (this.grid[i][col] === num) {
                return false;
            }
        }
        
        // 检查3x3宫格
        const boxRow = Math.floor(row / this.boxSize) * this.boxSize;
        const boxCol = Math.floor(col / this.boxSize) * this.boxSize;
        
        for (let i = 0; i < this.boxSize; i++) {
            for (let j = 0; j < this.boxSize; j++) {
                if (this.grid[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 获取1-9的随机排序数组
     * @returns {Array} 随机排序的1-9数组
     */
    _getShuffledNumbers() {
        const numbers = Array.from({length: this.size}, (_, i) => i + 1);
        this._shuffle(numbers);
        return numbers;
    }

    /**
     * 随机打乱数组
     * @param {Array} array - 要打乱的数组
     */
    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * 验证玩家的解答是否正确
     * @param {Array} playerGrid - 玩家的解答网格
     * @returns {boolean} 是否正确
     */
    validateSolution(playerGrid) {
        // 检查每个单元格
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                // 跳过空单元格
                if (playerGrid[row][col] === 0) {
                    return false; // 未完成
                }
                
                // 检查是否与解答匹配
                if (playerGrid[row][col] !== this.solution[row][col]) {
                    return false; // 错误
                }
            }
        }
        
        return true; // 正确
    }

    /**
     * 检查特定单元格的玩家输入是否正确
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number} value - 玩家输入的值
     * @returns {boolean} 是否正确
     */
    checkCell(row, col, value) {
        return value === this.solution[row][col];
    }

    /**
     * 获取提示（随机填充一个空单元格）
     * @param {Array} playerGrid - 当前玩家的网格
     * @returns {Object|null} 提示信息 {row, col, value} 或 null（如果没有空单元格）
     */
    getHint(playerGrid) {
        // 找到所有空单元格
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (playerGrid[row][col] === 0) {
                    emptyCells.push({row, col});
                }
            }
        }
        
        // 如果没有空单元格，返回null
        if (emptyCells.length === 0) {
            return null;
        }
        
        // 随机选择一个空单元格
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const {row, col} = emptyCells[randomIndex];
        
        // 返回提示
        return {
            row,
            col,
            value: this.solution[row][col]
        };
    }
}

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SudokuGenerator };
}
