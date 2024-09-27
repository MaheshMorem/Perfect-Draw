const drawingCanvas = document.getElementById('drawingCanvas');
const ctxDraw = drawingCanvas.getContext('2d', { willReadFrequently: true });
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const accuracyDiv = document.getElementById('accuracy');
const shapeCanvas = document.getElementById('shapeCanvas');
const ctxShape = shapeCanvas.getContext('2d', { willReadFrequently: true });

let isDrawing = false;
const tolerance = 10; // Tolerance distance for pixel matching

// Load the PNG image from the same server
let shapeImage = new Image();
shapeImage.src = '/images/shape.png'; // Ensure the image path is relative to the public folder

shapeImage.onload = function() {
    drawReferenceShape();
    setupUserDrawing(); 
}

function drawReferenceShape() {
    ctxShape.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
    ctxShape.drawImage(shapeImage, 0, 0, shapeCanvas.width, shapeCanvas.height);
}

// Set up the drawing canvas for user input
function setupUserDrawing() {
    ctxDraw.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctxDraw.strokeStyle = 'black';
    ctxDraw.lineWidth = 5;
    ctxDraw.lineCap = 'round';

    // Display a transparent version of the reference shape as a guide
    ctxDraw.globalAlpha = 0.2; // Set transparency for the guide shape
    ctxDraw.drawImage(shapeImage, 0, 0, drawingCanvas.width, drawingCanvas.height); // Draw the reference shape as a guide
    ctxDraw.globalAlpha = 1; // Reset transparency for normal drawing
}

// Event listeners for drawing
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseout', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxDraw.lineTo(x, y);
    ctxDraw.stroke();
    ctxDraw.beginPath();
    ctxDraw.moveTo(x, y);
}

function stopDrawing() {
    isDrawing = false;
    ctxDraw.beginPath();
}

function calculateAccuracy() {
   const shapeData = ctxShape.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height);
   const userData = ctxDraw.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
 
   let totalShapePixels = 0;
   let matchingPixels = 0;
 
   const overlayCanvas = document.getElementById('overlayCanvas');
   const overlayCtx = overlayCanvas.getContext('2d');
   const overlayImageData = overlayCtx.createImageData(shapeData.width, shapeData.height);
 
   const diffCanvas = document.getElementById('diffCanvas');
   const diffCtx = diffCanvas.getContext('2d');
   const diffImageData = diffCtx.createImageData(shapeData.width, shapeData.height);
 
   for (let y = 0; y < shapeData.height; y++) {
     for (let x = 0; x < shapeData.width; x++) {
       const shapeIndex = (y * shapeData.width + x) * 4;
       const userIndex = (y * userData.width + x) * 4;
       const overlayIndex = (y * shapeData.width + x) * 4;
       const diffIndex = (y * shapeData.width + x) * 4;
 
       // Check if the current pixel is part of the reference shape (black outline on PNG)
       if (shapeData.data[shapeIndex] === 0 && shapeData.data[shapeIndex + 1] === 0 && shapeData.data[shapeIndex + 2] === 0 && shapeData.data[shapeIndex + 3] === 255) { // Black pixel with full alpha
         totalShapePixels++;
 
         // Check if user drew a black pixel at this location
         if (userData.data[userIndex] === 0 && userData.data[userIndex + 1] === 0 && userData.data[userIndex + 2] === 0 && userData.data[userIndex + 3] === 255) {
           matchingPixels++;
           // Highlight matching pixels in red on the overlay canvas
           overlayImageData.data[overlayIndex] = 255;
           overlayImageData.data[overlayIndex + 1] = 0;
           overlayImageData.data[overlayIndex + 2] = 0;
           overlayImageData.data[overlayIndex + 3] = 255;
         } else {
           // Highlight non-matching pixels in blue on the diff canvas
           diffImageData.data[diffIndex] = 0;
           diffImageData.data[diffIndex + 1] = 0;
           diffImageData.data[diffIndex + 2] = 255;
           diffImageData.data[diffIndex + 3] = 255;
         }
       }
     }
   }
 
   const accuracy = totalShapePixels > 0 ? (matchingPixels / totalShapePixels) * 100 : 0;
   accuracyDiv.textContent = `Accuracy: ${accuracy.toFixed(2)}%`;
 
   // Set the image data for the overlay and difference canvases
   overlayCtx.putImageData(overlayImageData, 0, 0);
   diffCtx.putImageData(diffImageData, 0, 0);
 } 

// Reset canvas
function resetCanvas() {
    ctxDraw.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    setupUserDrawing();
    accuracyDiv.textContent = '';
}

// Initialize the canvas
shapeImage.onload = function() {
   drawReferenceShape();
   setupUserDrawing();
};


// Event listeners for buttons
calculateBtn.addEventListener('click', calculateAccuracy);
resetBtn.addEventListener('click', resetCanvas);
