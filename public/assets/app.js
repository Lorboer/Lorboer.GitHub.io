/**
 * Guliguli视频解析应用
 * 优化版本：提高性能，改进代码结构
 */
document.addEventListener('DOMContentLoaded', function() {
    // 缓存DOM元素，避免重复查询
    const elements = {
        videoUrlInput: document.getElementById('video-url'),
        interfaceSelect: document.getElementById('interface-select'),
        parseBtn: document.getElementById('parse-btn'),
        refreshBtn: document.getElementById('refresh-btn'),
        statusList: document.getElementById('status-list'),
        videoPlayer: document.getElementById('video-player'),
        modal: document.getElementById('about-modal'),
        closeModal: document.querySelector('.close'),
        aboutBtn: document.getElementById('about-btn')
    };
    
    // 应用状态
    const state = {
        interfaces: [],
        interfaceStatus: {}
    };
    
    // 初始化应用
    initApp();
    
    /**
     * 初始化应用
     */
    function initApp() {
        loadInterfaces();
        setupEventListeners();
        checkDeviceType();
    }
    
    /**
     * 加载解析接口
     */
    function loadInterfaces() {
        fetch('links.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                state.interfaces = data;
                populateInterfaceSelect();
            })
            .catch(error => {
                console.error('Error loading interfaces:', error);
                showAlert('加载解析接口失败，请刷新页面重试');
            });
    }
    
    /**
     * 设置事件监听器
     */
    function setupEventListeners() {
        // 视频解析按钮
        elements.parseBtn.addEventListener('click', parseVideo);
        
        // 回车键触发解析
        elements.videoUrlInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') parseVideo();
        });
        
        // 刷新接口状态
        elements.refreshBtn.addEventListener('click', () => {
            elements.refreshBtn.classList.add('spinning');
            checkAllInterfaceStatus();
            
            setTimeout(() => {
                elements.refreshBtn.classList.remove('spinning');
            }, 1000);
        });
        
        // 关于模态框
        elements.aboutBtn.addEventListener('click', () => {
            elements.modal.style.display = 'block';
            requestAnimationFrame(() => {
                elements.modal.classList.add('show');
            });
        });
        
        elements.closeModal.addEventListener('click', closeModal);
        
        window.addEventListener('click', event => {
            if (event.target === elements.modal) {
                closeModal();
            }
        });
        
        // 输入框焦点效果
        elements.videoUrlInput.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        elements.videoUrlInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
        });
        
        // 按钮波纹效果
        addRippleEffectToButtons();
    }
    
    /**
     * 关闭模态框
     */
    function closeModal() {
        elements.modal.classList.remove('show');
        setTimeout(() => {
            elements.modal.style.display = 'none';
        }, 300);
    }
    
    /**
     * 填充接口选择下拉框
     */
    function populateInterfaceSelect() {
        const { interfaceSelect } = elements;
        interfaceSelect.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        state.interfaces.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.title;
            fragment.appendChild(option);
        });
        
        interfaceSelect.appendChild(fragment);
    }
    
    /**
     * 检查单个接口状态
     * @param {Object} interface 接口对象
     * @param {number} index 接口索引
     * @returns {Promise<boolean>} 接口是否在线
     */
    function checkInterfaceStatus(interface, index) {
        return new Promise((resolve) => {
            const statusItem = createStatusItem(interface, index);
            
            // 设置检测超时
            const timeoutId = setTimeout(() => {
                if (statusItem.classList.contains('status-checking')) {
                    updateInterfaceStatus(index, false);
                    resolve(false);
                }
            }, 5000);
            
            // 检测接口可用性
            fetch(interface.url, { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            })
            .then(() => {
                clearTimeout(timeoutId);
                updateInterfaceStatus(index, true);
                resolve(true);
            })
            .catch(() => {
                clearTimeout(timeoutId);
                updateInterfaceStatus(index, false);
                resolve(false);
            });
        });
    }
    
    /**
     * 创建状态项
     * @param {Object} interface 接口对象
     * @param {number} index 接口索引
     * @returns {HTMLElement} 状态项元素
     */
    function createStatusItem(interface, index) {
        const statusItem = document.createElement('div');
        statusItem.classList.add('status-item', 'status-checking');
        statusItem.textContent = `${interface.title}: 检测中...`;
        statusItem.id = `status-${index}`;
        statusItem.style.animationDelay = `${index * 0.1}s`;
        
        const existingItem = document.getElementById(`status-${index}`);
        if (existingItem) {
            elements.statusList.replaceChild(statusItem, existingItem);
        } else {
            elements.statusList.appendChild(statusItem);
        }
        
        return statusItem;
    }
    
    /**
     * 更新接口状态
     * @param {number} index 接口索引
     * @param {boolean} isOnline 接口是否在线
     */
    function updateInterfaceStatus(index, isOnline) {
        state.interfaceStatus[index] = isOnline;
        updateStatusDisplay(index, isOnline);
    }
    
    /**
     * 更新状态显示
     * @param {number} index 接口索引
     * @param {boolean} isOnline 接口是否在线
     */
    function updateStatusDisplay(index, isOnline) {
        const statusItem = document.getElementById(`status-${index}`);
        if (!statusItem) return;
        
        statusItem.classList.remove('status-checking', 'status-online', 'status-offline');
        
        if (isOnline) {
            statusItem.classList.add('status-online');
            statusItem.textContent = `${state.interfaces[index].title}: 在线`;
        } else {
            statusItem.classList.add('status-offline');
            statusItem.textContent = `${state.interfaces[index].title}: 离线`;
        }
    }
    
    /**
     * 检查所有接口状态
     */
    function checkAllInterfaceStatus() {
        elements.statusList.innerHTML = '';
        state.interfaces.forEach((interface, index) => {
            checkInterfaceStatus(interface, index);
        });
    }
    
    /**
     * 解析视频
     */
    function parseVideo() {
        const videoUrl = elements.videoUrlInput.value.trim();
        const selectedIndex = elements.interfaceSelect.value;
        
        // 验证输入
        if (!videoUrl) {
            showAlert('请输入视频链接');
            return;
        }
        
        if (selectedIndex === undefined || !state.interfaces[selectedIndex]) {
            showAlert('请选择一个解析接口');
            return;
        }
        
        // 创建解析URL
        const parseUrl = state.interfaces[selectedIndex].url + videoUrl;
        
        // 加载视频
        loadVideo(parseUrl);
    }
    
    /**
     * 加载视频
     * @param {string} url 视频URL
     */
    function loadVideo(url) {
        // 清除欢迎信息
        elements.videoPlayer.removeAttribute('srcdoc');
        
        // 加载视频
        elements.videoPlayer.src = url;
        
    }

    
    /**
     * 显示提示消息
     * @param {string} message 提示消息
     */
    function showAlert(message) {
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
    
    /**
     * 检测设备类型
     */
    function checkDeviceType() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        document.body.classList.add(isMobile ? 'mobile-device' : 'desktop-device');
    }
    
    /**
     * 添加按钮波纹效果
     */
    function addRippleEffectToButtons() {
        const buttons = document.querySelectorAll('button');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                this.appendChild(ripple);
                
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
});
