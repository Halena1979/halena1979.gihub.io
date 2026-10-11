export class ImageAnimator {
    constructor(containerId="slideshow", fade_in_time = 1, hold_time = 2, fade_out_time = 1, filename_caption = true) {
        this._images = [];
        this.container = document.getElementById(containerId);
        this._fade_in_time = fade_in_time;
        this._hold_time = hold_time;
        this._fade_out_time = fade_out_time;
        this._filename_caption = filename_caption;
    } 

    /**
     * Silent Internal Image Preloader
     * Loops through asset strings, feeds them to browser thread download caches,
     * and maps a Promise engine that resolves only when all files hit 100% download.
     */
    preloadImages(filelist) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; height:100%; font-family:'Montserrat',sans-serif; font-weight:bold; font-size:16px; color:#555555;">
                    <div>Loading Gallery...</div>
                </div>
            `;
        }

        const promises = filelist.map(src => {
            return new Promise((resolve) => {
                const imgCache = new Image();
                imgCache.src = src; 
                imgCache.onload = () => resolve(src);
                imgCache.onerror = () => {
                    console.error(`Gallery loader failed to fetch asset target: ${src}`);
                    resolve(src); 
                };
            });
        });

        return Promise.all(promises);
    }

    buildAnimation() {
        if (!this.container) return;

        const count = this.images.length;
        const singleDuration = this.hold_time + this.fade_in_time + this.fade_out_time; 
        const totalDuration = singleDuration * count; 
        
        const fade_in_pct = (this.fade_in_time / totalDuration) * 100;
        const hold_pct = (this.hold_time / totalDuration) * 100;
        const fade_out_pct = (this.fade_out_time / totalDuration) * 100;
        const single_pct = (singleDuration / totalDuration) * 100;

        let keyframesCSS = '';
        this._images.forEach((_, index) => {
            const startDelay = index * single_pct;
            
            const p1 = startDelay.toFixed(4);
            const p2 = (startDelay + fade_in_pct).toFixed(4);
            const p3 = (startDelay + fade_in_pct + hold_pct).toFixed(4);
            const p4 = (startDelay + fade_in_pct + hold_pct + fade_out_pct).toFixed(4);

            keyframesCSS += `
                @keyframes slide-fade-loop-${index} { 
                    /* FIX: Kept visibility: visible here to force the browser to pre-decode pixels */
                    0%, ${p1}% { 
                        opacity: 0; 
                        mix-blend-mode: normal;
                        visibility: visible; 
                        transform: translate(100%, 0) scale(1.05); 
                        filter: blur(15px);
                        z-index: 1;
                    }
                    /* Entrance window */
                    ${p2}% { 
                        opacity: 1; 
                        mix-blend-mode: normal;
                        visibility: visible; 
                        transform: translate(0, 0) scale(1); 
                        filter: blur(0px);
                        z-index: 10;
                    }
                    /* Center Hold Phase */
                    ${p3}% { 
                        opacity: 1; 
                        mix-blend-mode: normal;
                        visibility: visible; 
                        transform: translate(0, 0) scale(1); 
                        filter: blur(0px);   
                        z-index: 10;
                    }
                    /* Exit Phase */
                    ${p4}%, 100% { 
                        opacity: 0; 
                        mix-blend-mode: normal;
                        visibility: visible; 
                        transform: translate(0, 0) scale(1.05); 
                        filter: blur(15px);
                        z-index: 1;
                    }
                }
            `;
        });

        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden'; 
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.boxSizing = 'border-box';
        
        let styleRules = keyframesCSS + `
            #${this.container.id}.paused * {
                animation-play-state: paused !important;
            }
        `;

        this._images.forEach((src, index) => {
            const filename = src.split('/').pop().replace(/\.[^/.]+$/, "");

            const slide = document.createElement('div');
            slide.className = `anim-slide-${index}`;
            
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.height = '100%';
            slide.style.display = 'flex';
            slide.style.flexDirection = 'column';
            slide.style.alignItems = 'center';
            slide.style.justifyContent = 'center';
            slide.style.boxSizing = 'border-box';
            slide.style.padding = '20px';

            const note = document.createElement('div');
            note.textContent = "Click image to pause/resume animation";
            note.style.marginBottom = '10px';
            note.style.fontSize = 'clamp(11px, 1.8cqi, 16px)';
            note.style.fontStyle = 'italic';
            note.style.fontWeight = 'bold';
            note.style.color = '#555555'; 
            note.style.fontFamily = 'Montserrat, sans-serif';
            note.style.textAlign = 'center';
            note.style.flexShrink = '0'; 

            const img = document.createElement('img');
            img.src = src; 
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.minHeight = '0'; 
            img.style.flexGrow = '1';
            img.style.objectFit = 'contain'; 
            img.style.cursor = 'pointer'; 

            img.addEventListener('click', () => {
                this.container.classList.toggle('paused');
            });

            const caption = document.createElement('div');
            caption.textContent = filename.replaceAll("_", " ");
            caption.style.marginTop = '15px';
            caption.style.fontSize = 'clamp(16px, 3.8cqi, 42px)'; 
            caption.style.fontWeight = 'bold';
            caption.style.color = '#000000'; 
            caption.style.fontFamily = 'Montserrat, sans-serif';
            caption.style.textAlign = 'center';
            caption.style.width = '100%';
            caption.style.flexShrink = '0'; 

            slide.appendChild(note);
            slide.appendChild(img);
            if (this._filename_caption) { slide.appendChild(caption); }
            this.container.appendChild(slide);
            
            styleRules += `.anim-slide-${index} { animation: slide-fade-loop-${index} ${totalDuration}s infinite linear; }`;
        });

        const oldStyle = document.getElementById('animator-styles');
        if (oldStyle) oldStyle.remove();

        const styleEl = document.createElement('style');
        styleEl.id = 'animator-styles';
        styleEl.textContent = styleRules;
        document.head.appendChild(styleEl);
    }

    get images() { return this._images; }

    set images(filelist) { 
        if (!Array.isArray(filelist) || filelist.length === 0) return;
        
        this.preloadImages(filelist).then((completedList) => {
            this._images = completedList;
            this.buildAnimation();
        });
    }

    get fade_in_time() { return this._fade_in_time; }
    get hold_time() { return this._hold_time; }
    get fade_out_time() { return this._fade_out_time; }
}