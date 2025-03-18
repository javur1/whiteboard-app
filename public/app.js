//get canvas
const canvas = document.getElementById('whiteboard');
//canvas context
const ctx = canvas.getContext('2d');
// width and height
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const colorPicker = document.getElementById('colorPicker');

let drawing = false;
let lastX = 0;
let lastY = 0;

let tool = 'pen';
let color = colorPicker.value;
let lineWidth = 5;

let settings = {
    tool: tool,
    color: color,
    lineWidth: lineWidth
};

let drawnLines = [];

const socket = io(); // Connect to server

// Buttons
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');

// Switch to Pen
penBtn.addEventListener('click', () => {
    tool = 'pen';
    color = colorPicker.value;
    lineWidth = 5;
    settings.tool = tool;
    settings.color = color;
    settings.lineWidth = lineWidth;
    localStorage.setItem('whiteboardSettings', JSON.stringify(settings));
    // Highlight Pen, remove from Eraser
    penBtn.classList.add('active-tool');
    eraserBtn.classList.remove('active-tool');
});

// Switch to Eraser
eraserBtn.addEventListener('click', () => {
    tool = 'eraser';
    color = '#f4f4f4'; // background color
    settings.tool = tool;
    localStorage.setItem('whiteboardSettings', JSON.stringify(settings));
    lineWidth = 20; // Bigger line for erasing
    // Highlight Eraser, remove from Pen
    eraserBtn.classList.add('active-tool');
    penBtn.classList.remove('active-tool');
});



//change color

colorPicker.addEventListener('input', (e) => {
    const selectedColor = e.target.value;
    color = selectedColor;
    settings.color = selectedColor;
    localStorage.setItem('whiteboardSettings', JSON.stringify(settings));
    //if (tool === 'pen') {
        
        // Update only if pen is active
      //  localStorage.setItem('whiteboardSettings', JSON.stringify(settings));
    //}
});

//function to render individual lines on canvas
function drawLine(lineData) {
    ctx.beginPath();
    ctx.moveTo(lineData.x1, lineData.y1);
    ctx.lineTo(lineData.x2, lineData.y2);
    ctx.strokeStyle = lineData.color;
    ctx.lineWidth = lineData.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
}

//reload with chosen settings

window.addEventListener('load', () => {
    const saved = localStorage.getItem('whiteboardSettings');
    const savedLines = localStorage.getItem('drawnLines');

    if (saved) {
        settings = JSON.parse(saved);
    // Now you can use settings.tool, settings.color, etc.
        tool = settings.tool;
        color = settings.color;
        lineWidth = settings.lineWidth;
        colorPicker.value = settings.color;

        if (tool === 'eraser') {
            // Simulate eraser button click
            tool = 'eraser';
            color = '#f4f4f4';
            lineWidth = 20;
            eraserBtn.classList.add('active-tool');
            penBtn.classList.remove('active-tool');
        } else {
            // Default to pen
           //tool = 'pen';
            //color = 'black';
            //lineWidth = 5;
            penBtn.classList.add('active-tool');
            eraserBtn.classList.remove('active-tool');
        }
    }
    if (savedLines) {
        if (savedLines) {
            drawnLines = JSON.parse(savedLines);
            drawnLines.forEach(lineData => {
                drawLine(lineData);
            });
        }
    }

    
    
});

//get mouse/tablet/styles input
canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

//get mouseup
canvas.addEventListener('pointerup', () => {
    drawing = false
});
//get input move
canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;

    const pressure = e.pressure || 1;
    const dynamicLineWidth = lineWidth * pressure;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.clientX, e.clientY);
    ctx.strokeStyle = color;
    ctx.lineWidth = dynamicLineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    const drawData = {
        x1: lastX,
        y1: lastY,
        x2: e.clientX,
        y2: e.clientY,
        color: color,
        lineWidth: dynamicLineWidth,
    };

    socket.emit('draw', drawData); // Send to server

    drawLine(drawData);
    lastX = e.clientX;
    lastY = e.clientY;

    drawnLines.push(drawData);
    localStorage.setItem('drawnLines', JSON.stringify(drawnLines));
});


canvas.addEventListener('pointerleave', () => {
    drawing = false;
});


function drawLine(data) {
    ctx.beginPath();
    ctx.moveTo(data.x1, data.y1);
    ctx.lineTo(data.x2, data.y2);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
}
//socket listener for incoming drawings
socket.on('draw', (data) => {
    drawLine(data);
});