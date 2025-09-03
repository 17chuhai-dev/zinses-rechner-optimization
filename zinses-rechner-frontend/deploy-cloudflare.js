#!/usr/bin/env node

/**
 * Cloudflare Pages部署脚本
 * 使用Cloudflare API部署Zinses Rechner应用
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudflare API配置
const CLOUDFLARE_CONFIG = {
  email: 'yigetech@gmail.com',
  apiKey: 'd70a07155b7e29ba4c0fe1ac05e976fe6852f',
  accountId: null, // 将通过API获取
  projectName: 'zinses-rechner',
  domain: 'zinses-rechner.de'
};

// API基础URL
const API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * 发送HTTP请求
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(`API Error: ${JSON.stringify(response.errors)}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 获取Cloudflare账户信息
 */
async function getAccountInfo() {
  console.log('🔍 获取Cloudflare账户信息...');

  const options = {
    hostname: 'api.cloudflare.com',
    path: '/client/v4/accounts',
    method: 'GET',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    const account = response.result.find(acc => acc.name.includes('yigetech') || acc.type === 'standard');

    if (!account) {
      throw new Error('未找到合适的Cloudflare账户');
    }

    CLOUDFLARE_CONFIG.accountId = account.id;
    console.log(`✅ 账户信息获取成功: ${account.name} (${account.id})`);
    return account;
  } catch (error) {
    console.error('❌ 获取账户信息失败:', error.message);
    throw error;
  }
}

/**
 * 检查Pages项目是否存在
 */
async function checkPagesProject() {
  console.log('🔍 检查Pages项目...');

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects`,
    method: 'GET',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    const project = response.result.find(p => p.name === CLOUDFLARE_CONFIG.projectName);

    if (project) {
      console.log(`✅ Pages项目已存在: ${project.name}`);
      return project;
    } else {
      console.log('📝 Pages项目不存在，将创建新项目');
      return null;
    }
  } catch (error) {
    console.error('❌ 检查Pages项目失败:', error.message);
    return null;
  }
}

/**
 * 创建Pages项目
 */
async function createPagesProject() {
  console.log('🚀 创建Pages项目...');

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects`,
    method: 'POST',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  const projectData = {
    name: CLOUDFLARE_CONFIG.projectName,
    production_branch: 'main',
    build_config: {
      build_command: 'npm run build',
      destination_dir: 'dist',
      root_dir: '/',
      web_analytics_tag: null,
      web_analytics_token: null
    },
    deployment_configs: {
      production: {
        environment_variables: {
          NODE_ENV: 'production',
          VITE_APP_ENVIRONMENT: 'production'
        },
        compatibility_date: '2024-01-15',
        compatibility_flags: []
      },
      preview: {
        environment_variables: {
          NODE_ENV: 'preview',
          VITE_APP_ENVIRONMENT: 'preview'
        },
        compatibility_date: '2024-01-15',
        compatibility_flags: []
      }
    }
  };

  try {
    const response = await makeRequest(options, projectData);
    console.log(`✅ Pages项目创建成功: ${response.result.name}`);
    return response.result;
  } catch (error) {
    console.error('❌ 创建Pages项目失败:', error.message);
    throw error;
  }
}

/**
 * 压缩dist目录
 */
function createDeploymentArchive() {
  console.log('📦 创建部署包...');

  const distPath = path.join(__dirname, 'dist');
  const archivePath = path.join(__dirname, 'deployment.tar.gz');

  if (!fs.existsSync(distPath)) {
    throw new Error('dist目录不存在，请先运行构建命令');
  }

  try {
    // 删除旧的压缩包
    if (fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath);
    }

    // 创建tar.gz压缩包
    execSync(`cd ${distPath} && tar -czf ${archivePath} .`, { stdio: 'inherit' });

    console.log(`✅ 部署包创建成功: ${archivePath}`);
    return archivePath;
  } catch (error) {
    console.error('❌ 创建部署包失败:', error.message);
    throw error;
  }
}

/**
 * 上传部署文件
 */
async function uploadDeployment(projectName) {
  console.log('⬆️  上传部署文件...');

  const archivePath = createDeploymentArchive();
  const { default: FormData } = await import('form-data');
  const form = new FormData();

  // 添加文件到表单
  form.append('file', fs.createReadStream(archivePath));

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects/${projectName}/deployments`,
    method: 'POST',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      ...form.getHeaders()
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.success) {
            console.log(`✅ 部署上传成功: ${response.result.url}`);
            resolve(response.result);
          } else {
            reject(new Error(`Upload Error: ${JSON.stringify(response.errors)}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * 配置自定义域名
 */
async function setupCustomDomain(projectName) {
  console.log('🌐 配置自定义域名...');

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects/${projectName}/domains`,
    method: 'POST',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  const domainData = {
    name: CLOUDFLARE_CONFIG.domain
  };

  try {
    const response = await makeRequest(options, domainData);
    console.log(`✅ 自定义域名配置成功: ${CLOUDFLARE_CONFIG.domain}`);
    return response.result;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  域名已存在: ${CLOUDFLARE_CONFIG.domain}`);
      return null;
    }
    console.error('❌ 配置自定义域名失败:', error.message);
    throw error;
  }
}

/**
 * 主部署函数
 */
async function deploy() {
  console.log('🚀 开始部署Zinses Rechner到Cloudflare Pages...\n');

  try {
    // 1. 获取账户信息
    await getAccountInfo();

    // 2. 检查项目是否存在
    let project = await checkPagesProject();

    // 3. 如果项目不存在，创建新项目
    if (!project) {
      project = await createPagesProject();
    }

    // 4. 上传部署文件
    const deployment = await uploadDeployment(project.name);

    // 5. 配置自定义域名
    await setupCustomDomain(project.name);

    // 6. 显示部署结果
    console.log('\n🎉 部署完成！');
    console.log('📊 部署信息:');
    console.log(`   项目名称: ${project.name}`);
    console.log(`   部署URL: ${deployment.url}`);
    console.log(`   自定义域名: https://${CLOUDFLARE_CONFIG.domain}`);
    console.log(`   部署ID: ${deployment.id}`);
    console.log(`   部署时间: ${new Date().toLocaleString()}`);

    // 清理临时文件
    const archivePath = path.join(__dirname, 'deployment.tar.gz');
    if (fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath);
      console.log('🧹 清理临时文件完成');
    }

  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
}

/**
 * 检查依赖
 */
function checkDependencies() {
  console.log('🔍 检查部署依赖...');

  // 检查Node.js版本
  const nodeVersion = process.version;
  console.log(`Node.js版本: ${nodeVersion}`);

  // 检查必要的命令
  try {
    execSync('tar --version', { stdio: 'ignore' });
    console.log('✅ tar命令可用');
  } catch (error) {
    throw new Error('tar命令不可用，请安装tar工具');
  }

  // 检查dist目录
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('dist目录不存在，请先运行: npm run build');
  }

  console.log('✅ 依赖检查通过\n');
}

// 主程序入口
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDependencies();
  deploy().catch(console.error);
}

export { deploy, checkDependencies };
