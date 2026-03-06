/**
 * Visor de Fractales Koch JSON
 * Para curso de Programación Estructurada C++ - Ingeniería de Software
 */

class KochViewer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.data = null;
        this.segments = [];
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.animationId = null;
        this.showGrid = true;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.centerCanvas();
    }

    setupCanvas() {
        // Configurar tamaño del canvas con alta resolución
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 600;
        
        // Fondo negro inicial
        this.clearCanvas();
    }

    setupEventListeners() {
        // Carga de archivo
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFile(e.target.files[0]);
        });

        // Drag and drop
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.style.border = '2px dashed var(--accent)';
        });

        this.canvas.addEventListener('dragleave', () => {
            this.canvas.style.border = '2px solid var(--bg-card)';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.border = '2px solid var(--bg-card)';
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                this.handleFile(file);
            } else {
                alert('Por favor, arrastra un archivo JSON válido');
            }
        });

        // Controles de zoom
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('fitBtn').addEventListener('click', () => this.fitToScreen());
        
        // Controles de vista
        document.getElementById('resetBtn').addEventListener('click', () => this.resetView());
        document.getElementById('animateBtn').addEventListener('click', () => this.animate());
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            if (this.data) this.draw();
        });

        // Pan (arrastrar)
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            if (this.data) this.draw();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Zoom con rueda del ratón
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(factor);
        });
    }

    centerCanvas() {
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    clearCanvas() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    handleFile(file) {
        if (!file) return;
        
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('placeholder').style.display = 'none';

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.data = JSON.parse(e.target.result);
                this.validateAndLoad();
            } catch (error) {
                alert('Error al parsear JSON: ' + error.message);
                document.getElementById('loading').style.display = 'none';
            }
        };
        reader.readAsText(file);
    }

    validateAndLoad() {
        // Validar estructura mínima
        if (!this.data.metadata || !this.data.segmentos) {
            alert('Formato JSON no válido. ¿Es un archivo generado por el programa C++?');
            document.getElementById('loading').style.display = 'none';
            return;
        }

        this.segments = this.data.segmentos;
        this.updateInfoPanel();
        this.createColorLegend();
        this.fitToScreen();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('infoPanel').style.display = 'block';
    }

    updateInfoPanel() {
        const meta = this.data.metadata;
        const config = this.data.configuracion;
        
        document.getElementById('metaTipo').textContent = meta.tipo || 'Desconocido';
        document.getElementById('metaNivel').textContent = meta.nivel_recursion;
        document.getElementById('metaSegmentos').textContent = meta.total_segmentos;
        document.getElementById('metaFecha').textContent = meta.fecha_generacion || 'No disponible';
        document.getElementById('metaTamano').textContent = meta.tamano_lado + ' px';
    }

    createColorLegend() {
        const legend = document.getElementById('colorLegend');
        const items = document.getElementById('legendItems');
        items.innerHTML = '';
        
        const colores = this.data.configuracion?.colores_nivel || 
                       ['white', 'cyan', 'blue', 'purple', 'magenta'];
        
        colores.forEach((color, index) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="color-box" style="background-color: ${color}"></div>
                <span>Nivel ${index}</span>
            `;
            items.appendChild(item);
        });
        
        legend.style.display = 'block';
    }

    fitToScreen() {
        if (!this.segments.length) return;
        
        // Calcular bounding box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.segments.forEach(seg => {
            minX = Math.min(minX, seg.x1, seg.x2);
            maxX = Math.max(maxX, seg.x1, seg.x2);
            minY = Math.min(minY, seg.y1, seg.y2);
            maxY = Math.max(maxY, seg.y1, seg.y2);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        const padding = 50;
        
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        
        this.scale = Math.min(scaleX, scaleY);
        this.offsetX = this.canvas.width / 2 - (minX + maxX) / 2 * this.scale;
        this.offsetY = this.canvas.height / 2 + (minY + maxY) / 2 * this.scale; // Invertir Y
        
        this.draw();
        this.updateZoomDisplay();
    }

    zoom(factor) {
        this.scale *= factor;
        this.draw();
        this.updateZoomDisplay();
    }

    updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = Math.round(this.scale * 100) + '%';
    }

    resetView() {
        this.fitToScreen();
    }

    draw() {
        this.clearCanvas();
        
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Dibujar todos los segmentos
        this.ctx.lineWidth = 2 / Math.sqrt(this.scale); // Líneas más finas al hacer zoom
        
        this.segments.forEach(seg => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = seg.color || 'white';
            this.ctx.moveTo(
                this.offsetX + seg.x1 * this.scale,
                this.offsetY - seg.y1 * this.scale // Invertir Y para coordenadas cartesianas
            );
            this.ctx.lineTo(
                this.offsetX + seg.x2 * this.scale,
                this.offsetY - seg.y2 * this.scale
            );
            this.ctx.stroke();
        });
    }

    drawGrid() {
        const gridSize = 50 * this.scale;
        const offsetX = this.offsetX % gridSize;
        const offsetY = this.offsetY % gridSize;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Líneas verticales
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Líneas horizontales
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Ejes principales
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        this.ctx.lineWidth = 2;
        
        // Eje X
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.offsetY);
        this.ctx.lineTo(this.canvas.width, this.offsetY);
        this.ctx.stroke();
        
        // Eje Y
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX, 0);
        this.ctx.lineTo(this.offsetX, this.canvas.height);
        this.ctx.stroke();
    }

    async animate() {
        if (!this.segments.length || this.animationId) return;
        
        this.clearCanvas();
        if (this.showGrid) this.drawGrid();
        
        const delay = Math.max(1, 5000 / this.segments.length); // 5 segundos total máximo
        
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = seg.color || 'white';
            this.ctx.lineWidth = 2 / Math.sqrt(this.scale);
            this.ctx.moveTo(
                this.offsetX + seg.x1 * this.scale,
                this.offsetY - seg.y1 * this.scale
            );
            this.ctx.lineTo(
                this.offsetX + seg.x2 * this.scale,
                this.offsetY - seg.y2 * this.scale
            );
            this.ctx.stroke();
            
            // Actualizar progreso cada 100 segmentos
            if (i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.viewer = new KochViewer();
});