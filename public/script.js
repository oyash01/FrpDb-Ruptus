document.addEventListener("DOMContentLoaded", function() {
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let tem, match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(match[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return { name: 'IE', version: (tem[1] || '') };
        }
        if (match[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
        }
        match = match[2] ? [match[1], match[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) match.splice(1, 1, tem[1]);
        return {
            name: match[0],
            version: match[1]
        };
    }

    function getWebGLInfo() {
        const canvas = document.createElement('canvas');
        let gl;
        try {
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        } catch (e) {
            return { error: 'WebGL not supported' };
        }
        if (!gl) return { error: 'WebGL not supported' };
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            gpu: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unavailable',
            gpuVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unavailable'
        };
    }

    function detectPlatform() {
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) return 'Android';
        if (/(iPhone|iPad|iPod)/i.test(ua)) return 'iOS';
        if (/Windows/i.test(ua)) return 'Windows';
        if (/Mac OS/i.test(ua)) return 'Mac';
        if (/Linux/i.test(ua)) return 'Linux';
        return 'Miscellaneous';
    }

    async function gatherFingerprintData() {
        // Check if data has already been sent
        if (localStorage.getItem("fingerprintDataSent") === "true") {
            console.log("Fingerprint data already sent.");
            return;
        }

        let ip = '';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ip = ipData.ip;
        } catch (ipError) {
            console.error('Error fetching IP:', ipError);
        }

        const platform = detectPlatform(); // Detect platform
        const browserInfo = getBrowserInfo();
        const webGLInfo = getWebGLInfo();

        const data = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cores: navigator.hardwareConcurrency,
            memory: navigator.deviceMemory || 'Unknown', // Device memory (GB) if available
            ip: ip,
            browserName: browserInfo.name,
            browserVersion: browserInfo.version,
            webGL: webGLInfo,
            osPlatform: platform // Include platform in data
        };

        try {
            const response = await fetch('/fingerprint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Network response was not ok.');
            console.log("Fingerprint data sent successfully.");
            // Set the flag in localStorage indicating data was sent
            localStorage.setItem("fingerprintDataSent", "true");
        } catch (error) {
            console.error('Error sending fingerprint data:', error);
        }
    }

    gatherFingerprintData();
});
