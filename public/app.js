const API_BASE = window.location.origin;
let currentProject = null;
let currentModalShotIndex = 0;

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function checkServerStatus() {
    try {
        const result = await apiRequest('/health');
        document.getElementById('serverStatus').textContent = '系统运行中';
        return true;
    } catch (error) {
        document.getElementById('serverStatus').textContent = '离线';
        return false;
    }
}

async function loadProject() {
    try {
        const result = await apiRequest('/api/projects');
        if (result.success && result.data) {
            currentProject = result.data;
            updateProjectSummary();
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

function updateProjectSummary() {
    const summaryEl = document.getElementById('projectSummary');
    if (!currentProject) {
        summaryEl.innerHTML = `
            <div class="summary-info">
                <h3>暂无项目</h3>
                <p>请创建新项目或加载范例开始</p>
            </div>
        `;
        return;
    }

    const stats = {
        characters: currentProject.characters?.length || 0,
        scenes: currentProject.scenes?.length || 0,
        shots: currentProject.shots?.length || 0,
        images: currentProject.shots?.filter(s => s.output_image).length || 0
    };

    summaryEl.innerHTML = `
        <div class="summary-info">
            <h3>${currentProject.name}</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.characters}</div>
                    <div class="stat-label">角色</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.scenes}</div>
                    <div class="stat-label">场景</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.shots}</div>
                    <div class="stat-label">镜头</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.images}</div>
                    <div class="stat-label">图片</div>
                </div>
            </div>
        </div>
    `;
}

async function loadExample(templateName) {
    try {
        await apiRequest(`/api/projects/current/load-example`, {
            method: 'POST',
            body: JSON.stringify({ name: templateName })
        });
        
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-template="${templateName}"]`)?.classList.add('selected');
        
        await loadProject();
        updateShotsList();
        updateCharactersList();
        updateScenesList();
        
        showStatus('storyGenStatus', '范例加载成功！', 'success');
    } catch (error) {
        showStatus('storyGenStatus', `加载失败: ${error.message}`, 'error');
    }
}

async function createProject(name, aspectRatio) {
    try {
        const result = await apiRequest('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ name, aspect_ratio: aspectRatio })
        });
        await loadProject();
        showStatus('storyGenStatus', result.message || '项目创建成功！', 'success');
        return true;
    } catch (error) {
        showStatus('storyGenStatus', `创建失败: ${error.message}`, 'error');
        return false;
    }
}

async function addCharacter(name, description) {
    try {
        await apiRequest('/api/projects/current/characters', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
        await loadProject();
        updateCharactersList();
        return true;
    } catch (error) {
        alert(`添加角色失败: ${error.message}`);
        return false;
    }
}

async function deleteCharacter(charId) {
    if (!confirm('确定要删除这个角色吗？')) return;
    try {
        await apiRequest(`/api/projects/current/characters/${charId}`, {
            method: 'DELETE'
        });
        await loadProject();
        updateCharactersList();
    } catch (error) {
        alert(`删除失败: ${error.message}`);
    }
}

async function addScene(name, description) {
    try {
        await apiRequest('/api/projects/current/scenes', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
        await loadProject();
        updateScenesList();
        return true;
    } catch (error) {
        alert(`添加场景失败: ${error.message}`);
        return false;
    }
}

async function deleteScene(sceneId) {
    if (!confirm('确定要删除这个场景吗？')) return;
    try {
        await apiRequest(`/api/projects/current/scenes/${sceneId}`, {
            method: 'DELETE'
        });
        await loadProject();
        updateScenesList();
    } catch (error) {
        alert(`删除失败: ${error.message}`);
    }
}

async function generateShot(shotNum, customPrompt = '') {
    try {
        showStatus('storyGenStatus', '正在生成图像...', 'success');
        await apiRequest(`/api/projects/current/shots/${shotNum}/generate`, {
            method: 'POST',
            body: JSON.stringify({ custom_prompt: customPrompt })
        });
        await loadProject();
        updateShotsList();
        showStatus('storyGenStatus', '图像生成成功！', 'success');
        return true;
    } catch (error) {
        showStatus('storyGenStatus', `生成失败: ${error.message}`, 'error');
        return false;
    }
}

function updateShotsList() {
    const shotsList = document.getElementById('shotsList');
    if (!currentProject?.shots?.length) {
        shotsList.innerHTML = '<div class="no-items">暂无镜头，请先添加镜头</div>';
        return;
    }

    shotsList.innerHTML = currentProject.shots.map((shot, index) => `
        <div class="shot-card" data-shot-num="${shot.shot_number}" onclick="openShotModal(${index})">
            <div class="shot-card-image">
                ${shot.output_image 
                    ? `<img src="${shot.output_image}" alt="镜头 ${shot.shot_number}">`
                    : `<span class="no-image">📷</span>`
                }
            </div>
            <div class="shot-card-info">
                <div class="shot-card-header">
                    <span class="shot-card-number">镜头 ${shot.shot_number}</span>
                    <span class="shot-card-template">${shot.template || '未设置'}</span>
                </div>
                <div class="shot-card-description">${shot.description || '暂无描述'}</div>
                ${!shot.output_image ? `
                    <button class="primary-btn" style="width:100%;margin-top:12px;" onclick="event.stopPropagation(); generateShot(${shot.shot_number})">
                        生成图像
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function updateCharactersList() {
    const charactersList = document.getElementById('charactersList');
    if (!currentProject?.characters?.length) {
        charactersList.innerHTML = '<div class="no-items">暂无角色</div>';
        return;
    }

    charactersList.innerHTML = currentProject.characters.map(char => `
        <div class="card-item">
            <h4>${char.name}</h4>
            <p>${char.description || '暂无描述'}</p>
            <div class="card-item-actions">
                <button class="delete-btn" onclick="deleteCharacter('${char.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

function updateScenesList() {
    const scenesList = document.getElementById('scenesList');
    if (!currentProject?.scenes?.length) {
        scenesList.innerHTML = '<div class="no-items">暂无场景</div>';
        return;
    }

    scenesList.innerHTML = currentProject.scenes.map(scene => `
        <div class="card-item">
            <h4>${scene.name}</h4>
            <p>${scene.description || '暂无描述'}</p>
            <div class="card-item-actions">
                <button class="delete-btn" onclick="deleteScene('${scene.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

function openShotModal(index) {
    if (!currentProject?.shots?.length) return;
    
    currentModalShotIndex = index;
    const shot = currentProject.shots[index];
    
    document.getElementById('modalTitle').textContent = `镜头 ${shot.shot_number} - 预览`;
    
    const imageContainer = document.getElementById('modalImage');
    if (shot.output_image) {
        imageContainer.innerHTML = `<img src="${shot.output_image}" class="modal-preview-img">`;
    } else {
        imageContainer.innerHTML = '<div class="modal-no-image">暂无图像</div>';
    }
    
    document.getElementById('modalDesc').textContent = shot.description || '暂无描述';
    document.getElementById('modalChars').textContent = Array.isArray(shot.characters) ? shot.characters.join(', ') : '无';
    document.getElementById('modalScene').textContent = shot.scene_id || '未设置';
    document.getElementById('modalType').textContent = shot.template || '未设置';
    document.getElementById('modalAngle').textContent = shot.camera?.angle || '未设置';
    document.getElementById('modalPrompt').textContent = shot.generated_prompt || shot.standard_prompt || '暂无提示词';
    
    document.getElementById('modalNav').textContent = `${index + 1} / ${currentProject.shots.length}`;
    
    document.getElementById('shotModal').style.display = 'flex';
}

function closeShotModal() {
    document.getElementById('shotModal').style.display = 'none';
}

function navigateShot(direction) {
    if (!currentProject?.shots?.length) return;
    
    currentModalShotIndex += direction;
    if (currentModalShotIndex < 0) currentModalShotIndex = currentProject.shots.length - 1;
    if (currentModalShotIndex >= currentProject.shots.length) currentModalShotIndex = 0;
    
    openShotModal(currentModalShotIndex);
}

function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = type;
    el.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            el.style.display = 'none';
        }, 3000);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    loadProject();
    
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const template = card.dataset.template;
            loadExample(template);
        });
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    document.getElementById('generateStoryBtn')?.addEventListener('click', () => {
        const storyIdea = document.getElementById('storyIdeaInput').value.trim();
        if (!storyIdea) {
            alert('请输入故事创意');
            return;
        }
        
        showStatus('storyGenStatus', 'AI 正在生成故事...', 'success');
        
        setTimeout(() => {
            createProject(storyIdea.substring(0, 20), '16:9');
        }, 1000);
    });
    
    document.getElementById('addCharacterBtn')?.addEventListener('click', () => {
        const name = document.getElementById('charNameInput').value.trim();
        const description = document.getElementById('charDescInput').value.trim();
        
        if (!name) {
            alert('请输入角色名称');
            return;
        }
        
        if (addCharacter(name, description)) {
            document.getElementById('charNameInput').value = '';
            document.getElementById('charDescInput').value = '';
        }
    });
    
    document.getElementById('addSceneBtn')?.addEventListener('click', () => {
        const name = document.getElementById('sceneNameInput').value.trim();
        const description = document.getElementById('sceneDescInput').value.trim();
        
        if (!name) {
            alert('请输入场景名称');
            return;
        }
        
        if (addScene(name, description)) {
            document.getElementById('sceneNameInput').value = '';
            document.getElementById('sceneDescInput').value = '';
        }
    });
    
    document.querySelector('.shot-modal-close')?.addEventListener('click', closeShotModal);
    document.getElementById('prevShotBtn')?.addEventListener('click', () => navigateShot(-1));
    document.getElementById('nextShotBtn')?.addEventListener('click', () => navigateShot(1));
    
    document.getElementById('shotModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('shotModal')) {
            closeShotModal();
        }
    });
    
    document.getElementById('navCreateBtn')?.addEventListener('click', () => switchTab('characters'));
    document.getElementById('navArrangeBtn')?.addEventListener('click', () => switchTab('shots'));
    document.getElementById('navGenerateBtn')?.addEventListener('click', () => switchTab('shots'));
    document.getElementById('navExportBtn')?.addEventListener('click', () => {
        alert('导出功能开发中');
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeShotModal();
        } else if (e.key === 'ArrowLeft') {
            navigateShot(-1);
        } else if (e.key === 'ArrowRight') {
            navigateShot(1);
        }
    });
});
