#!/usr/bin/env node

/**
 * Cloudflare Pages部署状态检查脚本
 * 使用API检查部署状态和配置
 */

import https from 'https';

// Cloudflare API配置
const CLOUDFLARE_CONFIG = {
  email: 'yigetech@gmail.com',
  apiKey: 'd70a07155b7e29ba4c0fe1ac05e976fe6852f',
  projectName: 'zinses-rechner'
};

/**
 * 发送HTTP请求
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 获取账户信息
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
    console.log(`📊 API响应状态: ${response.status}`);
    
    if (response.data.success) {
      const accounts = response.data.result;
      console.log(`✅ 找到 ${accounts.length} 个账户:`);
      accounts.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.id}) - ${account.type}`);
      });
      return accounts[0]; // 返回第一个账户
    } else {
      console.log('❌ API错误:', response.data.errors);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

/**
 * 获取Pages项目列表
 */
async function getPagesProjects(accountId) {
  console.log('\n🔍 获取Pages项目列表...');
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${accountId}/pages/projects`,
    method: 'GET',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    console.log(`📊 API响应状态: ${response.status}`);
    
    if (response.data.success) {
      const projects = response.data.result;
      console.log(`✅ 找到 ${projects.length} 个Pages项目:`);
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name}`);
        console.log(`      - 状态: ${project.latest_deployment?.stage || 'unknown'}`);
        console.log(`      - URL: https://${project.subdomain}.pages.dev`);
        console.log(`      - 创建时间: ${new Date(project.created_on).toLocaleString()}`);
      });
      return projects;
    } else {
      console.log('❌ API错误:', response.data.errors);
      return [];
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return [];
  }
}

/**
 * 获取特定项目详情
 */
async function getProjectDetails(accountId, projectName) {
  console.log(`\n🔍 获取项目 "${projectName}" 详情...`);
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
    method: 'GET',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    console.log(`📊 API响应状态: ${response.status}`);
    
    if (response.data.success) {
      const project = response.data.result;
      console.log('✅ 项目详情:');
      console.log(`   名称: ${project.name}`);
      console.log(`   子域名: ${project.subdomain}`);
      console.log(`   URL: https://${project.subdomain}.pages.dev`);
      console.log(`   生产分支: ${project.production_branch}`);
      console.log(`   创建时间: ${new Date(project.created_on).toLocaleString()}`);
      
      if (project.latest_deployment) {
        console.log('   最新部署:');
        console.log(`     - ID: ${project.latest_deployment.id}`);
        console.log(`     - 状态: ${project.latest_deployment.stage}`);
        console.log(`     - 环境: ${project.latest_deployment.environment}`);
        console.log(`     - URL: ${project.latest_deployment.url}`);
        console.log(`     - 创建时间: ${new Date(project.latest_deployment.created_on).toLocaleString()}`);
      }
      
      return project;
    } else {
      console.log('❌ API错误:', response.data.errors);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

/**
 * 获取项目部署历史
 */
async function getDeploymentHistory(accountId, projectName) {
  console.log(`\n🔍 获取项目 "${projectName}" 部署历史...`);
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    method: 'GET',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    console.log(`📊 API响应状态: ${response.status}`);
    
    if (response.data.success) {
      const deployments = response.data.result;
      console.log(`✅ 找到 ${deployments.length} 个部署记录:`);
      deployments.slice(0, 5).forEach((deployment, index) => {
        console.log(`   ${index + 1}. ${deployment.id.substring(0, 8)}...`);
        console.log(`      - 状态: ${deployment.stage}`);
        console.log(`      - 环境: ${deployment.environment}`);
        console.log(`      - URL: ${deployment.url}`);
        console.log(`      - 时间: ${new Date(deployment.created_on).toLocaleString()}`);
        if (deployment.deployment_trigger) {
          console.log(`      - 触发: ${deployment.deployment_trigger.type}`);
        }
      });
      return deployments;
    } else {
      console.log('❌ API错误:', response.data.errors);
      return [];
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return [];
  }
}

/**
 * 测试网站访问
 */
async function testWebsiteAccess(url) {
  console.log(`\n🌐 测试网站访问: ${url}`);
  
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeploymentChecker/1.0)'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`📊 HTTP状态: ${res.statusCode}`);
        console.log(`📏 响应大小: ${body.length} bytes`);
        
        if (res.statusCode === 200) {
          if (body.includes('<title>')) {
            const titleMatch = body.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) {
              console.log(`📄 页面标题: ${titleMatch[1]}`);
            }
          }
          
          if (body.includes('Zinses Rechner') || body.includes('zinses-rechner')) {
            console.log('✅ 网站内容正常，包含项目相关内容');
          } else if (body.length < 1000) {
            console.log('⚠️  网站可能显示空白或错误页面');
            console.log('📝 响应内容预览:', body.substring(0, 200));
          } else {
            console.log('✅ 网站响应正常');
          }
        } else {
          console.log(`❌ HTTP错误: ${res.statusCode}`);
        }
        
        resolve({ status: res.statusCode, size: body.length, content: body });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 访问失败:', error.message);
      resolve({ status: 0, size: 0, content: '' });
    });

    req.setTimeout(10000, () => {
      console.log('⏰ 请求超时');
      req.destroy();
      resolve({ status: 0, size: 0, content: '' });
    });

    req.end();
  });
}

/**
 * 主检查函数
 */
async function checkDeployment() {
  console.log('🚀 开始检查Cloudflare Pages部署状态...\n');
  
  try {
    // 1. 获取账户信息
    const account = await getAccountInfo();
    if (!account) {
      console.log('❌ 无法获取账户信息，请检查API凭据');
      return;
    }

    // 2. 获取Pages项目列表
    const projects = await getPagesProjects(account.id);
    
    // 3. 查找目标项目
    const targetProject = projects.find(p => p.name === CLOUDFLARE_CONFIG.projectName);
    if (!targetProject) {
      console.log(`❌ 未找到项目 "${CLOUDFLARE_CONFIG.projectName}"`);
      return;
    }

    // 4. 获取项目详情
    const projectDetails = await getProjectDetails(account.id, CLOUDFLARE_CONFIG.projectName);
    
    // 5. 获取部署历史
    const deployments = await getDeploymentHistory(account.id, CLOUDFLARE_CONFIG.projectName);
    
    // 6. 测试网站访问
    const projectUrl = `https://${targetProject.subdomain}.pages.dev`;
    await testWebsiteAccess(projectUrl);
    
    // 7. 总结
    console.log('\n📋 检查总结:');
    console.log(`✅ 项目存在: ${CLOUDFLARE_CONFIG.projectName}`);
    console.log(`✅ 访问地址: ${projectUrl}`);
    console.log(`✅ 部署数量: ${deployments.length}`);
    
    if (projectDetails && projectDetails.latest_deployment) {
      console.log(`✅ 最新部署状态: ${projectDetails.latest_deployment.stage}`);
      console.log(`✅ 部署环境: ${projectDetails.latest_deployment.environment}`);
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

// 运行检查
checkDeployment();
