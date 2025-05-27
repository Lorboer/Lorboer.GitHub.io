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

// 更新接口展示部分的代码
fetch('links.json')
    .then(response => response.json())
    .then(async data => {
        const container = document.getElementById('links-container');
        const select = document.getElementById('parser-select');
        
        // 清空原有内容
        container.innerHTML = '';
        select.innerHTML = '<option value="" disabled selected>请选择解析接口</option>';
        
        // 动态填充接口列表和选择框
        for (const item of data) {
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
            
            // 检查接口状态
            const isActive = await checkApiStatus(item.url);
            statusIndicator.classList.add(isActive ? 'active' : 'inactive');
            
            // 添加到下拉选择框
            const option = document.createElement('option');
            option.value = item.url;
            option.textContent = item.title;
            select.appendChild(option);
        }
    })
    .catch(error => console.error('加载接口失败:', error));

// 解析按钮点击事件
document.getElementById('parse-btn').addEventListener('click', () => {
    const videoUrl = document.getElementById('video-url').value;
    const parserUrl = document.getElementById('parser-select').value;
    const videoContainer = document.getElementById('video-container');
    
    if (!videoUrl || !parserUrl) {
        alert('请填写视频地址并选择解析接口！');
        return;
    }
    
    // 构建播放页地址（假设解析接口需要拼接视频地址）
    // 例如：解析接口格式为 https://parse.example?url=VIDEO_URL
    const playUrl = `${parserUrl}?url=${encodeURIComponent(videoUrl)}`;
    
    // 嵌入视频播放器
    videoContainer.innerHTML = `
        <iframe 
            src="${playUrl}" 
            width="100%" 
            height="500" 
            frameborder="0" 
            allowfullscreen
        ></iframe>
    `;
});



