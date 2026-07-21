const orders = {{triggerNode_1.output.orders}};
const orderId = {{triggerNode_1.output.orderId}};

function computeStats(order) {
  const today = new Date();
  const stageEntered = new Date(order.stageEnteredDate);
  const dueDate = new Date(order.dueDate);
  const quantity = Number(order.quantity);
  const completedQuantity = Number(order.completedQuantity);
  const daysInStage = Math.floor((today.getTime() - stageEntered.getTime()) / 86400000);
  const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
  const pctComplete = quantity > 0 ? Math.round((completedQuantity / quantity) * 100) : 0;
  const stageIndex = order.stages.indexOf(order.currentStage);
  const stagesRemaining = order.stages.length - stageIndex - 1;
  const atRisk = daysUntilDue < (stagesRemaining * 3) || daysUntilDue < 0;

  return { id: order.id, currentStage: order.currentStage, daysInStage, daysUntilDue, pctComplete, stagesRemaining, atRisk };
}

const match = orders.find(o => o.id === orderId);
output = match ? computeStats(match) : { error: "Order not found" };