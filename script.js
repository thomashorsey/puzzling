const ROWS = 6;
const COLUMNS = 8;
const PIECE_SIZE = 50;
const MASK_SIZE_MULTIPLIER = 1 / 1; // 1 / 0.75 is the correct scale
const NUMBER_OF_PIECES = ROWS * COLUMNS;
const BOARD_HEIGHT = ROWS * PIECE_SIZE;
const BOARD_WIDTH = COLUMNS * PIECE_SIZE;
const MARGIN = PIECE_SIZE / 2;
const SIDE_OFFSET_HORIZONTAL = [0, PIECE_SIZE, 0, -PIECE_SIZE];
const SIDE_OFFSET_VERTICAL = [-PIECE_SIZE, 0, PIECE_SIZE, 0];

const SIDE = {
    TOP: 0,
    RIGHT: 1,
    BOTTOM: 2,
    LEFT: 3,
}

const SIDE_TYPE = {
    FLAT: 'FLAT',
    TAB: 'TAB',
    BLANK: 'BLANK'
}

const COMPATIBLE_SIDE_TYPE = {
    FLAT: SIDE_TYPE.FLAT,
    TAB: SIDE_TYPE.BLANK,
    BLANK: SIDE_TYPE.TAB
}

const PIECE_TYPE_SIDES = {
    tl: [SIDE_TYPE.FLAT, SIDE_TYPE.BLANK, SIDE_TYPE.TAB, SIDE_TYPE.FLAT],
    tr: [SIDE_TYPE.FLAT, SIDE_TYPE.FLAT, SIDE_TYPE.TAB, SIDE_TYPE.TAB],
    t: [SIDE_TYPE.FLAT, SIDE_TYPE.BLANK, SIDE_TYPE.TAB, SIDE_TYPE.TAB],
    bl: [SIDE_TYPE.BLANK, SIDE_TYPE.BLANK, SIDE_TYPE.FLAT, SIDE_TYPE.FLAT],
    br: [SIDE_TYPE.BLANK, SIDE_TYPE.FLAT, SIDE_TYPE.FLAT, SIDE_TYPE.TAB],
    b: [SIDE_TYPE.BLANK, SIDE_TYPE.BLANK, SIDE_TYPE.FLAT, SIDE_TYPE.TAB],
    ml: [SIDE_TYPE.BLANK, SIDE_TYPE.BLANK, SIDE_TYPE.TAB, SIDE_TYPE.FLAT],
    mr: [SIDE_TYPE.BLANK, SIDE_TYPE.FLAT, SIDE_TYPE.TAB, SIDE_TYPE.TAB],
    m: [SIDE_TYPE.BLANK, SIDE_TYPE.BLANK, SIDE_TYPE.TAB, SIDE_TYPE.TAB]
}

let highestZIndex = 1;
let activePiece = null;

document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    board.style.height = `${BOARD_HEIGHT}px`;
    board.style.width = `${BOARD_WIDTH}px`;

    const instructions = document.getElementById('instructions');
    instructions.style.height = `${BOARD_HEIGHT}px`;
    instructions.style.width = `${BOARD_WIDTH}px`;

    const visited = localStorage.getItem('previousPuzzler');
    if (!visited) {
        instructions.style.display = 'block';
    }

    createAndPlacePieces(NUMBER_OF_PIECES);

    document.getElementById('showInstructions').addEventListener('click', () => {
        instructions.style.display = 'block';
    });

    document.getElementById('hideInstructions').addEventListener('click', () => {
        instructions.style.display = 'none';
        localStorage.setItem('previousPuzzler', 'true');
    });

    const uploadInput = document.getElementById('imageUpload');
    document.getElementById('uploadButton').addEventListener('click', (e) => {
        e.preventDefault(); 
        uploadInput.click(); 
    });
    uploadInput.addEventListener('change', handleImageUpload);
});

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file);
        document.querySelectorAll('.piece').forEach(piece => {
            piece.style.backgroundImage = `url('${imageUrl}')`;
        });
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && activePiece) {
        let currentRotation = parseInt(activePiece.dataset.rotation) || 0;
        currentRotation = (currentRotation + 90) % 360;
        activePiece.dataset.rotation = currentRotation;
        activePiece.style.transform = `rotate(${currentRotation}deg)`;
    }
});

function getPieceType(row, column) {
    const isTop = row === 0;
    const isBottom = row === ROWS - 1;
    const isLeft =  column === 0;
    const isRight = column === COLUMNS - 1;

    if (isTop) {
        if (isLeft) return 'tl';
        if(isRight) return 'tr';
        return 't';
    }

    if (isBottom) {
        if (isLeft) return 'bl';
        if (isRight) return'br';
        return 'b';
    }

    if (isLeft) return 'ml';
    if (isRight) return 'mr';
    return 'm';
}

function getRandomNonOverlappingPosition(mainRect, boardRect, pieceSize) {
    let randomTop, randomLeft;
    let isOverlapping = true;
    
    const maxTop = mainRect.height - MARGIN - pieceSize;
    const maxLeft = mainRect.width - MARGIN - pieceSize;

    while (isOverlapping) {
        randomTop = Math.random() * maxTop;
        randomLeft = Math.random() * maxLeft;

        const pieceTop = mainRect.top + randomTop;
        const pieceLeft = mainRect.left + randomLeft;
        const pieceBottom = pieceTop + pieceSize;
        const pieceRight = pieceLeft + pieceSize;

        const boardCollisionLeft = boardRect.left - MARGIN;
        const boardCollisionRight = boardRect.right + MARGIN;
        const boardCollisionTop = boardRect.top - MARGIN;
        const boardCollisionBottom = boardRect.bottom + MARGIN;

        if (
            pieceRight < boardCollisionLeft ||
            pieceLeft > boardCollisionRight ||
            pieceBottom < boardCollisionTop ||
            pieceTop > boardCollisionBottom
        ) {
            isOverlapping = false;
        }
    }
    return { randomTop, randomLeft };
}

function createAndPlacePieces(count) {
    const main = document.querySelector('main');
    const board = document.getElementById('board');

    const mainRect = main.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');

        piece.style.height = `${Math.ceil(PIECE_SIZE * MASK_SIZE_MULTIPLIER)}px`;
        piece.style.width = `${Math.ceil(PIECE_SIZE * MASK_SIZE_MULTIPLIER)}px`;

        const row = Math.floor(i / COLUMNS);
        const column = i % COLUMNS;

        const pieceType = getPieceType(row, column)
        piece.dataset.pieceType = pieceType;
        piece.style.maskImage = `url(#${pieceType})`;

        piece.style.backgroundImage = `url('background.jpg')`;
        piece.style.backgroundRepeat = 'no-repeat';
        piece.style.backgroundSize = `${BOARD_WIDTH}px ${BOARD_HEIGHT}px`;
        const backgroundPosX = -column * PIECE_SIZE;
        const backgroundPosY = -row * PIECE_SIZE;
        piece.style.backgroundPosition = `${backgroundPosX}px ${backgroundPosY}px`;

        highestZIndex++;
        piece.style.zIndex = highestZIndex;

        const randomRotation = Math.floor(Math.random() * 360);
        piece.dataset.rotation = randomRotation;
        piece.style.transform = `rotate(${randomRotation}deg)`;

        const { randomTop, randomLeft } = getRandomNonOverlappingPosition(mainRect, boardRect, PIECE_SIZE);
        piece.style.top = `${mainRect.top + randomTop}px`;
        piece.style.left = `${mainRect.left + randomLeft}px`;

        main.appendChild(piece);
        piece.addEventListener('click', togglePiece);
    }
}

function togglePiece(e) {
    e.preventDefault();
    const clickedPiece = e.target;

    if (activePiece === null) {
        activePiece = clickedPiece;

        highestZIndex++;
        activePiece.style.zIndex = highestZIndex;

        activePiece.style.cursor = 'grabbing';
        document.addEventListener('mousemove', moveActivePiece);

        let currentRotation = parseInt(activePiece.dataset.rotation) || 0;
        const snappedRotation = Math.round(currentRotation / 90) * 90;
        activePiece.dataset.rotation = snappedRotation;
        activePiece.style.transform = `rotate(${snappedRotation}deg)`;
    } else {
        putDownPiece();
    }
}

function moveActivePiece(e) {
    if (activePiece) {
        const newTop = e.clientY - (activePiece.offsetHeight / 2);
        const newLeft = e.clientX - (activePiece.offsetWidth / 2);

        activePiece.style.top = `${newTop}px`;
        activePiece.style.left = `${newLeft}px`;
    }
}

function putDownPiece() {
    if (activePiece) {
        document.removeEventListener('mousemove', moveActivePiece);
        activePiece.style.cursor = 'grab';

        snapToGrid(activePiece);

        activePiece = null;
    }
}

function isPieceOverTheBoard(pieceRect, boardRect) {
    const overlapX = Math.max(0, Math.min(pieceRect.right, boardRect.right) - Math.max(pieceRect.left, boardRect.left));
    const overlapY = Math.max(0, Math.min(pieceRect.bottom, boardRect.bottom) - Math.max(pieceRect.top, boardRect.top));

    const isOverlapMoreThanHalfX = overlapX / pieceRect.width > 0.5;
    const isOverlapMoreThanHalfY = overlapY / pieceRect.height > 0.5;

    return isOverlapMoreThanHalfX && isOverlapMoreThanHalfY;
}

function isPositionOffTheBoard(targetLeft, targetTop, boardRect) {
    return (
        targetTop < boardRect.top ||
        targetLeft + PIECE_SIZE > boardRect.right ||
        targetTop + PIECE_SIZE > boardRect.bottom ||
        targetLeft < boardRect.left
    );
}

function getPieceInPosition(targetLeft, targetTop) {
    const pieces = document.querySelectorAll('.piece');
    for (const piece of pieces) {
        const pieceRect = piece.getBoundingClientRect();
        if (pieceRect.left === targetLeft && pieceRect.top === targetTop) {
            return piece;
        }
    }
    return undefined;
}

function getPieceSideType(piece, side) {
    const rotationOffset = (piece.dataset.rotation / 90) % 4;
    const pieceSideTypes = PIECE_TYPE_SIDES[piece.dataset.pieceType];

    return pieceSideTypes.at(side - rotationOffset);
}

function isPositionValid(piece, targetLeft, targetTop, boardRect) {
    const sides = Object.values(SIDE);
    for (const side of sides) {
        const pieceSideType = getPieceSideType(piece, side);

        const neighborLeft = targetLeft + SIDE_OFFSET_HORIZONTAL[side];
        const neighborTop = targetTop + SIDE_OFFSET_VERTICAL[side];

        if (isPositionOffTheBoard(neighborLeft, neighborTop, boardRect)) {
            if (SIDE_TYPE.FLAT != COMPATIBLE_SIDE_TYPE[pieceSideType]) {
                return false;
            }
            continue;
        }

        const neighborPiece = getPieceInPosition(neighborLeft, neighborTop);
        if (!neighborPiece) {
            if (SIDE_TYPE.FLAT == pieceSideType) {
                return false;
            }
            continue;
        }

        const neighborSideType = getPieceSideType(neighborPiece, (side + 2) % 4);
        if (neighborSideType != COMPATIBLE_SIDE_TYPE[pieceSideType]) {
            return false;
        }
    }
    return true;
}

function isPositionEmpty(piece, targetLeft, targetTop) {
    const pieces = document.querySelectorAll('.piece');
    for (const otherPiece of pieces) {
        if (otherPiece === piece) {
            continue;
        }

        const otherPieceRect = otherPiece.getBoundingClientRect();
        if (otherPieceRect.left === targetLeft && otherPieceRect.top === targetTop) {
            return false;
        }
    }
    return true;
}

function snapToGrid(piece) {
    const board = document.getElementById('board');

    const boardRect = board.getBoundingClientRect();
    const pieceRect = piece.getBoundingClientRect();

    if (!isPieceOverTheBoard(pieceRect, boardRect)) {
        return;
    }

    // TODO correct gaps from piece scaling (this will be a rabbit hole)

    let snappedX = Math.round((pieceRect.left - boardRect.left) / PIECE_SIZE) * PIECE_SIZE;
    let snappedY = Math.round((pieceRect.top - boardRect.top) / PIECE_SIZE) * PIECE_SIZE;

    const maxPieceLeft = boardRect.width - piece.offsetWidth;
    const maxPieceTop = boardRect.height - piece.offsetHeight;

    snappedX = Math.max(0, Math.min(snappedX, maxPieceLeft));
    snappedY = Math.max(0, Math.min(snappedY, maxPieceTop));

    const targetLeft = boardRect.left + snappedX;
    const targetTop = boardRect.top + snappedY;

    if (!isPositionEmpty(piece, targetLeft, targetTop)) {
        return;
    }

    if (isPositionValid(piece, targetLeft, targetTop, boardRect)) {
        piece.style.left = `${targetLeft}px`;
        piece.style.top = `${targetTop}px`;
    }
}