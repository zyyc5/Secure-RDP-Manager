const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor() {
    this.config = null;
    this.configPath = null;
  }

  /**
   * 加载配置文件
   * @param {string} env - 环境名称 (default, production)
   */
  async loadConfig(env = 'default') {
    try {
      // 尝试从环境变量获取配置文件路径
      const configDir = process.env.CONFIG_DIR || path.join(__dirname, '..', '..', 'config');
      const configFile = path.join(configDir, `${env}.json`);
      
      // 检查配置文件是否存在
      try {
        await fs.access(configFile);
        this.configPath = configFile;
      } catch (err) {
        // 如果指定环境配置文件不存在，使用默认配置
        const defaultConfigFile = path.join(configDir, 'default.json');
        await fs.access(defaultConfigFile);
        this.configPath = defaultConfigFile;
      }

      // 读取配置文件
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);

      // 应用环境变量覆盖
      this.applyEnvironmentOverrides();

      console.log(`配置文件已加载: ${this.configPath}`);
      return this.config;
    } catch (err) {
      console.error('加载配置文件失败:', err);
      throw err;
    }
  }

  /**
   * 应用环境变量覆盖
   */
  applyEnvironmentOverrides() {
    if (process.env.PORT) {
      this.config.PORT = parseInt(process.env.PORT);
    }
    if (process.env.RDP_PROXY_PORT) {
      this.config.RDP_PROXY_PORT = parseInt(process.env.RDP_PROXY_PORT);
    }
    if (process.env.RDP_PORT) {
      this.config.RDP_PORT = parseInt(process.env.RDP_PORT);
    }
    if (process.env.USERNAME) {
      this.config.USERNAME = process.env.USERNAME;
    }
    if (process.env.PASSWORD) {
      this.config.PASSWORD = process.env.PASSWORD;
    }
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键
   * @param {*} defaultValue - 默认值
   */
  get(key, defaultValue = null) {
    return this.config ? this.config[key] : defaultValue;
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键
   * @param {*} value - 配置值
   */
  set(key, value) {
    if (this.config) {
      this.config[key] = value;
    }
  }

  /**
   * 保存配置到文件
   */
  async saveConfig() {
    if (!this.configPath || !this.config) {
      throw new Error('配置未加载');
    }

    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.log(`配置已保存到: ${this.configPath}`);
    } catch (err) {
      console.error('保存配置文件失败:', err);
      throw err;
    }
  }

  /**
   * 获取所有配置
   */
  getAll() {
    return this.config;
  }
}

// 创建单例实例
const configManager = new ConfigManager();

module.exports = configManager; 