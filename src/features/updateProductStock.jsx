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

export {updateProductStock, fetchSalesWithProduct}