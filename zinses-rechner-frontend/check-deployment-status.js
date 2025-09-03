#!/usr/bin/env node

/**
 * 检查特定部署的详细状态
 */

import https from 'https';

const CLOUDFLARE_CONFIG = {
  email: 'yigetech@gmail.com',
  apiKey: 'd70a07155b7e29ba4c0fe1ac05e976fe6852f',
  accountId: 'c94f5ebfe9fe77f87281ad8c7933dc8d',
  projectName: 'zinses-rechner',
  deploymentId: '74406ce9-6f05-46e2-a92a-176c0df5f9ab'
};

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

async function getDeploymentDetails() {
  console.log('🔍 获取部署详细状态...');
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects/${CLOUDFLARE_CONFIG.projectName}/deployments/${CLOUDFLARE_CONFIG.deploymentId}`,
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
      const deployment = response.data.result;
      console.log('✅ 部署详情:');
      console.log(`   ID: ${deployment.id}`);
      console.log(`   状态: ${deployment.stage || 'unknown'}`);
      console.log(`   环境: ${deployment.environment}`);
      console.log(`   URL: ${deployment.url}`);
      console.log(`   创建时间: ${new Date(deployment.created_on).toLocaleString()}`);
      console.log(`   修改时间: ${new Date(deployment.modified_on).toLocaleString()}`);
      
      if (deployment.build_config) {
        console.log('   构建配置:');
        console.log(`     - 构建命令: ${deployment.build_config.build_command || 'N/A'}`);
        console.log(`     - 输出目录: ${deployment.build_config.destination_dir || 'N/A'}`);
        console.log(`     - 根目录: ${deployment.build_config.root_dir || 'N/A'}`);
      }
      
      if (deployment.deployment_trigger) {
        console.log('   触发信息:');
        console.log(`     - 类型: ${deployment.deployment_trigger.type}`);
        if (deployment.deployment_trigger.metadata) {
          console.log(`     - 分支: ${deployment.deployment_trigger.metadata.branch || 'N/A'}`);
          console.log(`     - 提交: ${deployment.deployment_trigger.metadata.commit_hash || 'N/A'}`);
        }
      }
      
      return deployment;
    } else {
      console.log('❌ API错误:', response.data.errors);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

async function getDeploymentLogs() {
  console.log('\n🔍 获取部署日志...');
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects/${CLOUDFLARE_CONFIG.projectName}/deployments/${CLOUDFLARE_CONFIG.deploymentId}/history/logs`,
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
      const logs = response.data.result;
      console.log('✅ 部署日志:');
      if (logs.data && logs.data.length > 0) {
        logs.data.forEach((log, index) => {
          console.log(`   ${index + 1}. [${new Date(log.ts).toLocaleTimeString()}] ${log.line}`);
        });
      } else {
        console.log('   暂无日志数据');
      }
      return logs;
    } else {
      console.log('❌ API错误:', response.data.errors);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

async function checkProjectSettings() {
  console.log('\n🔍 检查项目设置...');
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/pages/projects/${CLOUDFLARE_CONFIG.projectName}`,
    method: 'GET',
    headers: {
      'X-Auth-Email': CLOUDFLARE_CONFIG.email,
      'X-Auth-Key': CLOUDFLARE_CONFIG.apiKey,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.data.success) {
      const project = response.data.result;
      console.log('✅ 项目设置:');
      console.log(`   名称: ${project.name}`);
      console.log(`   子域名: ${project.subdomain}`);
      console.log(`   生产分支: ${project.production_branch}`);
      
      if (project.build_config) {
        console.log('   构建配置:');
        console.log(`     - 构建命令: ${project.build_config.build_command || 'N/A'}`);
        console.log(`     - 输出目录: ${project.build_config.destination_dir || 'N/A'}`);
        console.log(`     - 根目录: ${project.build_config.root_dir || 'N/A'}`);
      }
      
      if (project.deployment_configs) {
        console.log('   部署配置:');
        if (project.deployment_configs.production) {
          console.log('     生产环境:');
          const prodConfig = project.deployment_configs.production;
          if (prodConfig.environment_variables) {
            console.log('       环境变量:', Object.keys(prodConfig.environment_variables));
          }
          console.log(`       兼容性日期: ${prodConfig.compatibility_date || 'N/A'}`);
        }
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

async function main() {
  console.log('🚀 开始检查部署状态...\n');
  
  // 1. 获取部署详情
  const deployment = await getDeploymentDetails();
  
  // 2. 获取部署日志
  await getDeploymentLogs();
  
  // 3. 检查项目设置
  await checkProjectSettings();
  
  // 4. 总结
  console.log('\n📋 诊断总结:');
  if (deployment) {
    console.log(`✅ 部署ID: ${deployment.id}`);
    console.log(`✅ 部署状态: ${deployment.stage || 'unknown'}`);
    console.log(`✅ 部署URL: ${deployment.url}`);
    
    if (deployment.stage === 'success') {
      console.log('🎉 部署成功！');
    } else if (deployment.stage === 'failure') {
      console.log('❌ 部署失败，请检查日志');
    } else if (deployment.stage === 'building') {
      console.log('🔨 正在构建中...');
    } else {
      console.log('⚠️  部署状态未知，可能仍在处理中');
    }
  }
}

main().catch(console.error);
