class ImageDropdown {
    /**
     * @param {string} wrapperId - Element ID of your parent placement container or anchor box
     * @param {string} iframeId - Element ID of your destination iframe target frame (e.g., 'main_frame')
     * @param {Array<{title: string, filename: string}>} options - Dropdown selections
     * @param {string} defaultText - Initial text showing before selection
     * @param {number} offsetX - Horizontal shift percentage from center
     * @param {number} offsetY - Vertical shift percentage from center
     */
    constructor(wrapperId, iframeId, options, defaultText = "Choose a Page...", offsetX = 0, offsetY = 0) {
        this.container = document.getElementById(wrapperId);
        this.iframeId = iframeId; 
        this.options = options;
        this.defaultText = defaultText;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.init();
    }

    init() {
        if (!this.container) return;

        this.container.style.position = 'relative'; 
        this.container.style.containerType = 'inline-size';
        this.container.style.position = 'relative'; 
        
        const existingImg = this.container.querySelector('img, .responsive-img');
        if (existingImg) {
            existingImg.style.cursor = 'pointer';
            existingImg.style.transition = 'transform 0.2s ease';
            existingImg.addEventListener('mouseenter', () => existingImg.style.transform = 'scale(1.01)');
            existingImg.addEventListener('mouseleave', () => existingImg.style.transform = 'scale(1.00)');
        }

        // Create the HTML Text Overlay Layer
        const textOverlay = document.createElement('div');
        textOverlay.textContent = `${this.defaultText} ▾`;
        textOverlay.style.position = 'absolute';
        textOverlay.style.zIndex = '20'; 
        textOverlay.style.width = '100%'; 
        textOverlay.style.fontFamily = "Montserrat";
        textOverlay.style.fontSize = 'clamp(10px, 5.5cqi, 20px)'; 
        textOverlay.style.fontWeight = 'bold';
        textOverlay.style.color = 'white'; 
        textOverlay.style.textAlign = 'center';
        textOverlay.style.pointerEvents = 'none'; 

        this.container.style.containerType = 'inline-size';

        const finalTop = 50 + this.offsetY;
        const finalLeft = 50 + this.offsetX;
        
        textOverlay.style.top = `50%`;
        textOverlay.style.left = `50%`;
        textOverlay.style.transform = 'translate(-50%, -50%)'; 

        this.container.appendChild(textOverlay);

        // Create the Invisible Select Overlay Click Area
        const select = document.createElement('select');
        select.style.position = 'absolute';
        select.style.top = `${finalTop}%`;
        select.style.left = `${finalLeft}%`;
        select.style.transform = 'translate(-50%, -50%)';
        select.style.width = '100%';  
        select.style.height = '100%';   
        select.style.opacity = '0'; 
        select.style.cursor = 'pointer';
        select.style.zIndex = '30'; 
        select.style.appearance = 'none';
        select.style.webkitAppearance = 'none';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        defaultOpt.hidden = true;
        defaultOpt.textContent = this.defaultText;
        select.appendChild(defaultOpt);

        this.options.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.filename;
            opt.textContent = item.title;
            select.appendChild(opt);
        });

        // FIXED: The internal click mechanism looks up your iframe directly now
        select.addEventListener('change', (e) => {
            const selectedFile = e.target.value;
            const selectedText = select.options[select.selectedIndex].text;
            
            textOverlay.textContent = `${selectedText} ▾`;

            // Automatically locates your target iframe and triggers the refresh
            const targetFrame = document.getElementById(this.iframeId);
            if (targetFrame && selectedFile) {
                targetFrame.src = selectedFile + "?timestamp=" + new Date().getTime();
            }
        });

        this.container.appendChild(select);
    }
}