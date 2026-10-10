class formatted_video {
    constructor(containerId, video_path, crop_pct_top=0, crop_pct_bottom=0, crop_pct_left = 0, crop_pct_right=0, pause_after_seconds=-1, loop=false) {
        this._container = document.getElementById(containerId);
        this._video_path = video_path;
        const uniqueid = crypto.randomUUID(); 
        this._cropdiv_id = `cropdiv-${uniqueid}`;
        this._vid_elem_id = `video-${uniqueid}`;
        this._crop_pct_top = crop_pct_top;
        this._crop_pct_bottom = crop_pct_bottom;
        this._crop_pct_left = crop_pct_left;
        this._crop_pct_right = crop_pct_right;
        this._pause_after_seconds = pause_after_seconds;
        this._loop = loop;
        
        this.add_video_to_container();
        this.crop_video();
        
        if (this._pause_after_seconds > 0) {
            this.pause_vid_after_seconds();
        } else { 
            // If no custom cut-off time is set, let the browser handle native loop loops safely
            this._vid_elem.loop = loop;
        }
    }

    add_video_to_container() {
        if (!this._container) return;
        
        const cropdiv = document.createElement('div');
        cropdiv.id = this._cropdiv_id;
        cropdiv.style.position = 'relative';
        cropdiv.style.width = '100%';
        cropdiv.style.height = '100%';
        cropdiv.style.overflow = 'hidden';
        this._cropdiv = cropdiv;
        
        const vid_elem = document.createElement('video');
        this._vid_elem = vid_elem;
        this._vid_elem.id = this._vid_elem_id;
        this._vid_elem.src = this._video_path;
        this._vid_elem.autoplay = true;
        this._vid_elem.muted = true;
        this._vid_elem.playsinline = true;
        
        // OPTIMIZATION FOR CHROME: Explicitly request the browser to aggressive-buffer
        // all structural video data metadata frames immediately upon injection.
        this._vid_elem.preload = "auto";
        
        this._cropdiv.appendChild(this._vid_elem);
        this._container.appendChild(this._cropdiv);

        // FORCE INITIAL RENDERING PAIRS:
        // Force the browser media player layer to explicitly parse the file data string.
        this._vid_elem.load();
        
        // Fire play immediately, but catch silent promise blocks cleanly
        this._vid_elem.play().catch(err => {
            console.log("Chrome queued autoplay until mouse moves:", err);
        });

        // RECOVERY LISTENER: The exact millisecond your mouse moves over the page wrapper,
        // it forces Chrome to grant media player focus and instantly boots the video up!
        const wakeVideo = () => {
            if (this._vid_elem.paused) {
                this._vid_elem.play().catch(e => console.log(e));
                window.removeEventListener('mousemove', wakeVideo);
                window.removeEventListener('click', wakeVideo);
            }
        };
        window.addEventListener('mousemove', wakeVideo);
        window.addEventListener('click', wakeVideo);
    }
    
    crop_video() {  
        this._vid_elem.style.position = 'absolute';
        this._vid_elem.style.top = '0';
        this._vid_elem.style.left = '0';
        this._vid_elem.style.height = '100%';
        this._vid_elem.style.width = '100%';
        this._vid_elem.style["object-fit"] = 'contain'; 
        this._vid_elem.style.display = 'block';
        this._vid_elem.style["pointer-events"] = 'none';
        this._vid_elem.style["clip-path"] = `inset(${this._crop_pct_top}% ${this._crop_pct_right}% ${this._crop_pct_bottom}% ${this._crop_pct_left}%)`;
    }

    _check_for_pause() {  
        const video = this._vid_elem;
        if (!video || isNaN(video.currentTime)) return;

        // FIXED: Added "video.ended" check. If a short video runs out of frames 
        // before hitting your custom second marker, it will handle the reset cleanly.
        if (video.currentTime >= this._pause_after_seconds || video.ended) {
            video.pause();
            if (this._loop) {
                video.currentTime = 0;
                // Wrapped play call in a small catch handler to keep browser policy restrictions quiet
                video.play().catch(err => console.log("Playback loop queued:", err));
            } else {
                if (!video.ended) {
                    video.currentTime = this._pause_after_seconds;
                }
                clearInterval(this._timer);
            }
        }  
    }

    pause_vid_after_seconds() { 
        // FIXED: Swapped out broken 'self' pointer reference to avoid 'undefined' crash logs
        console.log("Monitoring playback for:", this._vid_elem_id);
        this._timer = setInterval(() => this._check_for_pause(), 10); 
    }
}