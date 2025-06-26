import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import BottomNavigation from "../components/bottombar/BottomNavigation";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Phone,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import supabase from "../lib/supabaseClient";

const mockProducts = [
  {
    id: "1",
    title: "iPhone 14 Pro",
    price: 899,
    category: "phones",
    brand: "Apple",
    condition: "excellent",
    in_stock: 2,
    created_at: "2024-06-14",
  },
  {
    id: "2",
    title: "Samsung Galaxy S23",
    price: 749,
    category: "phones",
    brand: "Samsung",
    condition: "good",
    in_stock: 1,
    created_at: "2024-06-13",
  },
  {
    id: "3",
    title: "iPhone Case",
    price: 29,
    category: "accessories",
    brand: "Apple",
    condition: "new",
    in_stock: 15,
    created_at: "2024-06-12",
  },
  {
    id: "4",
    title: "Google Pixel 7",
    price: 599,
    category: "phones",
    brand: "Google",
    condition: "fair",
    in_stock: 0,
    created_at: "2024-06-10",
  },
];

const mockSells = [
  {
    id: "1",
    product_id: "1",
    sell_price: 920,
    paid_price: 500,
    rest_price: 420,
    buyer_name: "John Doe",
    created_at: "2024-06-15T10:30:00Z",
  },
  {
    id: "2",
    product_id: "3",
    sell_price: 35,
    paid_price: 35,
    rest_price: 0,
    buyer_name: "Jane Smith",
    created_at: "2024-06-15T14:20:00Z",
  },
  {
    id: "3",
    product_id: "2",
    sell_price: 780,
    paid_price: 400,
    rest_price: 380,
    buyer_name: "Mike Johnson",
    created_at: "2024-06-14T16:45:00Z",
  },
];

const mockTrades = [
  {
    id: "1",
    old_product_id: "4",
    new_product_id: "1",
    buyback_price: 400,
    new_product_price: 899,
    user_paid: 499,
    profit: 99,
    created_at: "2024-06-15T09:15:00Z",
  },
  {
    id: "2",
    old_product_id: "2",
    new_product_id: "1",
    buyback_price: 600,
    new_product_price: 899,
    user_paid: 299,
    profit: 49,
    created_at: "2024-06-14T11:30:00Z",
  },
];

function Dashboard() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("home");

  const [products, setProducts] = useState([]);
  const [sells, setSells] = useState([]);
  const [trades, setTrades] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [categoryRevenue, setCategoryRevenue] = useState({});
  const [timeRange, setTimeRange] = useState("today");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [cache, setCache] = useState({});
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchInventoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category, in_stock');
      
      if (error) throw error;

      const stats = data.reduce((accumulator, product) => {
        const category = product.category;
        if (!accumulator[category]) {
          accumulator[category] = 0;
        }
        accumulator[category] += product.in_stock;
        return accumulator;
      }, {});

      setInventoryStats(stats);
    } catch (error) {
      console.error(t('errors.fetchInventoryStats'), error);
      const mockStats = mockProducts.reduce((accumulator, product) => {
        const category = product.category;
        if (!accumulator[category]) {
          accumulator[category] = 0;
        }
        accumulator[category] += product.in_stock;
        return accumulator;
      }, {});
      setInventoryStats(mockStats);
    }
  };

  const fetchCategoryRevenue = async () => {
    try {
      const { data: sellsData, error: sellsError } = await supabase
        .from('sells')
        .select(`
          sell_price,
          paid_price,
          rest_price,
          created_at,
          products!inner(category, price)
        `);

      if (sellsError) throw sellsError;

      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select(`
          profit,
          created_at,
          products!trades_new_product_id_fkey(category)
        `);

      if (tradesError) throw tradesError;

      const now = new Date();
      let startDate;

      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "three_months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      const sellsProfitByCategory = sellsData
        .filter(sell => new Date(sell.created_at) >= startDate)
        .reduce((accumulator, sell) => {
          const category = sell.products.category;
          const profit = Number(sell.sell_price) - Number(sell.products.price);
          
          if (!accumulator[category]) {
            accumulator[category] = 0;
          }
          accumulator[category] += profit;
          return accumulator;
        }, {});

      const tradesProfitByCategory = tradesData
        .filter(trade => new Date(trade.created_at) >= startDate)
        .reduce((accumulator, trade) => {
          const category = trade.products.category;
          const profit = Number(trade.profit);
          
          if (!accumulator[category]) {
            accumulator[category] = 0;
          }
          accumulator[category] += profit;
          return accumulator;
        }, {});

      const combinedRevenue = {};
      const allCategories = new Set([
        ...Object.keys(sellsProfitByCategory),
        ...Object.keys(tradesProfitByCategory)
      ]);

      allCategories.forEach(category => {
        combinedRevenue[category] = (sellsProfitByCategory[category] || 0) + (tradesProfitByCategory[category] || 0);
      });

      setCategoryRevenue(combinedRevenue);
    } catch (error) {
      console.error(t('errors.fetchCategoryRevenue'), error);
      const mockCategoryRevenue = {
        phones: 150,
        accessories: 50
      };
      setCategoryRevenue(mockCategoryRevenue);
    }
  };

  const fetchData = async (useCache = true) => {
    const cacheKey = `dashboard_${timeRange}`;
    const now = Date.now();

    if (
      useCache &&
      cache[cacheKey] &&
      now - cache[cacheKey].timestamp < CACHE_DURATION
    ) {
      const cachedData = cache[cacheKey].data;
      setProducts(cachedData.products || mockProducts);
      setSells(cachedData.sells || mockSells);
      setTrades(cachedData.trades || mockTrades);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const productsResponse = await supabase.from("products").select("*");
      const sellsResponse = await supabase.from("sells").select("*");
      const tradesResponse = await supabase.from("trades").select("*");

      const fetchedData = {
        products: productsResponse.data || mockProducts,
        sells: sellsResponse.data || mockSells,
        trades: tradesResponse.data || mockTrades,
      };

      setCache((previous) => ({
        ...previous,
        [cacheKey]: {
          data: fetchedData,
          timestamp: now,
        },
      }));

      setProducts(fetchedData.products);
      setSells(fetchedData.sells);
      setTrades(fetchedData.trades);
      setLastUpdate(new Date());

      await fetchInventoryStats();
      await fetchCategoryRevenue();
    } catch (error) {
      console.error(t('errors.fetchData'), error);
      setProducts(mockProducts);
      setSells(mockSells);
      setTrades(mockTrades);
      await fetchInventoryStats();
      await fetchCategoryRevenue();
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "three_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    const filteredSells = sells.filter(
      (sell) => new Date(sell.created_at) >= startDate
    );
    const filteredTrades = trades.filter(
      (trade) => new Date(trade.created_at) >= startDate
    );

    return { sells: filteredSells, trades: filteredTrades };
  }, [sells, trades, timeRange]);

  const metrics = useMemo(() => {
    const { sells: filteredSells, trades: filteredTrades } = filteredData;

    const sellsRevenue = filteredSells.reduce(
      (sum, sell) => sum + Number(sell.sell_price),
      0
    );
    const tradesRevenue = filteredTrades.reduce(
      (sum, trade) => sum + Number(trade.user_paid),
      0
    );
    const totalRevenue = sellsRevenue + tradesRevenue;

    const tradesProfit = filteredTrades.reduce(
      (sum, trade) => sum + Number(trade.profit),
      0
    );
    const sellsProfit = filteredSells.reduce((sum, sell) => {
      const product = products.find((product) => product.id === sell.product_id);
      return (
        sum + (Number(sell.sell_price) - (product ? Number(product.price) : 0))
      );
    }, 0);
    const totalProfit = tradesProfit + sellsProfit;

    const totalRestPrice = filteredSells.reduce(
      (sum, sell) => sum + Number(sell.rest_price || 0),
      0
    );

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageSalePrice =
      filteredSells.length > 0 ? sellsRevenue / filteredSells.length : 0;
    const averageTradeProfit =
      filteredTrades.length > 0 ? tradesProfit / filteredTrades.length : 0;

    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.price) * product.in_stock,
      0
    );

    return {
      totalRevenue,
      totalProfit,
      totalRestPrice,
      profitMargin,
      averageSalePrice,
      averageTradeProfit,
      totalTransactions: filteredSells.length + filteredTrades.length,
      inventoryValue,
    };
  }, [products, filteredData]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "bg-tumbleweed",
    additionalValue,
    additionalLabel,
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-fog/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-grey text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-oceanblue mt-1">{value}</p>
          {additionalValue && additionalLabel && (
            <p className="text-sm text-grey mt-1">
              {additionalLabel}: <span className="font-medium">{additionalValue}</span>
            </p>
          )}
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend > 0 ? "text-tumbleweed" : "text-moderatelybrown"
              }`}
            >
              {trend > 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-full`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  useEffect(() => {
    if (user) {
      setUserData({
        email: user.email,
        id: user.id,
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
      });
    }
  }, [user]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        {t('messages.loadingUserData')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <div className="hidden lg:block fixed h-full">
        <Sidebar
          isOpen={isOpen}
          onToggle={handleToggle}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className="block lg:hidden">
        <BottomNavigation
          activeItem={activeItem}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className={`flex-1 overflow-hidden ${
          isOpen ? "lg:ml-64" : "lg:ml-20"
        } transition-all duration-200`}>

        <div className="min-h-screen bg-fog/10 p-6 pb-28 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-oceanblue">
                  {t('titles.phoneStoreDashboard')}
                </h1>
                <p className="text-grey mt-2">
                  {t('labels.businessOverview')}
                </p>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center items-end justify-end md:justify-normal space-x-4">
                <div className="flex bg-white rounded-lg shadow-md border border-fog/20">
                  {["today", "week", "month", "three_months", "year"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 text-[10px] md:text-sm font-medium capitalize rounded-lg transition-colors ${
                        timeRange === range
                          ? "bg-tumbleweed text-white"
                          : "text-grey hover:text-oceanblue hover:bg-fog/10"
                      }`}
                    >
                      {t(`labels.timeRange.${range}`)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchData(false)}
                  disabled={loading}
                  className="bg-oceanblue text-white p-2 rounded-lg hover:bg-oceanblue/90 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            <div className="text-right text-sm text-grey mb-6">
              {t('labels.lastUpdated')}: {lastUpdate.toLocaleTimeString()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title={t('labels.metrics.totalRevenue')}
                value={`${metrics.totalRevenue.toLocaleString()} ${t('labels.currency')}`}
                icon={DollarSign}
                color="bg-tumbleweed"
              />
              <StatCard
                title={t('labels.metrics.totalProfit')}
                value={`${metrics.totalProfit.toLocaleString()} ${t('labels.currency')}`}
                icon={TrendingUp}
                color="bg-oceanblue"
              />
              <StatCard
                value={`${metrics.totalRestPrice.toLocaleString()} ${t('labels.currency')}`}
                title={t('labels.metrics.restPrice')}
                icon={DollarSign}
                color="bg-red-800"
              />
              <StatCard
                title={t('labels.metrics.profitMargin')}
                value={`${metrics.profitMargin.toFixed(1)}%`}
                icon={ArrowUpRight}
                color="bg-tumbleweed"
              />
              <StatCard
                title={t('labels.metrics.transactions')}
                value={metrics.totalTransactions}
                icon={Package}
                color="bg-fog"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title={t('labels.metrics.averageSalePrice')}
                value={`${metrics.averageSalePrice.toFixed(0)} ${t('labels.currency')}`}
                icon={DollarSign}
                color="bg-moderatelybrown"
              />
              <StatCard
                title={t('labels.metrics.averageTradeProfit')}
                value={`${metrics.averageTradeProfit.toFixed(0)} ${t('labels.currency')}`}
                icon={TrendingUp}
                color="bg-tumbleweed"
              />
              <StatCard
                title={t('labels.metrics.inventoryValue')}
                value={`${metrics.inventoryValue.toLocaleString()} ${t('labels.currency')}`}
                icon={Package}
                color="bg-oceanblue"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-fog/20">
                <h3 className="text-lg font-semibold text-oceanblue mb-4">
                  {t('titles.revenueByCategory')}
                </h3>
                <div className="space-y-4">
                  {Object.entries(categoryRevenue).map(([category, revenue]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {category === 'phones' ? (
                          <Phone className="w-5 h-5 text-tumbleweed mr-2" />
                        ) : (
                          <Package className="w-5 h-5 text-fog mr-2" />
                        )}
                        <span className="text-grey capitalize">{t(`labels.categories.${category}`)}</span>
                      </div>
                      <span className="font-semibold text-oceanblue">
                        {Number(revenue).toLocaleString()} {t('labels.currency')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-fog/20">
                <h3 className="text-lg font-semibold text-oceanblue mb-4">
                  {t('titles.inventoryStatus')}
                </h3>
                <div className="space-y-4">
                  {Object.entries(inventoryStats).map(([category, stock]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {category === 'phones' ? (
                          <Smartphone className="w-5 h-5 text-tumbleweed mr-2" />
                        ) : (
                          <Package className="w-5 h-5 text-fog mr-2" />
                        )}
                        <span className="text-grey capitalize">{t('labels.categoryInStock', { category: t(`labels.categories.${category}`) })}</span>
                      </div>
                      <span className="font-semibold text-oceanblue">
                        {stock} {t('labels.units')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-fog/20">
              <h3 className="text-lg font-semibold text-oceanblue mb-4">
                {t('titles.keyPerformanceIndicators')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-tumbleweed/10 rounded-lg">
                  <p className="text-tumbleweed font-bold text-2xl">
                    {metrics.totalRevenue.toLocaleString()} {t('labels.currency')}
                  </p>
                  <p className="text-grey text-sm">{t('labels.metrics.totalRevenue')}</p>
                </div>
                <div className="text-center p-4 bg-oceanblue/10 rounded-lg">
                  <p className="text-oceanblue font-bold text-2xl">
                    {metrics.profitMargin.toFixed(1)}%
                  </p>
                  <p className="text-grey text-sm">{t('labels.metrics.profitMargin')}</p>
                </div>
                <div className="text-center p-4 bg-fog/10 rounded-lg">
                  <p className="text-fog font-bold text-2xl">
                    {metrics.totalTransactions}
                  </p>
                  <p className="text-grey text-sm">{t('labels.metrics.totalSales')}</p>
                </div>
                <div className="text-center p-4 bg-moderatelybrown/10 rounded-lg">
                  <p className="text-moderatelybrown font-bold text-2xl">
                    {metrics.inventoryValue.toLocaleString()} {t('labels.currency')}
                  </p>
                  <p className="text-grey text-sm">{t('labels.metrics.inventoryValue')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;