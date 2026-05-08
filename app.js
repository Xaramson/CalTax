// USER AUTHENTICATION
let currentUser = null;

function getCurrentUser() {
    if (!currentUser) {
        const userData = localStorage.getItem('calTax_user');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
    }
    return currentUser;
}

function setCurrentUser(username) {
    const userId = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    currentUser = { id: userId, name: username };
    localStorage.setItem('calTax_user', JSON.stringify(currentUser));
    updateUIForUser();
}

function logout() {
    localStorage.removeItem('calTax_user');
    currentUser = null;
    location.reload();
}

function updateUIForUser() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-info').style.display = 'inline';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('loginModal').style.display = 'none';
    } else {
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
    }
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    if (username) {
        setCurrentUser(username);
    } else {
        showMantaToast('Please enter a username', 'error');
    }
}

// FEATURE 1 — EMAIL NOTIFICATIONS (replaces browser Notification)

async function sendMantaEmailNotification(toEmail, title, date, remindText) {
    const subject = `calTax Reminder: ${title}`;
    const body = `Reminder: ${title} due on ${date}. You asked to be reminded ${remindText}.`;

    try {
        const response = await fetch('http://localhost:3000/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: toEmail, subject, body })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

// TOAST HELPER
function showMantaToast(message, type = 'success') {
    document.querySelector('.manta-toast')?.remove();

    const colors = {
        success: 'var(--success)',
        error:   'var(--error)',
        warning: 'var(--warning)'
    };

    const toast = document.createElement('div');
    toast.className = 'manta-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${colors[type] || colors.success};
        color: #fff;
        padding: 0.875rem 1.25rem;
        border-radius: var(--radius);
        font-size: 0.9rem;
        font-family: 'Source Sans 3', sans-serif;
        box-shadow: var(--shadow-elevated);
        z-index: 9999;
        max-width: 380px;
        line-height: 1.4;
        animation: toastIn 0.25s ease-out;
    `;

    if (!document.getElementById('toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'toast-keyframes';
        style.textContent = `
            @keyframes toastIn {
                from { opacity: 0; transform: translateY(12px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

// Saves a completed tax calculation to your MantaHQ data table.

async function saveTaxCalculation(type, grossIncome, taxPayable, effectiveRate) {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const response = await fetch('/api/save-calculation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                gross_income: grossIncome,
                tax_payable: taxPayable,
                effective_rate: effectiveRate,
                userId: user.id
            })
        });
        const data = await response.json();
        return data.success;
    } catch (err) {
        console.warn('Save failed:', err);
        return false;
    }
}

// Fetches the last 5 calculations from MantaHQ and renders them.

async function loadCalcHistory() {
    const user = getCurrentUser();
    if (!user) return;

    const container = document.getElementById('calc-history-list');
    if (!container) return;

    container.innerHTML = '<p>Loading history…</p>';

    try {
        const response = await fetch(`/api/history?userId=${encodeURIComponent(user.id)}`);
        const data = await response.json();
        const records = Array.isArray(data.records) ? data.records : [];

        if (records.length === 0) {
            container.innerHTML = '<p>No calculations saved yet.</p>';
            return;
        }

        container.innerHTML = '';
        records.forEach(rec => {
            const type = rec.type || 'Calculation';
            const grossIncome = parseFloat(rec.grossIncome) || 0;
            const taxPayable = parseFloat(rec.taxPayable) || 0;
            const effectiveRate = rec.effectiveRate || '—';
            const dateValue = rec.calculatedAt || rec.createdAt || new Date().toISOString();
            const date = new Date(dateValue).toLocaleDateString('en-NG');

            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-item-title">
                    <strong>${type}</strong>
                    <span>${date}</span>
                </div>
                <div class="history-item-meta">
                    <span>Tax: ${formatCurrency(taxPayable)}</span>
                    <span>Gross: ${formatCurrency(grossIncome)}</span>
                    <span>Rate: ${effectiveRate}</span>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        container.innerHTML = '<p>Could not load history. Is the proxy server running?</p>';
        console.error(err);
    }
}


// Initialize Lucide icons
lucide.createIcons();

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
    themeToggle.innerHTML = '<i data-lucide="sun"></i>';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    lucide.createIcons();
});

// Tab switching
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.calculator-section');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
            
        const target = tab.dataset.tab;
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(`${target}-section`).classList.add('active');
    });
});

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Personal Tax Calculator
async function calculatePersonalTax() {
    const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
    const housingAllowance = parseFloat(document.getElementById('housingAllowance').value) || 0;
    const transportAllowance = parseFloat(document.getElementById('transportAllowance').value) || 0;
    const otherAllowances = parseFloat(document.getElementById('otherAllowances').value) || 0;
    const bonus = parseFloat(document.getElementById('bonus').value) || 0;
    const autoDeductions = document.getElementById('autoDeductions').checked;
    const pensionPercent = parseFloat(document.getElementById('pensionPercent').value) || 8.33;
    const lifeInsurance = parseFloat(document.getElementById('lifeInsurance').value) || 0;
    const professionalSub = parseFloat(document.getElementById('professionalSub').value) || 0;

    // Calculate gross income
    const grossIncome = basicSalary + housingAllowance + transportAllowance + otherAllowances + bonus;

// Calculate deductions
let totalDeductions = 0;
    
if (autoDeductions) {
    // Consolidated Relief Allowance: 20% of gross or ₦200,000, whichever is higher
    const cra = Math.max(grossIncome * 0.2, 200000);
        
    // NHF: 2.5% of basic salary
    const nhf = basicSalary * 0.025;
        
    // NSITF: 1% of basic salary
    const nsitf = basicSalary * 0.01;
        
    // Pension: up to 8.33% of basic salary
    const pension = Math.min(basicSalary * (pensionPercent / 100), basicSalary * 0.0833);
        
    totalDeductions = cra + nhf + nsitf + pension;
}

// Add manual deductions
const cappedLifeInsurance = Math.min(lifeInsurance, 50000);
const cappedProfessionalSub = Math.min(professionalSub, 10000);
totalDeductions += cappedLifeInsurance + cappedProfessionalSub;

// Calculate taxable income
const taxableIncome = Math.max(grossIncome - totalDeductions, 0);

// Calculate tax using 2025 brackets
const brackets = [
    { limit: 300000, rate: 0.07 },
    { limit: 600000, rate: 0.11 },
    { limit: 1100000, rate: 0.15 },
    { limit: 1600000, rate: 0.19 },
    { limit: 3200000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 }
];

let tax = 0;
let remainingIncome = taxableIncome;
let previousLimit = 0;
const breakdown = [];

for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const bracketSize = bracket.limit - previousLimit;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
        
        if (taxableInBracket > 0) {
            const taxInBracket = taxableInBracket * bracket.rate;
            tax += taxInBracket;
            breakdown.push({
                range: i === brackets.length - 1 ? `Above ₦${formatNumber(previousLimit)}` : 
                        `₦${formatNumber(previousLimit)} - ₦${formatNumber(bracket.limit)}`,
                rate: (bracket.rate * 100).toFixed(0) + '%',
                amount: taxableInBracket,
                tax: taxInBracket
            });
            remainingIncome -= taxableInBracket;
        }
        previousLimit = bracket.limit;
    }

    // Update results
    document.getElementById('personal-total-tax').textContent = formatCurrency(tax);
    document.getElementById('personal-taxable-income').textContent = formatCurrency(taxableIncome);
    const effectiveRate = grossIncome > 0 ? (tax / grossIncome * 100).toFixed(1) : 0;
    document.getElementById('personal-effective-rate').textContent = effectiveRate + '%';
    document.getElementById('personal-monthly-tax').textContent = formatCurrency(tax / 12);

    // Update breakdown
    let breakdownHTML = `
        <div class="breakdown-section">
            <h4>Income Summary</h4>
            <div class="breakdown-item">
                <span class="label">Basic Salary</span>
                <span class="value">${formatCurrency(basicSalary)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">Housing Allowance</span>
                <span class="value">${formatCurrency(housingAllowance)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">Transport Allowance</span>
                <span class="value">${formatCurrency(transportAllowance)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">Other Allowances</span>
                <span class="value">${formatCurrency(otherAllowances)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">Bonus/Incentives</span>
                <span class="value">${formatCurrency(bonus)}</span>
            </div>
            <div class="breakdown-item total-row">
                <span class="label"><strong>Gross Annual Income</strong></span>
                <span class="value"><strong>${formatCurrency(grossIncome)}</strong></span>
            </div>
        </div>
        
        <div class="breakdown-section">
            <h4>Deductions Applied</h4>`;

    if (autoDeductions) {
        const cra = Math.max(grossIncome * 0.2, 200000);
        const nhf = basicSalary * 0.025;
        const nsitf = basicSalary * 0.01;
        const pension = Math.min(basicSalary * (pensionPercent / 100), basicSalary * 0.0833);
        
        breakdownHTML += `
            <div class="breakdown-item">
                <span class="label">Consolidated Relief Allowance (20% or ₦200k min)</span>
                <span class="value">-${formatCurrency(cra)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">NHF (2.5% of basic salary)</span>
                <span class="value">-${formatCurrency(nhf)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">NSITF (1% of basic salary)</span>
                <span class="value">-${formatCurrency(nsitf)}</span>
            </div>
            <div class="breakdown-item">
                <span class="label">Pension (${pensionPercent}% of basic salary)</span>
                <span class="value">-${formatCurrency(pension)}</span>
            </div>`;
    }

    if (cappedLifeInsurance > 0) {
        breakdownHTML += `
            <div class="breakdown-item">
                <span class="label">Life Insurance Premium (max ₦50,000)</span>
                <span class="value">-${formatCurrency(cappedLifeInsurance)}</span>
            </div>`;
    }

    if (cappedProfessionalSub > 0) {
        breakdownHTML += `
            <div class="breakdown-item">
                <span class="label">Professional Subscription (max ₦10,000)</span>
                <span class="value">-${formatCurrency(cappedProfessionalSub)}</span>
            </div>`;
    }

    breakdownHTML += `
            <div class="breakdown-item total-row">
                <span class="label"><strong>Total Deductions</strong></span>
                <span class="value"><strong>-${formatCurrency(totalDeductions)}</strong></span>
            </div>
        </div>
        
        <div class="breakdown-section">
            <h4>Tax Calculation</h4>
            <div class="breakdown-item total-row">
                <span class="label"><strong>Taxable Income</strong></span>
                <span class="value"><strong>${formatCurrency(taxableIncome)}</strong></span>
            </div>`;

    breakdown.forEach(item => {
        breakdownHTML += `
            <div class="breakdown-item">
                <span class="label">Tax on ${item.range} at ${item.rate}</span>
                <span class="value">${formatCurrency(item.tax)}</span>
            </div>`;
    });

    breakdownHTML += `
            <div class="breakdown-item total-row final-total">
                <span class="label"><strong>Total Income Tax</strong></span>
                <span class="value"><strong>${formatCurrency(tax)}</strong></span>
            </div>
        </div>`;

    document.getElementById('personal-breakdown').innerHTML = breakdownHTML;

    // Show results
    document.getElementById('personal-results').classList.add('show');

    // Save to MantaHQ and load history
    await saveTaxCalculation('personal', grossIncome, tax, effectiveRate + '%');
    loadCalcHistory();
}

// Format number for display
function formatNumber(num) {
    return new Intl.NumberFormat('en-NG').format(Math.round(num));
}

// Corporate Tax Calculator
async function calculateCorporateTax() {
    const companyType = document.getElementById('companyType').value;
    const grossRevenue = parseFloat(document.getElementById('corpGrossRevenue').value) || 0;
    const costOfSales = parseFloat(document.getElementById('corpCostOfSales').value) || 0;
    const operatingExp = parseFloat(document.getElementById('corpOperatingExp').value) || 0;
    const initialAllowance = parseFloat(document.getElementById('corpInitialAllowance').value) || 50;
    const annualAllowance = parseFloat(document.getElementById('corpAnnualAllowance').value) || 25;
    const investmentAllowance = parseFloat(document.getElementById('corpInvestmentAllowance').value) || 10;

    // Determine tax rate based on company type
    let taxRate = 0.30;
    let companyTypeLabel = 'Large Company';
    
    switch(companyType) {
        case 'small':
            taxRate = 0;
            companyTypeLabel = 'Small Company';
            break;
        case 'medium':
            taxRate = 0.20;
            companyTypeLabel = 'Medium Company';
            break;
        case 'bank':
        case 'insurance':
        case 'telecom':
            taxRate = 0.30;
            companyTypeLabel = companyType.charAt(0).toUpperCase() + companyType.slice(1);
            break;
        case 'oil':
            taxRate = 0.50;
            companyTypeLabel = 'Oil & Gas (Deep Offshore)';
            break;
    }

    // Calculate taxable income
    const grossProfit = grossRevenue - costOfSales;
    const taxableIncome = Math.max(grossProfit - operatingExp, 0);

    // Calculate capital allowances
    const totalCapitalAllowance = (initialAllowance + annualAllowance + investmentAllowance) / 100 * taxableIncome;
    const adjustedTaxableIncome = Math.max(taxableIncome - totalCapitalAllowance, 0);

    // Calculate tax
    const tax = adjustedTaxableIncome * taxRate;

    // Update results
    document.getElementById('corp-total-tax').textContent = formatCurrency(tax);
    document.getElementById('corp-taxable-income').textContent = formatCurrency(adjustedTaxableIncome);
    document.getElementById('corp-tax-rate').textContent = (taxRate * 100).toFixed(0) + '%';
    document.getElementById('corp-capital-allowances').textContent = formatCurrency(totalCapitalAllowance);

    // Update breakdown
    const breakdownHTML = `
        <div class="breakdown-item">
            <span class="label">Company Type</span>
            <span class="value">${companyTypeLabel}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Gross Revenue</span>
            <span class="value">${formatCurrency(grossRevenue)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Cost of Sales</span>
            <span class="value">-${formatCurrency(costOfSales)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Operating Expenses</span>
            <span class="value">-${formatCurrency(operatingExp)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Capital Allowances</span>
            <span class="value">-${formatCurrency(totalCapitalAllowance)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Tax Rate</span>
            <span class="value">${(taxRate * 100).toFixed(0)}%</span>
        </div>
    `;
    document.getElementById('corporate-breakdown').innerHTML = breakdownHTML;

    // Show results
    document.getElementById('corporate-results').classList.add('show');

    // Save to MantaHQ and load history
    const corpEffectiveRate = grossRevenue > 0 ? (tax / grossRevenue * 100).toFixed(1) + '%' : '0%';
    await saveTaxCalculation('corporate', grossRevenue, tax, corpEffectiveRate);
    loadCalcHistory();
}

// VAT Calculator
async function calculateVAT() {
    const grossSales = parseFloat(document.getElementById('vatGrossSales').value) || 0;
    const exemptSales = parseFloat(document.getElementById('vatExemptSales').value) || 0;
    const inputVAT = parseFloat(document.getElementById('vatInput').value) || 0;
    const reverseCharge = parseFloat(document.getElementById('vatReverseCharge').value) || 0;

    // Calculate VAT
    const vatRate = 0.075;
    const taxableSales = grossSales - exemptSales;
    const outputVAT = taxableSales * vatRate;
    const totalInputVAT = inputVAT + reverseCharge;
    const vatPayable = Math.max(outputVAT - totalInputVAT, 0);
    const vatRefund = Math.max(totalInputVAT - outputVAT, 0);

    // Update results
    document.getElementById('vat-payable').textContent = formatCurrency(vatPayable);
    document.getElementById('vat-output').textContent = formatCurrency(outputVAT);
    document.getElementById('vat-input-credit').textContent = formatCurrency(totalInputVAT);
    document.getElementById('vat-net').textContent = vatPayable > 0 ? formatCurrency(vatPayable) : `Refund: ${formatCurrency(vatRefund)}`;

    // Update breakdown
    const breakdownHTML = `
        <div class="breakdown-item">
            <span class="label">Total Sales</span>
            <span class="value">${formatCurrency(grossSales)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Exempt/Zero-Rated Sales</span>
            <span class="value">-${formatCurrency(exemptSales)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Taxable Sales</span>
            <span class="value">${formatCurrency(taxableSales)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Output VAT (7.5%)</span>
            <span class="value">${formatCurrency(outputVAT)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Input VAT Creditable</span>
            <span class="value">-${formatCurrency(totalInputVAT)}</span>
        </div>
    `;
    document.getElementById('vat-breakdown').innerHTML = breakdownHTML;

    // Show results
    document.getElementById('vat-results').classList.add('show');

    // Save to MantaHQ and load history
    await saveTaxCalculation('vat', grossSales, vatPayable, '7.5%');
    loadCalcHistory();
}

// Withholding Tax Calculator
async function calculateWHT() {
    const paymentType = document.getElementById('whtPaymentType').value;
    const grossAmount = parseFloat(document.getElementById('whtGrossAmount').value) || 0;
    const recipientType = document.getElementById('whtRecipientType').value;
    const applyTreaty = document.getElementById('whtTreaty').checked;

    // WHT rates
    const rates = {
        dividend: 0.10,
        interest: 0.10,
        royalty: 0.10,
        technical: 0.10,
        consultancy: 0.10,
        rental: 0.10,
        commission: 0.10,
        director: 0.10,
        contract: 0.05,
        construction: 0.05,
        supply: 0.02
    };

    let rate = rates[paymentType];
    
    // Adjust for company vs individual
    if (recipientType === 'company') {
        rate = rate * 0.5; // Companies pay lower WHT
    }

    // Apply treaty benefit (reduce by 50%)
    if (applyTreaty) {
        rate = rate * 0.5;
    }

    const whtDeducted = grossAmount * rate;
    const netPayment = grossAmount - whtDeducted;

    // Update results
    document.getElementById('wht-deducted').textContent = formatCurrency(whtDeducted);
    document.getElementById('wht-net').textContent = formatCurrency(netPayment);
    document.getElementById('wht-rate').textContent = (rate * 100).toFixed(0) + '%';

    // Update breakdown
    const paymentTypeLabels = {
        dividend: 'Dividend',
        interest: 'Interest',
        royalty: 'Royalties',
        technical: 'Technical Service Fees',
        consultancy: 'Consultancy Fees',
        rental: 'Rental',
        commission: 'Commission',
        director: 'Directors\' Fees',
        contract: 'Contract Payment',
        construction: 'Construction',
        supply: 'Supply of Goods'
    };

    const breakdownHTML = `
        <div class="breakdown-item">
            <span class="label">Payment Type</span>
            <span class="value">${paymentTypeLabels[paymentType]}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Recipient Type</span>
            <span class="value">${recipientType.charAt(0).toUpperCase() + recipientType.slice(1)}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Base Rate</span>
            <span class="value">${(rates[paymentType] * 100).toFixed(0)}%</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Tax Treaty Benefit</span>
            <span class="value">${applyTreaty ? 'Applied (-50%)' : 'Not Applied'}</span>
        </div>
        <div class="breakdown-item">
            <span class="label">Effective Rate</span>
            <span class="value">${(rate * 100).toFixed(0)}%</span>
        </div>
    `;
    document.getElementById('wht-breakdown').innerHTML = breakdownHTML;

    // Show results
    document.getElementById('wht-results').classList.add('show');

    // Save to MantaHQ and load history
    await saveTaxCalculation('wht', grossAmount, whtDeducted, (rate * 100).toFixed(0) + '%');
    loadCalcHistory();
}

// Statement Parser
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
let parsedTransactions = [];
let expenseCategories = {};

const categoryOptions = [
    'Office Supplies',
    'Travel & Accommodation',
    'Meals & Entertainment (50%)',
    'Utilities',
    'Rent',
    'Salaries & Wages',
    'Marketing & Advertising',
    'Professional Fees',
    'Insurance',
    'Depreciation',
    'Interest Expenses',
    'Non-Deductible',
    'Uncategorized'
];

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        parseFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        parseFile(e.target.files[0]);
    }
});

function parseFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'csv') {
        Papa.parse(file, {
            complete: function(results) {
                processCSVData(results.data);
            },
            error: function(error) {
                alert('Error parsing CSV: ' + error.message);
            }
        });
    } else if (['xlsx', 'xls'].includes(extension)) {
        alert('Excel file parsing requires additional library. Please convert to CSV format.');
    } else if (extension === 'pdf') {
        parsePDF(file);
    } else {
        alert('Unsupported file format. Please use CSV or PDF.');
    }
}

// PDF Parsing using PDF.js
async function parsePDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let allText = '';
        const numPages = pdf.numPages;
        
        // Show progress
        document.getElementById('uploadZone').innerHTML = `
            <i data-lucide="loader" class="loading"></i>
            <h4>Parsing PDF...</h4>
            <p>Processing ${numPages} pages</p>
        `;
        lucide.createIcons();
        
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            allText += pageText + '\n';
        }
        
        // Parse the extracted text into transactions
        processPDFText(allText);
        
    } catch (error) {
        console.error('PDF parsing error:', error);
        alert('Error parsing PDF: ' + error.message + '\n\nPlease ensure the PDF contains text (not just images).');
    }
}

function processPDFText(text) {
    parsedTransactions = [];
    expenseCategories = {};
    
    // Initialize category totals
    categoryOptions.forEach(cat => {
        expenseCategories[cat] = 0;
    });
    
    // Try to extract transaction-like patterns from PDF text
    // Common patterns: dates, descriptions, amounts
    const lines = text.split('\n').filter(line => line.trim());
    
    // Pattern to find amounts (e.g., ₦1,234.56 or 1234.56)
    const amountPattern = /(?:₦|N)?\s*([\d,]+\.?\d*)/g;
    
    // Pattern to find dates (various formats)
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
    
    let currentDate = '';
    
    for (const line of lines) {
        // Try to extract date
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
            currentDate = dateMatch[0];
        }
        
        // Try to extract amount
        const amountMatch = line.match(amountPattern);
        if (amountMatch) {
            const amountStr = amountMatch[1].replace(/,/g, '');
            const amount = parseFloat(amountStr);
            
            // Only process meaningful amounts (positive, reasonable)
            if (amount > 0 && amount < 1000000000) {
                // Use the line as description, removing the amount
                let description = line.replace(amountPattern, '').trim();
                description = description.replace(/^\s*[\/\-]\s*/, '').trim();
                
                if (description && description.length > 2) {
                    parsedTransactions.push({
                        date: currentDate || '',
                        description: description.substring(0, 100),
                        amount: amount,
                        category: categorizeExpense(description)
                    });
                    
                    // Add to category totals
                    const cat = categorizeExpense(description);
                    expenseCategories[cat] += amount;
                }
            }
        }
    }
    
    // If no transactions found, try alternative parsing
    if (parsedTransactions.length === 0) {
        // Fallback: treat each line as potential transaction
        for (const line of lines) {
            const amountMatch = line.match(amountPattern);
            if (amountMatch) {
                const amountStr = amountMatch[1].replace(/,/g, '');
                const amount = parseFloat(amountStr);
                
                if (amount > 0 && amount < 1000000000) {
                    let description = line.replace(amountPattern, '').trim();
                    
                    parsedTransactions.push({
                        date: '',
                        description: description.substring(0, 100) || 'Transaction',
                        amount: amount,
                        category: categorizeExpense(description)
                    });
                    
                    const cat = categorizeExpense(description);
                    expenseCategories[cat] += amount;
                }
            }
        }
    }
    
    displayParsedData();
    
    // Restore upload zone
    document.getElementById('uploadZone').innerHTML = `
        <i data-lucide="upload" size="48"></i>
        <h4>Drag & drop your statement here</h4>
        <p>or click to browse files</p>
        <div class="file-types">
            <span class="file-type-badge">CSV</span>
            <span class="file-type-badge">Excel</span>
            <span class="file-type-badge">PDF</span>
        </div>
    `;
    lucide.createIcons();
}

function processCSVData(data) {
    parsedTransactions = [];
    expenseCategories = {};
    
    // Initialize category totals
    categoryOptions.forEach(cat => {
        expenseCategories[cat] = 0;
    });

    // Skip header row if present
    const startIndex = data[0] && data[0][0] && data[0][0].toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < data.length; i++) {
        const row = data[i];
        if (row && row.length >= 3) {
            const date = row[0] || '';
            const description = row[1] || '';
            const amount = parseFloat(row[2]?.replace(/[^0-9.-]/g, '')) || 0;
            
            if (description || amount) {
                parsedTransactions.push({
                    date,
                    description,
                    amount: Math.abs(amount),
                    category: categorizeExpense(description)
                });
                
                // Add to category totals
                const cat = categorizeExpense(description);
                expenseCategories[cat] += Math.abs(amount);
            }
        }
    }

    displayParsedData();
}

function categorizeExpense(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('office') || desc.includes('stationery') || desc.includes('supplies')) {
        return 'Office Supplies';
    } else if (desc.includes('travel') || desc.includes('flight') || desc.includes('hotel') || desc.includes('accommodation')) {
        return 'Travel & Accommodation';
    } else if (desc.includes('meal') || desc.includes('food') || desc.includes('restaurant') || desc.includes('entertainment')) {
        return 'Meals & Entertainment (50%)';
    } else if (desc.includes('electric') || desc.includes('water') || desc.includes('utility') || desc.includes('power')) {
        return 'Utilities';
    } else if (desc.includes('rent') || desc.includes('lease')) {
        return 'Rent';
    } else if (desc.includes('salary') || desc.includes('wages') || desc.includes('payroll')) {
        return 'Salaries & Wages';
    } else if (desc.includes('marketing') || desc.includes('advertising') || desc.includes('promotion')) {
        return 'Marketing & Advertising';
    } else if (desc.includes('professional') || desc.includes('consulting') || desc.includes('legal') || desc.includes('audit')) {
        return 'Professional Fees';
    } else if (desc.includes('insurance') || desc.includes('premium')) {
        return 'Insurance';
    } else if (desc.includes('depreciation') || desc.includes('amortization')) {
        return 'Depreciation';
    } else if (desc.includes('interest') || desc.includes('loan') || desc.includes('bank')) {
        return 'Interest Expenses';
    } else if (desc.includes('donation') || desc.includes('gift')) {
        return 'Non-Deductible';
    }
    
    return 'Uncategorized';
}

function displayParsedData() {
    const tbody = document.getElementById('transactionsBody');
    tbody.innerHTML = '';

    parsedTransactions.forEach((tx, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.description}</td>
            <td class="mono">${formatCurrency(tx.amount)}</td>
            <td>
                <select class="category-select" onchange="updateCategory(${index}, this.value)">
                    ${categoryOptions.map(cat => 
                        `<option value="${cat}" ${cat === tx.category ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Display expense summary
    const summaryDiv = document.getElementById('expenseSummary');
    summaryDiv.innerHTML = '';

    Object.entries(expenseCategories).forEach(([category, amount]) => {
        if (amount > 0) {
            const div = document.createElement('div');
            div.className = 'expense-category';
            div.innerHTML = `
                <h5>${category}</h5>
                <div class="amount">${formatCurrency(amount)}</div>
            `;
            summaryDiv.appendChild(div);
        }
    });

    document.getElementById('parsedData').classList.add('show');
}

function updateCategory(index, category) {
    const oldCategory = parsedTransactions[index].category;
    const amount = parsedTransactions[index].amount;
    
    // Update transaction
    parsedTransactions[index].category = category;
    
    // Update totals
    expenseCategories[oldCategory] -= amount;
    expenseCategories[category] += amount;
    
    // Refresh summary
    const summaryDiv = document.getElementById('expenseSummary');
    summaryDiv.innerHTML = '';

    Object.entries(expenseCategories).forEach(([cat, amt]) => {
        if (amt > 0) {
            const div = document.createElement('div');
            div.className = 'expense-category';
            div.innerHTML = `
                <h5>${cat}</h5>
                <div class="amount">${formatCurrency(amt)}</div>
            `;
            summaryDiv.appendChild(div);
        }
    });
}

function exportExpenses() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Description,Amount,Category\n";
    
    parsedTransactions.forEach(tx => {
        csvContent += `${tx.date},"${tx.description}",${tx.amount},${tx.category}\n`;
    });

    csvContent += "\n\nEXPENSE SUMMARY\n";
    csvContent += "Category,Amount\n";
    Object.entries(expenseCategories).forEach(([cat, amt]) => {
        if (amt > 0) {
            csvContent += `${cat},${amt}\n`;
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// PDF Export functions
function exportPersonalPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 95);
    doc.text("Personal Income Tax Computation", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generated by calTax - Nigerian Tax Calculator", 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);
    
    // Get values
    const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
    const housingAllowance = parseFloat(document.getElementById('housingAllowance').value) || 0;
    const transportAllowance = parseFloat(document.getElementById('transportAllowance').value) || 0;
    const otherAllowances = parseFloat(document.getElementById('otherAllowances').value) || 0;
    const bonus = parseFloat(document.getElementById('bonus').value) || 0;
    const grossIncome = basicSalary + housingAllowance + transportAllowance + otherAllowances + bonus;
    
    const totalTax = document.getElementById('personal-total-tax').textContent;
    const taxableIncome = document.getElementById('personal-taxable-income').textContent;
    const effectiveRate = document.getElementById('personal-effective-rate').textContent;
    const monthlyTax = document.getElementById('personal-monthly-tax').textContent;
    
    // Income details
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Income Details", 20, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    let y = 60;
    doc.text(`Basic Salary: ${formatCurrency(basicSalary)}`, 20, y);
    doc.text(`Housing Allowance: ${formatCurrency(housingAllowance)}`, 20, y + 6);
    doc.text(`Transport Allowance: ${formatCurrency(transportAllowance)}`, 20, y + 12);
    doc.text(`Other Allowances: ${formatCurrency(otherAllowances)}`, 20, y + 18);
    doc.text(`Bonus/Incentives: ${formatCurrency(bonus)}`, 20, y + 24);
    doc.setFont(undefined, 'bold');
    doc.text(`Gross Income: ${formatCurrency(grossIncome)}`, 20, y + 34);
    doc.setFont(undefined, 'normal');
    
    // Tax computation
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Tax Computation", 20, 110);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    y = 120;
    doc.text(`Taxable Income: ${taxableIncome}`, 20, y);
    doc.text(`Total Tax Payable: ${totalTax}`, 20, y + 6);
    doc.text(`Effective Rate: ${effectiveRate}`, 20, y + 12);
    doc.text(`Monthly Tax: ${monthlyTax}`, 20, y + 18);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This is a computer-generated estimate. For official tax computations, consult a qualified tax professional.", 20, 280);
    
    doc.save("personal_tax_computation.pdf");
}

function exportCorporatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 95);
    doc.text("Corporate Income Tax Computation", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generated by calTax - Nigerian Tax Calculator", 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);
    
    // Get values
    const companyType = document.getElementById('companyType').value;
    const grossRevenue = parseFloat(document.getElementById('corpGrossRevenue').value) || 0;
    const costOfSales = parseFloat(document.getElementById('corpCostOfSales').value) || 0;
    const operatingExp = parseFloat(document.getElementById('corpOperatingExp').value) || 0;
    
    const totalTax = document.getElementById('corp-total-tax').textContent;
    const taxableIncome = document.getElementById('corp-taxable-income').textContent;
    const taxRate = document.getElementById('corp-tax-rate').textContent;
    const capitalAllowances = document.getElementById('corp-capital-allowances').textContent;
    
    // Company details
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Company Details", 20, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    let y = 60;
    doc.text(`Company Type: ${companyType.charAt(0).toUpperCase() + companyType.slice(1)}`, 20, y);
    doc.text(`Gross Revenue: ${formatCurrency(grossRevenue)}`, 20, y + 6);
    doc.text(`Cost of Sales: ${formatCurrency(costOfSales)}`, 20, y + 12);
    doc.text(`Operating Expenses: ${formatCurrency(operatingExp)}`, 20, y + 18);
    doc.text(`Capital Allowances: ${capitalAllowances}`, 20, y + 24);
    
    // Tax computation
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Tax Computation", 20, 110);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    y = 120;
    doc.text(`Taxable Income: ${taxableIncome}`, 20, y);
    doc.text(`Tax Rate: ${taxRate}`, 20, y + 6);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Tax Payable: ${totalTax}`, 20, y + 16);
    doc.setFont(undefined, 'normal');
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This is a computer-generated estimate. For official tax computations, consult a qualified tax professional.", 20, 280);
    
    doc.save("corporate_tax_computation.pdf");
}

function exportExpensePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 95);
    doc.text("Business Expense Report", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generated by calTax - Nigerian Tax Calculator", 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);
    
    // Expense summary
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Expense Summary by Category", 20, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    let y = 60;
    
    Object.entries(expenseCategories).forEach(([category, amount]) => {
        if (amount > 0) {
            doc.text(`${category}: ${formatCurrency(amount)}`, 20, y);
            y += 8;
        }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This report is for informational purposes only.", 20, 280);
    
    doc.save("expense_report.pdf");
}

// Tax Calendar
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function getTaxEvents(year) {
    const events = [];
    
    // Monthly PAYE remittances (due by 10th of following month)
    for (let month = 0; month < 12; month++) {
        const dueDate = new Date(year, month + 1, 10);
        if (dueDate.getMonth() === month + 1) {
            dueDate.setMonth(month + 1);
            dueDate.setDate(10);
        }
        const dateStr = `${year}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
        events.push({
            date: dateStr,
            title: `PAYE Remittance Due (${new Date(year, month).toLocaleString('default', { month: 'short' })} income)`,
            type: 'paye'
        });
    }
    
    // Monthly VAT filings (due by 21st of following month)
    for (let month = 0; month < 12; month++) {
        const dueDate = new Date(year, month + 1, 21);
        if (dueDate.getMonth() === month + 1) {
            dueDate.setMonth(month + 1);
            dueDate.setDate(21);
        }
        const dateStr = `${year}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
        events.push({
            date: dateStr,
            title: `VAT Filing & Payment Due (${new Date(year, month).toLocaleString('default', { month: 'short' })} period)`,
            type: 'vat'
        });
    }
    
    // Withholding Tax remittances (due by 21st of following month)
    for (let month = 0; month < 12; month++) {
        const dueDate = new Date(year, month + 1, 21);
        if (dueDate.getMonth() === month + 1) {
            dueDate.setMonth(month + 1);
            dueDate.setDate(21);
        }
        const dateStr = `${year}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
        events.push({
            date: dateStr,
            title: `Withholding Tax Remittance Due (${new Date(year, month).toLocaleString('default', { month: 'short' })} period)`,
            type: 'wht'
        });
    }
    
    // Annual tax deadlines
    events.push(
        { date: `${year}-03-31`, title: 'Annual Personal Income Tax Return Filing Deadline', type: 'annual' },
        { date: `${year}-03-31`, title: 'Provisional Tax Payment Deadline (1st installment)', type: 'provisional' },
        { date: `${year}-08-31`, title: 'Provisional Tax Payment Deadline (2nd installment)', type: 'provisional' },
        { date: `${year}-03-31`, title: 'Company Income Tax Return Filing Deadline', type: 'annual' }
    );
    
    return events;
}

let taxEvents = getTaxEvents(currentYear);

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('calendarMonth');
    const eventsDiv = document.getElementById('calendarEvents');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.fontWeight = '600';
        div.style.fontSize = '0.75rem';
        div.style.color = 'var(--text-secondary)';
        div.textContent = day;
        grid.appendChild(div);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.style.visibility = 'hidden';
        grid.appendChild(div);
    }
    
    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = day;
        
        // Check if today
        if (today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear) {
            div.classList.add('today');
        }
        
        // Check for events
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = taxEvents.some(e => e.date === dateStr);
        if (hasEvent) {
            div.classList.add('has-event');
            div.title = taxEvents.find(e => e.date === dateStr)?.title;
        }
        
        div.addEventListener('click', () => showDayEvents(dateStr));
        grid.appendChild(div);
    }
    
    // Show upcoming events
    const upcomingEvents = taxEvents
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    eventsDiv.innerHTML = '<h4 style="margin-bottom: 0.5rem;">Upcoming Deadlines</h4>';
    upcomingEvents.forEach(event => {
        const eventDate = new Date(event.date);
        eventsDiv.innerHTML += `
            <div class="event-item">
                <span class="event-date">${eventDate.toLocaleDateString()}</span>
                <span class="event-title">${event.title}</span>
            </div>
        `;
    });
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
        taxEvents = getTaxEvents(currentYear);
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
        taxEvents = getTaxEvents(currentYear);
    }
    renderCalendar();
}

function showDayEvents(dateStr) {
    const dayEvents = taxEvents.filter(e => e.date === dateStr);
    if (dayEvents.length > 0) {
        alert(dayEvents.map(e => e.title).join('\n'));
    }
}

function addTaxEvent() {
    const title = prompt('Enter tax deadline title:');
    if (title) {
        const date = prompt('Enter date (YYYY-MM-DD):');
        if (date) {
            taxEvents.push({ date, title });
            renderCalendar();
        }
    }
}

// Accordion toggle
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('show');
    const icon = header.querySelector('i');
    icon.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0)';
}

// Help modal
function showHelp() {
    document.getElementById('helpModal').classList.add('show');
}

function closeHelp() {
    document.getElementById('helpModal').classList.remove('show');
}

// Close modal on outside click
document.getElementById('helpModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('helpModal')) {
        closeHelp();
    }
});

// Initialize calendar
renderCalendar();

// ==================== NOTIFICATIONS SYSTEM ====================
let notifications = JSON.parse(localStorage.getItem('calTax_notifications') || '[]');

// Initialize notifications
loadNotifications();
checkNotificationReminders();

function loadNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No notifications set</p>';
        return;
    }
    
    list.innerHTML = '';
    notifications.forEach((notif, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;';
        div.innerHTML = `
            <div>
                <strong style="font-size: 0.875rem;">${notif.title}</strong>
                <br><span style="font-size: 0.75rem; color: var(--text-secondary);">${notif.date} (${notif.remindText})</span>
            </div>
            <button onclick="deleteNotification(${index})" style="background: none; border: none; color: var(--error); cursor: pointer;">
                <i data-lucide="trash-2" size="16"></i>
            </button>
        `;
        list.appendChild(div);
    });
    lucide.createIcons();
}

function addNotification() {
    const title      = document.getElementById('notifTitle').value.trim();
    const date       = document.getElementById('notifDate').value;
    const toEmail   = document.getElementById('notifEmail')?.value.trim() || '';
    const remindDays = parseInt(document.getElementById('notifRemind').value);

    if (!title || !date) {
        showMantaToast('Please fill in all required fields.', 'error');
        return;
    }

    // If email provided, validate and use MantaHQ
    if (toEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
            showMantaToast('Please enter a valid email address.', 'error');
            return;
        }

        const remindTexts = { 0: 'On the day', 1: '1 day before', 3: '3 days before', 7: '1 week before' };
        const remindText  = remindTexts[remindDays];

        // Save to localStorage
        notifications.push({
            title,
            date,
            email: toEmail,
            remindDays,
            remindText,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('calTax_notifications', JSON.stringify(notifications));
        loadNotifications();

        // Send email via MantaHQ
        sendMantaEmailNotification(toEmail, title, date, remindText).then(sent => {
            if (sent) {
                showMantaToast(`✅ Reminder set! Email will be sent to ${toEmail}`, 'success');
            } else {
                showMantaToast('Reminder saved, but email delivery failed. Check your API key.', 'warning');
            }
        });

        // Clear form
        document.getElementById('notifTitle').value = '';
        document.getElementById('notifDate').value  = '';
        document.getElementById('notifEmail').value = '';
    } else {
        // Original behavior without email
        const remindTexts = {
            0: 'On the day',
            1: '1 day before',
            3: '3 days before',
            7: '1 week before'
        };
        
        notifications.push({
            title,
            date,
            remindDays,
            remindText: remindTexts[remindDays],
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('calTax_notifications', JSON.stringify(notifications));
        
        document.getElementById('notifTitle').value = '';
        document.getElementById('notifDate').value = '';
        
        loadNotifications();
        showMantaToast('Notification set successfully!', 'success');
    }
}

function deleteNotification(index) {
    notifications.splice(index, 1);
    localStorage.setItem('calTax_notifications', JSON.stringify(notifications));
    loadNotifications();
}

function checkNotificationReminders() {
    const today = new Date();
    
    notifications.forEach(notif => {
        const notifDate = new Date(notif.date);
        const remindDate = new Date(notifDate);
        remindDate.setDate(remindDate.getDate() - notif.remindDays);
        
        if (today.toDateString() === remindDate.toDateString()) {
            if (Notification.permission === 'granted') {
                new Notification('calTax Reminder', {
                    body: `${notif.title} is due on ${notif.date}`,
                    icon: 'calculator'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    });
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Navigation
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href').replace('#', '');
        
        document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        if (target === 'calculator') {
            document.getElementById('personal-section').scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'parser') {
            document.getElementById('parser-section').scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'calendar') {
            document.getElementById('calendar-section').scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'resources') {
            document.getElementById('resources-section').scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'notifications-section') {
            document.getElementById('notifications-section').scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'history-section') {
            document.getElementById('history-section').scrollIntoView({ behavior: 'smooth' });
            loadCalcHistory();
        }
    });
});

// Load history on initial page display.
updateUIForUser();
if (getCurrentUser()) {
    loadCalcHistory();
}