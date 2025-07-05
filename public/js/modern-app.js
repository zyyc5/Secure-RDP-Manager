// Vue 3 应用
const { createApp, ref, reactive, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
const { 
  Monitor, Refresh, Connection, VideoPlay, VideoPause, 
  User, Plus, Minus, Share, Location, Lock, Edit 
} = ElementPlusIconsVue;

// 创建应用实例
const app = createApp({
  setup() {
    // 响应式数据
    const loading = ref(true);
    const refreshing = ref(false);
    const pageData = ref({});
    const proxyTargets = ref([]);
    const currentTargetId = ref('');
    
    // 开关状态
    const rdpSwitchValue = ref(false);
    const whitelistSwitchValue = ref(false);
    const proxySwitchValue = ref(false);
    
    // 对话框状态
    const passwordDialogVisible = ref(false);
    const targetDialogVisible = ref(false);
    
    // 加载状态
    const rdpLoading = ref(false);
    const whitelistLoading = ref(false);
    const proxyLoading = ref(false);
    const passwordLoading = ref(false);
    const targetLoading = ref(false);
    
    // 表单数据
    const passwordForm = reactive({
      userName: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    const targetForm = reactive({
      name: '',
      host: '',
      port: 3389,
      description: ''
    });
    
    // 表单引用
    const passwordFormRef = ref();
    const targetFormRef = ref();
    
    // 表单验证规则
    const passwordRules = {
      userName: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    };
    
    const targetRules = {
      name: [
        { required: true, message: '请输入目标名称', trigger: 'blur' }
      ],
      host: [
        { required: true, message: '请输入主机地址', trigger: 'blur' }
      ],
      port: [
        { required: true, message: '请输入端口号', trigger: 'blur' },
        { type: 'number', min: 1, max: 65535, message: '端口号必须在1-65535之间', trigger: 'blur' }
      ]
    };
    
    // 获取页面数据
    const loadPageData = async () => {
      try {
        const response = await fetch('/api/page-data', {
          
        });
        if (response.ok) {
          pageData.value = await response.json();
          await loadProxyTargets();
        } else {
          throw new Error('获取页面数据失败');
        }
      } catch (error) {
        console.error('加载页面数据失败:', error);
        ElMessage.error('加载失败，请刷新页面重试');
      }
    };
    
    // 加载代理目标地址数据
    const loadProxyTargets = async () => {
      try {
        console.log('开始加载代理目标数据...');
        const response = await fetch('/api/proxy-targets', {
          
        });
        if (response.ok) {
          const data = await response.json();
          console.log('代理目标数据:', data);
          proxyTargets.value = data.targets;
          currentTargetId.value = data.currentTarget;
          console.log('设置后的proxyTargets:', proxyTargets.value);
          console.log('设置后的currentTargetId:', currentTargetId.value);
        } else {
          throw new Error('获取代理目标数据失败');
        }
      } catch (error) {
        console.error('加载代理目标数据失败:', error);
      }
    };
    
    // 刷新数据
    const refreshData = async () => {
      refreshing.value = true;
      try {
        await loadPageData();
        ElMessage.success('数据刷新成功');
      } catch (error) {
        ElMessage.error('数据刷新失败');
      } finally {
        refreshing.value = false;
      }
    };
    
    // RDP服务操作
    const enableRdp = async () => {
      rdpLoading.value = true;
      try {
        const response = await fetch('/api/enable', { 
          method: 'POST',
          
        });
        if (response.ok) {
          await loadPageData();
          updateSwitchStates();
          ElMessage.success('RDP服务开启成功');
        } else {
          throw new Error('开启RDP服务失败');
        }
      } catch (error) {
        console.error('开启RDP服务失败:', error);
        ElMessage.error('开启RDP服务失败');
        updateSwitchStates();
      } finally {
        rdpLoading.value = false;
      }
    };
    
    const disableRdp = async () => {
      rdpLoading.value = true;
      try {
        const response = await fetch('/api/disable', { 
          method: 'POST',
          
        });
        if (response.ok) {
          await loadPageData();
          updateSwitchStates();
          ElMessage.success('RDP服务关闭成功');
        } else {
          throw new Error('关闭RDP服务失败');
        }
      } catch (error) {
        console.error('关闭RDP服务失败:', error);
        ElMessage.error('关闭RDP服务失败');
        updateSwitchStates();
      } finally {
        rdpLoading.value = false;
      }
    };
    
    // 白名单操作
    const joinWhitelist = async () => {
      whitelistLoading.value = true;
      try {
        const response = await fetch('/api/joinwhitelist', { 
          method: 'POST',
          
        });
        if (response.ok) {
          await loadPageData();
          updateSwitchStates();
          ElMessage.success('已加入白名单');
        } else {
          throw new Error('加入白名单失败');
        }
      } catch (error) {
        console.error('加入白名单失败:', error);
        ElMessage.error('加入白名单失败');
        updateSwitchStates();
      } finally {
        whitelistLoading.value = false;
      }
    };
    
    const removeWhitelist = async () => {
      whitelistLoading.value = true;
      try {
        const response = await fetch('/api/removewhitelist', { 
          method: 'POST',
          
        });
        if (response.ok) {
          await loadPageData();
          updateSwitchStates();
          ElMessage.success('已移出白名单');
        } else {
          throw new Error('移出白名单失败');
        }
      } catch (error) {
        console.error('移出白名单失败:', error);
        ElMessage.error('移出白名单失败');
        updateSwitchStates();
      } finally {
        whitelistLoading.value = false;
      }
    };
    
    // 代理操作
    const openProxy = async () => {
      proxyLoading.value = true;
      try {
        const response = await fetch('/api/openproxy', { 
          method: 'POST',
          
        });
        if (response.ok) {
          await loadPageData();
          updateSwitchStates();
          ElMessage.success('代理开启成功');
        } else {
          throw new Error('开启代理失败');
        }
      } catch (error) {
        console.error('开启代理失败:', error);
        ElMessage.error('开启代理失败');
        updateSwitchStates();
      } finally {
        proxyLoading.value = false;
      }
    };
    
    const closeProxy = async () => {
      proxyLoading.value = true;
      try {
        const response = await fetch('/api/closeproxy', { 
          method: 'POST',
          
        });
        if (response.ok) {
          await loadPageData();
          updateSwitchStates();
          ElMessage.success('代理关闭成功');
        } else {
          throw new Error('关闭代理失败');
        }
      } catch (error) {
        console.error('关闭代理失败:', error);
        ElMessage.error('关闭代理失败');
        updateSwitchStates();
      } finally {
        proxyLoading.value = false;
      }
    };
    
    // 代理目标操作
    const setCurrentTarget = async (targetId) => {
      try {
        const response = await fetch(`/api/proxy-targets/${targetId}/set-current`, {
          method: 'POST',
          
        });
        
        if (response.ok) {
          currentTargetId.value = targetId;
          await loadProxyTargets();
          ElMessage.success('目标地址设置成功');
        } else {
          const error = await response.json();
          throw new Error(error.error);
        }
      } catch (error) {
        console.error('设置目标地址失败:', error);
        ElMessage.error('设置失败: ' + error.message);
      }
    };
    
    const deleteTarget = async (targetId) => {
      try {
        await ElMessageBox.confirm('确定要删除这个目标地址吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        const response = await fetch(`/api/proxy-targets/${targetId}`, {
          method: 'DELETE',
          
        });
        
        if (response.ok) {
          await loadProxyTargets();
          ElMessage.success('删除成功');
        } else {
          const error = await response.json();
          throw new Error(error.error);
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除目标地址失败:', error);
          ElMessage.error('删除失败: ' + error.message);
        }
      }
    };
    
    // 密码修改
    const showPasswordDialog = () => {
      passwordForm.userName = pageData.value.userName || '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      passwordDialogVisible.value = true;
    };
    
    const submitPasswordChange = async () => {
      if (!passwordFormRef.value) return;
      
      try {
        await passwordFormRef.value.validate();
        passwordLoading.value = true;
        
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(passwordForm)
        });
        
        if (response.ok) {
          ElMessage.success('密码修改成功');
          passwordDialogVisible.value = false;
        } else {
          const error = await response.json();
          throw new Error(error.error);
        }
      } catch (error) {
        if (error.message) {
          ElMessage.error('密码修改失败: ' + error.message);
        }
      } finally {
        passwordLoading.value = false;
      }
    };
    
    // 目标地址管理
    const showTargetDialog = () => {
      targetForm.name = '';
      targetForm.host = '';
      targetForm.port = 3389;
      targetForm.description = '';
      targetDialogVisible.value = true;
    };
    
    const submitTargetAdd = async () => {
      if (!targetFormRef.value) return;
      
      try {
        await targetFormRef.value.validate();
        targetLoading.value = true;
        
        const response = await fetch('/api/proxy-targets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(targetForm)
        });
        
        if (response.ok) {
          await loadProxyTargets();
          ElMessage.success('目标地址添加成功');
          targetDialogVisible.value = false;
        } else {
          const error = await response.json();
          throw new Error(error.error);
        }
      } catch (error) {
        if (error.message) {
          ElMessage.error('添加失败: ' + error.message);
        }
      } finally {
        targetLoading.value = false;
      }
    };
    
    // 状态类型判断
    const getRdpStatusType = () => {
      // 只在Windows系统上判断RDP状态
      if (!pageData.value.isWindows) return 'info';
      
      const status = pageData.value.rdpStatus;
      if (status === '已启用') return 'success';
      if (status === '已关闭') return 'danger';
      return 'info';
    };
    
    const getWhitelistStatusType = () => {
      const status = pageData.value.whiteListStatus;
      if (status?.includes('已加入白名单')) return 'success';
      if (status?.includes('RDP连接有效期')) return 'warning';
      return 'info';
    };
    
    const getProxyStatusType = () => {
      const status = pageData.value.proxyStatus;
      if (status === '开启') return 'success';
      if (status === '关闭') return 'danger';
      if (status === '未安装') return 'info';
      return 'info';
    };
    
    // 获取当前目标名称
    const getCurrentTargetName = () => {
      const currentTarget = proxyTargets.value.find(t => t.id === currentTargetId.value);
      console.log('getCurrentTargetName called, proxyTargets:', proxyTargets.value, 'currentTargetId:', currentTargetId.value);
      return currentTarget ? currentTarget.name : '未设置';
    };
    
    // 开关切换函数
    const toggleRdp = async (value) => {
      console.log('切换RDP开关:', value);
      // 只在Windows系统上执行RDP操作
      if (!pageData.value.isWindows) {
        console.log('非Windows系统，跳过RDP操作');
        return;
      }
      
      try {
        if (value) {
          await enableRdp();
        } else {
          await disableRdp();
        }
      } catch (error) {
        console.error('RDP开关切换失败:', error);
        // 操作失败时恢复开关状态
        updateSwitchStates();
      }
    };
    
    const toggleWhitelist = async (value) => {
      console.log('切换白名单开关:', value);
      try {
        if (value) {
          await joinWhitelist();
        } else {
          await removeWhitelist();
        }
      } catch (error) {
        console.error('白名单开关切换失败:', error);
        // 操作失败时恢复开关状态
        updateSwitchStates();
      }
    };
    
    const toggleProxy = async (value) => {
      console.log('切换代理开关:', value);
      try {
        if (value) {
          await openProxy();
        } else {
          await closeProxy();
        }
      } catch (error) {
        console.error('代理开关切换失败:', error);
        // 操作失败时恢复开关状态
        updateSwitchStates();
      }
    };
    
    // 状态文本函数
    const getRdpStatusText = () => {
      // 只在Windows系统上显示RDP状态
      if (!pageData.value.isWindows) return '';
      
      const status = pageData.value.rdpStatus;
      if (status === '已启用') return 'RDP服务正在运行中';
      if (status === '已关闭') return 'RDP服务已停止';
      return 'RDP服务状态未知';
    };
    
    const getWhitelistStatusText = () => {
      const status = pageData.value.whiteListStatus;
      if (status?.includes('已加入白名单')) return '当前IP已在白名单中';
      if (status?.includes('RDP连接有效期')) return '当前IP不在白名单中（临时访问）';
      return '白名单状态未知';
    };
    
    const getProxyStatusText = () => {
      const status = pageData.value.proxyStatus;
      if (status === '开启') return 'FRP代理正在运行中';
      if (status === '关闭') return 'FRP代理已停止';
      if (status === '未安装') return 'FRP代理未安装';
      return 'FRP代理状态未知';
    };
    
    // 更新开关状态
    const updateSwitchStates = () => {
      const rdpStatus = pageData.value.rdpStatus;
      const whitelistStatus = pageData.value.whiteListStatus;
      const proxyStatus = pageData.value.proxyStatus;
      const isWindows = pageData.value.isWindows;
      
      console.log('更新开关状态:', {
        rdpStatus,
        whitelistStatus,
        proxyStatus,
        isWindows
      });
      
      // RDP开关状态 - 仅在Windows系统上更新
      if (isWindows) {
        const rdpEnabled = rdpStatus === '已启用';
        rdpSwitchValue.value = rdpEnabled;
        console.log('RDP开关状态:', rdpEnabled);
      }
      
      // 白名单开关状态 - API返回包含 "已加入白名单" 的字符串
      const whitelistEnabled = whitelistStatus?.includes('已加入白名单');
      whitelistSwitchValue.value = whitelistEnabled;
      console.log('白名单开关状态:', whitelistEnabled);
      
      // 代理开关状态 - API返回 "开启" 或 "关闭"
      const proxyEnabled = proxyStatus === '开启';
      proxySwitchValue.value = proxyEnabled;
      console.log('代理开关状态:', proxyEnabled);
    };
    
    // 页面初始化
    onMounted(async () => {
      console.log('Vue应用已挂载，开始加载数据...');
      await loadPageData();
      updateSwitchStates();
      loading.value = false;
      console.log('页面数据加载完成，proxyTargets:', proxyTargets.value);
      console.log('当前目标ID:', currentTargetId.value);
      console.log('初始开关状态:', {
        rdp: rdpSwitchValue.value,
        whitelist: whitelistSwitchValue.value,
        proxy: proxySwitchValue.value
      });
      
      // 添加一个定时器来检查数据状态
      setTimeout(() => {
        console.log('5秒后检查数据状态:');
        console.log('proxyTargets.length:', proxyTargets.value.length);
        console.log('proxyTargets内容:', proxyTargets.value);
        console.log('currentTargetId:', currentTargetId.value);
        console.log('当前开关状态:', {
          rdp: rdpSwitchValue.value,
          whitelist: whitelistSwitchValue.value,
          proxy: proxySwitchValue.value
        });
      }, 5000);
    });
    
    return {
      // 数据
      loading,
      refreshing,
      pageData,
      proxyTargets,
      currentTargetId,
      passwordDialogVisible,
      targetDialogVisible,
      rdpLoading,
      whitelistLoading,
      proxyLoading,
      passwordLoading,
      targetLoading,
      passwordForm,
      targetForm,
      passwordFormRef,
      targetFormRef,
      passwordRules,
      targetRules,
      
      // 开关状态
      rdpSwitchValue,
      whitelistSwitchValue,
      proxySwitchValue,
      
      // 方法
      refreshData,
      enableRdp,
      disableRdp,
      joinWhitelist,
      removeWhitelist,
      openProxy,
      closeProxy,
      setCurrentTarget,
      deleteTarget,
      showPasswordDialog,
      submitPasswordChange,
      showTargetDialog,
      submitTargetAdd,
      getRdpStatusType,
      getWhitelistStatusType,
      getProxyStatusType,
      getCurrentTargetName,
      
      // 开关切换函数
      toggleRdp,
      toggleWhitelist,
      toggleProxy,
      
      // 状态文本函数
      getRdpStatusText,
      getWhitelistStatusText,
      getProxyStatusText
    };
  }
});

// 使用Element Plus
app.use(ElementPlus);

// 注册图标
app.component('Monitor', Monitor);
app.component('Refresh', Refresh);
app.component('Connection', Connection);
app.component('VideoPlay', VideoPlay);
app.component('VideoPause', VideoPause);
app.component('User', User);
app.component('Plus', Plus);
app.component('Minus', Minus);
app.component('Share', Share);
app.component('Location', Location);
app.component('Lock', Lock);
app.component('Edit', Edit);

// 挂载应用
app.mount('#app'); 