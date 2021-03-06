const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextc = document.getElementById('nextblock');
const nextcc = nextc.getContext('2d');
let paused = false;
let gameTime = 0;
let deltaTime = 0;
let lost = false;
let secTime = 0;
let remSecTime = 0;
let minTime = 0;
var audio = new Audio('tetris_theme_a.mp3');
audio.loop = true;
audio.play();

context.scale(20, 20);
nextcc.scale(10,10);

function pause()
{
    if(!paused)
    {
        paused = true;
        audio.pause();
        if(player.score >= 300) {player.score -= 300;} else {player.score = 0;}
        updateScore();
    }
    else
    {
        paused = false;
        audio.play();
    }
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        rowCount++;
    }

    if(rowCount>0) player.score += scores[rowCount];
    
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type)
{
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1 , 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0},context);
    drawMatrix(player.matrix, player.pos,context);
    drawNext();
}

function drawNext()
{
    nextcc.fillStyle = '#000';
    let offset = {x: 0, y:0};
    if(player.nbt === 'T'){ offset = {x: 1, y: 2};}
    else if(player.nbt === 'I'){ offset = {x: 1, y: 0};}
    else if(player.nbt === 'J'){ offset = {x: 2, y: 1};}
    else if(player.nbt === 'L'){ offset = {x: 0, y: 1};}
    else if(player.nbt === 'O'){ offset = {x: 2, y: 2};}
    else if(player.nbt === 'S'){ offset = {x: 1, y: 2};}
    else if(player.nbt === 'Z'){ offset = {x: 1, y: 2};}
    else { offset = {x: 0, y: 0};}
    nextcc.fillRect(0,0,canvas.width,canvas.height);
    player.nextblock.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextcc.fillStyle = colors[value];
                nextcc.fillRect(x * 2 + offset.x, y * 2 + offset.y, 2 , 2);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    if(player.nextblock === null)
    {
        player.nbt = pieces[pieces.length * Math.random() | 0];
        player.nextblock = createPiece(player.nbt);
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    else
    {
        player.matrix = player.nextblock;
        player.nbt = pieces[pieces.length * Math.random() | 0];
        player.nextblock = createPiece(player.nbt);
    }
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => {row.fill(8);});
        document.getElementById('lastscore').innerText = "Last Score: " + player.score;
        document.getElementById('lasttime').innerText = "Last Time: " + format2(minTime) + ":" + format2(remSecTime);
        player.score = 0;
        gameTime = 0;
        arena.forEach(row => {row.fill(0);});
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {
    deltaTime = time - lastTime;

    if(!paused) gameTime += deltaTime;
    secTime = Math.trunc(gameTime / 1000);
    minTime = Math.trunc(secTime/60);
    remSecTime = (secTime % 60 | 0);

    if(!paused) dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;
    document.getElementById('timer').innerText = "Time: " + format2(minTime) + ":" + format2(remSecTime);

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = "Score: " + player.score;
}

document.addEventListener('keydown', event => {
    if(!paused){
        if (event.keyCode === 37) {
          playerMove(-1);
        } else if (event.keyCode === 39) {
            playerMove(1);
        } else if (event.keyCode === 40) {
            playerDrop();
        } else if (event.keyCode === 81) {
            playerRotate(-1);
        } else if (event.keyCode === 87) {
            playerRotate(1);
        }
        else if (event.keyCode === 32) {pause();}
    }
    else
    {
        if (event.keyCode === 32) {pause();}
    }
});

const colors = [
    null,
    '#AA0000',
    '#AA00AA',
    '#C0C0C0',
    '#0000AA',
    '#AA5500',
    '#00AA00',
    '#00AAAA',
];

const scores = [
	0,
	40,
	100,
	300,
	1200
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    nextblock:null, 
    nbt: 'T',
};

function format2(n){
    return n > 9 ? "" + n: "0" + n;
}

playerReset();
updateScore();
update();