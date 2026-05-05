# Nigerian Tax Calculator Web App - Specification

## 1. Project Overview

**Project Name:** calTax - Nigerian Tax Calculator
**Type:** Single Page Web Application
**Core Functionality:** A comprehensive tax calculator that helps individuals and businesses calculate taxes owed under the Nigerian Tax Act 2025, with statement parsing capabilities for business expense mapping.
**Target Users:** Individual taxpayers, small business owners, accountants, and tax professionals in Nigeria.

---

## 2. UI/UX Specification

### Layout Structure

**Page Sections:**
- **Header:** Fixed top navigation with logo, nav links, dark mode toggle
- **Hero Section:** Welcome message with quick tax calculator access
- **Calculator Section:** Tab-based interface for different tax types
- **Statement Parser Section:** File upload and expense mapping area
- **Results Section:** Detailed tax breakdown and payment schedule
- **Footer:** Links, disclaimer, copyright

**Responsive Breakpoints:**
- Mobile: < 768px (single column, stacked layout)
- Tablet: 768px - 1024px (two column where appropriate)
- Desktop: > 1024px (full layout with sidebar)

### Visual Design

**Color Palette:**
- Primary: `#1E3A5F` (Deep Navy Blue - trust, professionalism)
- Secondary: `#2E7D32` (Forest Green - money, growth)
- Accent: `#FF8F00` (Amber Gold - attention, CTAs)
- Background Light: `#F8FAFC`
- Background Dark: `#0F172A`
- Surface Light: `#FFFFFF`
- Surface Dark: `#1E293B`
- Text Primary Light: `#1E293B`
- Text Primary Dark: `#F1F5F9`
- Text Secondary: `#64748B`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Border Light: `#E2E8F0`
- Border Dark: `#334155`

**Typography:**
- Headings: `'Playfair Display', serif` - weights 600, 700
- Body: `'Source Sans 3', sans-serif` - weights 400, 500, 600
- Monospace (numbers): `'JetBrains Mono', monospace` - weight 500
- H1: 2.5rem (40px)
- H2: 2rem (32px)
- H3: 1.5rem (24px)
- H4: 1.25rem (20px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)

**Spacing System:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

**Visual Effects:**
- Card shadows: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`
- Elevated shadows: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 200ms ease-out for all interactive elements
- Hover lift: translateY(-2px) with enhanced shadow

### Components

**Navigation:**
- Logo (left): "calTax" with calculator icon
- Nav links (center): Calculator, Business, Statement Parser, Resources
- Actions (right): Dark mode toggle, Help button

**Tab System:**
- Tabs: Personal Tax, Corporate Tax, VAT Calculator, Withholding Tax
- Active state: Bottom border accent color, bold text
- Hover: Background tint

**Calculator Input Cards:**
- Label above input
- Input with currency prefix (₦)
- Helper text below
- Validation states (error border + message)

**Result Cards:**
- Summary card with total tax
- Breakdown accordion
- Download PDF button
- Payment schedule timeline

**Statement Parser:**
- Drag & drop zone with dashed border
- File type badges (CSV, Excel, PDF)
- Parsed data table with editable categories
- Expense category chips
- Export button

**Buttons:**
- Primary: Filled with accent color, white text
- Secondary: Outlined with primary color
- Ghost: Text only with hover background
- States: Default, Hover, Active, Disabled, Loading

**Form Inputs:**
- Text inputs with floating labels
- Select dropdowns with custom styling
- Checkbox and radio with custom icons
- File upload with preview

---

## 3. Functionality Specification

### Core Features

#### 3.1 Personal Income Tax Calculator
**Tax Brackets (2025):**
- First ₦300,000: 7%
- Next ₦300,000 (₦300,001 - ₦600,000): 11%
- Next ₦500,000 (₦600,001 - ₦1,100,000): 15%
- Next ₦500,000 (₦1,100,001 - ₦1,600,000): 19%
- Next ₦1,600,000 (₦1,600,001 - ₦3,200,000): 21%
- Above ₦3,200,000: 24%

**Deductions (Allowable):**
- Consolidated Relief Allowance: 20% of gross income or ₦200,000, whichever is higher
- National Housing Fund (NHF): 2.5% of basic salary
- National Social Insurance Trust Fund (NSITF): 1% of basic salary
- Pension Contributions: Up to 8.33% of basic salary
- Life Insurance Premiums: Up to ₦50,000
- Gratuity (if received as lump sum)
- Professional Subscription (CIMA, ICAN, etc.): Up to ₦10,000

**Inputs:**
- Gross annual income
- Basic salary
- Housing allowance
- Transport allowance
- Other allowances
- Bonus/incentives
- Deductions toggle (auto-calculate or manual)

#### 3.2 Corporate Income Tax Calculator
**Tax Rates:**
- Small companies (gross < ₦25M): 0%
- Medium companies (₦25M - ₦100M): 20%
- Large companies (> ₦100M): 30%
- Banks and financial institutions: 30%
- Insurance companies: 30%
- Telecommunication companies: 30%
- Oil and gas companies: 50% (or 85% for deep offshore)

**Capital Allowances:**
- Initial allowance: 50%
- Annual allowance: 25%
- Investment allowance: 10%
- Wear and tear allowance: 10%

**Deductions:**
- Cost of goods sold
- Administrative expenses
- Marketing expenses
- Depreciation
- Interest on loans (subject to thin capitalization rules)
- R&D expenses
- Training expenses
- Donations (limited to 5% of taxable income)

**Inputs:**
- Company type
- Gross revenue
- Cost of sales
- Operating expenses
- Capital allowances
- Tax incentives (pioneer status, etc.)

#### 3.3 VAT Calculator
**VAT Rates:**
- Standard rate: 7.5%
- Zero-rated (0%): Essential commodities
- Exempt: Financial services, education, medical

**VAT Calculation:**
- Input VAT (from purchases)
- Output VAT (from sales)
- VAT payable = Output VAT - Input VAT
- VAT registration threshold: ₦25M annual turnover

**Inputs:**
- Gross sales
- VAT-exempt sales
- Input VAT (creditable)
- Reverse charge VAT

#### 3.4 Withholding Tax Calculator
**Withholding Tax Rates:**
- Dividends: 10%
- Interest: 10%
- Royalties: 10%
- Technical service fees: 10%
- Consultancy fees: 10%
- Rental: 10%
- Commission: 10%
- Directors' fees: 10%
- Contract payments: 5%
- Construction: 5%
- Supply of goods: 2%

**Inputs:**
- Payment type
- Gross amount
- Whether recipient is a company or individual
- Tax treaty benefits (if applicable)

### 3.5 Statement of Account Parser
**Supported Formats:**
- CSV files
- Excel files (.xlsx, .xls)
- PDF bank statements

**Parsing Capabilities:**
- Extract transaction date, description, amount
- Auto-categorize expenses into tax-deductible categories:
  - Office supplies
  - Travel and accommodation
  - Meals and entertainment (50% deductible)
  - Utilities
  - Rent
  - Salaries and wages
  - Marketing and advertising
  - Professional fees
  - Insurance
  - Depreciation
  - Interest expenses
  - Other deductible expenses

**Features:**
- Category mapping suggestions
- Manual category override
- Export categorized data to Excel
- Generate expense summary report
- Identify potential non-deductible items

### 3.6 Mantahq Features (Additional)

1. **Tax Calendar:**
   - Important tax deadlines
   - Reminders for filing dates
   - Payment due date alerts
   - Custom event creation

2. **PDF Tax Report Generator:**
   - Professional tax computation summary
   - Bracket breakdown visualization
   - Year-over-year comparison
   - Export to PDF

3. **Tax Knowledge Base:**
   - FAQ section
   - Tax tips and guides
   - Latest tax updates
   - Glossary of terms

4. **Multi-Year Comparison:**
   - Compare tax liabilities across years
   - Trend analysis
   - Projection for future years

5. **Tax Estimator Wizard:**
   - Step-by-step guided tax calculation
   - Question-based input flow
   - Helpful tooltips and explanations

### User Interactions and Flows

**Personal Tax Flow:**
1. User selects "Personal Tax" tab
2. Enters income details (salary, allowances, bonus)
3. Toggles automatic deductions or enters manual
4. Clicks "Calculate Tax"
5. Views results with breakdown
6. Optionally exports to PDF

**Corporate Tax Flow:**
1. User selects "Corporate Tax" tab
2. Selects company type
3. Enters revenue and expense details
4. Applies capital allowances
5. Claims tax incentives if applicable
6. Calculates tax liability
7. Views detailed breakdown

**Statement Parser Flow:**
1. User navigates to Statement Parser
2. Drags and drops file or clicks to upload
3. System parses and displays transactions
4. User reviews and adjusts categories
5. Exports categorized expense report

### Edge Cases

- Negative taxable income (carry forward)
- Multiple income streams
- Tax treaty benefits
- Expatriate taxation
- Capital gains vs income
- Loss carry forward
- Group relief for companies

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Header displays correctly with logo, navigation, and dark mode toggle
- [ ] Tab system switches between tax types smoothly
- [ ] All form inputs have proper labels, validation, and styling
- [ ] Results display with proper formatting and breakdown
- [ ] Dark mode toggles all colors correctly
- [ ] Mobile layout stacks properly below 768px
- [ ] Animations are smooth (200ms transitions)

### Functional Checkpoints
- [ ] Personal tax calculates correctly using 2025 brackets
- [ ] All personal deductions apply correctly
- [ ] Corporate tax applies correct rates by company size
- [ ] Capital allowances calculate properly
- [ ] VAT calculation is accurate (7.5% rate)
- [ ] Withholding tax rates apply correctly by payment type
- [ ] Statement parser reads CSV files correctly
- [ ] Statement parser categorizes expenses appropriately
- [ ] PDF export generates downloadable report
- [ ] Tax calendar displays and allows event creation

### Technical Checkpoints
- [ ] No console errors on page load
- [ ] All calculations produce correct results
- [ ] File upload accepts correct formats
- [ ] Responsive design works at all breakpoints
- [ ] Dark mode persists across sessions (localStorage)
- [ ] All external resources load correctly

---

## 5. Technical Stack

- **Framework:** Vanilla JavaScript (ES6+)
- **Styling:** CSS with CSS Variables
- **Build:** Single HTML file with embedded CSS/JS
- **Libraries:**
  - Chart.js (for tax bracket visualization)
  - jsPDF (for PDF export)
  - SheetJS/xlsx (for Excel parsing)
  - PapaParse (for CSV parsing)
- **Fonts:** Google Fonts (Playfair Display, Source Sans 3, JetBrains Mono)
- **Icons:** Lucide Icons (via CDN)