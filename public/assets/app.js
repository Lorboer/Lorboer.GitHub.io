document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const videoUrlInput = document.getElementById('video-url');
    const interfaceSelect = document.getElementById('interface-select');
    const parseBtn = document.getElementById('parse-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const aboutBtn = document.getElementById('about-btn');
    const statusList = document.getElementById('status-list');
    const videoPlayer = document.getElementById('video-player');
    const modal = document.getElementById('about-modal');
    const closeModal = document.querySelector('.close');
    
    // Store interfaces and their status
    let interfaces = [];
    let interfaceStatus = {};
    
    // 初始显示信息
    videoPlayer.srcdoc = `
        <style>
            body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #000;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
            }
            .message {
                padding: 20px;
                max-width: 80%;
            }
            h3 {
                margin-bottom: 20px;
            }
        </style>
        <div class="message">
            <h3>欢迎使用视频解析站</h3>
            <p>请在下方输入框粘贴视频链接，选择解析接口后点击解析按钮</p>
        </div>
    `;
    
    // Fetch interfaces from JSON file
    fetch('links.json')
        .then(response => response.json())
        .then(data => {
            interfaces = data;
            populateInterfaceSelect();
        })
        .catch(error => {
            console.error('Error loading interfaces:', error);
        });
    
    // Populate interface select dropdown
    function populateInterfaceSelect() {
        interfaceSelect.innerHTML = '';
        interfaces.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.title;
            interfaceSelect.appendChild(option);
        });
    }
    
    // Check status of a single interface
    function checkInterfaceStatus(interface, index) {
        return new Promise((resolve) => {
            const statusItem = document.createElement('div');
            statusItem.classList.add('status-item', 'status-checking');
            statusItem.textContent = `${interface.title}: 检测中...`;
            statusItem.id = `status-${index}`;
            statusItem.style.animationDelay = `${index * 0.1}s`;
            
            // Add or update status item in the list
            const existingItem = document.getElementById(`status-${index}`);
            if (existingItem) {
                statusList.replaceChild(statusItem, existingItem);
            } else {
                statusList.appendChild(statusItem);
            }
            
            // 使用 fetch 来检测接口是否可访问
            fetch(interface.url, { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                timeout: 5000
            })
            .then(() => {
                // 由于 no-cors 模式下无法确定具体状态，但能接收到响应意味着服务器存在
                interfaceStatus[index] = true;
                updateStatusDisplay(index, true);
                resolve(true);
            })
            .catch(() => {
                interfaceStatus[index] = false;
                updateStatusDisplay(index, false);
                resolve(false);
            });
            
            // 设置超时
            setTimeout(() => {
                if (statusItem.classList.contains('status-checking')) {
                    interfaceStatus[index] = false;
                    updateStatusDisplay(index, false);
                    resolve(false);
                }
            }, 5000);
        });
    }
    
    // Update the status display for an interface
    function updateStatusDisplay(index, isOnline) {
        const statusItem = document.getElementById(`status-${index}`);
        if (statusItem) {
            statusItem.classList.remove('status-checking', 'status-online', 'status-offline');
            if (isOnline) {
                statusItem.classList.add('status-online');
                statusItem.textContent = `${interfaces[index].title}: 在线`;
            } else {
                statusItem.classList.add('status-offline');
                statusItem.textContent = `${interfaces[index].title}: 离线`;
            }
        }
    }
    
    // Check all interface statuses
    function checkAllInterfaceStatus() {
        statusList.innerHTML = '';
        interfaces.forEach((interface, index) => {
            checkInterfaceStatus(interface, index);
        });
    }
    
    // Parse video with selected interface
    function parseVideo() {
        const videoUrl = videoUrlInput.value.trim();
        const selectedIndex = interfaceSelect.value;
        
        if (!videoUrl) {
            showAlert('请输入视频链接');
            return;
        }
        
        if (selectedIndex === undefined || !interfaces[selectedIndex]) {
            showAlert('请选择一个解析接口');
            return;
        }
        
        const parseUrl = interfaces[selectedIndex].url + videoUrl;
        
        // 添加视频加载动画
        const videoContainer = document.querySelector('.video-container');
        videoContainer.classList.add('loading');
        
        // 使用iframe的srcdoc属性而不是直接设置src，避免自动播放问题
        videoPlayer.onload = function() {
            videoContainer.classList.remove('loading');
        };
        
        videoPlayer.onerror = function() {
            videoContainer.classList.remove('loading');
            showAlert('视频加载失败，请尝试其他接口');
            
            // 显示错误信息
            videoPlayer.srcdoc = `
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: #000;
                        color: #e74c3c;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }
                    .message {
                        padding: 20px;
                        max-width: 80%;
                    }
                </style>
                <div class="message">
                    <h3>视频加载失败</h3>
                    <p>请尝试其他解析接口或检查视频链接是否正确</p>
                </div>
            `;
        };
        
        // 直接设置src而不是srcdoc来加载外部视频
        videoPlayer.src = parseUrl;
        videoContainer.classList.remove('loading');
        
        // 保存到历史记录
        saveToHistory(videoUrl, selectedIndex);
    }
    
    // 保存解析历史
    function saveToHistory(url, interfaceIndex) {
        let history = JSON.parse(localStorage.getItem('videoParseHistory') || '[]');
        
        // 添加到历史记录，最多保存10条
        history.unshift({
            url: url,
            interface: interfaceIndex,
            timestamp: new Date().toISOString()
        });
        
        // 限制历史记录数量
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        localStorage.setItem('videoParseHistory', JSON.stringify(history));
    }
    
    // 显示自定义提示
    function showAlert(message) {
        // 检查是否已存在提示框
        let alertBox = document.querySelector('.custom-alert');
        
        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.className = 'custom-alert';
            document.body.appendChild(alertBox);
        }
        
        alertBox.textContent = message;
        alertBox.classList.add('show');
        
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 3000);
    }
    
    // Event listeners
    parseBtn.addEventListener('click', parseVideo);
    
    // 支持按回车键解析
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            parseVideo();
        }
    });
    
    refreshBtn.addEventListener('click', function() {
        refreshBtn.classList.add('spinning');
        checkAllInterfaceStatus();
        
        setTimeout(() => {
            refreshBtn.classList.remove('spinning');
        }, 1000);
    });
    
    aboutBtn.addEventListener('click', function() {
        modal.style.display = 'block';
        // 使用setTimeout确保display:block已应用
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    });
    
    closeModal.addEventListener('click', function() {
        modal.classList.remove('show');
        // 等待动画完成后隐藏模态框
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
    
    // 添加设备检测
    function checkDeviceType() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        document.body.classList.add(isMobile ? 'mobile-device' : 'desktop-device');
    }
    
    // 添加输入框焦点效果
    videoUrlInput.addEventListener('focus', function() {
        this.parentElement.classList.add('input-focused');
    });
    
    videoUrlInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('input-focused');
    });
    
    // 添加按钮点击波纹效果
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const x = e.clientX - this.getBoundingClientRect().left;
            const y = e.clientY - this.getBoundingClientRect().top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 初始化时检测设备类型
    checkDeviceType();
});
