let pageData = {};
let proxyTargets = [];
let currentTargetId = '';

// 页面加载时获取数据
async function loadPageData() {
  try {
    const response = await fetch('/api/page-data');
    if (response.ok) {
      pageData = await response.json();
      await loadProxyTargets();
      renderPage();
    } else {
      throw new Error('获取页面数据失败');
    }
  } catch (error) {
    console.error('加载页面数据失败:', error);
    document.getElementById('loading').innerHTML = '加载失败，请刷新页面重试';
  }
}

// 加载代理目标地址数据
async function loadProxyTargets() {
  try {
    const response = await fetch('/api/proxy-targets');
    if (response.ok) {
      const data = await response.json();
      proxyTargets = data.targets;
      currentTargetId = data.currentTarget;
    } else {
      throw new Error('获取代理目标数据失败');
    }
  } catch (error) {
    console.error('加载代理目标数据失败:', error);
  }
}

// 渲染页面内容
function renderPage() {
  // 隐藏加载提示，显示内容
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';

  // 渲染RDP状态
  if (pageData.rdpStatus) {
    document.getElementById('rdpSection').style.display = 'block';
    document.getElementById('rdpStatus').textContent = pageData.rdpStatus;
    document.getElementById('rdpEnableBtn').style.display = pageData.rdpEnableDisabled;
    document.getElementById('rdpDisableBtn').style.display = pageData.rdpDisableDisabled;
  }

  // 渲染IP和白名单状态
  document.getElementById('ipStatus').textContent = `${pageData.IP} (${pageData.whiteListStatus})`;
  document.getElementById('joinWhiteListBtn').style.display = pageData.whiteListJoinDisabled;
  document.getElementById('removeWhiteListBtn').style.display = pageData.whiteListRemoveDisabled;

  // 渲染代理状态
  document.getElementById('proxyStatus').textContent = pageData.proxyStatus;
  document.getElementById('openProxyBtn').style.display = pageData.proxyOpenDisabled;
  document.getElementById('closeProxyBtn').style.display = pageData.proxyCloseDisabled;

  // 渲染代理目标地址
  renderProxyTargets();

  // 设置用户名
  document.getElementById('userNameInput').value = pageData.userName;
}

// 渲染代理目标地址列表
function renderProxyTargets() {
  const currentTarget = proxyTargets.find(t => t.id === currentTargetId);
  document.getElementById('currentTarget').textContent = currentTarget ? currentTarget.name : '未设置';

  const targetsList = document.getElementById('targetsList');
  targetsList.innerHTML = '';

  if (proxyTargets.length === 0) {
    targetsList.innerHTML = '<p style="color: #666; text-align: center;">暂无目标地址</p>';
    return;
  }

  proxyTargets.forEach(target => {
    const targetItem = document.createElement('div');
    targetItem.className = `target-item ${target.id === currentTargetId ? 'current' : ''}`;
    
    targetItem.innerHTML = `
      ${target.id === currentTargetId ? '<span class="current-badge">当前</span>' : ''}
      <h4>${target.name}</h4>
      <div class="target-info">
        <div>地址: ${target.host}:${target.port}</div>
        ${target.description ? `<div>描述: ${target.description}</div>` : ''}
      </div>
      <div class="target-actions">
        ${target.id !== currentTargetId ? 
          `<button onclick="setCurrentTarget('${target.id}')" class="btn-secondary">设为当前</button>` : 
          '<button disabled class="btn-secondary">当前目标</button>'
        }
        <button onclick="deleteTarget('${target.id}')" class="btn-danger">删除</button>
      </div>
    `;
    
    targetsList.appendChild(targetItem);
  });
}

// 设置当前代理目标
async function setCurrentTarget(targetId) {
  try {
    const response = await fetch(`/api/proxy-targets/${targetId}/set-current`, {
      method: 'POST'
    });
    
    if (response.ok) {
      currentTargetId = targetId;
      renderProxyTargets();
      alert('目标地址设置成功！');
    } else {
      const error = await response.json();
      alert('设置失败: ' + error.error);
    }
  } catch (error) {
    console.error('设置目标地址失败:', error);
    alert('设置失败，请稍后重试');
  }
}

// 删除代理目标
async function deleteTarget(targetId) {
  if (!confirm('确定要删除这个目标地址吗？')) {
    return;
  }

  try {
    const response = await fetch(`/api/proxy-targets/${targetId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadProxyTargets();
      renderProxyTargets();
      alert('删除成功！');
    } else {
      const error = await response.json();
      alert('删除失败: ' + error.error);
    }
  } catch (error) {
    console.error('删除目标地址失败:', error);
    alert('删除失败，请稍后重试');
  }
}

// 刷新页面数据
async function refreshPageData() {
  await loadPageData();
}

// 弹窗相关函数
function showModal() {
  document.getElementById("passwordModal").style.display = "block";
  document.getElementById("errorMsg").textContent = "";
}

function hideModal() {
  document.getElementById("passwordModal").style.display = "none";
}

// 代理目标地址弹窗相关函数
function showTargetModal() {
  document.getElementById("targetModal").style.display = "block";
  document.getElementById("targetErrorMsg").textContent = "";
  // 清空表单
  document.getElementById("targetForm").reset();
}

function hideTargetModal() {
  document.getElementById("targetModal").style.display = "none";
}

// 密码修改表单处理
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const userName = form.querySelector('[name="userName"]').value;
    const newPassword = form.querySelector('[name="newPassword"]').value;
    const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

    const data = {
      userName,
      newPassword,
      confirmPassword
    };

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      const text = await response.text();

      if (response.ok) {
        alert(text);
        hideModal();
        // 强制重新登录
        window.location.reload(true);
      } else {
        document.getElementById("errorMsg").textContent = text;
      }
    } catch (error) {
      document.getElementById("errorMsg").textContent = error.message || "修改失败，请稍后重试";
    }
  });

  // 代理目标地址表单处理
  document.getElementById("targetForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]').value;
    const host = form.querySelector('[name="host"]').value;
    const port = form.querySelector('[name="port"]').value;
    const description = form.querySelector('[name="description"]').value;

    const data = {
      name,
      host,
      port: parseInt(port),
      description
    };

    try {
      const response = await fetch("/api/proxy-targets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('添加成功！');
        hideTargetModal();
        await loadProxyTargets();
        renderProxyTargets();
      } else {
        const error = await response.json();
        document.getElementById("targetErrorMsg").textContent = error.error;
      }
    } catch (error) {
      document.getElementById("targetErrorMsg").textContent = error.message || "添加失败，请稍后重试";
    }
  });

  // 页面加载完成后获取数据
  loadPageData();

  // 定期刷新数据（可选）
  setInterval(refreshPageData, 30000); // 每30秒刷新一次
}); 