// --- Configuration ---
const numberOfPieces = 48;
// A variable to keep track of the currently "picked up" piece
let activePiece = null;

let highestZIndex = 1;

// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
    createAndPlacePieces(numberOfPieces);
});

// Listen for key presses to rotate the piece
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && activePiece) {
        // Get the current rotation from the data attribute
        let currentRotation = parseInt(activePiece.dataset.rotation) || 0;
        currentRotation = (currentRotation + 90) % 360;
        activePiece.dataset.rotation = currentRotation;
        activePiece.style.transform = `rotate(${currentRotation}deg)`;
    }
});

/**
 * Dynamically creates and places a specified number of pieces
 * with random starting positions.
 * @param {number} count The number of pieces to create.
 */
function createAndPlacePieces(count) {
    const main = document.querySelector("main");
    const mainMargin = 20;
    const boardMargin = 20;

    // Use fixed dimensions from CSS to correctly calculate placement
    const pieceHeight = 40;
    const pieceWidth = 40;

    const mainRect = main.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        piece.classList.add("piece");

        // Set the initial z-index to be unique for each piece
        highestZIndex++;
        piece.style.zIndex = highestZIndex;

        // Generate a random rotation for each piece
        const randomRotation = Math.floor(Math.random() * 360);
        piece.dataset.rotation = randomRotation;
        piece.style.transform = `rotate(${randomRotation}deg)`;

        let randomTop, randomLeft;
        let isOverlapping = true;

        // Keep generating new random positions until one is found that doesn't overlap with the board
        while (isOverlapping) {
            randomTop = Math.random() * (mainRect.height - mainMargin - pieceHeight);
            randomLeft = Math.random() * (mainRect.width - mainMargin - pieceWidth);

            // Calculate the piece's position relative to the viewport for collision detection
            const pieceTop = mainRect.top + randomTop;
            const pieceLeft = mainRect.left + randomLeft;
            const pieceBottom = pieceTop + pieceHeight;
            const pieceRight = pieceLeft + pieceWidth;

            // Check for overlap with the board's viewport position, now with a margin
            if (
                pieceRight < boardRect.left - boardMargin ||
                pieceLeft > boardRect.right + boardMargin ||
                pieceBottom < boardRect.top - boardMargin ||
                pieceTop > boardRect.bottom + boardMargin
            ) {
                isOverlapping = false;
            }
        }

        // Set the piece's position relative to the main container's top-left corner
        piece.style.top = (mainRect.top + randomTop) + 'px';
        piece.style.left = (mainRect.left + randomLeft) + 'px';

        main.appendChild(piece);
        piece.onclick = togglePiece;
    }
}

/**
 * Handles the two-click interaction for picking up and putting down a piece.
 * @param {Event} e The click event object.
 */
function togglePiece(e) {
    e.preventDefault();
    const clickedPiece = e.target;

    if (activePiece === null) {
        // First click: Pick up the piece
        activePiece = clickedPiece;

        // When a piece is picked up, update its z-index to the highest value
        highestZIndex++;
        activePiece.style.zIndex = highestZIndex;

        // Set cursor to 'grabbing' when the piece is picked up
        activePiece.style.cursor = 'grabbing';
        document.addEventListener('mousemove', moveActivePiece);

        // Snap the piece's rotation to the nearest 90 degrees when picked up
        let currentRotation = parseInt(activePiece.dataset.rotation) || 0;
        const snappedRotation = Math.round(currentRotation / 90) * 90;
        activePiece.dataset.rotation = snappedRotation;
        activePiece.style.transform = `rotate(${snappedRotation}deg)`;

    } else {
        // Second click: Put down the piece.
        putDownPiece();
    }
}

/**
 * Moves the active piece to follow the mouse cursor.
 * @param {Event} e The mousemove event object.
 */
function moveActivePiece(e) {
    if (activePiece) {
        const newTop = e.clientY - (activePiece.offsetHeight / 2);
        const newLeft = e.clientX - (activePiece.offsetWidth / 2);
        activePiece.style.top = newTop + 'px';
        activePiece.style.left = newLeft + 'px';
    }
}

/**
 * Puts down the currently active piece.
 */
function putDownPiece() {
    if (activePiece) {
        document.removeEventListener('mousemove', moveActivePiece);
        // Set cursor back to 'grab' when the piece is put down
        activePiece.style.cursor = 'grab';
        snapToGrid(activePiece);
        activePiece = null;
    }
}

/**
 * Snaps a draggable element to the nearest 50x50 grid square within the board,
 * but only if more than 50% of the piece's width AND height overlap the board.
 * It also prevents snapping if the target position is already occupied.
 * @param {HTMLElement} pieceEl The piece element to snap.
 */
function snapToGrid(pieceEl) {
    const board = document.getElementById("board");
    const gridSize = 50;
    const boardRect = board.getBoundingClientRect();
    const pieceRect = pieceEl.getBoundingClientRect();

    // Calculate the overlapping width and height
    const overlapX = Math.max(0, Math.min(pieceRect.right, boardRect.right) - Math.max(pieceRect.left, boardRect.left));
    const overlapY = Math.max(0, Math.min(pieceRect.bottom, boardRect.bottom) - Math.max(pieceRect.top, boardRect.top));

    // Check if more than 50% of the piece's width AND height are overlapping
    const isMoreThanFiftyPercentX = overlapX / pieceRect.width > 0.5;
    const isMoreThanFiftyPercentY = overlapY / pieceRect.height > 0.5;

    if (isMoreThanFiftyPercentX && isMoreThanFiftyPercentY) {
        // Calculate the snapped position relative to the board's top-left corner
        let snappedX = Math.round((pieceRect.left - boardRect.left) / gridSize) * gridSize;
        let snappedY = Math.round((pieceRect.top - boardRect.top) / gridSize) * gridSize;

        // Clamp the snapped position to ensure it stays within the board's boundaries
        const maxPieceLeft = boardRect.width - pieceEl.offsetWidth;
        const maxPieceTop = boardRect.height - pieceEl.offsetHeight;
        snappedX = Math.max(0, Math.min(snappedX, maxPieceLeft));
        snappedY = Math.max(0, Math.min(snappedY, maxPieceTop));

        // Calculate the final position in screen coordinates
        const finalLeft = boardRect.left + snappedX;
        const finalTop = boardRect.top + snappedY;

        // Check if the target position is already occupied
        let isPositionOccupied = false;
        const allPieces = document.querySelectorAll(".piece");

        for (const otherPiece of allPieces) {
            // Skip checking the piece that is currently being put down
            if (otherPiece === pieceEl) {
                continue;
            }

            // Compare the current screen position of the other piece with the target snapped position
            const otherPieceRect = otherPiece.getBoundingClientRect();
            if (otherPieceRect.left === finalLeft && otherPieceRect.top === finalTop) {
                isPositionOccupied = true;
                break; // Stop checking once a collision is found
            }
        }

        // Only snap the piece if the position is not occupied
        if (!isPositionOccupied) {
            // Update the piece's style to the new snapped position
            pieceEl.style.left = finalLeft + "px";
            pieceEl.style.top = finalTop + "px";
        }
    }
}

var instructions = document.getElementById("instructions");

var showInstructionsButton = document.getElementById("showInstructions");

showInstructionsButton.onclick = function() {
    showInstructions();
}

function showInstructions() {
    instructions.style.display = "block";
}

hideInstructionsButton = document.getElementById("hideInstructions")

hideInstructionsButton.onclick = function() {
    hideInstructions();
}

function hideInstructions() {
    instructions.style.display = "none";
}