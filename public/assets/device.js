// 检测设备类型
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    
    // 添加设备类型标识到 body
    document.body.classList.add(isMobile ? 'mobile-device' : 'desktop-device');
    
    // 加载对应的样式表
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = isMobile ? 'assets/mobile-style.css' : 'assets/style.css';
    document.head.appendChild(cssLink);
    
    return isMobile;
}

// 页面加载时执行设备检测
document.addEventListener('DOMContentLoaded', detectDevice);

// 导出检测函数供其他模块使用
window.isDeviceMobile = detectDevice;
