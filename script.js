// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const convertBtn = document.getElementById('convertBtn');
const outputSection = document.getElementById('outputSection');
const outputPreview = document.getElementById('outputPreview');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const themeToggle = document.getElementById('themeToggle');
const themeToggleLabel = document.getElementById('themeToggleLabel');

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggleLabel.textContent = `${nextTheme} mode`;
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
}

let savedTheme = 'dark';
try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
        savedTheme = storedTheme;
    }
} catch (error) {
    console.warn('Unable to read saved theme:', error);
}
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
        localStorage.setItem('theme', nextTheme);
    } catch (error) {
        console.warn('Unable to save theme preference:', error);
    }
});

// Outline Slider Elements
const outputStyleRadios = document.querySelectorAll('input[name="outputStyle"]');
const outlineDetailGroup = document.getElementById('outlineDetailGroup');
const outlineDetailSlider = document.getElementById('outlineDetail');
const outlineDetailValue = document.getElementById('outlineDetailValue');

outputStyleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'outline' || e.target.value === 'outline-shading') {
            outlineDetailGroup.style.display = 'block';
        } else {
            outlineDetailGroup.style.display = 'none';
        }
    });
});

outlineDetailSlider.addEventListener('input', (e) => {
    outlineDetailValue.textContent = e.target.value;
});

// State
let currentImage = null;
let generatedSVG = null;

// Upload area interactions
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

removeBtn.addEventListener('click', () => {
    currentImage = null;
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    convertBtn.disabled = true;
    outputSection.style.display = 'none';
    fileInput.value = '';
});

// Handle file upload
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = new Image();
        currentImage.onload = () => {
            previewImage.src = e.target.result;
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'block';
            convertBtn.disabled = false;
        };
        currentImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Get current options
function getOptions() {
    const detailLevel = document.querySelector('input[name="detailLevel"]:checked').value;
    const colorMode = document.querySelector('input[name="colorMode"]:checked').value;
    const outputStyle = document.querySelector('input[name="outputStyle"]:checked').value;
    const outlineDetail = parseInt(document.getElementById('outlineDetail').value);
    
    return {
        detailLevel,
        colorMode,
        outputStyle,
        outlineDetail
    };
}

// Convert image to SVG
convertBtn.addEventListener('click', async () => {
    if (!currentImage) return;

    convertBtn.disabled = true;
    convertBtn.innerHTML = '<span class="btn-text">Converting...</span>';

    // Allow UI to update before heavy processing
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const options = getOptions();
        const svgResult = await imageToSVG(currentImage, options);
        
        generatedSVG = svgResult;
        outputPreview.innerHTML = svgResult;
        outputSection.style.display = 'block';
        
        // Scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        convertBtn.innerHTML = '<span class="btn-text">Apply to All</span><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"/></svg>';
        convertBtn.disabled = false;
    } catch (error) {
        console.error('Conversion error:', error);
        alert('Error converting image to SVG. Please try again.');
        convertBtn.innerHTML = '<span class="btn-text">Apply to All</span><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"/></svg>';
        convertBtn.disabled = false;
    }
});

// Download SVG
downloadBtn.addEventListener('click', () => {
    if (!generatedSVG) return;

    const blob = new Blob([generatedSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-image.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Copy SVG code
copyBtn.addEventListener('click', async () => {
    if (!generatedSVG) return;

    try {
        await navigator.clipboard.writeText(generatedSVG);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    } catch (error) {
        console.error('Copy failed:', error);
        alert('Failed to copy to clipboard');
    }
});

// Image to SVG conversion function
async function imageToSVG(image, options) {
    let tracerOptions = {
        corspolicy: true,
        scale: 1, // Do not scale by default
        layering: 0
    };

    if (options.detailLevel === 'high') {
        tracerOptions.numberofcolors = 64;
        tracerOptions.pathomit = 2;
        tracerOptions.blurradius = 1;
        tracerOptions.blurdelta = 20;
        tracerOptions.linefilter = true;
    } else if (options.detailLevel === 'medium') {
        tracerOptions.numberofcolors = 16;
        tracerOptions.pathomit = 8;
        tracerOptions.blurradius = 2;
        tracerOptions.blurdelta = 20;
        tracerOptions.linefilter = true;
    } else {
        tracerOptions.numberofcolors = 8;
        tracerOptions.pathomit = 16;
        tracerOptions.blurradius = 4;
        tracerOptions.blurdelta = 20;
        tracerOptions.linefilter = false;
    }

    if (options.colorMode === 'blackwhite') {
        tracerOptions.pal = [{r:0,g:0,b:0,a:255}, {r:255,g:255,b:255,a:255}];
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (options.outputStyle === 'full') {
        return ImageTracer.imagedataToSVG(originalImageData, tracerOptions);
    }

    // For Outline or Outline-Shading, isolate edges using Sobel edge detection
    const edgeImageData = ctx.createImageData(canvas.width, canvas.height);
    edgeImageData.data.set(originalImageData.data);

    // threshold logic: outlineDetail is 10 to 150. Lower slider -> higher threshold (fewer edges).
    const threshold = 170 - options.outlineDetail; 
    applyEdgeDetection(edgeImageData, threshold);

    let edgeTracerOptions = {
        corspolicy: true,
        scale: 1,
        layering: 1, // Parallel layering so white/black shapes don't overlap
        pal: [{r:0,g:0,b:0,a:255}, {r:255,g:255,b:255,a:255}], // Explicitly trace black AND white
        pathomit: 2, // Low omit to keep thin lines
        linefilter: true
    };

    const edgeSvgStr = ImageTracer.imagedataToSVG(edgeImageData, edgeTracerOptions);

    // Remove white backgrounds by manipulating the DOM
    const parser = new DOMParser();
    const edgeDoc = parser.parseFromString(edgeSvgStr, 'image/svg+xml');
    const edgePaths = edgeDoc.querySelectorAll('path');
    
    edgePaths.forEach(path => {
        const fill = path.getAttribute('fill');
        if (fill === 'rgb(255,255,255)' || fill === '#ffffff' || fill === 'white') {
            path.remove();
        }
    });

    if (options.outputStyle === 'outline') {
        return new XMLSerializer().serializeToString(edgeDoc.documentElement);
    }

    if (options.outputStyle === 'outline-shading') {
        // Trace base colors, double blur for smoother cell shading base
        tracerOptions.blurradius = tracerOptions.blurradius * 2;
        const colorSvgStr = ImageTracer.imagedataToSVG(originalImageData, tracerOptions);
        
        // Combine them
        const colorDoc = parser.parseFromString(colorSvgStr, 'image/svg+xml');
        const colorSvg = colorDoc.querySelector('svg');
        
        const remainingEdgePaths = edgeDoc.querySelectorAll('path');
        remainingEdgePaths.forEach(path => {
            path.setAttribute('fill', '#000000');
            path.setAttribute('opacity', '0.85');
            colorSvg.appendChild(path);
        });
        
        return new XMLSerializer().serializeToString(colorDoc.documentElement);
    }
}

// Sobel Edge Detection
function applyEdgeDetection(imageData, threshold) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
        gray[i] = data[i*4] * 0.299 + data[i*4+1] * 0.587 + data[i*4+2] * 0.114;
    }
    
    const output = new Uint8ClampedArray(data.length);
    const kernelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const kernelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let pixelX = 0;
            let pixelY = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const val = gray[(y + ky) * width + (x + kx)];
                    const weightX = kernelX[(ky + 1) * 3 + (kx + 1)];
                    const weightY = kernelY[(ky + 1) * 3 + (kx + 1)];
                    pixelX += val * weightX;
                    pixelY += val * weightY;
                }
            }
            
            const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
            const idx = (y * width + x) * 4;
            
            if (magnitude > threshold) {
                output[idx] = 0;
                output[idx+1] = 0;
                output[idx+2] = 0;
                output[idx+3] = 255;
            } else {
                output[idx] = 255;
                output[idx+1] = 255;
                output[idx+2] = 255;
                output[idx+3] = 255;
            }
        }
    }
    
    // Borders
    for (let i = 0; i < output.length; i += 4) {
        if (output[i+3] === 0) {
            output[i] = 255; output[i+1] = 255; output[i+2] = 255; output[i+3] = 255;
        }
        data[i] = output[i];
        data[i+1] = output[i+1];
        data[i+2] = output[i+2];
        data[i+3] = output[i+3];
    }
}
