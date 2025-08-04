const numberOfPieces = 48;
let highestZIndex = 1;
let activePiece = null;

// Wait for DOM to be fully loaded before accessing its elements
document.addEventListener("DOMContentLoaded", () => {
    const instructions = document.getElementById("instructions");
    const showInstructionsButton = document.getElementById("showInstructions");
    const hideInstructionsButton = document.getElementById("hideInstructions");

    createAndPlacePieces(numberOfPieces);

    showInstructionsButton.addEventListener('click', () => {
        instructions.style.display = "block";
    });

    hideInstructionsButton.addEventListener('click', () => {
        instructions.style.display = "none";
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && activePiece) {
        let currentRotation = parseInt(activePiece.dataset.rotation) || 0;
        currentRotation = (currentRotation + 90) % 360;
        activePiece.dataset.rotation = currentRotation;
        activePiece.style.transform = `rotate(${currentRotation}deg)`;
    }
});

function createAndPlacePieces(count) {
    const main = document.querySelector("main");
    const board = document.getElementById("board");
    const mainMargin = 20;
    const boardMargin = 20;

    const pieceHeight = 40;
    const pieceWidth = 40;

    const mainRect = main.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        piece.classList.add("piece");

        // Set to the new highest z-index
        highestZIndex++;
        piece.style.zIndex = highestZIndex;

        // Generate a random rotation for each piece
        const randomRotation = Math.floor(Math.random() * 360);
        piece.dataset.rotation = randomRotation;
        piece.style.transform = `rotate(${randomRotation}deg)`;

        let randomTop, randomLeft;
        let isOverlapping = true;

        // Generating new positions until a valid one is found
        while (isOverlapping) {
            randomTop = Math.random() * (mainRect.height - mainMargin - pieceHeight);
            randomLeft = Math.random() * (mainRect.width - mainMargin - pieceWidth);

            // Calculate piece position relative to main
            const pieceTop = mainRect.top + randomTop;
            const pieceLeft = mainRect.left + randomLeft;
            const pieceBottom = pieceTop + pieceHeight;
            const pieceRight = pieceLeft + pieceWidth;

            // Check for overlap with the board or its margin
            if (
                pieceRight < boardRect.left - boardMargin ||
                pieceLeft > boardRect.right + boardMargin ||
                pieceBottom < boardRect.top - boardMargin ||
                pieceTop > boardRect.bottom + boardMargin
            ) {
                isOverlapping = false;
            }
        }

        // Set position relative to main
        piece.style.top = (mainRect.top + randomTop) + 'px';
        piece.style.left = (mainRect.left + randomLeft) + 'px';

        main.appendChild(piece);
        piece.addEventListener('click', togglePiece);
    }
}

function togglePiece(e) {
    e.preventDefault();
    const clickedPiece = e.target;

    // Detect if we are picking up or putting down the piece
    if (activePiece === null) {
        activePiece = clickedPiece;

        // Set to the new highest z-index
        highestZIndex++;
        activePiece.style.zIndex = highestZIndex;

        // Update cursor
        activePiece.style.cursor = 'grabbing';
        document.addEventListener('mousemove', moveActivePiece);

        // Snap rotation to the nearest 90 degrees
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
        activePiece.style.top = newTop + 'px';
        activePiece.style.left = newLeft + 'px';
    }
}

function putDownPiece() {
    if (activePiece) {
        // Update cursor
        document.removeEventListener('mousemove', moveActivePiece);
        activePiece.style.cursor = 'grab';

        // Snap piece
        snapToGrid(activePiece);

        // Reset selection
        activePiece = null;
    }
}

function snapToGrid(pieceEl) {
    const board = document.getElementById("board");
    const gridSize = 50;
    const boardRect = board.getBoundingClientRect();
    const pieceRect = pieceEl.getBoundingClientRect();

    // Calculate overlap
    const overlapX = Math.max(0, Math.min(pieceRect.right, boardRect.right) - Math.max(pieceRect.left, boardRect.left));
    const overlapY = Math.max(0, Math.min(pieceRect.bottom, boardRect.bottom) - Math.max(pieceRect.top, boardRect.top));

    // Check overlap is greater than 50%
    const isMoreThanFiftyPercentX = overlapX / pieceRect.width > 0.5;
    const isMoreThanFiftyPercentY = overlapY / pieceRect.height > 0.5;

    if (isMoreThanFiftyPercentX && isMoreThanFiftyPercentY) {
        // Calculate snapped position relative to board
        let snappedX = Math.round((pieceRect.left - boardRect.left) / gridSize) * gridSize;
        let snappedY = Math.round((pieceRect.top - boardRect.top) / gridSize) * gridSize;

        // Clamp snapped position within board
        const maxPieceLeft = boardRect.width - pieceEl.offsetWidth;
        const maxPieceTop = boardRect.height - pieceEl.offsetHeight;
        snappedX = Math.max(0, Math.min(snappedX, maxPieceLeft));
        snappedY = Math.max(0, Math.min(snappedY, maxPieceTop));

        // Calculate target position
        const targetLeft = boardRect.left + snappedX;
        const targetTop= boardRect.top + snappedY;

        // Check if target position is occupied
        let isPositionOccupied = false;
        const allPieces = document.querySelectorAll(".piece");
        for (const otherPiece of allPieces) {
            if (otherPiece === pieceEl) {
                continue;
            }

            // Compare current piece position with target position
            const otherPieceRect = otherPiece.getBoundingClientRect();
            if (otherPieceRect.left === targetLeft && otherPieceRect.top === targetTop) {
                isPositionOccupied = true;
                break;
            }
        }

        // Snap into position if its unoccupied
        if (!isPositionOccupied) {
            pieceEl.style.left = targetLeft + "px";
            pieceEl.style.top = targetTop + "px";
        }
    }
}