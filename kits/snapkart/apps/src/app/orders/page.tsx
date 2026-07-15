import { fetchOrders, type Order } from "@/actions/orders"
import OrdersClient from "./OrdersClient"

export default async function OrdersPage() {
  let orders: Order[] = []
  let error = ""
  try {
    orders = await fetchOrders()
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load orders"
  }
  return <OrdersClient initialOrders={orders} initialError={error} />
}
