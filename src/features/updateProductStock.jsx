import supabase from "../lib/supabaseClient";

/**
 * Update product stock by adding or subtracting a specified amount.
 * @param productId UUID of the product
 * @param amount Number to add (positive) or subtract (negative)
 */
async function updateProductStock(productId, amount) {
  // Get current stock
  const { data, error } = await supabase
    .from("products")
    .select("in_stock")
    .eq("id", productId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Product not found");

  const newStock = data.in_stock + amount;
  if (newStock < 0) throw new Error("Insufficient stock to subtract");

  // Update stock and updated_at timestamp
  const { error: updateError } = await supabase
    .from("products")
    .update({ in_stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (updateError) throw updateError;

  return newStock;
}

async function fetchSalesWithProduct() {
  const { data, error } = await supabase
    .from("sells")
    .select(`
      id,
      sell_price,
      buyer_name,
      buyer_phone,
      type,
      created_at,
      product:products (
        id,
        title,
        price,
        images
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

async function fetchTradesWithProducts() {
  // First fetch all trades with product details
  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select(`
      id,
      buyback_price,
      new_product_price,
      user_paid,
      profit,
      created_at,
      old_product_id,
      new_product:new_product_id (
        id,
        title,
        price,
        images
      )
    `)
    .order("created_at", { ascending: false });

  if (tradesError) throw tradesError;

  // Get all product IDs involved in trades (both old and new)
  const productIds = trades.flatMap(trade => [
    trade.old_product_id,
    trade.new_product.id
  ]).filter(Boolean);

  // Fetch all sells related to these products
  const { data: sells, error: sellsError } = await supabase
    .from("sells")
    .select(`
      id,
      product_id,
      buyer_name,
      buyer_phone
    `)
    .in("product_id", productIds);

  if (sellsError) throw sellsError;

  // Create a map of product_id to sell data for quick lookup
  const sellsMap = sells.reduce((map, sell) => {
    map[sell.product_id] = sell;
    return map;
  }, {});

  // Combine the data
  return trades.map(trade => ({
    id: trade.id,
    old_product_id: trade.old_product_id,
    new_product_id: trade.new_product.id,
    buyback_price: trade.buyback_price,
    new_product_price: trade.new_product_price,
    user_paid: trade.user_paid,
    profit: trade.profit,
    created_at: trade.created_at,
    buyer_name: sellsMap[trade.new_product.id]?.buyer_name || 'Trade Customer',
    buyer_phone: sellsMap[trade.new_product.id]?.buyer_phone || 'N/A',
    old_product: trade.old_product_id ? {
      id: trade.old_product_id,
      // We don't have the old product details unless we fetch them
      // You might want to add another query to fetch these if needed
    } : null,
    new_product: trade.new_product
  }));
}

export {updateProductStock, fetchSalesWithProduct, fetchTradesWithProducts}