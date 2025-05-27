// 更新接口状态检测函数
async function checkApiStatus(url) {
    return new Promise((resolve) => {
        // 创建一个隐藏的 iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // 设置超时定时器
        const timeoutId = setTimeout(() => {
            document.body.removeChild(iframe);
            console.warn(`接口 ${url} 检测超时`);
            resolve(false);
        }, 5000);

        // 加载成功
        iframe.onload = () => {
            clearTimeout(timeoutId);
            document.body.removeChild(iframe);
            resolve(true);
        };

        // 加载失败
        iframe.onerror = () => {
            clearTimeout(timeoutId);
            document.body.removeChild(iframe);
            console.warn(`接口 ${url} 加载失败`);
            resolve(false);
        };

        iframe.src = url;
    });
}

// 添加状态文本显示函数
function updateCardStatus(card, isActive) {
    const statusIndicator = card.querySelector('.status-indicator');
    statusIndicator.classList.remove('active', 'inactive');
    statusIndicator.classList.add(isActive ? 'active' : 'inactive');
    
    // 添加状态文本
    let statusText = card.querySelector('.status-text');
    if (!statusText) {
        statusText = document.createElement('span');
        statusText.className = 'status-text';
        card.appendChild(statusText);
    }
    statusText.textContent = isActive ? '可用' : '不可用';
    statusText.style.color = isActive ? '#4CAF50' : '#f44336';
}

// 添加刷新按钮相关代码
let apiData = []; // 存储接口数据

// 更新检测接口状态的函数
async function refreshApiStatus() {
    const refreshBtn = document.getElementById('refresh-btn');
    const container = document.getElementById('links-container');
    
    // 添加旋转动画
    refreshBtn.classList.add('rotating');
    
    // 检查每个接口的状态
    const cards = container.querySelectorAll('.api-card');
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const url = apiData[i].url;
        const isActive = await checkApiStatus(url);
        updateCardStatus(card, isActive);
    }
    
    // 移除旋转动画
    refreshBtn.classList.remove('rotating');
}

// 更新接口展示部分的代码
fetch('links.json')
    .then(response => response.json())
    .then(data => {
        apiData = data; // 保存接口数据
        const container = document.getElementById('links-container');
        const select = document.getElementById('parser-select');
        
        // 清空原有内容
        container.innerHTML = '';
        select.innerHTML = '<option value="" disabled selected>请选择解析接口</option>';
        
        // 动态填充接口列表和选择框
        data.forEach(item => {
            // 创建卡片
            const card = document.createElement('div');
            card.className = 'api-card';
            
            // 添加状态指示器
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'status-indicator';
            
            // 添加标题
            const title = document.createElement('h3');
            title.textContent = item.title;
            
            card.appendChild(statusIndicator);
            card.appendChild(title);
            container.appendChild(card);
            
            // 添加到下拉选择框
            const option = document.createElement('option');
            option.value = item.url;
            option.textContent = item.title;
            select.appendChild(option);
        });
    })
    .catch(error => console.error('加载接口失败:', error));

// 添加刷新按钮点击事件
document.getElementById('refresh-btn').addEventListener('click', refreshApiStatus);

// 初始化视频容器的默认显示
function initVideoContainer() {
    const videoContainer = document.getElementById('video-container');
    videoContainer.className = 'empty';
    videoContainer.innerHTML = `
        <i class="fas fa-play-circle"></i>
        <div>请在上方输入视频地址并选择解析接口</div>
    `;
}

// 在页面加载时初始化视频容器
document.addEventListener('DOMContentLoaded', initVideoContainer);

// 更新解析按钮点击事件
document.getElementById('parse-btn').addEventListener('click', () => {
    const videoUrl = document.getElementById('video-url').value;
    const parserUrl = document.getElementById('parser-select').value;
    const videoContainer = document.getElementById('video-container');
    
    if (!videoUrl || !parserUrl) {
        alert('请填写视频地址并选择解析接口！');
        return;
    }
    
    // 构建播放页地址
    const playUrl = `${parserUrl}?url=${encodeURIComponent(videoUrl)}`;
    
    // 移除empty类并嵌入视频播放器
    videoContainer.className = '';
    videoContainer.innerHTML = `
        <iframe 
            src="${playUrl}" 
            frameborder="0" 
            allowfullscreen
        ></iframe>
    `;
});



