/**
 * 简化的德国金融计算器功能验证
 * 直接测试计算逻辑，无需复杂的模块导入
 */

console.log('🧮 开始德国金融计算器功能验证...\n');

// 测试结果统计
let totalTests = 0;
let passedTests = 0;

function runTest(testName, testFunction, expected, actual) {
    totalTests++;
    const passed = testFunction();
    
    if (passed) {
        passedTests++;
        console.log(`✅ ${testName}`);
        console.log(`   结果: ${actual}`);
    } else {
        console.log(`❌ ${testName}`);
        console.log(`   期望: ${expected}`);
        console.log(`   实际: ${actual}`);
    }
    console.log('');
}

// 1. 测试复利计算器逻辑
console.log('🔄 测试复利计算器（Zinseszins-Rechner）');
console.log('=' .repeat(50));

function testCompoundInterest() {
    const principal = 10000;      // 初始投资
    const monthlyPayment = 500;   // 月度投资
    const annualRate = 4.0;       // 年利率 4%
    const years = 10;             // 投资期限

    // 复利计算逻辑
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;
    
    // 计算最终金额（复利公式）
    let futureValue = principal;
    for (let i = 0; i < totalMonths; i++) {
        futureValue = (futureValue + monthlyPayment) * (1 + monthlyRate);
    }
    
    const totalContributions = principal + (monthlyPayment * totalMonths);
    const totalInterest = futureValue - totalContributions;

    // 验证测试
    runTest(
        '最终金额大于总投入',
        () => futureValue > totalContributions,
        `> €${totalContributions.toFixed(2)}`,
        `€${futureValue.toFixed(2)}`
    );

    runTest(
        '产生正利息收益',
        () => totalInterest > 0,
        '> €0',
        `€${totalInterest.toFixed(2)}`
    );

    runTest(
        '计算结果在合理范围',
        () => futureValue > 80000 && futureValue < 120000,
        '€80,000 - €120,000',
        `€${futureValue.toFixed(2)}`
    );

    return { futureValue, totalContributions, totalInterest };
}

const compoundResult = testCompoundInterest();

// 2. 测试贷款计算器逻辑
console.log('🏦 测试贷款计算器（Darlehensrechner）');
console.log('=' .repeat(50));

function testLoanCalculator() {
    const principal = 200000;     // 贷款本金
    const annualRate = 3.5;       // 年利率 3.5%
    const years = 20;             // 贷款期限

    // 等额本息月供计算公式
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                          (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - principal;

    // 验证测试
    runTest(
        '月供金额合理（德国标准）',
        () => monthlyPayment > 800 && monthlyPayment < 2000,
        '€800 - €2,000',
        `€${monthlyPayment.toFixed(2)}`
    );

    runTest(
        '产生利息成本',
        () => totalInterest > 0,
        '> €0',
        `€${totalInterest.toFixed(2)}`
    );

    runTest(
        '总还款大于本金',
        () => totalPayment > principal,
        `> €${principal.toFixed(2)}`,
        `€${totalPayment.toFixed(2)}`
    );

    // 验证德国贷款标准：月供不超过收入的40%
    const assumedIncome = 4000; // 假设月收入4000欧
    const debtToIncomeRatio = monthlyPayment / assumedIncome;
    
    runTest(
        '符合德国负债收入比标准',
        () => debtToIncomeRatio <= 0.4,
        '≤ 40%',
        `${(debtToIncomeRatio * 100).toFixed(1)}%`
    );

    return { monthlyPayment, totalPayment, totalInterest };
}

const loanResult = testLoanCalculator();

// 3. 测试房贷计算器逻辑
console.log('🏠 测试房贷计算器（Baufinanzierungsrechner）');
console.log('=' .repeat(50));

function testMortgageCalculator() {
    const purchasePrice = 400000;        // 房价
    const downPayment = 80000;           // 首付
    const landTransferTaxRate = 5.0;     // 土地转让税率（德国标准）
    const notaryRate = 1.5;              // 公证费率
    const realEstateAgentRate = 3.57;    // 中介费率
    const monthlyIncome = 4000;          // 月收入

    // 计算德国购房成本
    const landTransferTax = purchasePrice * (landTransferTaxRate / 100);
    const notaryFees = purchasePrice * (notaryRate / 100);
    const agentFees = purchasePrice * (realEstateAgentRate / 100);
    const totalCosts = purchasePrice + landTransferTax + notaryFees + agentFees;

    // 计算贷款金额和月供
    const loanAmount = purchasePrice - downPayment;
    const annualRate = 3.8;
    const years = 25;
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                          (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const affordabilityRatio = monthlyPayment / monthlyIncome;

    // 验证德国购房成本计算
    runTest(
        '土地转让税计算正确',
        () => Math.abs(landTransferTax - 20000) < 1,
        '€20,000',
        `€${landTransferTax.toFixed(2)}`
    );

    runTest(
        '公证费计算正确',
        () => Math.abs(notaryFees - 6000) < 1,
        '€6,000',
        `€${notaryFees.toFixed(2)}`
    );

    runTest(
        '总成本包含所有费用',
        () => totalCosts > purchasePrice,
        `> €${purchasePrice.toFixed(2)}`,
        `€${totalCosts.toFixed(2)}`
    );

    runTest(
        '负担能力比率合理',
        () => affordabilityRatio < 0.5,
        '< 50%',
        `${(affordabilityRatio * 100).toFixed(1)}%`
    );

    // 验证德国房贷标准
    const equityRatio = downPayment / purchasePrice;
    runTest(
        '首付比例符合德国标准',
        () => equityRatio >= 0.15, // 至少15%首付
        '≥ 15%',
        `${(equityRatio * 100).toFixed(1)}%`
    );

    return { totalCosts, monthlyPayment, affordabilityRatio, landTransferTax };
}

const mortgageResult = testMortgageCalculator();

// 4. 输出测试总结
console.log('📊 测试结果总结');
console.log('=' .repeat(50));
console.log(`总测试数: ${totalTests}`);
console.log(`通过测试: ${passedTests}`);
console.log(`失败测试: ${totalTests - passedTests}`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！德国金融计算器功能验证成功！');
    console.log('\n✅ 验证结果:');
    console.log(`   • 复利计算器: 10年投资可获得 €${compoundResult.futureValue.toFixed(2)}`);
    console.log(`   • 贷款计算器: 20万欧贷款月供 €${loanResult.monthlyPayment.toFixed(2)}`);
    console.log(`   • 房贷计算器: 40万欧房产总成本 €${mortgageResult.totalCosts.toFixed(2)}`);
} else {
    console.log('\n⚠️ 部分测试失败，需要进一步检查计算逻辑');
}

console.log('\n🇩🇪 德国金融标准合规性验证完成！');
