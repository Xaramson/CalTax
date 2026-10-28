import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3,
  Bell, Boxes, Building2, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, CreditCard,
  Calculator, Camera, Download, FileText, Filter, Home, LayoutDashboard, LogOut, Menu, Minus,
  Package, Plus, Printer, Search, Settings, ShoppingBag, ShoppingCart,
  SlidersHorizontal, Sparkles, Tag, TrendingUp, Truck, Users, Wallet, X,
  Receipt, Banknote, Trash2, RotateCcw, CircleHelp
} from 'lucide-react';

type Product = { id: string; name: string; sku: string; category: string; price: number; cost: number; stock: number; reorder: number; unit: string; color: string; photo?: string };
type Customer = { id: string; name: string; email: string; phone: string; spent: number; visits: number; balance: number };
type SaleLine = { productId: string; name: string; qty: number; price: number; cost: number };
type Sale = { id: string; date: string; customer: string; items: number; total: number; method: string; status: 'Completed' | 'Refunded'; lines: SaleLine[] };
type Expense = { id: string; title: string; category: string; date: string; amount: number; method: string };
type TaxpayerType = 'company' | 'individual';
type TaxSettings = {
  taxpayerType: TaxpayerType;
  lastFilingDate: string;
  nextFilingDate: string;
  annualTurnover: string;
  fixedAssets: string;
  otherTaxableIncome: string;
  additionalDeductions: { capitalAllowances: string; approvedDonations: string; otherAllowable: string };
  personalDeductions: { rentPaid: string; pension: string; nhf: string; nhis: string; lifeAssurance: string; mortgageInterest: string };
};
type Page = 'Overview' | 'Point of sale' | 'Products' | 'Inventory' | 'Sales' | 'Customers' | 'Expenses' | 'Tax' | 'Reports' | 'Settings';
type Store = { products: Product[]; customers: Customer[]; sales: Sale[]; expenses: Expense[] };

const money = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
const shortMoney = (n: number) => n >= 1000000 ? `₦${(n / 1000000).toFixed(1)}m` : n >= 1000 ? `₦${(n / 1000).toFixed(1)}k` : money(n);
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const dateInput = (date: Date) => {
  const local = new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
};
const addMonths = (date: string, months: number) => {
  const value = new Date(`${date}T12:00:00`);
  const day = value.getDate();
  value.setMonth(value.getMonth()+months);
  if (value.getDate() < day) value.setDate(0);
  return dateInput(value);
};
const createTaxSettings = (): TaxSettings => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const individualDeadline = new Date(currentYear,2,31);
  if (individualDeadline < now) individualDeadline.setFullYear(currentYear+1);
  const companyDeadline = new Date(currentYear,5,30);
  if (companyDeadline < now) companyDeadline.setFullYear(currentYear+1);
  return {
    taxpayerType:'company',
    lastFilingDate:`${currentYear}-01-01`,
    nextFilingDate:dateInput(companyDeadline),
    annualTurnover:'',
    fixedAssets:'',
    otherTaxableIncome:'',
    additionalDeductions:{capitalAllowances:'',approvedDonations:'',otherAllowable:''},
    personalDeductions:{rentPaid:'',pension:'',nhf:'',nhis:'',lifeAssurance:'',mortgageInterest:''},
  };
};
const loadTaxSettings = (): TaxSettings => {
  const defaults = createTaxSettings();
  try {
    const saved = localStorage.getItem('caltax_tax_settings_v1');
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<TaxSettings>;
    return {
      ...defaults,
      ...parsed,
      taxpayerType:parsed.taxpayerType==='individual'?'individual':'company',
      additionalDeductions:{...defaults.additionalDeductions,...parsed.additionalDeductions},
      personalDeductions:{...defaults.personalDeductions,...parsed.personalDeductions},
    };
  } catch {
    return defaults;
  }
};
const personalIncomeTax = (income: number) => {
  const bands = [
    { limit:800_000, rate:0 },
    { limit:2_200_000, rate:0.15 },
    { limit:9_000_000, rate:0.18 },
    { limit:13_000_000, rate:0.21 },
    { limit:25_000_000, rate:0.23 },
    { limit:Number.POSITIVE_INFINITY, rate:0.25 },
  ];
  let remaining = Math.max(0,income);
  let tax = 0;
  for (const band of bands) {
    const taxable = Math.min(remaining,band.limit);
    tax += taxable*band.rate;
    remaining -= taxable;
    if (remaining<=0) break;
  }
  return tax;
};
const productPhotos: Record<string, string> = {
  p1: 'photo-1442512595331-e89e73853f31',
  p2: 'photo-1509042239860-f550ce710b93',
  p3: 'photo-1550583724-b2692b85b150',
  p4: 'photo-1606313564200-e75d5e30476c',
  p5: 'photo-1553062407-98eeb64c6a62',
  p6: 'photo-1517701604599-bb29b565090c',
  p7: 'photo-1474979266404-7eaacbcd87c5',
  p8: 'photo-1559056199-641a0ac8b55e',
  p9: 'photo-1602143407151-7111542de6e8',
  p10: 'photo-1555507036-ab1f4038808a',
  p11: 'photo-1607958996333-41aef7caefaa',
  p12: 'photo-1515823064-d6e0c04616a7',
};
const categoryPhotos: Record<string, string> = {
  Beverages: 'photo-1442512595331-e89e73853f31',
  Snacks: 'photo-1606313564200-e75d5e30476c',
  'Home & Living': 'photo-1509042239860-f550ce710b93',
  Accessories: 'photo-1553062407-98eeb64c6a62',
  Bakery: 'photo-1555507036-ab1f4038808a',
};
const productPhotoUrl = (product: Product) =>
  `https://images.unsplash.com/${productPhotos[product.id] || categoryPhotos[product.category] || 'photo-1442512595331-e89e73853f31'}?auto=format&fit=crop&w=400&q=80`;
const initialStore: Store = {
  products: [
    { id:'p1', name:'Arabica Coffee Beans', sku:'COF-001', category:'Beverages', price:8500, cost:5200, stock:42, reorder:12, unit:'bag', color:'tan' },
    { id:'p2', name:'Ceramic Coffee Mug', sku:'HOM-014', category:'Home & Living', price:6500, cost:3100, stock:28, reorder:8, unit:'piece', color:'blue' },
    { id:'p3', name:'Oat Milk 1L', sku:'DRK-023', category:'Beverages', price:3200, cost:2100, stock:9, reorder:15, unit:'carton', color:'green' },
    { id:'p4', name:'Dark Chocolate Bar', sku:'SNK-008', category:'Snacks', price:1800, cost:950, stock:65, reorder:20, unit:'piece', color:'brown' },
    { id:'p5', name:'Reusable Tote Bag', sku:'ACC-031', category:'Accessories', price:4200, cost:1900, stock:6, reorder:10, unit:'piece', color:'pink' },
    { id:'p6', name:'Cold Brew Bottle', sku:'DRK-026', category:'Beverages', price:5000, cost:2700, stock:18, reorder:8, unit:'bottle', color:'purple' },
    { id:'p7', name:'Vanilla Syrup', sku:'COF-012', category:'Beverages', price:3800, cost:2200, stock:21, reorder:8, unit:'bottle', color:'orange' },
    { id:'p8', name:'Ground Coffee 250g', sku:'COF-002', category:'Beverages', price:6000, cost:3600, stock:3, reorder:10, unit:'bag', color:'tan' },
    { id:'p9', name:'Stainless Water Bottle', sku:'ACC-044', category:'Accessories', price:9500, cost:5700, stock:14, reorder:6, unit:'piece', color:'blue' },
    { id:'p10', name:'Butter Croissant', sku:'BAK-004', category:'Bakery', price:1600, cost:700, stock:24, reorder:10, unit:'piece', color:'orange' },
    { id:'p11', name:'Blueberry Muffin', sku:'BAK-011', category:'Bakery', price:2200, cost:900, stock:16, reorder:8, unit:'piece', color:'purple' },
    { id:'p12', name:'Matcha Powder', sku:'TEA-009', category:'Beverages', price:7200, cost:4300, stock:11, reorder:5, unit:'tin', color:'green' },
  ],
  customers: [
    { id:'c1', name:'Amara Okafor', email:'amara.okafor@example.com', phone:'+234 803 555 0101', spent:186500, visits:24, balance:0 },
    { id:'c2', name:'Tunde Adebayo', email:'tunde.a@example.com', phone:'+234 806 555 0134', spent:94500, visits:13, balance:12500 },
    { id:'c3', name:'Zainab Bello', email:'zainab.b@example.com', phone:'+234 809 555 0168', spent:76800, visits:11, balance:0 },
    { id:'c4', name:'Chidi Eze', email:'chidi.eze@example.com', phone:'+234 802 555 0199', spent:52200, visits:8, balance:8000 },
    { id:'c5', name:'Ngozi Nwosu', email:'ngozi.n@example.com', phone:'+234 805 555 0122', spent:38900, visits:6, balance:0 },
  ],
  sales: [
    { id:'SL-2048', date:new Date(Date.now()-1000*60*28).toISOString(), customer:'Amara Okafor', items:3, total:19800, method:'Card', status:'Completed', lines:[{productId:'p1',name:'Arabica Coffee Beans',qty:1,price:8500,cost:5200},{productId:'p4',name:'Dark Chocolate Bar',qty:2,price:1800,cost:950}] },
    { id:'SL-2047', date:new Date(Date.now()-1000*60*95).toISOString(), customer:'Walk-in customer', items:2, total:9700, method:'Cash', status:'Completed', lines:[{productId:'p2',name:'Ceramic Coffee Mug',qty:1,price:6500,cost:3100},{productId:'p10',name:'Butter Croissant',qty:2,price:1600,cost:700}] },
    { id:'SL-2046', date:new Date(Date.now()-1000*60*60*4).toISOString(), customer:'Zainab Bello', items:4, total:16400, method:'Transfer', status:'Completed', lines:[{productId:'p3',name:'Oat Milk 1L',qty:2,price:3200,cost:2100},{productId:'p4',name:'Dark Chocolate Bar',qty:2,price:1800,cost:950},{productId:'p10',name:'Butter Croissant',qty:2,price:1600,cost:700}] },
    { id:'SL-2045', date:new Date(Date.now()-1000*60*60*8).toISOString(), customer:'Walk-in customer', items:1, total:9500, method:'Card', status:'Completed', lines:[{productId:'p9',name:'Stainless Water Bottle',qty:1,price:9500,cost:5700}] },
    { id:'SL-2044', date:new Date(Date.now()-1000*60*60*21).toISOString(), customer:'Tunde Adebayo', items:3, total:14200, method:'Transfer', status:'Completed', lines:[{productId:'p6',name:'Cold Brew Bottle',qty:2,price:5000,cost:2700},{productId:'p11',name:'Blueberry Muffin',qty:1,price:2200,cost:900}] },
  ],
  expenses: [
    { id:'EX-091', title:'Shop rent', category:'Rent', date:today(), amount:180000, method:'Transfer' },
    { id:'EX-090', title:'Packaging supplies', category:'Supplies', date:today(), amount:24500, method:'Card' },
    { id:'EX-089', title:'Internet subscription', category:'Utilities', date:new Date(Date.now()-86400000*2).toISOString().slice(0,10), amount:12000, method:'Transfer' },
  ]
};

function loadStore(): Store {
  try { const raw = localStorage.getItem('stockwise_store_v1'); if (raw) return JSON.parse(raw) as Store; } catch { /* use demo seed */ }
  return initialStore;
}
const nav: { label: Page; icon: typeof Home; group: string }[] = [
  {label:'Overview',icon:LayoutDashboard,group:'WORKSPACE'}, {label:'Point of sale',icon:ShoppingCart,group:'WORKSPACE'},
  {label:'Products',icon:Package,group:'CATALOGUE'}, {label:'Inventory',icon:Boxes,group:'CATALOGUE'},
  {label:'Sales',icon:Receipt,group:'MANAGE'}, {label:'Customers',icon:Users,group:'MANAGE'}, {label:'Expenses',icon:Wallet,group:'MANAGE'}, {label:'Tax',icon:Calculator,group:'MANAGE'},
  {label:'Reports',icon:BarChart3,group:'INSIGHTS'}, {label:'Settings',icon:Settings,group:'SYSTEM'}
];

export default function App() {
  const [store,setStore] = useState<Store>(loadStore);
  const [page,setPage] = useState<Page>('Overview');
  const [search,setSearch] = useState('');
  const [notice,setNotice] = useState('');
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [period,setPeriod] = useState('Today');
  const [modal,setModal] = useState<'product'|'customer'|'expense'|'stock'|'refund'|null>(null);
  const [activeProduct,setActiveProduct] = useState<Product|null>(null);
  const [activeSale,setActiveSale] = useState<Sale|null>(null);
  const [cart,setCart] = useState<{product:Product;qty:number}[]>([]);
  const [posSearch,setPosSearch] = useState('');
  const [category,setCategory] = useState('All items');
  const [customerPick,setCustomerPick] = useState('Walk-in customer');
  const [paymentMethod,setPaymentMethod] = useState('Cash');
  const [discount,setDiscount] = useState(0);
  const [productForm,setProductForm] = useState({name:'',sku:'',category:'Beverages',price:'',cost:'',stock:'',reorder:'5',unit:'piece'});
  const [customerForm,setCustomerForm] = useState({name:'',email:'',phone:''});
  const [expenseForm,setExpenseForm] = useState({title:'',category:'Supplies',amount:'',method:'Transfer'});
  const [stockQty,setStockQty] = useState('');
  const [stockMode,setStockMode] = useState<'add'|'remove'|'set'>('add');
  const [settingsName,setSettingsName] = useState('Caltax Store');
  const [settingsTax,setSettingsTax] = useState('7.5');
  const [settingsCurrency,setSettingsCurrency] = useState('NGN');
  const [taxSettings,setTaxSettings] = useState<TaxSettings>(loadTaxSettings);
  const [cameraStream,setCameraStream] = useState<MediaStream|null>(null);
  const [cameraPhoto,setCameraPhoto] = useState<string|null>(null);
  const [cameraError,setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { localStorage.setItem('stockwise_store_v1',JSON.stringify(store)); },[store]);
  useEffect(() => { localStorage.setItem('caltax_tax_settings_v1',JSON.stringify(taxSettings)); },[taxSettings]);
  useEffect(() => { if (!notice) return; const t = window.setTimeout(()=>setNotice(''),3200); return ()=>window.clearTimeout(t); },[notice]);
  useEffect(() => {
    if (modal !== 'product') {
      setCameraPhoto(null);
      setCameraError('');
      setCameraStream(null);
    }
  },[modal]);
  useEffect(() => {
    if (!cameraStream) return;
    const video = videoRef.current;
    if (video) {
      video.srcObject = cameraStream;
      void video.play().catch(() => setCameraError('The camera preview could not start. Check your browser camera permissions.'));
    }
    return () => cameraStream.getTracks().forEach(track=>track.stop());
  },[cameraStream]);

  const todaySales = useMemo(()=>store.sales.filter(s=>s.status==='Completed' && new Date(s.date).toDateString()===new Date().toDateString()),[store.sales]);
  const todayRevenue = todaySales.reduce((sum,s)=>sum+s.total,0);
  const totalSales = store.sales.filter(s=>s.status==='Completed').reduce((sum,s)=>sum+s.total,0);
  const lowStock = store.products.filter(p=>p.stock<=p.reorder);
  const inventoryValue = store.products.reduce((sum,p)=>sum+p.stock*p.cost,0);
  const categories = ['All items',...Array.from(new Set(store.products.map(p=>p.category)))];
  const filteredProducts = store.products.filter(p=>(p.name+' '+p.sku+' '+p.category).toLowerCase().includes(search.toLowerCase()));
  const cartSubtotal = cart.reduce((sum,item)=>sum+item.product.price*item.qty,0);
  const cartTotal = Math.max(0,cartSubtotal-discount);

  const addToCart = (product:Product) => {
    if (product.stock<1) { setNotice('This item is out of stock.'); return; }
    setCart(prev=> { const found=prev.find(i=>i.product.id===product.id); if(found) { if(found.qty>=product.stock) { setNotice('You have reached available stock.'); return prev; } return prev.map(i=>i.product.id===product.id?{...i,qty:i.qty+1}:i); } return [...prev,{product,qty:1}]; });
  };
  const changeQty = (productId:string,delta:number) => setCart(prev=>prev.map(i=>i.product.id===productId?{...i,qty:Math.min(i.product.stock,Math.max(0,i.qty+delta))}:i).filter(i=>i.qty>0));
  const checkout = () => {
    if (!cart.length) { setNotice('Add at least one product before checkout.'); return; }
    const unavailable=cart.find(i=>!store.products.find(p=>p.id===i.product.id || (p.id===i.product.id && p.stock>=i.qty)) || (store.products.find(p=>p.id===i.product.id)?.stock ?? 0)<i.qty);
    if(unavailable) { setNotice(`Not enough stock for ${unavailable.product.name}.`); return; }
    const sale:Sale={id:id('SL'),date:new Date().toISOString(),customer:customerPick,items:cart.reduce((n,i)=>n+i.qty,0),total:cartTotal,method:paymentMethod,status:'Completed',lines:cart.map(i=>({productId:i.product.id,name:i.product.name,qty:i.qty,price:i.product.price,cost:i.product.cost}))};
    setStore(prev=>({...prev,products:prev.products.map(p=>{const item=cart.find(i=>i.product.id===p.id);return item?{...p,stock:p.stock-item.qty}:p;}),sales:[sale,...prev.sales],customers:prev.customers.map(c=>c.name===customerPick?{...c,spent:c.spent+cartTotal,visits:c.visits+1}:c)}));
    setCart([]);setDiscount(0);setCustomerPick('Walk-in customer');setNotice(`Sale ${sale.id} completed successfully.`);
  };
  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera access is unavailable. Use a supported browser on HTTPS or localhost.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      setCameraStream(stream);
    } catch (error) {
      const cameraError = error instanceof DOMException ? error.name : '';
      setCameraError(cameraError==='NotAllowedError'?'Camera access was denied. Allow camera access in your browser settings and try again.':cameraError==='NotFoundError'?'No camera was found on this device.':'Could not access the camera. Check browser permissions and try again.');
    }
  };
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Wait for the live camera preview before taking a photo.');
      return;
    }
    const scale = Math.min(1,480/Math.max(video.videoWidth,video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth*scale);
    canvas.height = Math.round(video.videoHeight*scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Could not capture the photo. Please try again.');
      return;
    }
    context.drawImage(video,0,0,canvas.width,canvas.height);
    setCameraPhoto(canvas.toDataURL('image/jpeg',0.7));
    setCameraError('');
    setCameraStream(null);
  };
  const addProduct = (e:React.FormEvent) => { e.preventDefault(); if(!productForm.name.trim()||!productForm.sku.trim()||Number(productForm.price)<=0||Number(productForm.stock)<0){setNotice('Complete the required product fields.');return;} if(store.products.some(p=>p.sku.toLowerCase()===productForm.sku.trim().toLowerCase())){setNotice('That SKU already exists.');return;} const p:Product={id:id('P'),name:productForm.name.trim(),sku:productForm.sku.trim(),category:productForm.category,price:Number(productForm.price),cost:Number(productForm.cost)||0,stock:Number(productForm.stock),reorder:Number(productForm.reorder)||0,unit:productForm.unit,color:'blue',...(cameraPhoto?{photo:cameraPhoto}:{})};setStore(prev=>({...prev,products:[p,...prev.products]}));setProductForm({name:'',sku:'',category:'Beverages',price:'',cost:'',stock:'',reorder:'5',unit:'piece'});setCameraPhoto(null);setModal(null);setNotice('Product added to your catalogue.'); };
  const addCustomer = (e:React.FormEvent) => { e.preventDefault(); if(!customerForm.name.trim()){setNotice('Enter a customer name.');return;} const c:Customer={id:id('C'),name:customerForm.name.trim(),email:customerForm.email.trim(),phone:customerForm.phone.trim(),spent:0,visits:0,balance:0};setStore(prev=>({...prev,customers:[c,...prev.customers]}));setCustomerForm({name:'',email:'',phone:''});setModal(null);setNotice('Customer added.'); };
  const addPosCustomer = (name:string):string|null => {
    const trimmedName=name.trim();
    if(!trimmedName){setNotice('Enter a customer name.');return null;}
    const existingCustomer=store.customers.find(customer=>customer.name.toLocaleLowerCase()===trimmedName.toLocaleLowerCase());
    if(existingCustomer){setNotice('That customer already exists; selected the existing customer.');return existingCustomer.name;}
    const customer:Customer={id:id('C'),name:trimmedName,email:'',phone:'',spent:0,visits:0,balance:0};
    setStore(prev=>({...prev,customers:[customer,...prev.customers]}));
    setNotice('Customer added.');
    return customer.name;
  };
  const addExpense = (e:React.FormEvent) => { e.preventDefault(); if(!expenseForm.title.trim()||Number(expenseForm.amount)<=0){setNotice('Enter an expense description and amount.');return;} const ex:Expense={id:id('EX'),title:expenseForm.title.trim(),category:expenseForm.category,date:today(),amount:Number(expenseForm.amount),method:expenseForm.method};setStore(prev=>({...prev,expenses:[ex,...prev.expenses]}));setExpenseForm({title:'',category:'Supplies',amount:'',method:'Transfer'});setModal(null);setNotice('Expense recorded.'); };
  const updateStock = (e:React.FormEvent) => {
    e.preventDefault();
    const quantity=Number(stockQty);
    if(!activeProduct||stockQty.trim()===''||!Number.isFinite(quantity)||quantity<0){setNotice('Enter a valid stock quantity.');return;}
    const adjustedStock=stockMode==='add'?activeProduct.stock+quantity:stockMode==='remove'?activeProduct.stock-quantity:quantity;
    if(adjustedStock<0){setNotice(`Cannot remove more stock than the ${activeProduct.stock} currently available.`);return;}
    setStore(prev=>({...prev,products:prev.products.map(p=>p.id===activeProduct.id?{...p,stock:adjustedStock}:p)}));
    setModal(null);
    setStockQty('');
    setStockMode('add');
    setActiveProduct(null);
    setNotice('Inventory updated.');
  };
  const refundSale = () => { if(!activeSale)return; if(activeSale.status==='Refunded'){setNotice('This sale has already been refunded.');return;}setStore(prev=>({...prev,sales:prev.sales.map(s=>s.id===activeSale.id?{...s,status:'Refunded'}:s),products:prev.products.map(p=>{const line=activeSale.lines.find(l=>l.productId===p.id);return line?{...p,stock:p.stock+line.qty}:p;})}));setModal(null);setActiveSale(null);setNotice(`Sale ${activeSale.id} refunded and stock restored.`); };
  const exportCsv = (kind:'products'|'sales'|'expenses') => { const rows=kind==='products'?[['Name','SKU','Category','Price','Cost','Stock','Reorder level'],...store.products.map(p=>[p.name,p.sku,p.category,p.price,p.cost,p.stock,p.reorder])]:kind==='sales'?[['Sale ID','Date','Customer','Items','Total','Payment method','Status'],...store.sales.map(s=>[s.id,new Date(s.date).toLocaleString(),s.customer,s.items,s.total,s.method,s.status])]:[['Expense ID','Title','Category','Date','Amount','Method'],...store.expenses.map(x=>[x.id,x.title,x.category,x.date,x.amount,x.method])];const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`caltax-${kind}-${today()}.csv`;a.click();URL.revokeObjectURL(url);setNotice(`${kind} CSV exported.`); };

  const pageTitle = page==='Point of sale'?'Point of sale':page;
  const pageSubtitle:Record<Page,string>={'Overview':'Here’s what’s happening with your business today.','Point of sale':'A faster way to serve customers and complete sales.','Products':'Manage your catalogue, pricing and product details.','Inventory':'Track stock levels and stay ahead of replenishment.','Sales':'Review transactions, payment methods and refunds.','Customers':'Build customer relationships and track account activity.','Expenses':'Keep your business spending organized.','Tax':'Estimate tax on profit since your last filing and track your next due date.','Reports':'Understand your performance and make better decisions.','Settings':'Configure your store and business preferences.'};

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><Boxes size={22}/></div><div><div className="brand-name">Caltax<span>.</span></div><div className="brand-caption">BUSINESS MANAGER</div></div><button className="icon-button sidebar-close" onClick={()=>setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <button className="store-switcher"><div className="store-avatar"><Building2 size={16}/></div><div className="store-info"><strong>{settingsName}</strong><span>Retail store · Main branch</span></div><ChevronDown size={16} className="muted"/></button>
      <nav className="side-nav">{['WORKSPACE','CATALOGUE','MANAGE','INSIGHTS','SYSTEM'].map(group=><div className="nav-group" key={group}><div className="nav-label">{group}</div>{nav.filter(n=>n.group===group).map(item=>{const Icon=item.icon;return <button key={item.label} className={`nav-item ${page===item.label?'active':''}`} onClick={()=>{setPage(item.label);setSearch('');setSidebarOpen(false);}}><Icon size={18}/><span>{item.label}</span>{item.label==='Inventory'&&lowStock.length>0&&<span className="nav-count">{lowStock.length}</span>}</button>;})}</div>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={16}/></div><strong>Need a hand?</strong><p>Explore tips to get more from Caltax.</p><button onClick={()=>setNotice('Help centre: this demo is ready for your own documentation links.')}>Visit help centre <ArrowRight size={13}/></button></div><button className="profile-button"><div className="profile-avatar">AO</div><div className="profile-info"><strong>Alex Okoro</strong><span>Store administrator</span></div><MoreDots/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setSidebarOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/><strong>{pageTitle}</strong></div></div><div className="topbar-actions"><div className="global-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." aria-label="Search"/><kbd>⌘ K</kbd></div><button className="icon-button notification-button" onClick={()=>setNotice(lowStock.length?`${lowStock.length} products are at or below reorder level.`:'You are all caught up.')} aria-label="Notifications"><Bell size={18}/>{lowStock.length>0&&<i/>}</button><div className="topbar-divider"/><div className="user-chip"><div className="profile-avatar small">AO</div><ChevronDown size={14}/></div></div></header>
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow">{new Date().toLocaleDateString('en-NG',{weekday:'long',month:'long',day:'numeric'})}</div><h1>{pageTitle==='Overview'?'Good morning, Alex 👋':pageTitle}</h1><p>{pageSubtitle[page]}</p></div><div className="heading-actions">{page==='Overview'&&<button className="btn btn-secondary" onClick={()=>exportCsv('sales')}><Download size={16}/> Export</button>}{page==='Overview'&&<button className="btn btn-primary" onClick={()=>setPage('Point of sale')}><Plus size={17}/> New sale</button>}{page==='Products'&&<button className="btn btn-primary" onClick={()=>setModal('product')}><Plus size={17}/> Add product</button>}{page==='Customers'&&<button className="btn btn-primary" onClick={()=>setModal('customer')}><Plus size={17}/> Add customer</button>}{page==='Expenses'&&<button className="btn btn-primary" onClick={()=>setModal('expense')}><Plus size={17}/> Add expense</button>}{page==='Inventory'&&<button className="btn btn-secondary" onClick={()=>exportCsv('products')}><Download size={16}/> Export stock</button>}{page==='Sales'&&<button className="btn btn-secondary" onClick={()=>exportCsv('sales')}><Download size={16}/> Export sales</button>}</div></div>
      {page==='Overview'&&<Overview store={store} todayRevenue={todayRevenue} todaySales={todaySales} totalSales={totalSales} lowStock={lowStock} inventoryValue={inventoryValue} setPage={setPage} setActiveProduct={setActiveProduct} setModal={setModal} setActiveSale={setActiveSale} />}
      {page==='Point of sale'&&<Pos store={store} cart={cart} addToCart={addToCart} changeQty={changeQty} subtotal={cartSubtotal} total={cartTotal} posSearch={posSearch} setPosSearch={setPosSearch} category={category} setCategory={setCategory} categories={categories} customerPick={customerPick} setCustomerPick={setCustomerPick} addCustomer={addPosCustomer} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} discount={discount} setDiscount={setDiscount} checkout={checkout} />}
      {page==='Products'&&<Products products={filteredProducts} setModal={setModal} setActiveProduct={setActiveProduct} exportCsv={()=>exportCsv('products')} />}
      {page==='Inventory'&&<Inventory products={filteredProducts} lowStock={lowStock} inventoryValue={inventoryValue} setModal={setModal} setActiveProduct={setActiveProduct} />}
      {page==='Sales'&&<Sales sales={store.sales.filter(s=>(s.id+' '+s.customer+' '+s.method).toLowerCase().includes(search.toLowerCase()))} setActiveSale={setActiveSale} setModal={setModal} exportCsv={()=>exportCsv('sales')} />}
      {page==='Customers'&&<Customers customers={store.customers.filter(c=>(c.name+' '+c.email+' '+c.phone).toLowerCase().includes(search.toLowerCase()))} />}
      {page==='Expenses'&&<Expenses expenses={store.expenses.filter(x=>(x.title+' '+x.category).toLowerCase().includes(search.toLowerCase()))} onExport={()=>exportCsv('expenses')} />}
      {page==='Tax'&&<TaxPage store={store} settings={taxSettings} onSettingsChange={setTaxSettings} />}
      {page==='Reports'&&<Reports store={store} todayRevenue={todayRevenue} totalSales={totalSales} inventoryValue={inventoryValue} />}
      {page==='Settings'&&<SettingsPage settingsName={settingsName} setSettingsName={setSettingsName} settingsTax={settingsTax} setSettingsTax={setSettingsTax} settingsCurrency={settingsCurrency} setSettingsCurrency={setSettingsCurrency} onSave={()=>setNotice('Store settings saved on this device.')} onReset={()=>{localStorage.removeItem('stockwise_store_v1');setStore(initialStore);setNotice('Demo data has been reset.');}} />}
      <footer className="footer"><span>© 2026 Caltax. Built for better business.</span><span><span className="status-dot"/> All changes saved locally <span className="footer-sep">·</span> v1.0.0</span></footer>
      </div>
    </main>
    {sidebarOpen&&<div className="mobile-scrim" onClick={()=>setSidebarOpen(false)}/>}
    {notice&&<div className="toast"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
    {modal&&<Modal title={modal==='product'?'Add a new product':modal==='customer'?'Add a customer':modal==='expense'?'Record an expense':modal==='stock'?'Update stock':'Refund sale'} onClose={()=>{setModal(null);setActiveProduct(null);setActiveSale(null);}}>{modal==='product'?<form className="form-stack" onSubmit={addProduct}><div className="form-grid"><Field label="Product name *"><input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="e.g. Espresso beans"/></Field><Field label="SKU / barcode *"><input required value={productForm.sku} onChange={e=>setProductForm({...productForm,sku:e.target.value})} placeholder="e.g. COF-015"/></Field><Field label="Category"><select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{['Beverages','Snacks','Home & Living','Accessories','Bakery','Other'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Unit"><select value={productForm.unit} onChange={e=>setProductForm({...productForm,unit:e.target.value})}>{['piece','bag','bottle','carton','box','kg','litre','tin'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Selling price (₦) *"><input required type="number" min="1" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})} placeholder="0"/></Field><Field label="Cost price (₦)"><input type="number" min="0" value={productForm.cost} onChange={e=>setProductForm({...productForm,cost:e.target.value})} placeholder="0"/></Field><Field label="Opening stock *"><input required type="number" min="0" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})} placeholder="0"/></Field><Field label="Low stock threshold"><input type="number" min="0" value={productForm.reorder} onChange={e=>setProductForm({...productForm,reorder:e.target.value})}/></Field></div><div className="camera-capture"><div className="camera-capture-heading"><strong>Product photo</strong><span>Take a live photo with your camera</span></div>{cameraPhoto?<div className="camera-photo-result"><img src={cameraPhoto} alt="Captured product preview"/><div><button type="button" className="btn btn-secondary btn-small" onClick={startCamera}><Camera size={15}/> Retake photo</button><button type="button" className="camera-remove" onClick={()=>setCameraPhoto(null)}>Remove photo</button></div></div>:cameraStream?<div className="camera-live"><video ref={videoRef} autoPlay playsInline muted/><div><button type="button" className="btn btn-primary btn-small" onClick={capturePhoto}><Camera size={15}/> Capture photo</button><button type="button" className="btn btn-secondary btn-small" onClick={()=>setCameraStream(null)}>Cancel camera</button></div></div>:<button type="button" className="btn btn-secondary" onClick={startCamera}><Camera size={16}/> Take photo</button>}{cameraError&&<p className="camera-error" role="alert">{cameraError}</p>}</div><ModalActions onCancel={()=>setModal(null)} submit="Add product"/></form>:null}
    {modal==='customer'?<form className="form-stack" onSubmit={addCustomer}><Field label="Full name *"><input required value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})} placeholder="Customer name"/></Field><Field label="Email address"><input type="email" value={customerForm.email} onChange={e=>setCustomerForm({...customerForm,email:e.target.value})} placeholder="name@example.com"/></Field><Field label="Phone number"><input value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})} placeholder="+234..."/></Field><ModalActions onCancel={()=>setModal(null)} submit="Add customer"/></form>:null}
    {modal==='expense'?<form className="form-stack" onSubmit={addExpense}><Field label="Expense description *"><input required value={expenseForm.title} onChange={e=>setExpenseForm({...expenseForm,title:e.target.value})} placeholder="What was this expense for?"/></Field><div className="form-grid"><Field label="Category"><select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}>{['Supplies','Rent','Utilities','Transport','Marketing','Payroll','Other'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Amount (₦) *"><input required type="number" min="1" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})} placeholder="0"/></Field><Field label="Payment method"><select value={expenseForm.method} onChange={e=>setExpenseForm({...expenseForm,method:e.target.value})}>{['Cash','Card','Transfer'].map(c=><option key={c}>{c}</option>)}</select></Field></div><ModalActions onCancel={()=>setModal(null)} submit="Save expense"/></form>:null}
    {modal==='stock'?<form className="form-stack" onSubmit={updateStock}><div className="stock-product-summary">{activeProduct&&<ProductThumb product={activeProduct}/>}<div><strong>{activeProduct?.name}</strong><span>{activeProduct?.sku} · Current stock: {activeProduct?.stock}</span></div></div><Field label="Adjustment type"><select value={stockMode} onChange={e=>setStockMode(e.target.value as 'add'|'remove'|'set')}><option value="add">Add Stock</option><option value="remove">Remove Stock</option><option value="set">Set Exact Stock</option></select></Field><Field label={stockMode==='add'?'Quantity to add':stockMode==='remove'?'Quantity to remove':'New stock count'}><input type="number" min="0" required value={stockQty} onChange={e=>setStockQty(e.target.value)} placeholder="Enter quantity"/></Field><ModalActions onCancel={()=>setModal(null)} submit="Update stock"/></form>:null}
    {modal==='refund'?<div className="form-stack"><div className="refund-warning"><AlertTriangle size={20}/><div><strong>Refund {activeSale?.id}?</strong><p>This marks the sale as refunded and returns the sold quantities to inventory. It does not move money through a payment provider.</p></div></div><div className="refund-total"><span>Refund amount</span><strong>{money(activeSale?.total||0)}</strong></div><ModalActions onCancel={()=>setModal(null)} submit="Confirm refund" onSubmit={refundSale}/></div>:null}
    </Modal>}
  </div>;
}

function MoreDots(){return <span className="more-dots">···</span>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-card"><div className="modal-header"><div><h2>{title}</h2><p>Enter the details below to continue.</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div>{children}</div></div>}
function ModalActions({onCancel,submit,onSubmit}:{onCancel:()=>void;submit:string;onSubmit?:()=>void}){return <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button><button type={onSubmit?'button':'submit'} className="btn btn-primary" onClick={onSubmit}>{submit}</button></div>}
function PageCard({title,subtitle,action,children,className=''}:{title:string;subtitle?:string;action?:React.ReactNode;children:React.ReactNode;className?:string}){return <section className={`panel ${className}`}><div className="panel-header"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>}
function Avatar({name,size='normal'}:{name:string;size?:'normal'|'small'}){const colors=['av-lilac','av-green','av-orange','av-blue','av-pink'];const idx=name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%colors.length;return <div className={`customer-avatar ${colors[idx]} ${size==='small'?'avatar-small':''}`}>{name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>}
function ProductPhoto({product}:{product:Product}){return <img className="product-photo" src={product.photo||productPhotoUrl(product)} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>}
function ProductThumb({product}:{product:Product}){const colors:Record<string,string>={tan:'tan',blue:'blue',green:'green',brown:'brown',pink:'pink',purple:'purple',orange:'orange'};return <div className={`product-thumb ${colors[product.color]||'blue'}`}><Package size={19}/><ProductPhoto product={product}/></div>}
function StatusPill({status}:{status:string}){const c=status==='Completed'?'status-success':status==='Refunded'?'status-danger':status==='Low stock'?'status-warning':'status-neutral';return <span className={`status-pill ${c}`}><i/>{status}</span>}

function Overview({store,todayRevenue,todaySales,totalSales,lowStock,inventoryValue,setPage,setActiveProduct,setModal,setActiveSale}:{store:Store;todayRevenue:number;todaySales:Sale[];totalSales:number;lowStock:Product[];inventoryValue:number;setPage:(p:Page)=>void;setActiveProduct:(p:Product)=>void;setModal:(m:'product'|'customer'|'expense'|'stock'|'refund'|null)=>void;setActiveSale:(s:Sale)=>void}){
  const weekly=[{day:'Mon',value:0.53},{day:'Tue',value:0.72},{day:'Wed',value:0.44},{day:'Thu',value:0.82},{day:'Fri',value:0.62},{day:'Sat',value:0.95},{day:'Sun',value:0.68}];const max=weekly.reduce((m,d)=>Math.max(m,d.value),0);const grossProfit=store.sales.filter(s=>s.status==='Completed').reduce((sum,s)=>sum+s.lines.reduce((lineSum,l)=>lineSum+(l.price-l.cost)*l.qty,0),0);const topProducts=store.products.map(p=>({...p,sold:store.sales.filter(s=>s.status==='Completed').flatMap(s=>s.lines).filter(l=>l.productId===p.id).reduce((n,l)=>n+l.qty,0)})).sort((a,b)=>b.sold-a.sold).slice(0,4);
  return <><div className="metric-grid dashboard-metrics"><Metric title="Today's revenue" value={shortMoney(todayRevenue)} change="Live total" positive icon={CircleDollarSign} tint="green" note={`${todaySales.length} completed sales`}/><Metric title="Total transactions" value={String(store.sales.filter(s=>s.status==='Completed').length)} change="All time" positive icon={ShoppingBag} tint="purple" note={`${store.sales.filter(s=>s.status==='Refunded').length} refunded`}/><Metric title="Inventory value" value={shortMoney(inventoryValue)} change={`${store.products.length} products`} positive icon={Boxes} tint="blue" note="At cost price"/><Metric title="Gross profit" value={shortMoney(grossProfit)} change="All time" positive icon={TrendingUp} tint="orange" note="Before expenses"/></div>
  <div className="dashboard-grid"><PageCard title="Sales overview" subtitle="Your weekly sales performance" action={<select className="compact-select" defaultValue="This week"><option>This week</option><option>This month</option></select>} className="sales-chart-panel"><div className="chart-summary"><strong>{shortMoney(todayRevenue)}</strong><span><span className="trend-up"><ArrowUpRight size={14}/> Revenue today</span></span></div><div className="chart-area"><div className="chart-y-labels"><span>₦100k</span><span>₦75k</span><span>₦50k</span><span>₦25k</span><span>₦0</span></div><div className="chart-main"><div className="chart-grid-lines"><i/><i/><i/><i/><i/></div><div className="bar-chart">{weekly.map((d,i)=><div className="bar-group" key={d.day}><div className="bar-rail"><div className={`bar ${i===5?'bar-highlight':''}`} style={{height:`${d.value/max*100}%`}}/></div><span>{d.day}</span></div>)}</div></div></div><div className="chart-footnote"><span><i className="legend-dot"/> Revenue</span><span>Demo trend · illustrative</span></div></PageCard>
  <PageCard title="Inventory alerts" subtitle={`${lowStock.length} products need attention`} action={<button className="text-action" onClick={()=>setPage('Inventory')}>View inventory <ArrowRight size={14}/></button>}><div className="alert-list">{lowStock.slice(0,4).map(p=><div className="alert-row" key={p.id}><ProductThumb product={p}/><div className="alert-product"><strong>{p.name}</strong><span>{p.sku}</span></div><div className="alert-stock"><strong>{p.stock} left</strong><span>Reorder at {p.reorder}</span></div><button className="mini-action" title="Update stock" onClick={()=>{setActiveProduct(p);setModal('stock');}}><Plus size={15}/></button></div>)}{lowStock.length===0&&<Empty icon={CheckCircle2} title="Stock looks healthy" text="No products are below their reorder level."/>}</div></PageCard>
  <PageCard title="Recent transactions" subtitle="Your latest customer orders" action={<button className="text-action" onClick={()=>setPage('Sales')}>View all <ArrowRight size={14}/></button>} className="transactions-panel"><div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>CUSTOMER</th><th>AMOUNT</th><th>STATUS</th><th/></tr></thead><tbody>{store.sales.slice(0,4).map(s=><tr key={s.id} onClick={()=>{setActiveSale(s);}}><td><strong className="id-text">{s.id}</strong><span className="cell-sub">{new Date(s.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></td><td><div className="customer-cell"><Avatar name={s.customer}/><span>{s.customer}</span></div></td><td><strong>{money(s.total)}</strong></td><td><StatusPill status={s.status}/></td><td><button className="row-more" onClick={e=>{e.stopPropagation();setActiveSale(s);setModal('refund');}} title="Refund sale"><RotateCcw size={15}/></button></td></tr>)}</tbody></table></div></PageCard>
  <PageCard title="Top products" subtitle="Based on recorded demo sales" action={<button className="text-action" onClick={()=>setPage('Products')}>All products <ArrowRight size={14}/></button>}><div className="top-products">{topProducts.map((p,i)=><div className="top-product-row" key={p.id}><span className="rank">0{i+1}</span><ProductThumb product={p}/><div className="top-product-info"><strong>{p.name}</strong><span>{p.sold} units sold</span></div><strong>{money(p.price*p.sold)}</strong></div>)}</div></PageCard>
  <div className="quick-actions-panel"><div><div className="quick-kicker"><Sparkles size={15}/> KEEP THINGS MOVING</div><h2>What would you like to do?</h2><p>Jump straight into your most common tasks.</p></div><div className="quick-actions"><button onClick={()=>setPage('Point of sale')}><span className="quick-icon purple"><ShoppingCart size={18}/></span><span><strong>New sale</strong><small>Start a checkout</small></span><ArrowRight size={15}/></button><button onClick={()=>setPage('Products')}><span className="quick-icon blue"><Package size={18}/></span><span><strong>Add products</strong><small>Grow your catalogue</small></span><ArrowRight size={15}/></button><button onClick={()=>{setActiveProduct(store.products[0]);setModal('stock');}}><span className="quick-icon orange"><Boxes size={18}/></span><span><strong>Update stock</strong><small>Adjust inventory</small></span><ArrowRight size={15}/></button></div></div></div></>;
}
function Metric({title,value,change,positive,icon:Icon,tint,note}:{title:string;value:string;change:string;positive:boolean;icon:typeof Home;tint:string;note:string}){return <div className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${tint}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={positive?'trend-up':'trend-down'}>{positive?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {change}</span><span className="metric-note">{note}</span></div></div>}
function Empty({icon:Icon,title,text}:{icon:typeof Home;title:string;text:string}){return <div className="empty-state"><span><Icon size={23}/></span><strong>{title}</strong><p>{text}</p></div>}

function Pos({store,cart,addToCart,changeQty,subtotal,total,posSearch,setPosSearch,category,setCategory,categories,customerPick,setCustomerPick,addCustomer,paymentMethod,setPaymentMethod,discount,setDiscount,checkout}:{store:Store;cart:{product:Product;qty:number}[];addToCart:(p:Product)=>void;changeQty:(id:string,d:number)=>void;subtotal:number;total:number;posSearch:string;setPosSearch:(v:string)=>void;category:string;setCategory:(v:string)=>void;categories:string[];customerPick:string;setCustomerPick:(v:string)=>void;addCustomer:(name:string)=>string|null;paymentMethod:string;setPaymentMethod:(v:string)=>void;discount:number;setDiscount:(v:number)=>void;checkout:()=>void}){
 const [addingCustomer,setAddingCustomer]=useState(false);
 const [newCustomerName,setNewCustomerName]=useState('');
 const list=store.products.filter(p=>(p.name+' '+p.sku).toLowerCase().includes(posSearch.toLowerCase())&&(category==='All items'||p.category===category));
 return <div className="pos-layout">
   <section className="pos-catalog">
     <div className="pos-search"><Search size={18}/><input autoFocus value={posSearch} onChange={e=>setPosSearch(e.target.value)} placeholder="Search products or scan barcode..."/><kbd>⌘ K</kbd></div>
     <div className="category-pills">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
     <div className="pos-product-grid">{list.map(p=><button key={p.id} className="pos-product" onClick={()=>addToCart(p)} disabled={p.stock===0}><div className={`pos-product-art ${p.color}`}><Package size={29}/><ProductPhoto product={p}/><span className={p.stock<=p.reorder?'stock-badge warning':'stock-badge'}>{p.stock} in stock</span></div><div className="pos-product-copy"><strong>{p.name}</strong><span>{p.category}</span><b>{money(p.price)}</b></div><span className="add-product"><Plus size={16}/></span></button>)}</div>
     {list.length===0&&<Empty icon={Search} title="No products found" text="Try another search or category."/>}
   </section>
   <aside className="cart-panel">
     <div className="cart-header"><div><h2>Current order</h2><p>{cart.reduce((n,i)=>n+i.qty,0)} items in cart</p></div><button className="clear-cart" onClick={()=>cart.forEach(i=>changeQty(i.product.id,-i.qty))} disabled={!cart.length}>Clear all</button></div>
     <div className="cart-customer"><Users size={17}/><select aria-label="Select customer" value={customerPick} onChange={e=>setCustomerPick(e.target.value)}><option>Walk-in customer</option>{store.customers.map(c=><option key={c.id}>{c.name}</option>)}</select><ChevronDown size={14}/><button type="button" className="pos-add-customer-toggle" onClick={()=>setAddingCustomer(value=>!value)}><Plus size={14}/><span>New</span></button></div>
     {addingCustomer&&<form className="pos-add-customer" onSubmit={e=>{e.preventDefault();const added=addCustomer(newCustomerName);if(added){setCustomerPick(added);setNewCustomerName('');setAddingCustomer(false);}}}><input aria-label="New customer name" autoFocus required value={newCustomerName} onChange={e=>setNewCustomerName(e.target.value)} placeholder="Enter customer name"/><button className="btn btn-primary btn-small" type="submit">Add</button></form>}
     <div className="cart-lines">{cart.map(item=><div className="cart-line" key={item.product.id}><ProductThumb product={item.product}/><div className="cart-line-main"><strong>{item.product.name}</strong><span>{money(item.product.price)} each</span><div className="qty-control"><button onClick={()=>changeQty(item.product.id,-1)} aria-label="Decrease quantity"><Minus size={12}/></button><span>{item.qty}</span><button onClick={()=>changeQty(item.product.id,1)} aria-label="Increase quantity"><Plus size={12}/></button></div></div><strong className="cart-line-total">{money(item.qty*item.product.price)}</strong></div>)}{!cart.length&&<Empty icon={ShoppingCart} title="Your cart is empty" text="Choose products to start a sale."/>}</div>
     <div className="cart-adjustments"><label>Discount (₦)<input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(Math.min(subtotal,Math.max(0,Number(e.target.value))))}/></label><label>Payment method<select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option>Cash</option><option>Card</option><option>Transfer</option><option>Split payment</option></select></label></div>
     <div className="cart-totals">
       <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
       <div><span>Discount</span><strong>−{money(discount)}</strong></div>
       <div className="cart-grand-total"><span>Total due</span><strong>{money(total)}</strong></div>
     </div>
     <button className="btn btn-primary checkout-button" disabled={!cart.length} onClick={checkout}><CreditCard size={18}/> Complete sale <span>{money(total)}</span></button>
     <div className="secure-note"><CheckCircle2 size={13}/> Demo mode · no real payment is processed</div>
   </aside>
 </div>;
}
function Products({products,setModal,setActiveProduct,exportCsv}:{products:Product[];setModal:(m:'product'|'customer'|'expense'|'stock'|'refund'|null)=>void;setActiveProduct:(p:Product)=>void;exportCsv:()=>void}){return <PageCard title="Product catalogue" subtitle={`${products.length} products in your catalogue`} action={<div className="inline-actions"><button className="btn btn-secondary btn-small" onClick={exportCsv}><Download size={15}/> Export CSV</button><button className="btn btn-secondary btn-small" onClick={()=>setModal('product')}><Plus size={15}/> Add product</button></div>}><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>SELLING PRICE</th><th>COST PRICE</th><th>STOCK</th><th/></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="product-cell"><ProductThumb product={p}/><div><strong>{p.name}</strong><span>{p.unit}</span></div></div></td><td className="muted-cell">{p.sku}</td><td><span className="category-tag">{p.category}</span></td><td><strong>{money(p.price)}</strong></td><td>{money(p.cost)}</td><td><StatusPill status={p.stock<=p.reorder?'Low stock':'In stock'}/><span className="stock-quantity">{p.stock} {p.unit}{p.stock===1?'':'s'}</span></td><td><button className="row-more" onClick={()=>{setActiveProduct(p);setModal('stock');}} title="Adjust stock"><SlidersHorizontal size={16}/></button></td></tr>)}</tbody></table>{products.length===0&&<Empty icon={Package} title="No products match" text="Try changing your search."/>}</div></PageCard>}
function Inventory({products,lowStock,inventoryValue,setModal,setActiveProduct}:{products:Product[];lowStock:Product[];inventoryValue:number;setModal:(m:'product'|'customer'|'expense'|'stock'|'refund'|null)=>void;setActiveProduct:(p:Product)=>void}){return <><div className="metric-grid three"><Metric title="Inventory at cost" value={shortMoney(inventoryValue)} change="Current stock" positive icon={Boxes} tint="blue" note="Cost valuation"/><Metric title="Total units" value={products.reduce((n,p)=>n+p.stock,0).toLocaleString()} change={`${products.length} SKUs`} positive icon={Package} tint="purple" note="Across all products"/><Metric title="Low stock items" value={String(lowStock.length)} change="Needs attention" positive={lowStock.length===0} icon={AlertTriangle} tint="orange" note="At/below reorder level"/></div><PageCard title="Stock levels" subtitle="Current quantities and reorder thresholds" action={<button className="btn btn-secondary btn-small" onClick={()=>{if(products[0]){setActiveProduct(products[0]);setModal('stock');}}}><SlidersHorizontal size={15}/> Adjust stock</button>}><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>ON HAND</th><th>REORDER LEVEL</th><th>STOCK STATUS</th><th>STOCK VALUE</th><th/></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="product-cell"><ProductThumb product={p}/><div><strong>{p.name}</strong><span>{p.category}</span></div></div></td><td>{p.sku}</td><td><strong>{p.stock}</strong> <span className="muted-cell">{p.unit}</span></td><td>{p.reorder} {p.unit}</td><td><StatusPill status={p.stock<=p.reorder?'Low stock':'In stock'}/></td><td>{money(p.stock*p.cost)}</td><td><button className="row-more" onClick={()=>{setActiveProduct(p);setModal('stock');}}><SlidersHorizontal size={15}/></button></td></tr>)}</tbody></table></div></PageCard></>}
function Sales({sales,setActiveSale,setModal,exportCsv}:{sales:Sale[];setActiveSale:(s:Sale)=>void;setModal:(m:'product'|'customer'|'expense'|'stock'|'refund'|null)=>void;exportCsv:()=>void}){return <PageCard title="Sales history" subtitle={`${sales.length} transactions recorded`} action={<button className="btn btn-secondary btn-small" onClick={exportCsv}><Download size={15}/> Export CSV</button>}><div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>DATE & TIME</th><th>CUSTOMER</th><th>ITEMS</th><th>PAYMENT</th><th>TOTAL</th><th>STATUS</th><th/></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td><strong className="id-text">{s.id}</strong></td><td>{new Date(s.date).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td>{s.customer}</td><td>{s.items}</td><td><span className="payment-tag">{s.method}</span></td><td><strong>{money(s.total)}</strong></td><td><StatusPill status={s.status}/></td><td><button className="row-more" title="Refund" disabled={s.status==='Refunded'} onClick={()=>{setActiveSale(s);setModal('refund');}}><RotateCcw size={15}/></button></td></tr>)}</tbody></table>{sales.length===0&&<Empty icon={Receipt} title="No transactions found" text="Completed sales will appear here."/>}</div></PageCard>}
function Customers({customers}:{customers:Customer[]}){return <PageCard title="Customer directory" subtitle={`${customers.length} customer profiles`}><div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>CONTACT</th><th>ORDERS</th><th>LIFETIME SPEND</th><th>OUTSTANDING</th><th>SEGMENT</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td><div className="customer-cell"><Avatar name={c.name}/><div><strong>{c.name}</strong><span className="cell-sub">Added customer</span></div></div></td><td><div className="contact-cell"><span>{c.email||'—'}</span><span>{c.phone||'No phone'}</span></div></td><td>{c.visits}</td><td><strong>{money(c.spent)}</strong></td><td><strong className={c.balance?'text-warning':''}>{money(c.balance)}</strong></td><td><span className="category-tag">{c.spent>75000?'Loyal customer':c.visits===0?'New customer':'Returning'}</span></td></tr>)}</tbody></table>{customers.length===0&&<Empty icon={Users} title="No customers found" text="Add a customer to start building your directory."/>}</div></PageCard>}
function Expenses({expenses,onExport}:{expenses:Expense[];onExport:()=>void}){const total=expenses.reduce((n,x)=>n+x.amount,0);return <><div className="metric-grid three"><Metric title="Recorded expenses" value={shortMoney(total)} change="All recorded" positive icon={Wallet} tint="orange" note="Expenses in this demo"/><Metric title="Expense entries" value={String(expenses.length)} change="Records" positive icon={ClipboardList} tint="blue" note="Across categories"/><Metric title="Largest expense" value={shortMoney(Math.max(0,...expenses.map(e=>e.amount)))} change="Single entry" positive icon={CircleDollarSign} tint="purple" note={expenses.slice().sort((a,b)=>b.amount-a.amount)[0]?.title||'No entries'} /></div><PageCard title="Expense ledger" subtitle="Track outgoing business payments" action={<button className="btn btn-secondary btn-small" onClick={onExport}><Download size={15}/> Export CSV</button>}><div className="table-wrap"><table><thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th>PAYMENT METHOD</th><th>AMOUNT</th></tr></thead><tbody>{expenses.map(x=><tr key={x.id}><td><div className="expense-name"><span className="expense-icon"><Receipt size={17}/></span><div><strong>{x.title}</strong><span>{x.id}</span></div></div></td><td><span className="category-tag">{x.category}</span></td><td>{new Date(x.date).toLocaleDateString()}</td><td>{x.method}</td><td><strong>{money(x.amount)}</strong></td></tr>)}</tbody></table>{expenses.length===0&&<Empty icon={Wallet} title="No expenses recorded" text="Record business expenses to see them here."/>}</div></PageCard></>}
function TaxPage({store,settings,onSettingsChange}:{store:Store;settings:TaxSettings;onSettingsChange:(settings:TaxSettings)=>void}){
  const validPeriod=Boolean(settings.lastFilingDate&&settings.lastFilingDate<=today());
  const periodSales=validPeriod?store.sales.filter(s=>s.status==='Completed'&&s.date.slice(0,10)>=settings.lastFilingDate&&s.date.slice(0,10)<=today()):[];
  const revenue=periodSales.reduce((sum,s)=>sum+s.total,0);
  const costOfSales=periodSales.reduce((sum,s)=>sum+s.lines.reduce((lineSum,line)=>lineSum+line.cost*line.qty,0),0);
  const periodExpenses=validPeriod?store.expenses.filter(e=>e.date>=settings.lastFilingDate&&e.date<=today()).reduce((sum,e)=>sum+e.amount,0):0;
  const businessProfit=revenue-costOfSales-periodExpenses;
  const numeric=(value:string)=>Math.max(0,Number(value)||0);
  const personal=settings.personalDeductions;
  const personalRelief=Math.min(numeric(personal.rentPaid)*0.2,500_000)+numeric(personal.pension)+numeric(personal.nhf)+numeric(personal.nhis)+numeric(personal.lifeAssurance)+numeric(personal.mortgageInterest);
  const company=settings.additionalDeductions;
  const companyDeductions=numeric(company.capitalAllowances)+numeric(company.approvedDonations)+numeric(company.otherAllowable);
  const annualTurnover=numeric(settings.annualTurnover);
  const turnoverKnown=settings.annualTurnover!=='';
  const assetsKnown=settings.fixedAssets!=='';
  const smallCompany=turnoverKnown&&assetsKnown&&annualTurnover<=100_000_000&&numeric(settings.fixedAssets)<=250_000_000;
  const taxableProfit=Math.max(0,businessProfit+(settings.taxpayerType==='individual'?numeric(settings.otherTaxableIncome):0)-(settings.taxpayerType==='individual'?personalRelief:companyDeductions));
  const developmentLevyBase=Math.max(0,businessProfit-numeric(company.approvedDonations)-numeric(company.otherAllowable));
  const companyIncomeTax=settings.taxpayerType==='company'&&!smallCompany?taxableProfit*0.30:0;
  const developmentLevy=settings.taxpayerType==='company'&&!smallCompany?developmentLevyBase*0.04:0;
  const individualTax=settings.taxpayerType==='individual'?personalIncomeTax(taxableProfit):0;
  const estimatedTax=companyIncomeTax+developmentLevy+individualTax;
  const deadlineTimestamp=settings.nextFilingDate?new Date(`${settings.nextFilingDate}T00:00:00`).getTime():Number.NaN;
  const daysToDeadline=Number.isFinite(deadlineTimestamp)?Math.ceil((deadlineTimestamp-new Date(`${today()}T00:00:00`).getTime())/86400000):null;
  const deadlineLabel=settings.nextFilingDate?new Date(`${settings.nextFilingDate}T12:00:00`).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'}):'';
  const deadlineStatus=daysToDeadline===null?'on-track':daysToDeadline<0?'overdue':daysToDeadline<=30?'due-soon':'on-track';
  const update=(patch:Partial<TaxSettings>)=>onSettingsChange({...settings,...patch});
  const updatePersonal=(key:keyof TaxSettings['personalDeductions'],value:string)=>update({personalDeductions:{...personal,...{[key]:value}}});
  const updateCompany=(key:keyof TaxSettings['additionalDeductions'],value:string)=>update({additionalDeductions:{...company,...{[key]:value}}});
  const setTaxpayer=(value:TaxpayerType)=>{
    const date=new Date();
    const deadline=value==='individual'?new Date(date.getFullYear(),2,31):new Date(date.getFullYear(),5,30);
    if(deadline<date)deadline.setFullYear(date.getFullYear()+1);
    update({taxpayerType:value,nextFilingDate:dateInput(deadline)});
  };
  return <>
    <div className="tax-disclaimer"><AlertTriangle size={18}/><p><strong>Planning estimate only.</strong> This prototype is not tax advice and does not file returns. Confirm eligibility, deductions, deadlines and current rules with the Nigeria Revenue Service (NRS) or a qualified tax practitioner before payment or filing.</p></div>
    <div className="tax-settings-grid">
      <PageCard title="Tax profile" subtitle="Choose the calculation and reporting period">
        <div className="tax-fields">
          <Field label="Taxpayer type"><select value={settings.taxpayerType} onChange={e=>setTaxpayer(e.target.value as TaxpayerType)}><option value="company">Registered company</option><option value="individual">Sole proprietor / individual</option></select></Field>
          <Field label="Profit period starts (last filing date)"><input type="date" value={settings.lastFilingDate} max={today()} onChange={e=>update({lastFilingDate:e.target.value})}/></Field>
          <Field label="Next filing due (confirm this date)"><input type="date" value={settings.nextFilingDate} onChange={e=>update({nextFilingDate:e.target.value})}/></Field>
          {settings.taxpayerType==='company'?<><Field label="Annual gross turnover (₦)"><input type="number" min="0" value={settings.annualTurnover} onChange={e=>update({annualTurnover:e.target.value})} placeholder="Needed to check small-company threshold"/></Field><Field label="Company fixed assets (₦)"><input type="number" min="0" value={settings.fixedAssets} onChange={e=>update({fixedAssets:e.target.value})} placeholder="Needed to check small-company threshold"/></Field></>:<Field label="Other taxable income in this period (₦)"><input type="number" min="0" value={settings.otherTaxableIncome} onChange={e=>update({otherTaxableIncome:e.target.value})} placeholder="Optional"/></Field>}
        </div>
      </PageCard>
      <section className={`tax-reminder ${deadlineStatus}`}>
        <div className="tax-reminder-icon"><CalendarDays size={21}/></div>
        <div><span className="tax-section-kicker">FILING REMINDER</span><h2>{daysToDeadline===null?'Enter your filing due date':daysToDeadline<0?'Filing date has passed':daysToDeadline===0?'Filing due today':`Filing due ${deadlineLabel}`}</h2><p>{daysToDeadline===null?'Add a due date in Tax profile to activate the reminder.':daysToDeadline<0?`${Math.abs(daysToDeadline)} days past the date you entered`:daysToDeadline===0?'Take action today':`${daysToDeadline} days remaining`}. This is an in-app reminder only; it does not send notifications.</p></div>
      </section>
    </div>
    <div className="metric-grid three tax-metrics">
      <Metric title="Sales since last filing" value={shortMoney(revenue)} change={`${periodSales.length} completed sales`} positive icon={CircleDollarSign} tint="blue" note={`From ${settings.lastFilingDate||'—'} to today`}/>
      <Metric title="Estimated business profit" value={shortMoney(businessProfit)} change="After cost of sales & recorded expenses" positive={businessProfit>=0} icon={TrendingUp} tint="green" note="Uses completed sales in selected period"/>
      <Metric title="Estimated tax" value={shortMoney(estimatedTax)} change={settings.taxpayerType==='company'?(smallCompany?'Small-company exemption applied':'CIT + development levy estimate'):'Progressive personal income-tax estimate'} positive icon={Calculator} tint="orange" note="Before credits, payments or other adjustments"/>
    </div>
    <div className="tax-details-grid">
      <PageCard title="Deductibles & reliefs" subtitle={settings.taxpayerType==='company'?'Business costs are included in the profit calculation above. Enter only additional eligible deductions not already recorded.':'Enter eligible amounts for this filing period; rent relief is calculated automatically.'}>
        <div className="tax-deduction-list">
          {settings.taxpayerType==='company'?<>
            <TaxAmountField label="Capital allowances" hint="Enter an accountant-confirmed claim; no asset schedule is calculated." value={company.capitalAllowances} onChange={v=>updateCompany('capitalAllowances',v)}/>
            <TaxAmountField label="Approved donations" hint="Only eligible donations are deductible; statutory caps may apply." value={company.approvedDonations} onChange={v=>updateCompany('approvedDonations',v)}/>
            <TaxAmountField label="Other allowable deductions" hint="Must be tax-allowable and not already deducted in recorded expenses or cost of sales." value={company.otherAllowable} onChange={v=>updateCompany('otherAllowable',v)}/>
            <div className="tax-deduction-total"><span>Additional entered deductions</span><strong>{money(companyDeductions)}</strong></div>
            <div className="tax-tax-breakdown"><div><span>Estimated company income tax</span><strong>{money(companyIncomeTax)}</strong></div><div><span>Estimated development levy</span><strong>{money(developmentLevy)}</strong></div><div className="tax-total"><span>Estimated total</span><strong>{money(estimatedTax)}</strong></div></div>
            {smallCompany&&<p className="tax-inline-note">Entered annual turnover is within ₦100m and declared fixed assets are within ₦250m; the estimate applies a 0% company income-tax rate. Verify the legal small-company tests before relying on this treatment.</p>}
            {(!assetsKnown||!turnoverKnown)&&<p className="tax-inline-note">Enter annual turnover and fixed assets to check the small-company threshold. Until both are entered, the estimate does not apply the exemption.</p>}
          </>:<>
            <TaxAmountField label="Annual rent paid" hint="Relief is estimated at 20% of rent, capped at ₦500,000." value={personal.rentPaid} onChange={v=>updatePersonal('rentPaid',v)}/>
            <div className="tax-deduction-total"><span>Estimated rent relief</span><strong>{money(Math.min(numeric(personal.rentPaid)*0.2,500_000))}</strong></div>
            <TaxAmountField label="Pension contributions" hint="Enter eligible contributions paid in the period." value={personal.pension} onChange={v=>updatePersonal('pension',v)}/>
            <TaxAmountField label="National Housing Fund (NHF)" hint="Enter eligible contributions paid in the period." value={personal.nhf} onChange={v=>updatePersonal('nhf',v)}/>
            <TaxAmountField label="National Health Insurance Scheme (NHIS)" hint="Enter eligible contributions paid in the period." value={personal.nhis} onChange={v=>updatePersonal('nhis',v)}/>
            <TaxAmountField label="Life assurance premiums" hint="Enter eligible premiums paid in the period." value={personal.lifeAssurance} onChange={v=>updatePersonal('lifeAssurance',v)}/>
            <TaxAmountField label="Owner-occupied home mortgage interest" hint="Enter eligible interest paid; principal repayments are not included." value={personal.mortgageInterest} onChange={v=>updatePersonal('mortgageInterest',v)}/>
            <div className="tax-deduction-total"><span>Total entered personal reliefs</span><strong>{money(personalRelief)}</strong></div>
            <div className="tax-tax-breakdown"><div><span>Taxable income after entered reliefs</span><strong>{money(taxableProfit)}</strong></div><div className="tax-total"><span>Estimated personal income tax</span><strong>{money(individualTax)}</strong></div></div>
          </>}
        </div>
      </PageCard>
      <PageCard title="Profit calculation" subtitle={`Recorded activity from ${settings.lastFilingDate||'—'} through today`}>
        <div className="tax-tax-breakdown">
          <div><span>Completed sales</span><strong>{money(revenue)}</strong></div>
          <div><span>Less: cost of products sold</span><strong>−{money(costOfSales)}</strong></div>
          <div><span>Less: recorded business expenses</span><strong>−{money(periodExpenses)}</strong></div>
          <div className="tax-total"><span>Estimated business profit</span><strong>{money(businessProfit)}</strong></div>
          {settings.taxpayerType==='individual'&&<><div><span>Add: other taxable income entered</span><strong>{money(numeric(settings.otherTaxableIncome))}</strong></div><div><span>Less: eligible reliefs entered</span><strong>−{money(personalRelief)}</strong></div><div className="tax-total"><span>Estimated taxable income</span><strong>{money(taxableProfit)}</strong></div></>}
          {settings.taxpayerType==='company'&&<><div><span>Less: additional deductions entered</span><strong>−{money(companyDeductions)}</strong></div><div className="tax-total"><span>Estimated taxable profit for CIT</span><strong>{money(taxableProfit)}</strong></div><div><span>Annual turnover used for threshold check</span><strong>{money(annualTurnover)}</strong></div><div><span>Development levy base estimate (before capital allowances)</span><strong>{money(developmentLevyBase)}</strong></div></>}
        </div>
        {!validPeriod&&<div className="tax-inline-note">Choose a valid last filing date on or before today to include sales and expenses in the estimate.</div>}
      </PageCard>
    </div>
    <div className="tax-law-note"><FileText size={17}/><div><strong>Rule assumptions used in this estimate</strong><p>Company rate: 30%; small-company test: annual turnover up to ₦100m and fixed assets up to ₦250m; development levy: 4% of estimated assessable profit for companies not treated as small. Individual rates use progressive bands of 0% on the first ₦800,000, then 15%, 18%, 21%, 23% and 25%. Individual rent relief is estimated at 20% of rent capped at ₦500,000. Eligibility and application may depend on the full Act and regulations.</p><p>Business profit is derived from completed POS sales, recorded product costs and expenses since the selected date. These records may be incomplete for statutory accounting. No VAT, withholding tax, capital-gains tax, tax credits, penalties or prior payments are included. Filing dates vary: a company typically files within six months after its accounting year end; individuals file within 90 days after the tax year end. Confirm applicable dates with the NRS or a tax professional. Sources: <a href="https://www.nrs.gov.ng/" target="_blank" rel="noreferrer">Nigeria Revenue Service</a>, <a href="https://taxsummaries.pwc.com/nigeria/corporate/taxes-on-corporate-income" target="_blank" rel="noreferrer">PwC corporate tax summary</a>, <a href="https://taxsummaries.pwc.com/nigeria/individual/taxes-on-personal-income" target="_blank" rel="noreferrer">PwC individual tax summary</a>, and <a href="https://taxsummaries.pwc.com/nigeria/individual/deductions" target="_blank" rel="noreferrer">PwC deductions summary</a>.</p></div></div>
  </>;
}
function TaxAmountField({label,hint,value,onChange}:{label:string;hint:string;value:string;onChange:(value:string)=>void}){return <label className="tax-deduction-field"><span><strong>{label}</strong><small>{hint}</small></span><span className="tax-currency-input"><i>₦</i><input type="number" min="0" value={value} onChange={e=>onChange(e.target.value)} placeholder="0"/></span></label>}
function Reports({store,todayRevenue,totalSales,inventoryValue}:{store:Store;todayRevenue:number;totalSales:number;inventoryValue:number}){const sales=store.sales.filter(s=>s.status==='Completed');const cogs=sales.reduce((sum,s)=>sum+s.lines.reduce((a,l)=>a+l.cost*l.qty,0),0);const revenue=sales.reduce((sum,s)=>sum+s.total,0);const expenses=store.expenses.reduce((sum,e)=>sum+e.amount,0);const gross=revenue-cogs;const net=gross-expenses;const byMethod=['Cash','Card','Transfer','Split payment'].map(m=>({name:m,count:sales.filter(s=>s.method===m).length,amount:sales.filter(s=>s.method===m).reduce((n,s)=>n+s.total,0)}));const max=Math.max(1,...byMethod.map(x=>x.amount));return <><div className="metric-grid"><Metric title="Gross revenue" value={shortMoney(revenue)} change="Completed sales" positive icon={CircleDollarSign} tint="green" note="All recorded sales"/><Metric title="Cost of goods sold" value={shortMoney(cogs)} change="Estimated from costs" positive icon={Boxes} tint="blue" note="Based on sale line costs"/><Metric title="Gross profit" value={shortMoney(gross)} change={revenue?`${Math.round(gross/revenue*100)}% margin`:'0% margin'} positive icon={TrendingUp} tint="purple" note="Revenue less product cost"/><Metric title="Net after expenses" value={shortMoney(net)} change="Demo calculation" positive={net>=0} icon={Wallet} tint="orange" note="Not statutory accounts"/></div><div className="reports-grid"><PageCard title="Sales by payment method" subtitle="Completed transactions"><div className="payment-breakdown">{byMethod.map(m=><div className="payment-break-row" key={m.name}><div className="payment-break-label"><span>{m.name}</span><strong>{money(m.amount)}</strong></div><div className="progress-track"><div className={`progress-fill ${m.name.toLowerCase().replace(' ','-')}`} style={{width:`${m.amount/max*100}%`}}/></div><span className="payment-count">{m.count} transaction{m.count===1?'':'s'}</span></div>)}</div></PageCard><PageCard title="Business snapshot" subtitle="Current operational indicators"><div className="snapshot-list"><div><span><Package size={16}/> Active products</span><strong>{store.products.length}</strong></div><div><span><Users size={16}/> Customers</span><strong>{store.customers.length}</strong></div><div><span><Receipt size={16}/> Completed sales</span><strong>{totalSales}</strong></div><div><span><Boxes size={16}/> Inventory at cost</span><strong>{money(inventoryValue)}</strong></div><div><span><Wallet size={16}/> Recorded expenses</span><strong>{money(expenses)}</strong></div><div><span><CalendarDays size={16}/> Today's revenue</span><strong>{money(todayRevenue)}</strong></div></div></PageCard></div><div className="report-note"><CircleHelp size={18}/><div><strong>About these reports</strong><p>This prototype uses demo data and simplified gross/net calculations. A production accounting system needs tax rules, payment reconciliation, proper double-entry ledgers, and date-filtered reporting.</p></div></div></>}
function SettingsPage({settingsName,setSettingsName,settingsTax,setSettingsTax,settingsCurrency,setSettingsCurrency,onSave,onReset}:{settingsName:string;setSettingsName:(s:string)=>void;settingsTax:string;setSettingsTax:(s:string)=>void;settingsCurrency:string;setSettingsCurrency:(s:string)=>void;onSave:()=>void;onReset:()=>void}){
 return <div className="settings-layout">
   <div className="settings-menu"><button className="settings-tab active"><Building2 size={17}/> Business profile</button><button className="settings-tab"><Receipt size={17}/> Receipts & tax</button><button className="settings-tab"><Users size={17}/> Team & permissions</button><button className="settings-tab"><CreditCard size={17}/> Billing & plan</button><button className="settings-tab"><Activity size={17}/> Data & backups</button></div>
   <div className="settings-main">
     <PageCard title="Business profile" subtitle="Basic information about your store">
       <div className="settings-form">
         <Field label="Business name"><input value={settingsName} onChange={e=>setSettingsName(e.target.value)}/></Field>
         <Field label="Default currency"><select value={settingsCurrency} onChange={e=>setSettingsCurrency(e.target.value)}><option value="NGN">NGN — Nigerian naira (₦)</option><option value="USD">USD — US dollar ($)</option><option value="GBP">GBP — Pound sterling (£)</option><option value="GHS">GHS — Ghanaian cedi</option></select></Field>
         <Field label="Default tax rate (%)"><input type="number" min="0" max="100" step="0.1" value={settingsTax} onChange={e=>setSettingsTax(e.target.value)}/></Field>
         <div className="settings-info"><AlertTriangle size={17}/><p>Tax is configurable for demonstration only. The current checkout does not calculate or remit tax. Validate local tax obligations before production use.</p></div>
         <div className="settings-actions"><button className="btn btn-primary" onClick={onSave}><Check size={16}/> Save changes</button></div>
       </div>
     </PageCard>
     <PageCard title="Demo data" subtitle="Manage the data stored in this browser"><p className="settings-copy">This prototype saves changes to local browser storage. It does not sync across devices or create cloud backups.</p><button className="btn btn-danger" onClick={()=>{if(window.confirm('Reset all local demo data to its original state?'))onReset();}}><RotateCcw size={16}/> Reset demo data</button></PageCard>
   </div>
 </div>;
}
